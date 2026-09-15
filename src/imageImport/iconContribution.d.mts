export interface ContributionIcon { x: number; y: number; original: string; icon: string }
export interface ContributionItem { id: string; name: string; category: string; preset_slot: number; id_aliases: string[] }
export interface ContributionConfig { siteKey: string; categories: string[] }
export interface Challenge { reset(): void; remove(): void }
export function createPresetIconContribution(assetBase: string): {
  clean(slot: ImageData, border: ImageData, background: ImageData): ImageData | null;
  extract(image: HTMLImageElement | HTMLCanvasElement, signal?: AbortSignal): Promise<ContributionIcon[]>;
  read(file: File, signal?: AbortSignal): Promise<ContributionIcon[]>;
  config(endpoint: string): Promise<ContributionConfig | null>;
  submit(endpoint: string, item: ContributionItem, original: string, token: string): Promise<{ url: string; existing?: boolean }>;
  challenge(element: HTMLElement, siteKey: string, onToken: (token: string) => void): Promise<Challenge>;
};
