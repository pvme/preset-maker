export interface ContributionIcon { x: number; y: number; original: string; icon: string }
export function createPresetIconContribution(assetBase: string): {
  clean(slot: ImageData, border: ImageData, background: ImageData): ImageData | null;
  extract(image: HTMLImageElement | HTMLCanvasElement, signal?: AbortSignal): Promise<ContributionIcon[]>;
  read(file: File, signal?: AbortSignal): Promise<ContributionIcon[]>;
  prepare(image: HTMLImageElement | HTMLCanvasElement, region: { x: number; y: number; w: number; h: number } | undefined, signal?: AbortSignal): Promise<{ icons: ContributionIcon[]; selected: number }>;
};
