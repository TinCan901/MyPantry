import { ContainerType, PantryItem, UnitType } from '../types/pantry';

export function formatPantryQty(
  amount: string | number,
  unit: string,
  container: string,
  count: string | number
): string {
  const cnt = Math.max(1, parseInt(String(count), 10) || 1);
  const cleanAmt = String(amount ?? '').trim();

  if (!cleanAmt) {
    const baseLabel = container || 'In stock';
    return cnt > 1 ? `${cnt} × ${baseLabel}` : baseLabel;
  }

  const space = unit === 'kg' || unit === 'l' || unit === 'pcs' ? ' ' : '';
  const singlePack = container
    ? `${cleanAmt}${space}${unit} ${container}`
    : `${cleanAmt}${space}${unit}`;

  return cnt > 1 ? `${cnt} × ${singlePack}` : singlePack;
}

export function splitQtyParts(qtyStr: string): {
  count: number;
  amount: string;
  unit: UnitType;
  container: ContainerType;
} {
  const match = String(qtyStr || '')
    .trim()
    .match(
      /^(?:(\d+)\s*[×x]\s*)?(\d+(?:\.\d+)?)\s*(g|kg|ml|l|pcs)?\s*(Bag|Bottle|Can|Pack|Box|Jar)?/i
    );

  if (!match) {
    return { count: 1, amount: '', unit: 'g', container: '' };
  }

  const rawContainer = match[4] || '';
  const container = (
    rawContainer
      ? rawContainer.charAt(0).toUpperCase() + rawContainer.slice(1).toLowerCase()
      : ''
  ) as ContainerType;

  const rawUnit = (match[3] || 'g').toLowerCase();
  const unit = (['g', 'kg', 'ml', 'l', 'pcs'].includes(rawUnit) ? rawUnit : 'g') as UnitType;

  return {
    count: parseInt(match[1], 10) || 1,
    amount: match[2] || '',
    unit,
    container,
  };
}

export function parseQtyAndUnit(text: string): {
  amount: number;
  unit: string;
  rest: string;
} | null {
  const match = String(text)
    .trim()
    .match(
      /^(\d+(?:\.\d+)?)\s*(kg|g|ml|l|tbsp|tsp|cloves|clove|cans|can|packs|pack)?\b(.*)$/i
    );
  if (!match) return null;

  return {
    amount: parseFloat(match[1]),
    unit: (match[2] || '').toLowerCase(),
    rest: (match[3] || '').trim(),
  };
}

export function calculateDeductedQty(pantryQty: string, ingredientText: string): string {
  const p = parseQtyAndUnit(pantryQty);
  const r = parseQtyAndUnit(ingredientText);
  if (!p || !r) return pantryQty;

  // Convert kg <-> g (e.g., 1 kg Bag minus 600g = 400g Bag)
  if ((p.unit === 'kg' || p.unit === 'g') && (r.unit === 'kg' || r.unit === 'g')) {
    const pGrams = p.unit === 'kg' ? p.amount * 1000 : p.amount;
    const rGrams = r.unit === 'kg' ? r.amount * 1000 : r.amount;
    const rem = Math.max(0, Math.round(pGrams - rGrams));
    if (rem === 0) return '0g';
    const suffix = p.rest ? ` ${p.rest}` : '';
    return (rem >= 1000 ? `${+(rem / 1000).toFixed(2)} kg` : `${rem}g`) + suffix;
  }

  // Convert l <-> ml (e.g., 1 l Bottle minus 250ml = 750ml Bottle)
  if ((p.unit === 'l' || p.unit === 'ml') && (r.unit === 'l' || r.unit === 'ml')) {
    const pMl = p.unit === 'l' ? p.amount * 1000 : p.amount;
    const rMl = r.unit === 'l' ? r.amount * 1000 : r.amount;
    const rem = Math.max(0, Math.round(pMl - rMl));
    if (rem === 0) return '0ml';
    const suffix = p.rest ? ` ${p.rest}` : '';
    return (rem >= 1000 ? `${+(rem / 1000).toFixed(2)} l` : `${rem}ml`) + suffix;
  }

  // Matching units (e.g., 10 tbsp minus 2 tbsp = 8 tbsp)
  if (p.unit && p.unit === r.unit) {
    const rem = Math.max(0, +(p.amount - r.amount).toFixed(2));
    return `${rem} ${p.unit}`.trim();
  }

  // Plain counts (e.g., 12 large minus 3 = 9 large)
  if (!p.unit && !r.unit) {
    const rem = Math.max(0, +(p.amount - r.amount).toFixed(2));
    return p.rest ? `${rem} ${p.rest}` : `${rem}`;
  }

  // Pantry stored as plain pack count while recipe uses weight/volume -> deduct 1
  if (!p.unit && (r.unit === 'g' || r.unit === 'kg' || r.unit === 'ml' || r.unit === 'l')) {
    const rem = Math.max(0, p.amount - 1);
    return p.rest ? `${rem} ${p.rest}` : `${rem}`;
  }

  return pantryQty;
}

export function findMatchingPantryItem(
  pantry: PantryItem[],
  ingredientText: string
): PantryItem | undefined {
  const cleanIng = ingredientText.toLowerCase();
  return pantry.find((pItem) => {
    const keywords = pItem.name
      .toLowerCase()
      .split(/[/,()]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 3);

    return keywords.some((kw) => {
      const singular = kw.endsWith('s') && kw.length > 4 ? kw.slice(0, -1) : kw;
      return cleanIng.includes(kw) || cleanIng.includes(singular);
    });
  });
}

export function cleanIngredientName(name: string): string {
  return (
    name
      .replace(
        /^[\d\s/.-]+(g|kg|ml|l|tbsp|tsp|cup|cups|cloves|clove|large|medium|small)?\s*/i,
        ''
      )
      .trim() || name
  );
}