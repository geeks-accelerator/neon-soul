// Package handlers provides HTTP handlers for the web UI.
package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"github.com/multiverse/neon-soul/internal/soul"
	"github.com/multiverse/neon-soul/internal/store"
	"github.com/multiverse/neon-soul/internal/web/views"
)

// Handlers holds HTTP handler dependencies.
type Handlers struct {
	store *store.Store
}

// New creates a new Handlers instance.
func New(s *store.Store) *Handlers {
	return &Handlers{store: s}
}

// Home renders the dashboard home page.
func (h *Handlers) Home(w http.ResponseWriter, r *http.Request) {
	artifacts, _ := h.store.ListArtifacts(nil)
	principles, _ := h.store.ListPrinciples(nil)
	axioms, _ := h.store.ListAxioms()

	data := views.HomeData{
		Page: views.PageData{Title: "Dashboard"},
		Stats: views.Stats{
			Artifacts:  len(artifacts),
			Principles: len(principles),
			Axioms:     len(axioms),
		},
		Artifacts:  limitSlice(artifacts, 5),
		Principles: limitSlice(principles, 5),
		Axioms:     axioms,
	}

	// For now, render simple HTML (will be replaced with templ)
	renderHTML(w, "home", data)
}

// ListArtifacts renders the artifact list page.
func (h *Handlers) ListArtifacts(w http.ResponseWriter, r *http.Request) {
	source := r.URL.Query().Get("source")
	var sourceFilter *soul.Source
	if source != "" {
		s := soul.Source(source)
		sourceFilter = &s
	}

	artifacts, err := h.store.ListArtifacts(sourceFilter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := views.ArtifactListData{
		Page:      views.PageData{Title: "Artifacts"},
		Artifacts: artifacts,
	}

	renderHTML(w, "artifacts", data)
}

// GetArtifact renders a single artifact detail page.
func (h *Handlers) GetArtifact(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	artifact, err := h.store.GetArtifact(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if artifact == nil {
		http.NotFound(w, r)
		return
	}

	data := views.ArtifactDetailData{
		Page:     views.PageData{Title: artifact.Title},
		Artifact: artifact,
	}

	renderHTML(w, "artifact_detail", data)
}

// ListPrinciples renders the principle list page.
func (h *Handlers) ListPrinciples(w http.ResponseWriter, r *http.Request) {
	principles, err := h.store.ListPrinciples(nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	axioms, _ := h.store.ListAxioms()

	data := views.PrincipleListData{
		Page:       views.PageData{Title: "Principles"},
		Principles: principles,
		Axioms:     axioms,
	}

	renderHTML(w, "principles", data)
}

// ListAxioms renders the axiom list page.
func (h *Handlers) ListAxioms(w http.ResponseWriter, r *http.Request) {
	axioms, err := h.store.ListAxioms()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := views.AxiomListData{
		Page:   views.PageData{Title: "Axioms"},
		Axioms: axioms,
	}

	renderHTML(w, "axioms", data)
}

// PreviewSoul renders the soul compilation preview.
func (h *Handlers) PreviewSoul(w http.ResponseWriter, r *http.Request) {
	axioms, _ := h.store.ListAxioms()
	confirmed := soul.StatusConfirmed
	principles, _ := h.store.ListPrinciples(&confirmed)

	// Generate markdown preview
	markdown := compileSoulMarkdown(axioms, principles)

	data := views.SoulPreviewData{
		Page:       views.PageData{Title: "Soul Preview"},
		Axioms:     axioms,
		Principles: principles,
		Markdown:   markdown,
	}

	renderHTML(w, "soul", data)
}

// CreateArtifact handles artifact creation via API.
func (h *Handlers) CreateArtifact(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title   string      `json:"title"`
		Content string      `json:"content"`
		Source  soul.Source `json:"source"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	artifact := &soul.Artifact{
		ID:        generateID(),
		Title:     req.Title,
		Content:   req.Content,
		Source:    req.Source,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.store.SaveArtifact(artifact); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(artifact)
}

// CompileSoul triggers soul compilation and returns the result.
func (h *Handlers) CompileSoul(w http.ResponseWriter, r *http.Request) {
	axioms, _ := h.store.ListAxioms()
	confirmed := soul.StatusConfirmed
	principles, _ := h.store.ListPrinciples(&confirmed)

	markdown := compileSoulMarkdown(axioms, principles)

	w.Header().Set("Content-Type", "text/markdown")
	w.Write([]byte(markdown))
}

// Helper functions

func generateID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func limitSlice[T any](s []*T, n int) []*T {
	if len(s) <= n {
		return s
	}
	return s[:n]
}

func compileSoulMarkdown(axioms []*soul.Axiom, principles []*soul.Principle) string {
	md := "# Soul\n\n## Axioms\n\n"
	for _, a := range axioms {
		md += "### " + a.Name + "\n"
		if a.CJK != "" {
			md += "*" + a.CJK + "*\n\n"
		}
		md += a.Description + "\n\n"
	}

	md += "## Principles\n\n"
	for _, p := range principles {
		md += "- " + p.Text + " (N=" + string(rune('0'+p.Confidence())) + ")\n"
	}

	return md
}

// renderHTML is a placeholder for templ rendering
func renderHTML(w http.ResponseWriter, template string, data any) {
	w.Header().Set("Content-Type", "text/html")
	// TODO: Replace with templ components
	json.NewEncoder(w).Encode(data)
}
