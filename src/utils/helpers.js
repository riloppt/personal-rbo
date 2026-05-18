export const qrUrl = t => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(t)}`;
