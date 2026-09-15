export function createPresetLayoutDetector() {
  function detectScale({ data, width, height }) {
    const gray = new Float32Array(width * height);
    const horizontal = new Uint8Array(gray.length), vertical = new Uint8Array(gray.length);
    for (let p = 0; p < gray.length; p++) gray[p] = (data[p * 4] + data[p * 4 + 1] + data[p * 4 + 2]) / 3;
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      const p = y * width + x, r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
      if (Math.max(r, g, b) > 145 || Math.max(r, g, b) - Math.min(r, g, b) > 55) continue;
      horizontal[p] = Math.max(Math.abs(gray[p] - gray[p - width]), Math.abs(gray[p] - gray[p + width])) >= 4 ? 1 : 0;
      vertical[p] = Math.max(Math.abs(gray[p] - gray[p - 1]), Math.abs(gray[p] - gray[p + 1])) >= 4 ? 1 : 0;
    }
    const hp = new Uint32Array((width + 1) * height), vp = new Uint32Array(width * (height + 1));
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      hp[y * (width + 1) + x + 1] = hp[y * (width + 1) + x] + horizontal[p];
      vp[(y + 1) * width + x] = vp[y * width + x] + vertical[p];
    }
    const hline = (x, y, w) => (hp[y * (width + 1) + x + w] - hp[y * (width + 1) + x]) / w;
    const vline = (x, y, h) => (vp[(y + h) * width + x] - vp[y * width + x]) / h;
    function frame(x, y, w, h) {
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      if (x < 1 || y < 1 || x + w >= width - 1 || y + h >= height - 1) return 0;
      const a = hline(x, y, w), b = hline(x, y + h - 1, w), c = vline(x, y, h), d = vline(x + w - 1, y, h);
      return Math.min(a, b, c, d) < .4 ? 0 : (a + b + c + d) / 4;
    }
    const raw = [];
    for (let y = 1; y < height - 1; y++) {
      let start = -1, last = -1;
      for (let x = 1; x < width; x++) {
        if (x < width - 1 && horizontal[y * width + x]) {
          if (start < 0) start = x;
          last = x;
        } else if (start >= 0 && (x - last > 2 || x === width - 1)) {
          const w = last - start + 1;
          if (w >= 12 && w <= 160) {
            for (const sign of [-1, 1]) {
              let best;
              for (let h = Math.round(w * .8); h <= Math.round(w * 1.12); h++) {
                const top = sign === 1 ? y : y - h + 1;
                const score = frame(start, top, w, h);
                const adjusted = score - Math.abs(h / w - .94) * .06;
                if (score >= .86 && (!best || adjusted > best.adjusted)) best = { x: start, y: top, w, h, score, adjusted };
              }
              if (best) raw.push(best);
            }
          }
          start = -1;
        }
      }
    }
    raw.sort((a, b) => b.adjusted - a.adjusted);
    const rectangles = [];
    for (const rect of raw) {
      if (!rectangles.some(other => Math.abs(rect.x - other.x) < 3 && Math.abs(rect.y - other.y) < 3 && Math.abs(rect.w - other.w) < 5 && Math.abs(rect.h - other.h) < 5)) rectangles.push(rect);
      if (rectangles.length >= 600) break;
    }
    function pitches(axis) {
      const histogram = new Map();
      for (let i = 0; i < rectangles.length; i++) for (let j = i + 1; j < rectangles.length; j++) {
        const a = rectangles[i], b = rectangles[j], other = axis === 'x' ? 'y' : 'x';
        if (Math.abs(a[other] - b[other]) > 3 || Math.abs(a.w - b.w) > 5 || Math.abs(a.h - b.h) > 6) continue;
        const distance = Math.abs(a[axis] - b[axis]), size = axis === 'x' ? (a.w + b.w) / 2 : (a.h + b.h) / 2;
        for (let stride = 1; stride <= 6; stride++) {
          const step = Math.round(distance / stride * 2) / 2;
          if (step < size * .95 || step > size * 1.6) continue;
          histogram.set(step, (histogram.get(step) || 0) + Math.min(a.score, b.score) / Math.sqrt(stride));
        }
      }
      return [...histogram].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([step]) => step);
    }
    const xs = pitches('x'), ys = pitches('y');
    function grid(columns, rows, excluded) {
      let best;
      const seen = new Set();
      for (const dx of xs) for (const dy of ys) {
        if (dy / dx < .65 || dy / dx > 1.4) continue;
        const suitable = rectangles.filter(seed => seed.w / dx >= .78 && seed.w / dx <= .98 && seed.h / dy >= .78 && seed.h / dy <= 1 &&
          (!excluded || seed.x >= excluded.x + excluded.w || seed.x + seed.w <= excluded.x || seed.y >= excluded.y + excluded.h || seed.y + seed.h <= excluded.y));
        const sizes = new Map();
        for (const seed of suitable) {
          const key = seed.w + ',' + seed.h;
          sizes.set(key, (sizes.get(key) || 0) + seed.score);
        }
        const common = new Set([...sizes].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([key]) => key));
        for (const seed of suitable.filter(seed => common.has(seed.w + ',' + seed.h)).slice(0, 120)) {
          const w = seed.w, h = seed.h;
          for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
            const x = seed.x - col * dx, y = seed.y - row * dy;
            if (x < 1 || y < 1 || x + (columns - 1) * dx + w >= width - 1 || y + (rows - 1) * dy + h >= height - 1) continue;
            if (excluded && x < excluded.x + excluded.w && x + columns * dx > excluded.x && y < excluded.y + excluded.h && y + rows * dy > excluded.y) continue;
            const key = [x, y, dx, dy, w, h].join(',');
            if (seen.has(key)) continue; seen.add(key);
            if (![0, rows - 1].every(r => {
              let count = 0;
              for (let c = 0; c < columns; c++) if (frame(x + c * dx, y + r * dy, w, h) > .76) count++;
              return count >= Math.ceil(columns / 2);
            })) continue;
            let total = 0, found = 0;
            const rowFound = Array(rows).fill(0), colFound = Array(columns).fill(0);
            for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
              const score = frame(x + c * dx, y + r * dy, w, h);
              total += score;
              if (score > .76) { found++; rowFound[r]++; colFound[c]++; }
            }
            const score = total / (columns * rows);
            if (rowFound[0] >= Math.ceil(columns / 2) && rowFound[rows - 1] >= Math.ceil(columns / 2) &&
                colFound.every(count => count >= Math.ceil(rows / 2)) && found >= columns * rows * .72 &&
                score > .77 && (!best || score > best.score)) best = { x, y, w, h, dx, dy, columns, rows, score, found };
          }
        }
      }
      return best;
    }
    const inventories = [grid(4, 7), grid(7, 4)].filter(Boolean).sort((a, b) => b.score - a.score);
    const inventory = inventories[0];
    const inventoryBounds = inventory && { x: inventory.x, y: inventory.y, w: (inventory.columns - 1) * inventory.dx + inventory.w, h: (inventory.rows - 1) * inventory.dy + inventory.h };
    const equipmentOffsets = [[0, 0], [-1, 1], [0, 1], [-1.3, 2], [0, 2], [1.3, 2], [0, 3], [-1.3, 4], [0, 4], [1.3, 4], [1, 1], [1, 0]];
    let equipment;
    for (const dy of ys) {
      for (const seed of rectangles) {
        const w = seed.w, h = seed.h;
        if (w / dy < .65 || w / dy > .98 || h / dy < .65 || h / dy > .98) continue;
        for (const dx of new Set([dy, ...xs.filter(step => step / dy > .8 && step / dy < 1.25)])) for (const spread of [1.3, 1.5]) {
          for (let row = 0; row < 5; row++) {
            const x = seed.x, y = seed.y - row * dy;
            if (x < dx * spread || y < 1 || x + dx * spread + w >= width - 1 || y + dy * 4 + h >= height - 1) continue;
            let total = 0, found = 0;
            const boxes = equipmentOffsets.map(([ox, oy]) => ({ x: Math.round(x + (Math.abs(ox) === 1.3 ? Math.sign(ox) * spread : ox) * dx), y: Math.round(y + oy * dy), w, h }));
            if (inventoryBounds && boxes.some(box => box.x < inventoryBounds.x + inventoryBounds.w && box.x + box.w > inventoryBounds.x && box.y < inventoryBounds.y + inventoryBounds.h && box.y + box.h > inventoryBounds.y)) continue;
            for (const box of boxes) { const score = frame(box.x, box.y, w, h); total += score; if (score > .76) found++; }
            const score = total / boxes.length;
            if (found >= 9 && score > .78 && (!equipment || score > equipment.score)) equipment = { boxes, score, found };
          }
        }
      }
    }
    const compact = grid(3, 4, inventoryBounds);
    if (compact && (!equipment || compact.score > equipment.score + .04)) equipment = {
      boxes: Array.from({ length: 12 }, (_, i) => ({ x: compact.x + i % 3 * compact.dx, y: compact.y + Math.floor(i / 3) * compact.dy, w: compact.w, h: compact.h })), score: compact.score,
    };
    const regions = [];
    const add = (group, index, box) => {
      const inset = Math.max(1, Math.round(Math.min(box.w, box.h) / 34));
      regions.push({ group, index, x: box.x + inset, y: box.y + inset, w: box.w - 2 * inset, h: box.h - 2 * inset });
    };
    if (inventory) for (let i = 0; i < 28; i++) add('inventory', i, { x: inventory.x + i % inventory.columns * inventory.dx, y: inventory.y + Math.floor(i / inventory.columns) * inventory.dy, w: inventory.w, h: inventory.h });
    if (equipment) equipment.boxes.forEach((box, i) => add('equipment', i, box));
    return { regions, inventory: !!inventory, equipment: !!equipment };
  }
  function resize(pixels, factor) {
    const width = Math.max(1, Math.round(pixels.width * factor)), height = Math.max(1, Math.round(pixels.height * factor));
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const sx = Math.min(pixels.width - 1, (x + .5) * pixels.width / width - .5);
      const sy = Math.min(pixels.height - 1, (y + .5) * pixels.height / height - .5);
      const x0 = Math.max(0, Math.floor(sx)), y0 = Math.max(0, Math.floor(sy));
      const x1 = Math.min(pixels.width - 1, x0 + 1), y1 = Math.min(pixels.height - 1, y0 + 1);
      const fx = sx - x0, fy = sy - y0;
      for (let channel = 0; channel < 4; channel++) data[(y * width + x) * 4 + channel] =
        (pixels.data[(y0 * pixels.width + x0) * 4 + channel] * (1 - fx) + pixels.data[(y0 * pixels.width + x1) * 4 + channel] * fx) * (1 - fy) +
        (pixels.data[(y1 * pixels.width + x0) * 4 + channel] * (1 - fx) + pixels.data[(y1 * pixels.width + x1) * 4 + channel] * fx) * fy;
    }
    return { data, width, height };
  }
  function detect(pixels) {
    let best = { regions: [], inventory: false, equipment: false };
    const base = Math.min(1, 1400 / Math.max(pixels.width, pixels.height));
    for (const multiplier of [1, .75, .5]) {
      const factor = base * multiplier;
      const sample = factor === 1 ? pixels : resize(pixels, factor);
      const result = detectScale(sample);
      if (result.regions.length > best.regions.length) {
        best = { ...result, regions: result.regions.map(region => ({ ...region,
          x: region.x * pixels.width / sample.width, y: region.y * pixels.height / sample.height,
          w: region.w * pixels.width / sample.width, h: region.h * pixels.height / sample.height })) };
      }
      if (best.inventory && best.equipment) break;
    }
    return best;
  }
  async function detectAsync(pixels, signal) {
    signal?.throwIfAborted();
    if (typeof Worker === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 0));
      signal?.throwIfAborted();
      return detect(pixels);
    }
    const url = URL.createObjectURL(new Blob([
      'const detector = (' + createPresetLayoutDetector.toString() + ')(); self.onmessage = event => { try { self.postMessage({ result: detector.detect(event.data) }); } catch (error) { self.postMessage({ error: error.message }); } };'
    ], { type: 'text/javascript' }));
    return new Promise((resolve, reject) => {
      let worker;
      const finish = (error, result) => {
        worker?.terminate(); URL.revokeObjectURL(url); signal?.removeEventListener('abort', abort);
        if (error) reject(error); else resolve(result);
      };
      const abort = () => finish(signal.reason || new Error('Detection cancelled.'));
      try {
        worker = new Worker(url);
        worker.onmessage = event => finish(event.data.error ? new Error(event.data.error) : null, event.data.result);
        worker.onerror = () => finish(new Error('Could not detect slots. Try again or choose a manual layout.'));
        signal?.addEventListener('abort', abort, { once: true });
        worker.postMessage(pixels, [pixels.data.buffer]);
      } catch (error) { finish(error); }
    });
  }
  return { detect, detectAsync };
}
