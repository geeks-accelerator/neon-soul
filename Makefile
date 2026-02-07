.PHONY: all build run test clean templ deps seed

# Default target
all: deps templ build

# Install dependencies
deps:
	go mod tidy

# Generate templ files
templ:
	templ generate

# Build the binary
build: templ
	go build -o bin/neon-soul ./cmd/web-app

# Run the web app
run: templ
	go run ./cmd/web-app

# Run tests
test:
	go test ./...

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f internal/web/components/*_templ.go

# Watch mode for development (requires templ CLI)
watch:
	templ generate --watch &
	go run ./cmd/web-app

# Initialize with seed data
seed:
	go run ./cmd/seed

# Help
help:
	@echo "Available targets:"
	@echo "  all    - Install deps, generate templ, build binary"
	@echo "  deps   - Install Go dependencies"
	@echo "  templ  - Generate templ files"
	@echo "  build  - Build the binary"
	@echo "  run    - Run the web app"
	@echo "  test   - Run tests"
	@echo "  clean  - Remove build artifacts"
	@echo "  watch  - Development mode with hot reload"
	@echo "  seed   - Initialize database with seed axioms"
