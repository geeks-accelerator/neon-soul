// Package soul defines the core types for the soul compiler.
package soul

import "time"

// Source represents artifact provenance (where it came from).
type Source string

const (
	SourceHeart  Source = "heart"  // Internal: conversations, reflections, creative work
	SourceBrain  Source = "brain"  // External: guides, research, methodologies
	SourceShadow Source = "shadow" // Anti-patterns: failures, contradictions
	SourceInbox  Source = "inbox"  // Unclassified: awaiting triage
)

// Status represents the lifecycle state of a principle.
type Status string

const (
	StatusCandidate  Status = "candidate"  // Extracted, not yet confirmed
	StatusConfirmed  Status = "confirmed"  // N >= 3, has axiom link
	StatusUngrounded Status = "ungrounded" // N >= 3, but no axiom link
)

// Artifact represents a piece of source material.
type Artifact struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Source    Source    `json:"source"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Principle represents a behavioral rule distilled from artifacts.
type Principle struct {
	ID        string    `json:"id"`
	Text      string    `json:"text"`
	AxiomID   *string   `json:"axiom_id,omitempty"` // nil = ungrounded
	Evidence  []string  `json:"evidence"`           // Artifact IDs
	Status    Status    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Confidence returns the evidence count for this principle.
func (p *Principle) Confidence() int {
	return len(p.Evidence)
}

// IsGrounded returns true if the principle links to an axiom.
func (p *Principle) IsGrounded() bool {
	return p.AxiomID != nil
}

// Axiom represents a foundational constraint (stable, rarely changes).
type Axiom struct {
	ID          string    `json:"id"`
	CJK         string    `json:"cjk,omitempty"`  // e.g., "果重"
	Name        string    `json:"name"`           // e.g., "Consequences Over Intentions"
	Description string    `json:"description"`
	Origin      string    `json:"origin"`         // "seed" or "discovered"
	CreatedAt   time.Time `json:"created_at"`
}

// GovernorSet represents a versioned bundle of axioms and principles.
type GovernorSet struct {
	ID         string       `json:"id"`
	Version    int          `json:"version"`
	Axioms     []Axiom      `json:"axioms"`
	Principles []Principle  `json:"principles"`
	Status     SetStatus    `json:"status"`
	CreatedAt  time.Time    `json:"created_at"`
	ActivatedAt *time.Time  `json:"activated_at,omitempty"`
}

// SetStatus represents the lifecycle of a governor set.
type SetStatus string

const (
	SetStatusDraft    SetStatus = "draft"    // Being compiled
	SetStatusPending  SetStatus = "pending"  // Awaiting review
	SetStatusApproved SetStatus = "approved" // Approved, not yet active
	SetStatusActive   SetStatus = "active"   // Current governors
)

// Distillation represents extracted insights from an artifact.
type Distillation struct {
	ArtifactID string    `json:"artifact_id"`
	Insights   []Insight `json:"insights"`
	CreatedAt  time.Time `json:"created_at"`
}

// Insight represents a single extracted principle candidate.
type Insight struct {
	Text       string  `json:"text"`        // The operational guideline
	AxiomHint  string  `json:"axiom_hint"`  // LLM's guess at which axiom
	Confidence float64 `json:"confidence"`  // LLM's confidence in the link
}
