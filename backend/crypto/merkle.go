package crypto

import (
	"database/sql"
	"fmt"
	"math"
	"sync"
)

// MerkleTree implements a binary hash tree (RFC 6962 style) for evidence integrity verification.
// Each uploaded document's SHA-256 hash becomes a leaf. The tree computes a root hash
// that changes if any single leaf is modified — this is our core tamper detection.
type MerkleTree struct {
	mu     sync.RWMutex
	leaves []string // Ordered list of leaf hashes (SHA-256 hex strings)
	nodes  [][]string // Full tree: nodes[0] = leaves, nodes[len-1] = [root]
}

// NewMerkleTree creates an empty Merkle tree.
func NewMerkleTree() *MerkleTree {
	return &MerkleTree{
		leaves: make([]string, 0),
		nodes:  make([][]string, 0),
	}
}

// LoadFromDB reconstructs the Merkle tree from stored leaves in the database.
func (mt *MerkleTree) LoadFromDB(db *sql.DB) error {
	rows, err := db.Query("SELECT hash FROM merkle_leaves ORDER BY position ASC")
	if err != nil {
		return fmt.Errorf("failed to load merkle leaves: %w", err)
	}
	defer rows.Close()

	mt.mu.Lock()
	defer mt.mu.Unlock()

	mt.leaves = mt.leaves[:0] // Clear existing
	for rows.Next() {
		var hash string
		if err := rows.Scan(&hash); err != nil {
			return fmt.Errorf("failed to scan leaf: %w", err)
		}
		mt.leaves = append(mt.leaves, hash)
	}

	if len(mt.leaves) > 0 {
		mt.rebuild()
	}

	return nil
}

// AddLeaf appends a new document hash to the tree and recomputes the root.
// Returns the leaf position (0-indexed).
func (mt *MerkleTree) AddLeaf(hash string) int {
	mt.mu.Lock()
	defer mt.mu.Unlock()

	mt.leaves = append(mt.leaves, hash)
	mt.rebuild()
	return len(mt.leaves) - 1
}

// Root returns the current Merkle root hash. Empty string if tree has no leaves.
func (mt *MerkleTree) Root() string {
	mt.mu.RLock()
	defer mt.mu.RUnlock()

	if len(mt.nodes) == 0 {
		return ""
	}
	topLevel := mt.nodes[len(mt.nodes)-1]
	if len(topLevel) == 0 {
		return ""
	}
	return topLevel[0]
}

// LeafCount returns the number of leaves in the tree.
func (mt *MerkleTree) LeafCount() int {
	mt.mu.RLock()
	defer mt.mu.RUnlock()
	return len(mt.leaves)
}

// GetLeaf returns the hash at a specific leaf position.
func (mt *MerkleTree) GetLeaf(position int) (string, error) {
	mt.mu.RLock()
	defer mt.mu.RUnlock()

	if position < 0 || position >= len(mt.leaves) {
		return "", fmt.Errorf("leaf position %d out of range (0-%d)", position, len(mt.leaves)-1)
	}
	return mt.leaves[position], nil
}

// VerifyLeaf checks if a given hash matches the stored leaf at a position.
func (mt *MerkleTree) VerifyLeaf(position int, hash string) (bool, error) {
	stored, err := mt.GetLeaf(position)
	if err != nil {
		return false, err
	}
	return stored == hash, nil
}

// ProofNode represents one step in a Merkle inclusion proof.
type ProofNode struct {
	Hash     string `json:"hash"`
	Position string `json:"position"` // "left" or "right"
}

// GetProof generates a Merkle inclusion proof for a leaf at the given position.
// The proof is a list of sibling hashes from leaf to root that anyone can use
// to independently verify the leaf is part of the tree.
func (mt *MerkleTree) GetProof(position int) ([]ProofNode, error) {
	mt.mu.RLock()
	defer mt.mu.RUnlock()

	if position < 0 || position >= len(mt.leaves) {
		return nil, fmt.Errorf("leaf position %d out of range", position)
	}

	if len(mt.leaves) == 1 {
		return []ProofNode{}, nil // Single leaf = proof is the root itself
	}

	proof := make([]ProofNode, 0)
	idx := position

	for level := 0; level < len(mt.nodes)-1; level++ {
		currentLevel := mt.nodes[level]

		if idx%2 == 0 {
			// Current node is on the left, sibling is on the right
			if idx+1 < len(currentLevel) {
				proof = append(proof, ProofNode{
					Hash:     currentLevel[idx+1],
					Position: "right",
				})
			}
		} else {
			// Current node is on the right, sibling is on the left
			proof = append(proof, ProofNode{
				Hash:     currentLevel[idx-1],
				Position: "left",
			})
		}

		idx = idx / 2 // Move to parent
	}

	return proof, nil
}

// VerifyProof independently verifies a Merkle inclusion proof.
// Given a leaf hash, proof nodes, and the expected root — returns true if valid.
func VerifyProof(leafHash string, proof []ProofNode, expectedRoot string) bool {
	currentHash := leafHash

	for _, node := range proof {
		var combined string
		var err error

		if node.Position == "right" {
			combined, err = CombineHashes(currentHash, node.Hash)
		} else {
			combined, err = CombineHashes(node.Hash, currentHash)
		}

		if err != nil {
			return false
		}
		currentHash = combined
	}

	return currentHash == expectedRoot
}

// rebuild recomputes the entire tree from leaves up to root.
// Called after any modification to the leaf set.
func (mt *MerkleTree) rebuild() {
	if len(mt.leaves) == 0 {
		mt.nodes = [][]string{}
		return
	}

	// Level 0 = leaves
	levels := int(math.Ceil(math.Log2(float64(len(mt.leaves))))) + 1
	mt.nodes = make([][]string, 0, levels)

	// Copy leaves as level 0
	currentLevel := make([]string, len(mt.leaves))
	copy(currentLevel, mt.leaves)
	mt.nodes = append(mt.nodes, currentLevel)

	// Build up level by level
	for len(currentLevel) > 1 {
		nextLevel := make([]string, 0, (len(currentLevel)+1)/2)

		for i := 0; i < len(currentLevel); i += 2 {
			if i+1 < len(currentLevel) {
				combined, _ := CombineHashes(currentLevel[i], currentLevel[i+1])
				nextLevel = append(nextLevel, combined)
			} else {
				// Odd node — promote it (duplicate itself as sibling)
				combined, _ := CombineHashes(currentLevel[i], currentLevel[i])
				nextLevel = append(nextLevel, combined)
			}
		}

		mt.nodes = append(mt.nodes, nextLevel)
		currentLevel = nextLevel
	}
}
