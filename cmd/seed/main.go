// Package main provides a seed command to initialize the database with default axioms.
package main

import (
	"log"
	"os"

	"github.com/multiverse/neon-soul/internal/soul"
	"github.com/multiverse/neon-soul/internal/store"
)

func main() {
	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = "./data"
	}

	// Ensure data directory exists
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	// Open store
	st, err := store.New(dataDir + "/neon-soul.db")
	if err != nil {
		log.Fatalf("Failed to open store: %v", err)
	}
	defer st.Close()

	// Check if already seeded
	axioms, err := st.ListAxioms()
	if err != nil {
		log.Fatalf("Failed to list axioms: %v", err)
	}

	if len(axioms) > 0 {
		log.Printf("Database already has %d axioms, skipping seed", len(axioms))
		return
	}

	// Seed axioms
	log.Println("Seeding axioms...")
	for _, a := range soul.SeedAxioms() {
		if err := st.SaveAxiom(a); err != nil {
			log.Fatalf("Failed to save axiom %s: %v", a.ID, err)
		}
		log.Printf("  + %s (%s)", a.Name, a.CJK)
	}

	// Seed principles
	log.Println("Seeding principles...")
	for _, p := range soul.SeedPrinciples() {
		if err := st.SavePrinciple(p); err != nil {
			log.Fatalf("Failed to save principle %s: %v", p.ID, err)
		}
		log.Printf("  + %s", p.Text)
	}

	log.Println("Seed complete!")
}
