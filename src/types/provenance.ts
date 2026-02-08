/**
 * Provenance chain for full audit trail from axiom to source.
 */

import type { SignalSource } from './signal.js';

export interface ProvenanceChain {
  axiom: {
    id: string;
    text: string;
  };
  principles: Array<{
    id: string;
    text: string;
    n_count: number;
  }>;
  signals: Array<{
    id: string;
    text: string;
    source: SignalSource;
  }>;
}
