// src/utility/comparePresets.ts

export function presetsAreEqual(a: any, b: any): boolean {
  const clone = (obj: any): any => JSON.parse(JSON.stringify(obj));

  const cleanItem = (item: any): any => {
    const { slot, selected, ...rest } = item ?? {};
    const cleaned = Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    );

    const isEmpty = Object.values(cleaned).every(
      val => val === '' || val === null || val === undefined
    );
    return isEmpty ? null : cleaned;
  };

  const cleanArray = (arr: any[] = []) => (arr ?? []).map(cleanItem);

  const cleanRelic = (relic: any): any => {
    const {
      energy,
      description,
      breakdownNotes,
      label,
      name,
      image,
      selected,
      slot,
      ...rest
    } = relic ?? {};

    const cleaned = {
      energy,
      description: (description ?? '').trim(),
      breakdownNotes: (breakdownNotes ?? '').trim(),
      label: (label ?? '').trim(),
      name: (name ?? '').trim(),
      image: (image ?? '').trim(),
      ...rest,
    };

    const isEmpty = Object.values(cleaned).every(
      val => val === '' || val === null || val === undefined
    );
    return isEmpty ? null : cleaned;
  };

  const cleanRelicArray = (arr: any[] = []) => (arr ?? []).map(cleanRelic);

  const cleanRelics = (relics: any = {}) => ({
    primaryRelics: cleanRelicArray(relics.primaryRelics),
    alternativeRelics: cleanRelicArray(relics.alternativeRelics),
  });

  const cleanFamiliar = (familiar: any): any => {
    const {
      name,
      label,
      image,
      breakdownNotes,
      slot,
      selected,
      ...rest
    } = familiar ?? {};

    const cleaned = {
      name: (name ?? '').trim(),
      label: (label ?? '').trim(),
      image: (image ?? '').trim(),
      breakdownNotes: (breakdownNotes ?? '').trim(),
      ...rest,
    };

    const isEmpty = Object.values(cleaned).every(
      val => val === '' || val === null || val === undefined
    );
    return isEmpty ? null : cleaned;
  };

  const cleanFamiliarArray = (arr: any[] = []) => (arr ?? []).map(cleanFamiliar);

  const cleanFamiliars = (familiars: any = {}) => ({
    primaryFamiliars: cleanFamiliarArray(familiars.primaryFamiliars),
    alternativeFamiliars: cleanFamiliarArray(familiars.alternativeFamiliars),
  });

  const cleanPreset = (p: any): any => {
    const {
      slotType,
      slotIndex,
      ...rest
    } = p ?? {};

    return {
      presetName: (rest.presetName ?? '').trim(),
      presetNotes: (rest.presetNotes ?? '').trim(),
      inventorySlots: cleanArray(rest.inventorySlots),
      equipmentSlots: cleanArray(rest.equipmentSlots),
      relics: cleanRelics(rest.relics),
      familiars: cleanFamiliars(rest.familiars),
      breakdown: cleanArray(rest.breakdown),
    };
  };

  try {
    const cleanA = cleanPreset(clone(a));
    const cleanB = cleanPreset(clone(b));
    return JSON.stringify(cleanA) === JSON.stringify(cleanB);
  } catch (err) {
    console.warn('[presetsAreEqual] Comparison failed', err);
    return false;
  }
}
