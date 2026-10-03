import { afterEach, expect, test, vi } from 'vitest';
import { copyReadyEmbedLink } from '../src/utility/copy-embed-link';
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

test('clipboard access begins before the asynchronous readiness check completes', async () => {
  let resolve: (url: string) => void;
  const data = new Promise<string>(done => { resolve = done; });
  const write = vi.fn(async ([item]) => { await item.data['text/plain']; });
  vi.stubGlobal('ClipboardItem', class { constructor(public data: any) {} });
  vi.stubGlobal('navigator', { clipboard: { write } });
  const copying = copyReadyEmbedLink(() => data);
  expect(write).toHaveBeenCalledOnce();
  resolve!('https://example.test/ready');
  await copying;
});

test('unready previews never write a text link', async () => {
  const writeText = vi.fn();
  vi.stubGlobal('ClipboardItem', undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  await expect(copyReadyEmbedLink(async () => undefined)).rejects.toThrow('Embed is not ready yet');
  expect(writeText).not.toHaveBeenCalled();
});
