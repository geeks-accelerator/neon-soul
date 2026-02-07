// Package main provides the entry point for the neon-soul web application.
package main

import (
	"log"

	"github.com/multiverse/neon-soul/internal/web"
)

func main() {
	if err := web.Run(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
