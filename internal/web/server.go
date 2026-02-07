// Package web provides the HTTP server for neon-soul.
package web

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/multiverse/neon-soul/internal/store"
	"github.com/multiverse/neon-soul/internal/web/handlers"
)

// Config holds server configuration.
type Config struct {
	Port      string
	DataDir   string
	MemoryDir string
}

// DefaultConfig returns configuration with sensible defaults.
func DefaultConfig() *Config {
	return &Config{
		Port:      getEnv("PORT", "8080"),
		DataDir:   getEnv("DATA_DIR", "./data"),
		MemoryDir: getEnv("MEMORY_DIR", "./memory"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// Server holds the HTTP server and its dependencies.
type Server struct {
	config     *Config
	httpServer *http.Server
	store      *store.Store
}

// New creates a new server with the given configuration.
func New(cfg *Config) (*Server, error) {
	// Ensure data directory exists
	if err := os.MkdirAll(cfg.DataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	// Initialize store
	dbPath := cfg.DataDir + "/neon-soul.db"
	st, err := store.New(dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize store: %w", err)
	}

	return &Server{
		config: cfg,
		store:  st,
	}, nil
}

// Start starts the HTTP server.
func (s *Server) Start() error {
	mux := http.NewServeMux()

	// Create handlers
	h := handlers.New(s.store)

	// Static files
	mux.Handle("GET /static/", http.StripPrefix("/static/", http.FileServer(http.Dir("internal/web/static"))))

	// Pages
	mux.HandleFunc("GET /", h.Home)
	mux.HandleFunc("GET /artifacts", h.ListArtifacts)
	mux.HandleFunc("GET /artifacts/{id}", h.GetArtifact)
	mux.HandleFunc("GET /principles", h.ListPrinciples)
	mux.HandleFunc("GET /axioms", h.ListAxioms)
	mux.HandleFunc("GET /soul", h.PreviewSoul)

	// API endpoints
	mux.HandleFunc("POST /api/artifacts", h.CreateArtifact)
	mux.HandleFunc("POST /api/compile", h.CompileSoul)

	s.httpServer = &http.Server{
		Addr:         ":" + s.config.Port,
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("Starting neon-soul on http://localhost:%s", s.config.Port)
	log.Printf("  Data directory: %s", s.config.DataDir)
	log.Printf("  Memory directory: %s", s.config.MemoryDir)

	return s.httpServer.ListenAndServe()
}

// Shutdown gracefully shuts down the server.
func (s *Server) Shutdown(ctx context.Context) error {
	if err := s.httpServer.Shutdown(ctx); err != nil {
		return err
	}
	return s.store.Close()
}

// Run starts the server and handles graceful shutdown.
func Run() error {
	cfg := DefaultConfig()

	server, err := New(cfg)
	if err != nil {
		return err
	}

	// Handle graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan

		log.Println("Shutting down...")
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Shutdown error: %v", err)
		}
	}()

	if err := server.Start(); err != http.ErrServerClosed {
		return err
	}

	log.Println("Server stopped")
	return nil
}
