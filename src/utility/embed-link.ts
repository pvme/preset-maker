import type { InventoryLayout } from '../hooks/useInventoryLayout';

export function buildEmbedLink(id: string, layout: InventoryLayout): string {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  return new URL(`embeds/${encodeURIComponent(id)}/${layout}/`, base).href;
}
