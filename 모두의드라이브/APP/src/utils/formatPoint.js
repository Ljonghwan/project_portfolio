export function formatPoint(amount, { withSuffix = true } = {}) {
    if (amount == null || isNaN(amount)) return withSuffix ? '0P' : '0';
    const num = Number(amount);
    const text = num.toLocaleString();
    return withSuffix ? `${text}P` : text;
}

export function formatSignedPoint(amount, { withSuffix = true } = {}) {
    if (amount == null || isNaN(amount)) return withSuffix ? '0P' : '0';
    const num = Number(amount);
    const sign = num > 0 ? '+' : '';
    const text = `${sign}${num.toLocaleString()}`;
    return withSuffix ? `${text}P` : text;
}
