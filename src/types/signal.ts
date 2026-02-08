/**
 * Signal types for capturing behavioral patterns from memory.
 */

export type SignalType =
  | 'value'
  | 'belief'
  | 'preference'
  | 'goal'
  | 'constraint'
  | 'relationship'
  | 'pattern'
  | 'correction'
  | 'boundary'
  | 'reinforcement';

/**
 * SoulCraft dimensions for organizing identity signals.
 */
export type SoulCraftDimension =
  | 'identity-core'
  | 'character-traits'
  | 'voice-presence'
  | 'honesty-framework'
  | 'boundaries-ethics'
  | 'relationship-dynamics'
  | 'continuity-growth';

/**
 * Source type for signal provenance.
 */
export type SignalSourceType = 'memory' | 'interview' | 'template';

export interface SignalSource {
  /** Type of source (memory, interview, template) */
  type: SignalSourceType;
  /** Source file path */
  file: string;
  /** Section within file (header, question ID, etc.) */
  section?: string;
  /** Line number in source file (if applicable) */
  line?: number;
  /** Surrounding context text */
  context: string;
  /** When the signal was extracted */
  extractedAt: Date;
}

export interface Signal {
  id: string;
  type: SignalType;
  text: string;
  confidence: number;
  embedding: number[]; // 384-dim from all-MiniLM-L6-v2
  /** SoulCraft dimension this signal relates to */
  dimension?: SoulCraftDimension;
  source: SignalSource;
}
