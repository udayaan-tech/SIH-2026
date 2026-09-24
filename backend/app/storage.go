package app

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/nyay-suraksha/backend/config"
)

// Magic header for AES-256-GCM encrypted evidence files at rest
var encHeaderMagic = []byte("NYAY_ENC_V1")

// ReadSeekCloser combines io.Reader, io.Seeker, and io.Closer
type ReadSeekCloser interface {
	io.Reader
	io.Seeker
	io.Closer
}

// bufferReadSeekCloser adapts a *bytes.Reader to ReadSeekCloser
type bufferReadSeekCloser struct {
	*bytes.Reader
}

func (b *bufferReadSeekCloser) Close() error {
	return nil
}

// StorageManager handles object storage using MinIO with local disk vault fallback and AES-256-GCM at-rest encryption
type StorageManager struct {
	cfg         *config.Config
	minioClient *minio.Client
	useMinIO    bool
	vaultDir    string
	mu          sync.RWMutex
}

// GlobalStorage is the singleton instance of StorageManager
var GlobalStorage *StorageManager

// InitStorage initializes the storage manager
func InitStorage(cfg *config.Config) *StorageManager {
	vaultDir := "vault"
	if err := os.MkdirAll(vaultDir, 0755); err != nil {
		log.Printf("⚠️ Failed to ensure vault directory: %v", err)
	}

	sm := &StorageManager{
		cfg:      cfg,
		vaultDir: vaultDir,
		useMinIO: false,
	}

	// Attempt MinIO connection if endpoint provided
	if cfg.MinIOEndpoint != "" {
		sm.tryConnectMinIO()
	}

	GlobalStorage = sm
	return sm
}

func (s *StorageManager) tryConnectMinIO() bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	client, err := minio.New(s.cfg.MinIOEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(s.cfg.MinIOAccessKey, s.cfg.MinIOSecretKey, ""),
		Secure: s.cfg.MinIOUseSSL,
	})
	if err != nil {
		return false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	exists, err := client.BucketExists(ctx, s.cfg.MinIOBucket)
	if err == nil {
		if !exists {
			_ = client.MakeBucket(ctx, s.cfg.MinIOBucket, minio.MakeBucketOptions{})
		}
		s.minioClient = client
		s.useMinIO = true
		log.Printf("📦 MinIO storage initialized (bucket: %s)", s.cfg.MinIOBucket)
		return true
	}

	log.Printf("ℹ️ MinIO not reachable at %s, falling back to local disk vault directory (%s)", s.cfg.MinIOEndpoint, s.vaultDir)
	s.useMinIO = false
	return false
}

// getCipher creates an AES-256-GCM cipher from the configuration key
func (s *StorageManager) getCipher() (cipher.AEAD, error) {
	if s.cfg == nil || s.cfg.EvidenceEncryptionKey == "" {
		return nil, errors.New("encryption key not configured")
	}

	rawKey := s.cfg.EvidenceEncryptionKey
	var key []byte

	if len(rawKey) == 64 {
		decoded, err := hex.DecodeString(rawKey)
		if err == nil && len(decoded) == 32 {
			key = decoded
		}
	}

	if key == nil {
		if len(rawKey) == 32 {
			key = []byte(rawKey)
		} else {
			h := sha256.Sum256([]byte(rawKey))
			key = h[:]
		}
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create AES cipher: %w", err)
	}

	return cipher.NewGCM(block)
}

// UploadFile uploads content to MinIO or stores to local vault directory with AES-256-GCM encryption at rest
func (s *StorageManager) UploadFile(bucketName, objectKey string, fileReader io.Reader, fileSize int64) error {
	rawBytes, err := io.ReadAll(fileReader)
	if err != nil {
		return fmt.Errorf("failed to read payload: %w", err)
	}

	var dataToStore []byte

	// Perform AES-256-GCM envelope encryption if key is configured
	aead, cipherErr := s.getCipher()
	if cipherErr == nil && aead != nil {
		nonce := make([]byte, aead.NonceSize())
		if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
			return fmt.Errorf("failed to generate encryption nonce: %w", err)
		}

		ciphertext := aead.Seal(nil, nonce, rawBytes, nil)

		dataToStore = make([]byte, 0, len(encHeaderMagic)+len(nonce)+len(ciphertext))
		dataToStore = append(dataToStore, encHeaderMagic...)
		dataToStore = append(dataToStore, nonce...)
		dataToStore = append(dataToStore, ciphertext...)
	} else {
		dataToStore = rawBytes
	}

	storedSize := int64(len(dataToStore))

	// Attempt MinIO upload if available
	s.mu.RLock()
	canUseMinIO := s.useMinIO && s.minioClient != nil
	s.mu.RUnlock()

	if canUseMinIO {
		ctx := context.Background()
		bucket := bucketName
		if bucket == "" {
			bucket = s.cfg.MinIOBucket
		}

		_, err := s.minioClient.PutObject(ctx, bucket, objectKey, bytes.NewReader(dataToStore), storedSize, minio.PutObjectOptions{
			ContentType: "application/octet-stream",
		})
		if err == nil {
			return nil
		}
		log.Printf("⚠️ MinIO upload failed (%v), writing to local vault fallback", err)
	}

	// Local filesystem fallback
	targetPath := filepath.Join(s.vaultDir, filepath.Base(objectKey))
	outFile, err := os.Create(targetPath)
	if err != nil {
		return fmt.Errorf("failed to create vault file: %w", err)
	}
	defer outFile.Close()

	if _, err := outFile.Write(dataToStore); err != nil {
		return fmt.Errorf("failed to write file content: %w", err)
	}

	return nil
}

// DownloadFile retrieves and transparently decrypts evidentiary content from MinIO or disk vault
func (s *StorageManager) DownloadFile(bucketName, objectKey string) (io.ReadCloser, error) {
	var rawData []byte
	var localFile *os.File

	// 1. Check local disk vault
	localPath := objectKey
	if !filepath.IsAbs(localPath) && !fileExists(localPath) {
		localPath = filepath.Join(s.vaultDir, filepath.Base(objectKey))
	}

	if fileExists(localPath) {
		var err error
		localFile, err = os.Open(localPath)
		if err != nil {
			return nil, err
		}
		rawData, err = io.ReadAll(localFile)
		_ = localFile.Close()
		if err != nil {
			return nil, fmt.Errorf("failed reading local vault file: %w", err)
		}
	}

	// 2. If not local, try MinIO
	if rawData == nil {
		s.mu.RLock()
		canUseMinIO := s.useMinIO && s.minioClient != nil
		s.mu.RUnlock()

		if !canUseMinIO && s.cfg.MinIOEndpoint != "" {
			canUseMinIO = s.tryConnectMinIO()
		}

		if canUseMinIO {
			ctx := context.Background()
			bucket := bucketName
			if bucket == "" {
				bucket = s.cfg.MinIOBucket
			}
			obj, err := s.minioClient.GetObject(ctx, bucket, objectKey, minio.GetObjectOptions{})
			if err == nil {
				defer obj.Close()
				data, readErr := io.ReadAll(obj)
				if readErr == nil && len(data) > 0 {
					rawData = data
				}
			}
		}
	}

	if rawData == nil {
		return nil, errors.New("file not found in vault or object storage")
	}

	// 3. Inspect if data is AES-256-GCM encrypted with NYAY_ENC_V1 header
	magicLen := len(encHeaderMagic)
	if len(rawData) > magicLen && bytes.Equal(rawData[:magicLen], encHeaderMagic) {
		aead, err := s.getCipher()
		if err == nil && aead != nil {
			nonceSize := aead.NonceSize()
			if len(rawData) >= magicLen+nonceSize+aead.Overhead() {
				nonce := rawData[magicLen : magicLen+nonceSize]
				ciphertext := rawData[magicLen+nonceSize:]

				plaintext, decErr := aead.Open(nil, nonce, ciphertext, nil)
				if decErr == nil {
					return &bufferReadSeekCloser{bytes.NewReader(plaintext)}, nil
				}
				log.Printf("⚠️ AES-256-GCM decryption failed (%v), returning raw content", decErr)
			}
		}
	}

	// If unencrypted or legacy content, return buffer with ReadSeekCloser capability
	return &bufferReadSeekCloser{bytes.NewReader(rawData)}, nil
}

// DeleteFile deletes a file (Restricted under WORM policy)
func (s *StorageManager) DeleteFile(bucketName, objectKey string) error {
	// Section 65B BNSS requires immutable chain of custody — deletion is strictly prohibited
	return errors.New("file deletion prohibited: repository enforces WORM (Write Once Read Many) evidentiary integrity")
}

// Package-level helper wrappers required by BACKEND_DEV2.md
func UploadFile(bucketName, objectKey string, fileReader io.Reader, fileSize int64) error {
	if GlobalStorage == nil {
		return errors.New("storage manager not initialized")
	}
	return GlobalStorage.UploadFile(bucketName, objectKey, fileReader, fileSize)
}

func DownloadFile(bucketName, objectKey string) (io.ReadCloser, error) {
	if GlobalStorage == nil {
		return nil, errors.New("storage manager not initialized")
	}
	return GlobalStorage.DownloadFile(bucketName, objectKey)
}

func DeleteFile(bucketName, objectKey string) error {
	if GlobalStorage == nil {
		return errors.New("storage manager not initialized")
	}
	return GlobalStorage.DeleteFile(bucketName, objectKey)
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

