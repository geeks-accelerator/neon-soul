// Package store provides BuntDB persistence for soul data.
package store

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/multiverse/neon-soul/internal/soul"
	"github.com/tidwall/buntdb"
)

// Store provides persistence for artifacts, principles, and axioms.
type Store struct {
	db *buntdb.DB
}

// New creates a new store with the given path.
// Use ":memory:" for in-memory storage (testing).
func New(path string) (*Store, error) {
	db, err := buntdb.Open(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Create indexes
	if err := db.CreateIndex("artifacts_by_source", "artifact:*", buntdb.IndexJSON("source")); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to create artifacts index: %w", err)
	}

	if err := db.CreateIndex("principles_by_status", "principle:*", buntdb.IndexJSON("status")); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to create principles index: %w", err)
	}

	return &Store{db: db}, nil
}

// Close closes the database.
func (s *Store) Close() error {
	return s.db.Close()
}

// SaveArtifact saves an artifact to the store.
func (s *Store) SaveArtifact(a *soul.Artifact) error {
	data, err := json.Marshal(a)
	if err != nil {
		return fmt.Errorf("failed to marshal artifact: %w", err)
	}

	return s.db.Update(func(tx *buntdb.Tx) error {
		_, _, err := tx.Set("artifact:"+a.ID, string(data), nil)
		return err
	})
}

// GetArtifact retrieves an artifact by ID.
func (s *Store) GetArtifact(id string) (*soul.Artifact, error) {
	var artifact soul.Artifact

	err := s.db.View(func(tx *buntdb.Tx) error {
		val, err := tx.Get("artifact:" + id)
		if err == buntdb.ErrNotFound {
			return nil
		}
		if err != nil {
			return err
		}
		return json.Unmarshal([]byte(val), &artifact)
	})

	if err != nil {
		return nil, err
	}
	if artifact.ID == "" {
		return nil, nil
	}
	return &artifact, nil
}

// ListArtifacts returns all artifacts, optionally filtered by source.
func (s *Store) ListArtifacts(source *soul.Source) ([]*soul.Artifact, error) {
	var artifacts []*soul.Artifact

	err := s.db.View(func(tx *buntdb.Tx) error {
		return tx.AscendKeys("artifact:*", func(key, value string) bool {
			var a soul.Artifact
			if err := json.Unmarshal([]byte(value), &a); err != nil {
				return true // Skip malformed entries
			}
			if source == nil || a.Source == *source {
				artifacts = append(artifacts, &a)
			}
			return true
		})
	})

	return artifacts, err
}

// SavePrinciple saves a principle to the store.
func (s *Store) SavePrinciple(p *soul.Principle) error {
	p.UpdatedAt = time.Now()
	data, err := json.Marshal(p)
	if err != nil {
		return fmt.Errorf("failed to marshal principle: %w", err)
	}

	return s.db.Update(func(tx *buntdb.Tx) error {
		_, _, err := tx.Set("principle:"+p.ID, string(data), nil)
		return err
	})
}

// GetPrinciple retrieves a principle by ID.
func (s *Store) GetPrinciple(id string) (*soul.Principle, error) {
	var principle soul.Principle

	err := s.db.View(func(tx *buntdb.Tx) error {
		val, err := tx.Get("principle:" + id)
		if err == buntdb.ErrNotFound {
			return nil
		}
		if err != nil {
			return err
		}
		return json.Unmarshal([]byte(val), &principle)
	})

	if err != nil {
		return nil, err
	}
	if principle.ID == "" {
		return nil, nil
	}
	return &principle, nil
}

// ListPrinciples returns all principles, optionally filtered by status.
func (s *Store) ListPrinciples(status *soul.Status) ([]*soul.Principle, error) {
	var principles []*soul.Principle

	err := s.db.View(func(tx *buntdb.Tx) error {
		return tx.AscendKeys("principle:*", func(key, value string) bool {
			var p soul.Principle
			if err := json.Unmarshal([]byte(value), &p); err != nil {
				return true
			}
			if status == nil || p.Status == *status {
				principles = append(principles, &p)
			}
			return true
		})
	})

	return principles, err
}

// SaveAxiom saves an axiom to the store.
func (s *Store) SaveAxiom(a *soul.Axiom) error {
	data, err := json.Marshal(a)
	if err != nil {
		return fmt.Errorf("failed to marshal axiom: %w", err)
	}

	return s.db.Update(func(tx *buntdb.Tx) error {
		_, _, err := tx.Set("axiom:"+a.ID, string(data), nil)
		return err
	})
}

// ListAxioms returns all axioms.
func (s *Store) ListAxioms() ([]*soul.Axiom, error) {
	var axioms []*soul.Axiom

	err := s.db.View(func(tx *buntdb.Tx) error {
		return tx.AscendKeys("axiom:*", func(key, value string) bool {
			var a soul.Axiom
			if err := json.Unmarshal([]byte(value), &a); err != nil {
				return true
			}
			axioms = append(axioms, &a)
			return true
		})
	})

	return axioms, err
}

// Stats returns store statistics.
func (s *Store) Stats() (artifacts, principles, axioms int, err error) {
	err = s.db.View(func(tx *buntdb.Tx) error {
		tx.AscendKeys("artifact:*", func(_, _ string) bool { artifacts++; return true })
		tx.AscendKeys("principle:*", func(_, _ string) bool { principles++; return true })
		tx.AscendKeys("axiom:*", func(_, _ string) bool { axioms++; return true })
		return nil
	})
	return
}
