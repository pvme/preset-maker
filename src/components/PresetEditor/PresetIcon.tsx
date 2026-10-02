import React, { useEffect, useState } from "react";

// Use the same alpha-bounded, aspect-preserving footprint as the static renderer.
// Cache each source once; hosts without canvas CORS support retain the original.
const croppedSources = new Map<string, Promise<string>>();
function cropIcon(src: string): Promise<string> {
  const cached = croppedSources.get(src);
  if (cached) return cached;
  const result = new Promise<string>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onerror = () => resolve(src);
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src);
        ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
        for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
          if (!pixels[(y * canvas.width + x) * 4 + 3]) continue;
          left = Math.min(left, x); top = Math.min(top, y);
          right = Math.max(right, x); bottom = Math.max(bottom, y);
        }
        if (right < 0) return resolve(src);
        canvas.width = right - left + 1;
        canvas.height = bottom - top + 1;
        ctx.drawImage(image, left, top, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch { resolve(src); }
    };
    image.src = src;
  });
  if (croppedSources.size >= 512) croppedSources.clear();
  croppedSources.set(src, result);
  return result;
}

export function PresetIcon({ src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [cropped, setCropped] = useState({ source: "", url: "" });
  useEffect(() => {
    let active = true;
    if (src) void cropIcon(src).then(url => { if (active) setCropped({ source: src, url }); });
    return () => { active = false; };
  }, [src]);
  return <img {...props} src={cropped.source === src ? cropped.url : src} />;
}
