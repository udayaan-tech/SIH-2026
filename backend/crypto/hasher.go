package crypto

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
)

// HashFile computes the SHA-256 hash of a file by streaming it in chunks.
// This avoids loading the entire file into memory — critical for large CCTV footage.
func HashFile(filePath string) (string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer f.Close()

	return HashReader(f)
}

// HashReader computes SHA-256 from any io.Reader (file, upload stream, etc.)
func HashReader(reader io.Reader) (string, error) {
	hasher := sha256.New()
	if _, err := io.Copy(hasher, reader); err != nil {
		return "", fmt.Errorf("failed to hash: %w", err)
	}
	return hex.EncodeToString(hasher.Sum(nil)), nil
}

// HashBytes computes SHA-256 of a raw byte slice.
func HashBytes(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

// CombineHashes takes two hex-encoded hashes, concatenates, and returns their combined SHA-256.
// Used internally by the Merkle tree to compute parent nodes.
func CombineHashes(left, right string) (string, error) {
	leftBytes, err := hex.DecodeString(left)
	if err != nil {
		return "", fmt.Errorf("invalid left hash: %w", err)
	}
	rightBytes, err := hex.DecodeString(right)
	if err != nil {
		return "", fmt.Errorf("invalid right hash: %w", err)
	}

	combined := append(leftBytes, rightBytes...)
	hash := sha256.Sum256(combined)
	return hex.EncodeToString(hash[:]), nil
}
