export const COMBAT_BODY_SIZE = 88;
export const COMBAT_BODY_HEIGHT = COMBAT_BODY_SIZE;
export function opaqueBounds(bytes, width, height) {
    let left = width, top = height, right = -1, bottom = -1;
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++)
            if (bytes[(y * width + x) * 4 + 3] > 32) {
                left = Math.min(left, x);
                top = Math.min(top, y);
                right = Math.max(right, x);
                bottom = Math.max(bottom, y);
            }
    return right < 0 ? { x: 0, y: 0, width, height } : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}
// Scale2x reconstructs diagonal pixel-art edges without adding invented texture.
// Applied once per native sprite tick, never at the 50 fps presentation cadence.
export function smoothSprite2x(bytes, width, height, output) {
    const input = bytes.byteOffset % 4 ? new Uint8Array(bytes) : bytes, source = new Uint32Array(input.buffer, input.byteOffset, width * height), pixels = output || new Uint8ClampedArray(width * height * 16), target = new Uint32Array(pixels.buffer, pixels.byteOffset, pixels.byteLength / 4), outWidth = width * 2;
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            const e = source[y * width + x], b = source[Math.max(0, y - 1) * width + x], d = source[y * width + Math.max(0, x - 1)], f = source[y * width + Math.min(width - 1, x + 1)], h = source[Math.min(height - 1, y + 1) * width + x], i = y * 2 * outWidth + x * 2, edge = b !== h && d !== f;
            target[i] = edge && d === b ? d : e;
            target[i + 1] = edge && b === f ? f : e;
            target[i + outWidth] = edge && d === h ? d : e;
            target[i + outWidth + 1] = edge && h === f ? f : e;
        }
    return pixels;
}
export function spritePlacement(bounds, targetHeight = COMBAT_BODY_HEIGHT) { const scale = targetHeight / Math.max(1, bounds.height, bounds.width); return { scale, x: -(bounds.x + bounds.width / 2) * scale, y: -(bounds.y + bounds.height) * scale }; }
