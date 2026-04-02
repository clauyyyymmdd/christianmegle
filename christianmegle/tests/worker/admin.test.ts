import { describe, it, expect } from 'vitest';
import { createMockEnv, createMockDB } from './setup';
import { listPriests } from '../../worker/features/admin/listPriests';
import { updatePriestStatus } from '../../worker/features/admin/updatePriestStatus';

describe('listPriests', () => {
  it('rejects without auth', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/admin/priests?status=pending');

    const res = await listPriests(req, env);

    expect(res.status).toBe(401);
  });

  it('returns priests with valid auth', async () => {
    const db = createMockDB();
    db._setResults([{ id: '1', display_name: 'Father A', status: 'pending' }]);
    const env = createMockEnv({ DB: db as any });

    const req = new Request('http://localhost/api/admin/priests?status=pending', {
      headers: { Authorization: 'Bearer test-secret' },
    });
    const res = await listPriests(req, env);
    const body = await res.json() as any[];

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].display_name).toBe('Father A');
  });
});

describe('updatePriestStatus', () => {
  it('rejects without auth', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/admin/priests/x/approve', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await updatePriestStatus(req, env, { id: 'x', action: 'approve' });

    expect(res.status).toBe(401);
  });

  it('returns success for approve action', async () => {
    const db = createMockDB();
    const env = createMockEnv({ DB: db as any });

    const req = new Request('http://localhost/api/admin/priests/p1/approve', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const res = await updatePriestStatus(req, env, { id: 'p1', action: 'approve' });
    const body = await res.json() as any;

    expect(body).toEqual({ success: true, action: 'approve' });
  });

  it('returns success for reject action', async () => {
    const db = createMockDB();
    const env = createMockEnv({ DB: db as any });

    const req = new Request('http://localhost/api/admin/priests/p2/reject', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const res = await updatePriestStatus(req, env, { id: 'p2', action: 'reject' });
    const body = await res.json() as any;

    expect(body).toEqual({ success: true, action: 'reject' });
  });

  it('binds approved status for approve action', async () => {
    const db = createMockDB();
    const env = createMockEnv({ DB: db as any });

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    await updatePriestStatus(req, env, { id: 'p3', action: 'approve' });

    expect(db._lastBindings()[0]).toBe('approved');
  });

  it('binds rejected status for reject action', async () => {
    const db = createMockDB();
    const env = createMockEnv({ DB: db as any });

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    await updatePriestStatus(req, env, { id: 'p4', action: 'reject' });

    expect(db._lastBindings()[0]).toBe('rejected');
  });
});
