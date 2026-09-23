package crypto

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

// ZKPCommitment represents a Zero-Knowledge Proof commitment.
// It allows a prover to commit to a document's hash without revealing the document,
// and later prove possession of it.
type ZKPCommitment struct {
	Salt       string `json:"salt"`       // Random 256-bit salt
	Commitment string `json:"commitment"` // SHA256(Hash + Salt)
}

// CreateZKPCommitment creates a cryptographic commitment for a document hash.
// This is used when the system needs to prove to a third party (e.g. a defense lawyer)
// that it possesses a document matching a specific hash, without revealing the actual hash
// until the specific verification moment.
func CreateZKPCommitment(documentHash string) (*ZKPCommitment, error) {
	// 1. Generate a secure random salt (32 bytes = 256 bits)
	saltBytes := make([]byte, 32)
	if _, err := rand.Read(saltBytes); err != nil {
		return nil, fmt.Errorf("failed to generate secure salt: %w", err)
	}
	salt := hex.EncodeToString(saltBytes)

	// 2. Create the commitment: SHA256(DocumentHash + Salt)
	commitment, err := CombineHashes(documentHash, salt)
	if err != nil {
		return nil, fmt.Errorf("failed to create commitment: %w", err)
	}

	return &ZKPCommitment{
		Salt:       salt,
		Commitment: commitment,
	}, nil
}

// VerifyZKP allows a verifier (judge/lawyer) to verify the commitment.
// The prover provides the actual document hash and the salt. The verifier checks
// if it computes to the previously published commitment.
//
// Why this matters: The system can publish the Commitment to a public blockchain
// immediately upon upload. Later, in court, the system provides the Hash and Salt.
// The judge verifies it against the blockchain, proving the document existed at T-zero,
// without the hash ever being public before the trial.
func VerifyZKP(documentHash string, salt string, expectedCommitment string) bool {
	computedCommitment, err := CombineHashes(documentHash, salt)
	if err != nil {
		return false
	}
	
	return computedCommitment == expectedCommitment
}
