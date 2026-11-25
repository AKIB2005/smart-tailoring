import { describe, expect, it } from 'vitest';
import { SubmissionGuard } from './submission';

describe('submission protection', () => {
  it('blocks rapid repeats and edits during a pending payment or order save', async () => {
    const guard = new SubmissionGuard(); let calls = 0; let finish!: (ok: boolean) => void;
    const save = () => { calls++; return new Promise<boolean>(resolve => { finish = resolve; }); };
    const first = guard.run(save);
    guard.reset(); expect(await guard.run(save)).toBe(false);
    finish(true); expect(await first).toBe(true);
    expect(await guard.run(save)).toBe(false); expect(calls).toBe(1);
    guard.reset(); expect(await guard.run(async () => true)).toBe(true);
  });
  it('allows retry after a failed or thrown save', async () => {
    const guard = new SubmissionGuard();
    expect(await guard.run(async () => false)).toBe(false);
    await expect(guard.run(async () => { throw Error('storage'); })).rejects.toThrow('storage');
    expect(await guard.run(async () => true)).toBe(true);
  });
});
