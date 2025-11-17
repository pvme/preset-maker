export function getDevHeaders(): Record<string, string> {
  const devSecret = import.meta.env.VITE_DEV_SECRET;
  return devSecret ? { 'X-Dev-Secret': devSecret } : {};
}
