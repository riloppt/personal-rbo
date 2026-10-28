export const qrUrl = t => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(t)}`;

// Escape text before interpolating it into HTML strings (emails, print windows)
export const escHtml = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
