export const safeJsonParseArray = (val: any, fallback: any[] = []): any[] => {
  if (val === null || val === undefined || val === '') return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val !== 'string') return [val];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (_e) {
    return val.trim().length > 0 ? [val.trim()] : fallback;
  }
};

export const safeJsonParseObject = (val: any, fallback: any = {}): any => {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'object' && !Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return typeof parsed === 'object' && parsed !== null ? parsed : fallback;
  } catch (_e) {
    return fallback;
  }
};

