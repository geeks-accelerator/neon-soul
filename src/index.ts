/**
 * NEON-SOUL: AI Identity Through Grounded Principles
 *
 * OpenClaw skill for soul synthesis with semantic compression.
 * Extracts signals from memory, matches to principles, promotes to axioms.
 *
 * @module neon-soul
 */

export { loadConfig, type NeonSoulConfig } from './lib/config.js';
export { embed, embedBatch } from './lib/embeddings.js';
export {
  cosineSimilarity,
  findBestMatch,
  DEFAULT_MATCH_THRESHOLD,
  type MatchResult,
} from './lib/matcher.js';
export { parseMarkdown, type ParsedMarkdown } from './lib/markdown-reader.js';
export {
  createSignalSource,
  createPrincipleProvenance,
  createAxiomProvenance,
  traceToSource,
} from './lib/provenance.js';
// Stage 4: extractSignals removed (dead code). Use extractSignalsFromContent instead.
export {
  extractSignalsFromContent,
  extractSignalsFromMemoryFiles,
  type ExtractionConfig,
} from './lib/signal-extractor.js';
// Stage 12: Signal source classification for identity validity
export {
  classifyElicitationType,
  filterForIdentitySynthesis,
  calculateWeightedSignalCount,
  ELICITATION_WEIGHT,
} from './lib/signal-source-classifier.js';
export { loadState, saveState, shouldRunSynthesis } from './lib/state.js';
export { backupFile, rollback, commitSoulUpdate } from './lib/backup.js';
export {
  extractFromTemplate,
  extractFromTemplates,
  type TemplateExtractionResult,
} from './lib/template-extractor.js';
export {
  createPrincipleStore,
  type PrincipleStore,
  type AddSignalResult,
} from './lib/principle-store.js';
export {
  compressPrinciples,
  generateSoulMd,
  type CompressionResult,
} from './lib/compressor.js';
export {
  countTokens,
  compressionRatio,
  semanticDensity,
  calculateMetrics,
  formatMetricsReport,
  type CompressionMetrics,
} from './lib/metrics.js';
export {
  TrajectoryTracker,
  calculateStyleMetrics,
  formatTrajectoryReport,
  type TrajectoryPoint,
  type TrajectoryMetrics,
  type StyleMetrics,
} from './lib/trajectory.js';

export type {
  Signal,
  SignalSource,
  SignalType,
  SignalElicitationType,
} from './types/signal.js';

export type {
  Principle,
  PrincipleProvenance,
  PrincipleEvent,
} from './types/principle.js';

export type {
  Axiom,
  AxiomProvenance,
  CanonicalForm,
  AxiomTier,
} from './types/axiom.js';

export type {
  ProvenanceChain,
} from './types/provenance.js';

export {
  SOULCRAFT_DIMENSIONS,
  type SoulCraftDimension,
  type DimensionCoverage,
} from './types/dimensions.js';

// Pipeline and synthesis
export {
  runPipeline,
  validateSoulOutput,
  formatPipelineResult,
  type PipelineOptions,
  type PipelineContext,
  type PipelineResult,
  type SourceCollection,
} from './lib/pipeline.js';

export {
  runReflectiveLoop,
  formatReflectiveLoopReport,
  type ReflectiveLoopConfig,
  type ReflectiveLoopResult,
} from './lib/reflection-loop.js';

export {
  generateSoul,
  formatAxiom,
  generateMinimalSoul,
  diffSouls,
  type GeneratedSoul,
  type SoulGeneratorOptions,
  type NotationFormat,
} from './lib/soul-generator.js';

export {
  collectSources,
  formatSourceSummary,
  type SourceCollection as CollectedSources,
  type ParsedSoul,
  type UserContext,
  type SourceStats,
  type CollectorOptions,
} from './lib/source-collector.js';

export {
  createMemoryWalker,
  type MemoryWalker,
  type MemoryFile,
} from './lib/memory-walker.js';

// Persistence layer
export {
  saveSynthesisData,
  saveSignals,
  savePrinciples,
  saveAxioms,
  loadSynthesisData,
  loadSignals,
  loadPrinciples,
  loadAxioms,
  type SynthesisData,
} from './lib/persistence.js';

// Path utilities
export {
  getDefaultMemoryPath,
  getDefaultOutputPath,
  getDefaultWorkspacePath,
  getWorkspaceFromMemory,
  getNeonSoulPath,
  resolvePath,
  OPENCLAW_DEFAULTS,
} from './lib/paths.js';
