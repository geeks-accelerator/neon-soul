/**
 * Integration Tests: Audit Trail
 *
 * Tests for audit logging and provenance tracking.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'node:path';
import { mkdir, rm, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createAuditLogger, formatAuditEntry, generateAuditStats, type AuditEntry } from '../../src/lib/audit.js';
import type { Signal } from '../../src/types/signal.js';
import type { Principle } from '../../src/types/principle.js';
import type { Axiom } from '../../src/types/axiom.js';

const TEST_OUTPUT_PATH = resolve(process.cwd(), 'test-output');

describe('Audit Trail', () => {
  const auditPath = join(TEST_OUTPUT_PATH, 'test-audit.jsonl');

  beforeEach(async () => {
    await mkdir(TEST_OUTPUT_PATH, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(TEST_OUTPUT_PATH)) {
      await rm(TEST_OUTPUT_PATH, { recursive: true });
    }
  });

  describe('createAuditLogger', () => {
    it('creates logger with session metadata', () => {
      const logger = createAuditLogger(auditPath);
      const session = logger.getSession();
      expect(session.sessionId).toBeDefined();
      expect(session.startedAt).toBeDefined();
      expect(session.entryCount).toBe(0);
    });

    it('logs signal extraction', async () => {
      const logger = createAuditLogger(auditPath);
      const signal: Signal = {
        id: 'sig_test',
        text: 'Test signal',
        type: 'explicit',
        dimension: 'honesty-framework',
        confidence: 0.9,
        source: {
          file: 'test.md',
          type: 'memory',
        },
        embedding: [],
        created_at: new Date().toISOString(),
      };

      await logger.logSignalExtracted(signal);
      const session = logger.getSession();
      expect(session.entryCount).toBe(1);
      expect(session.actionCounts.signal_extracted).toBe(1);
    });

    it('logs principle creation', async () => {
      const logger = createAuditLogger(auditPath);
      const principle: Principle = {
        id: 'prin_test',
        text: 'Test principle',
        dimension: 'honesty-framework',
        n_count: 1,
        confidence: 0.85,
        embedding: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        derived_from: { signals: [] },
      };

      await logger.logPrincipleCreated(principle);
      const session = logger.getSession();
      expect(session.actionCounts.principle_created).toBe(1);
    });

    it('logs axiom promotion', async () => {
      const logger = createAuditLogger(auditPath);
      const axiom: Axiom = {
        id: 'ax_test',
        text: 'Test axiom',
        tier: 'core',
        dimension: 'honesty-framework',
        derived_from: {
          principles: [],
          promoted_at: new Date().toISOString(),
        },
      };
      const principles: Principle[] = [];

      await logger.logAxiomPromoted(axiom, principles);
      const session = logger.getSession();
      expect(session.actionCounts.axiom_promoted).toBe(1);
    });

    it('logs pipeline lifecycle', async () => {
      const logger = createAuditLogger(auditPath);

      await logger.logPipelineStarted({ memoryPath: '/test' });
      await logger.logSoulGenerated(1500, 10);
      await logger.logIterationComplete(1, { signals: 50, principles: 15 });
      await logger.logPipelineCompleted({ tokenCount: 1500 });

      const session = logger.getSession();
      expect(session.actionCounts.pipeline_started).toBe(1);
      expect(session.actionCounts.soul_generated).toBe(1);
      expect(session.actionCounts.iteration_complete).toBe(1);
      expect(session.actionCounts.pipeline_completed).toBe(1);
    });

    it('writes entries as JSONL', async () => {
      const logger = createAuditLogger(auditPath);
      await logger.logPipelineStarted({ test: true });
      await logger.logPipelineCompleted({});

      const content = await readFile(auditPath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines.length).toBe(2);

      // Each line should be valid JSON
      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    });

    it('closes and writes session summary', async () => {
      const logger = createAuditLogger(auditPath);
      await logger.logPipelineStarted({});
      await logger.close();

      const sessionPath = auditPath.replace('.jsonl', '-session.json');
      expect(existsSync(sessionPath)).toBe(true);

      const session = JSON.parse(await readFile(sessionPath, 'utf-8'));
      expect(session.endedAt).toBeDefined();
    });
  });

  describe('formatAuditEntry', () => {
    it('formats entry with time and action', () => {
      const entry: AuditEntry = {
        id: 'test',
        timestamp: new Date().toISOString(),
        action: 'signal_extracted',
        subject: 'sig_1',
        details: { text: 'Test signal' },
        provenance: undefined,
      };

      const formatted = formatAuditEntry(entry);
      expect(formatted).toContain('signal extracted');
      expect(formatted).toContain('Test signal');
    });
  });

  describe('generateAuditStats', () => {
    it('aggregates entries by action', () => {
      const entries: AuditEntry[] = [
        { id: '1', timestamp: new Date().toISOString(), action: 'signal_extracted', subject: 's1', details: {}, provenance: undefined },
        { id: '2', timestamp: new Date().toISOString(), action: 'signal_extracted', subject: 's2', details: {}, provenance: undefined },
        { id: '3', timestamp: new Date().toISOString(), action: 'principle_created', subject: 'p1', details: {}, provenance: undefined },
      ];

      const stats = generateAuditStats(entries);
      expect(stats.totalEntries).toBe(3);
      expect(stats.byAction['signal_extracted']).toBe(2);
      expect(stats.byAction['principle_created']).toBe(1);
    });

    it('aggregates entries by dimension', () => {
      const entries: AuditEntry[] = [
        { id: '1', timestamp: new Date().toISOString(), action: 'signal_extracted', subject: 's1', details: { dimension: 'honesty-framework' }, provenance: undefined },
        { id: '2', timestamp: new Date().toISOString(), action: 'signal_extracted', subject: 's2', details: { dimension: 'honesty-framework' }, provenance: undefined },
        { id: '3', timestamp: new Date().toISOString(), action: 'signal_extracted', subject: 's3', details: { dimension: 'identity-core' }, provenance: undefined },
      ];

      const stats = generateAuditStats(entries);
      expect(stats.byDimension['honesty-framework']).toBe(2);
      expect(stats.byDimension['identity-core']).toBe(1);
    });

    it('builds timeline', () => {
      const entries: AuditEntry[] = [
        { id: '1', timestamp: '2026-02-07T10:00:00Z', action: 'pipeline_started', subject: 's1', details: {}, provenance: undefined },
        { id: '2', timestamp: '2026-02-07T10:01:00Z', action: 'signal_extracted', subject: 's2', details: {}, provenance: undefined },
      ];

      const stats = generateAuditStats(entries);
      expect(stats.timeline.length).toBe(2);
      expect(stats.timeline[0]?.action).toBe('pipeline_started');
      expect(stats.timeline[1]?.action).toBe('signal_extracted');
    });
  });
});
