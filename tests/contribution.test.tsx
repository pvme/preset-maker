import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ItemContributionDialog } from '../src/components/ImportImageDialog/ItemContributionDialog';

const mocks = vi.hoisted(() => ({ config: vi.fn(), read: vi.fn(), prepare: vi.fn(), submit: vi.fn(), challenge: vi.fn(), reset: vi.fn(), remove: vi.fn() }));
vi.mock('../src/imageImport/iconContribution.mjs', () => ({ createPresetIconContribution: () => mocks }));
const match = { group: 'equipment' as const, index: 0, selected: '__keep__', candidates: [], confident: false, thumbnail: 'data:image/png;base64,original' };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.config.mockResolvedValue({ siteKey: 'site-key', categories: ['Other Gear', 'Magic Gear'] });
  mocks.read.mockResolvedValue([{ x: 0, y: 0, original: 'selected-slot', icon: 'data:image/png;base64,cleaned' }]);
  mocks.prepare.mockResolvedValue({ icons: [{ x: 0, y: 0, original: 'reused-slot', icon: 'data:image/png;base64,cleaned' }], selected: 0 });
  mocks.submit.mockResolvedValue({ url: 'https://github.com/pvme/pvme-settings/pull/123' });
  mocks.challenge.mockImplementation(async (_element, _key, onToken) => {
    onToken('verified'); return { reset: mocks.reset, remove: mocks.remove };
  });
});
afterEach(cleanup);

test('missing-item form submits the chosen original slot and details without a GitHub login', async () => {
  const close = vi.fn(); render(<ItemContributionDialog match={match} onClose={close} />);
  await waitFor(() => expect(mocks.challenge).toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText('Missing item screenshot'), { target: { files: [new File(['image'], 'bank.png', { type: 'image/png' })] } });
  await screen.findByRole('button', { name: 'Use cleaned item 1' });
  fireEvent.change(screen.getByLabelText('Item name'), { target: { value: 'New helm' } });
  fireEvent.change(screen.getByLabelText('Item ID'), { target: { value: 'newhelm' } });
  fireEvent.change(screen.getByLabelText('Aliases (optional)'), { target: { value: 'helmnew, newhead' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit item' }));
  await screen.findByRole('link', { name: 'View draft pull request' });
  expect(mocks.submit).toHaveBeenCalledWith(expect.any(String), { id: 'newhelm', name: 'New helm', category: 'Other Gear', preset_slot: 1, id_aliases: ['helmnew', 'newhead'] }, 'selected-slot', 'verified');
  expect(mocks.reset).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'Done' })); expect(close).toHaveBeenCalledOnce();
});

test('without the bot service, preparation stays available and submission is disabled', async () => {
  mocks.config.mockResolvedValue(null);
  render(<ItemContributionDialog match={match} onClose={() => {}} />);
  await screen.findByText(/Item submissions are not connected yet/);
  expect((screen.getByRole('button', { name: 'Submit item' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByLabelText('Missing item screenshot')).toBeTruthy();
  expect(mocks.challenge).not.toHaveBeenCalled();
});

test('a failed contribution retains the form and allows a new verification attempt', async () => {
  mocks.submit.mockRejectedValue(new Error('Please try again later.'));
  render(<ItemContributionDialog match={match} onClose={() => {}} />);
  await waitFor(() => expect(mocks.challenge).toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText('Missing item screenshot'), { target: { files: [new File(['image'], 'bank.png', { type: 'image/png' })] } });
  await screen.findByRole('button', { name: 'Use cleaned item 1' });
  fireEvent.change(screen.getByLabelText('Item name'), { target: { value: 'New helm' } });
  fireEvent.change(screen.getByLabelText('Item ID'), { target: { value: 'newhelm' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit item' }));
  await screen.findByText('Please try again later.');
  expect((screen.getByLabelText('Item name') as HTMLInputElement).value).toBe('New helm');
  expect(mocks.reset).toHaveBeenCalledOnce();
});

test('suggesting an imported item reuses the original screenshot and preselects its slot', async () => {
  const source = new Image(); const region = { group: 'inventory' as const, index: 0, x: 1, y: 1, w: 36, h: 32 };
  render(<ItemContributionDialog match={{ ...match, group: 'inventory', region }} source={source} onClose={() => {}} />);
  await screen.findByText('Selected item prepared from your uploaded screenshot.');
  expect(mocks.prepare).toHaveBeenCalledWith(source, region, expect.any(AbortSignal));
  expect(mocks.read).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Use cleaned item 1' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.change(screen.getByLabelText('Item name'), { target: { value: 'New item' } });
  fireEvent.change(screen.getByLabelText('Item ID'), { target: { value: 'newitem' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit item' }));
  await screen.findByRole('link', { name: 'View draft pull request' });
  expect(mocks.submit).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ id: 'newitem' }), 'reused-slot', 'verified');
});

test('worn equipment never automatically selects an unrelated inventory icon', async () => {
  mocks.prepare.mockResolvedValue({ icons: [{ x: 0, y: 0, original: 'other-slot', icon: 'data:image/png;base64,cleaned' }], selected: -1 });
  render(<ItemContributionDialog match={match} source={new Image()} onClose={() => {}} />);
  await screen.findByText(/Choose this item from the bank slots below/);
  expect(screen.getByRole('button', { name: 'Use cleaned item 1' }).getAttribute('aria-pressed')).toBe('false');
  expect((screen.getByRole('button', { name: 'Submit item' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.queryByRole('link', { name: 'Download cleaned icon' })).toBeNull();
});
