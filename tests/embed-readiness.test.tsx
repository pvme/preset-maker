import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useEmbedReadiness } from '../src/components/PresetMenu/useEmbedReadiness';
import { getEmbedStatus } from '../src/api/embed-status';

vi.mock('../src/api/embed-status', () => ({ getEmbedStatus: vi.fn() }));
const ready = { state: 'ready' as const, revision: 'a'.repeat(64) };
const options = { id: 'qa', layout: '7x4' as const, mode: 'cloud' as const, isDirty: false, busy: false, contentKey: 'one' };
async function flush() { await act(async () => {}); }
beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  vi.mocked(getEmbedStatus).mockResolvedValue({ state: 'pending' });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.resetAllMocks(); });

test('polling automatically enables copying and uses the published revision', async () => {
  const { result } = renderHook(() => useEmbedReadiness(options));
  await flush();
  expect(result.current.label).toBe('Preparing embed…');
  expect(result.current.ready).toBe(false);
  vi.mocked(getEmbedStatus).mockResolvedValue(ready);
  await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
  expect(result.current.label).toBe('Copy embed link');
  let url;
  await act(async () => { url = await result.current.copyUrl(); });
  expect(url).toContain(`/qa/7x4/?v=${ready.revision}`);
});

test('unsaved, local and busy presets cannot copy or poll', async () => {
  for (const [overrides, label] of [
    [{ isDirty: true }, 'Save changes first'],
    [{ mode: 'local' }, 'Upload to cloud first'],
    [{ busy: true }, 'Preparing embed…'],
  ] as const) {
    const { result, unmount } = renderHook(() => useEmbedReadiness({ ...options, ...overrides }));
    await flush();
    expect(result.current.label).toBe(label);
    expect(result.current.ready).toBe(false);
    expect(await result.current.copyUrl()).toBeUndefined();
    unmount();
  }
  expect(getEmbedStatus).not.toHaveBeenCalled();
});

test('layout changes and saves invalidate old readiness immediately', async () => {
  vi.mocked(getEmbedStatus).mockResolvedValue(ready);
  const { result, rerender } = renderHook(props => useEmbedReadiness(props), { initialProps: { ...options, layout: '7x4' as '7x4' | '4x7' } });
  await flush();
  expect(result.current.ready).toBe(true);
  vi.mocked(getEmbedStatus).mockResolvedValue({ state: 'pending' });
  rerender({ ...options, layout: '4x7' });
  expect(result.current.ready).toBe(false);
  await flush();
  expect(getEmbedStatus).toHaveBeenLastCalledWith('qa', '4x7', expect.any(AbortSignal));
  rerender({ ...options, contentKey: 'new save', layout: '4x7' });
  expect(result.current.ready).toBe(false);
});

test('hidden tabs pause and visibility resumes with an immediate check', async () => {
  renderHook(() => useEmbedReadiness(options));
  await flush();
  const count = vi.mocked(getEmbedStatus).mock.calls.length;
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  act(() => { document.dispatchEvent(new Event('visibilitychange')); });
  await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
  expect(getEmbedStatus).toHaveBeenCalledTimes(count);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  act(() => { document.dispatchEvent(new Event('visibilitychange')); });
  await flush();
  expect(getEmbedStatus).toHaveBeenCalledTimes(count + 1);
});

test('network errors offer retry; a stale result at copy time blocks copying', async () => {
  vi.mocked(getEmbedStatus).mockRejectedValue(new Error('offline'));
  const { result } = renderHook(() => useEmbedReadiness(options));
  await flush();
  expect(result.current.canRetry).toBe(true);
  vi.mocked(getEmbedStatus).mockResolvedValue(ready);
  act(() => result.current.retry());
  await flush();
  expect(result.current.ready).toBe(true);
  vi.mocked(getEmbedStatus).mockResolvedValue({ state: 'pending' });
  await act(async () => { expect(await result.current.copyUrl()).toBeUndefined(); });
  expect(result.current.ready).toBe(false);
});

test('old in-flight checks cannot enable a different preset', async () => {
  let resolve: (status: typeof ready) => void;
  vi.mocked(getEmbedStatus).mockReturnValueOnce(new Promise(done => { resolve = done; }));
  const { result, rerender } = renderHook(props => useEmbedReadiness(props), { initialProps: options });
  rerender({ ...options, id: 'different' });
  await act(async () => { resolve!(ready); });
  expect(result.current.ready).toBe(false);
});

test('pending polling slows down after a minute and stops on unmount', async () => {
  const { unmount } = renderHook(() => useEmbedReadiness(options));
  await flush();
  await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
  const count = vi.mocked(getEmbedStatus).mock.calls.length;
  await act(async () => { await vi.advanceTimersByTimeAsync(29000); });
  expect(getEmbedStatus).toHaveBeenCalledTimes(count);
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(getEmbedStatus).toHaveBeenCalledTimes(count + 1);
  unmount();
  await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
  expect(getEmbedStatus).toHaveBeenCalledTimes(count + 1);
});
