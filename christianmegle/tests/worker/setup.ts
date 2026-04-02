import { vi } from 'vitest';
import type { Env } from '../../worker/lib/types';

/**
 * Minimal D1-like mock. Tracks prepared statements and returns
 * configurable results so handler logic can be tested without workerd.
 */
export function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    SIGNALING: {} as any,
    MATCHMAKER: {} as any,
    DB: createMockDB(),
    ADMIN_SECRET: 'test-secret',
    TURN_SERVER_URL: '',
    TURN_USERNAME: '',
    TURN_CREDENTIAL: '',
    NOTIFICATION_EMAIL: '',
    ...overrides,
  };
}

interface MockStatement {
  bind: (...args: any[]) => MockStatement;
  all: () => Promise<{ results: any[] }>;
  first: () => Promise<any>;
  run: () => Promise<{ success: boolean }>;
}

interface MockDB {
  prepare: (sql: string) => MockStatement;
  /** Set what the next .all() returns */
  _setResults: (results: any[]) => void;
  /** Set what the next .first() returns */
  _setFirst: (row: any) => void;
  /** Get the last SQL prepared */
  _lastSQL: () => string;
  /** Get the last bound params */
  _lastBindings: () => any[];
}

export function createMockDB(): MockDB & D1Database {
  let results: any[] = [];
  let firstRow: any = null;
  let lastSQL = '';
  let lastBindings: any[] = [];

  const stmt: MockStatement = {
    bind: (...args: any[]) => {
      lastBindings = args;
      return stmt;
    },
    all: () => Promise.resolve({ results }),
    first: () => Promise.resolve(firstRow),
    run: () => Promise.resolve({ success: true }),
  };

  const db: MockDB = {
    prepare: (sql: string) => {
      lastSQL = sql;
      lastBindings = [];
      return stmt;
    },
    _setResults: (r) => { results = r; },
    _setFirst: (r) => { firstRow = r; },
    _lastSQL: () => lastSQL,
    _lastBindings: () => lastBindings,
  };

  return db as MockDB & D1Database;
}
