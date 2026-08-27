export function ensureArray(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim().startsWith('[')) {
        try { return JSON.parse(val); } catch { return []; }
    }
    return [];
}
