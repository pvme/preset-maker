import { useEffect, useRef, type PointerEvent } from "react";
import { Box, useTheme } from "@mui/material";
import { regions, type Box as CropBox, type Layout, type Region } from "../../imageImport/matcher";

interface Props {
  image: HTMLImageElement;
  crop: CropBox;
  layout: Layout;
  detected?: Region[];
  onChange: (box: CropBox) => void;
}

export function CropPreview({ image, crop, layout, detected, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const start = useRef<{ x: number; y: number }>();
  const theme = useTheme();
  const scale = Math.min(1, 720 / image.width, 380 / image.height);
  const width = Math.round(image.width * scale), height = Math.round(image.height * scale);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    const sx = width / image.width, sy = height / image.height;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.rect(crop.x * sx, crop.y * sy, crop.w * sx, crop.h * sy);
    ctx.fill("evenodd");
    ctx.strokeStyle = theme.palette.primary.main;
    ctx.lineWidth = 1;
    for (const region of (layout === "auto" ? detected ?? [] : regions(layout, crop))) {
      ctx.strokeRect(region.x * sx, region.y * sy, region.w * sx, region.h * sy);
    }
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x * sx, crop.y * sy, crop.w * sx, crop.h * sy);
  }, [image, crop, layout, detected, width, height, theme.palette.primary.main]);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(image.width - 1, Math.round((event.clientX - rect.left) / rect.width * image.width))),
      y: Math.max(0, Math.min(image.height - 1, Math.round((event.clientY - rect.top) / rect.height * image.height))),
    };
  };
  return <Box sx={{ bgcolor: "background.default", p: 1, borderRadius: 1, flexShrink: 0 }}>
    <canvas ref={canvasRef} width={width} height={height}
      role="img" aria-label="Screenshot with slot outlines. Drag to crop, or use the crop fields below."
      style={{ display: "block", margin: "0 auto", maxWidth: "100%", height: "auto", touchAction: "none", cursor: "crosshair" }}
      onPointerDown={event => {
        if (event.button !== 0) return;
        start.current = point(event);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        if (!start.current) return;
        const end = point(event);
        onChange({ x: Math.min(start.current.x, end.x), y: Math.min(start.current.y, end.y),
          w: Math.max(1, Math.abs(end.x - start.current.x)), h: Math.max(1, Math.abs(end.y - start.current.y)) });
      }}
      onPointerUp={event => { start.current = undefined; event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={() => { start.current = undefined; }}
    />
  </Box>;
}
