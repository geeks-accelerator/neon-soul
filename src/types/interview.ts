/**
 * Interview Type Definitions
 *
 * Types for the NEON-SOUL interview flow that supplements sparse memory areas.
 * Interview responses become signals with full provenance tracking.
 */

import type { SignalType, SoulCraftDimension } from './signal.js';

/**
 * A single interview question targeting a specific dimension.
 */
export interface InterviewQuestion {
  /** Unique question identifier */
  id: string;

  /** SoulCraft dimension this question targets */
  dimension: SoulCraftDimension;

  /** The question text to present to user */
  text: string;

  /** Conditional follow-up questions based on response */
  followUps: FollowUpQuestion[];

  /** Expected signal type from response */
  signalType: SignalType;

  /** Whether this question is required for complete coverage */
  required: boolean;

  /** Priority for adaptive ordering (higher = earlier) */
  priority: number;

  /** Tags for categorization */
  tags: string[];
}

/**
 * A follow-up question triggered by specific response patterns.
 */
export interface FollowUpQuestion {
  /** Unique follow-up identifier */
  id: string;

  /** Trigger pattern (regex or keywords) */
  trigger: string;

  /** Follow-up question text */
  text: string;

  /** Signal type for follow-up response */
  signalType: SignalType;
}

/**
 * User's response to an interview question.
 */
export interface InterviewResponse {
  /** Question that was answered */
  questionId: string;

  /** Raw response text */
  text: string;

  /** Timestamp of response */
  respondedAt: Date;

  /** Any follow-ups that were triggered and answered */
  followUpResponses: FollowUpResponse[];
}

/**
 * Response to a follow-up question.
 */
export interface FollowUpResponse {
  /** Follow-up question ID */
  followUpId: string;

  /** Raw response text */
  text: string;

  /** Timestamp */
  respondedAt: Date;
}

/**
 * An interview session containing questions and responses.
 */
export interface InterviewSession {
  /** Unique session identifier */
  id: string;

  /** When the interview started */
  startedAt: Date;

  /** When the interview completed (null if in progress) */
  completedAt: Date | null;

  /** Responses collected so far */
  responses: InterviewResponse[];

  /** Questions that were skipped (dimension already covered by memory) */
  skippedQuestions: string[];

  /** Dimensions identified as sparse (from memory analysis) */
  sparseDimensions: SoulCraftDimension[];

  /** Session status */
  status: 'in_progress' | 'completed' | 'abandoned';
}

/**
 * Coverage analysis for a dimension.
 */
export interface DimensionCoverage {
  /** The dimension being analyzed */
  dimension: SoulCraftDimension;

  /** Number of signals from memory */
  memorySignals: number;

  /** Number of signals from interviews */
  interviewSignals: number;

  /** Whether dimension is considered sparse */
  isSparse: boolean;

  /** Confidence in coverage (0-1) */
  confidence: number;
}

/**
 * Question bank organized by dimension.
 */
export interface QuestionBank {
  /** Version for compatibility tracking */
  version: string;

  /** All questions indexed by ID */
  questions: Map<string, InterviewQuestion>;

  /** Questions grouped by dimension */
  byDimension: Map<SoulCraftDimension, InterviewQuestion[]>;
}

/**
 * Interview flow configuration.
 */
export interface InterviewConfig {
  /** Minimum signals per dimension before skipping */
  minSignalsToSkip: number;

  /** Maximum questions per session */
  maxQuestionsPerSession: number;

  /** Whether to include follow-up questions */
  enableFollowUps: boolean;

  // MN-6 FIX: Removed unused extractionModel field
}

/**
 * Default interview configuration.
 */
export const DEFAULT_INTERVIEW_CONFIG: InterviewConfig = {
  minSignalsToSkip: 3,
  maxQuestionsPerSession: 15,
  enableFollowUps: true,
};
