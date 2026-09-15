export function createPresetIconContribution(assetBase) {
  const kinds = ['ge', 'inventory', 'inventory-alt'];
  const canvas = (width, height) => Object.assign(document.createElement('canvas'), { width, height });
  const pixels = image => {
    const output = canvas(image.width, image.height);
    output.getContext('2d').drawImage(image, 0, 0);
    return output.getContext('2d').getImageData(0, 0, output.width, output.height);
  };
  const png = data => {
    const output = canvas(data.width, data.height);
    output.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data.data), data.width, data.height), 0, 0);
    return output.toDataURL('image/png');
  };
  let templates;
  async function loadTemplates() {
    if (!templates) templates = Promise.all(kinds.map(async kind => {
      const images = await Promise.all(['border', 'background'].map(async suffix => {
        const image = new Image(); image.src = assetBase + '/' + kind + '-' + suffix + '.png';
        await image.decode(); return pixels(image);
      }));
      return { kind, border: images[0], background: images[1] };
    })).catch(error => { templates = null; throw error; });
    return templates;
  }
  function clean(slot, border, background) {
    if (slot.width !== 38 || slot.height !== 34) return null;
    const result = new Uint8ClampedArray(slot.data.length);
    let visible = 0;
    for (let p = 0; p < result.length; p += 4) {
      const same = image => [0, 1, 2, 3].every(c => slot.data[p + c] === image.data[p + c]);
      if (border.data[p + 3] && !same(border)) return null;
      const [r, g, b, a] = slot.data.subarray(p, p + 4);
      if (same(background) || (a === 255 && ((r === 0 && g === 0 && b === 1) || (r === 255 && g === 255 && b === 0)))) continue;
      result.set(slot.data.subarray(p, p + 4), p);
      if (a) visible++;
    }
    return visible ? { width: 38, height: 34, data: result } : null;
  }
  async function extract(image, signal) {
    if (image.width > 2048 || image.height > 2048) throw new Error('Crop the bank or GE screenshot to at most 2048 pixels on each side.');
    const source = pixels(image), entries = await loadTemplates();
    for (const entry of entries) {
      const mask = [];
      for (let p = 0; p < entry.border.data.length; p += 4) if (entry.border.data[p + 3]) mask.push(p / 4);
      const found = [];
      for (let y = 0; y <= source.height - 34; y++) {
        if (y % 24 === 0) { signal?.throwIfAborted(); await new Promise(resolve => setTimeout(resolve, 0)); }
        for (let x = 0; x <= source.width - 38; x++) {
          if (!mask.every(p => {
            const offset = ((y + Math.floor(p / 38)) * source.width + x + p % 38) * 4;
            return [0, 1, 2, 3].every(c => source.data[offset + c] === entry.border.data[p * 4 + c]);
          })) continue;
          const slot = { width: 38, height: 34, data: new Uint8ClampedArray(38 * 34 * 4) };
          for (let row = 0; row < 34; row++) slot.data.set(source.data.subarray(((y + row) * source.width + x) * 4, ((y + row) * source.width + x + 38) * 4), row * 38 * 4);
          const icon = clean(slot, entry.border, entry.background);
          if (icon) found.push({ x, y, original: png(slot), icon: png(icon) });
          if (found.length >= 100) break;
        }
        if (found.length >= 100) break;
      }
      if (found.length) return found;
    }
    throw new Error('No compatible bank or GE slots found. Use an original PNG at 100% interface scale, with an opaque background and the full slot border. Worn equipment crops cannot be cleaned by this tool.');
  }
  async function read(file, signal) {
    if (file.type !== 'image/png' || file.size > 6 * 1024 * 1024) throw new Error('Choose an original PNG smaller than 6 MB.');
    const url = URL.createObjectURL(file);
    try { const image = new Image(); image.src = url; await image.decode(); return await extract(image, signal); }
    finally { URL.revokeObjectURL(url); }
  }
  async function prepare(image, region, signal) {
    const icons = await extract(image, signal);
    const selected = region ? icons.findIndex(icon => {
      const overlap = Math.max(0, Math.min(icon.x + 38, region.x + region.w) - Math.max(icon.x, region.x)) *
        Math.max(0, Math.min(icon.y + 34, region.y + region.h) - Math.max(icon.y, region.y));
      return overlap / (region.w * region.h) >= .8 && overlap / (38 * 34) >= .5;
    }) : -1;
    return { icons, selected };
  }
  async function config(endpoint) {
    if (!endpoint) return null;
    const response = await fetch(endpoint.replace(/\/$/, '') + '/config', { credentials: 'omit' });
    if (!response.ok) throw new Error('Item submissions are temporarily unavailable.');
    const result = await response.json();
    if (!result.siteKey) throw new Error('Item submissions are not connected yet.');
    return result;
  }
  async function submit(endpoint, item, original, token) {
    const response = await fetch(endpoint.replace(/\/$/, '') + '/submit', {
      method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item, original, token }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not submit this item. Please try again.');
    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/.test(result.url)) throw new Error('The submission did not return a pull request link.');
    return result;
  }
  async function challenge(element, siteKey, onToken) {
    if (!window.turnstile) await new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-item-turnstile]');
      const script = existing || document.createElement('script');
      const timer = setTimeout(() => reject(new Error('Verification could not load. Please reopen the form.')), 15000);
      const done = fn => { clearTimeout(timer); fn(); };
      script.addEventListener('load', () => done(resolve), { once: true });
      script.addEventListener('error', () => { script.remove(); done(() => reject(new Error('Verification could not load. Please reopen the form.'))); }, { once: true });
      if (!existing) { script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.dataset.itemTurnstile = ''; document.head.append(script); }
    });
    const id = window.turnstile.render(element, { sitekey: siteKey, action: 'item-contribution', callback: onToken,
      'expired-callback': () => onToken(''), 'error-callback': () => onToken('') });
    return { reset() { onToken(''); window.turnstile.reset(id); }, remove() { window.turnstile.remove(id); } };
  }
  return { clean, extract, read, prepare, config, submit, challenge };
}
