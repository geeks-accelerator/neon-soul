// Package views defines view data types for templ components.
package views

import "github.com/multiverse/neon-soul/internal/soul"

// PageData holds common data for all pages.
type PageData struct {
	Title string
}

// HomeData holds data for the home page.
type HomeData struct {
	Page       PageData
	Stats      Stats
	Artifacts  []*soul.Artifact
	Principles []*soul.Principle
	Axioms     []*soul.Axiom
}

// Stats holds dashboard statistics.
type Stats struct {
	Artifacts  int
	Principles int
	Axioms     int
}

// ArtifactListData holds data for the artifact list page.
type ArtifactListData struct {
	Page      PageData
	Artifacts []*soul.Artifact
}

// ArtifactDetailData holds data for the artifact detail page.
type ArtifactDetailData struct {
	Page     PageData
	Artifact *soul.Artifact
}

// PrincipleListData holds data for the principle list page.
type PrincipleListData struct {
	Page       PageData
	Principles []*soul.Principle
	Axioms     []*soul.Axiom // For axiom name lookup
}

// AxiomListData holds data for the axiom list page.
type AxiomListData struct {
	Page   PageData
	Axioms []*soul.Axiom
}

// SoulPreviewData holds data for the soul compilation preview.
type SoulPreviewData struct {
	Page       PageData
	Axioms     []*soul.Axiom
	Principles []*soul.Principle
	Markdown   string // Compiled soul.md content
}
