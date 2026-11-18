"""Prepare compact, lossless terrain thumbnails; never run this on a player's device."""
import base64, gzip, io, json, pathlib, re, struct, sys, zlib
from PIL import Image


def png(image):
    original = image.convert('RGBA')
    # Minimap colours are a tiny exact palette. Verify equality before packing.
    source = original.convert('RGB') if original.getchannel('A').getextrema() == (255, 255) else original
    packed = source.convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
    if source.mode == 'RGB':
        packed.putpalette(packed.getpalette()[:3*(packed.getextrema()[1]+1)])
    assert packed.convert('RGBA').tobytes() == original.tobytes()
    out = io.BytesIO()
    packed.save(out, format='PNG', optimize=True, compress_level=9)
    return 'data:image/png;base64,' + base64.b64encode(out.getvalue()).decode()


def terrain(path):
    root = pathlib.Path('work/game-data/homm3eng/home/web_user/.local/share/vcmi')
    files = [p for p in (root/'Maps').rglob('*') if p.is_file() and p.with_suffix('').relative_to(root).as_posix().upper() == path.upper()]
    if len(files) != 1 or files[0].suffix.lower() != '.h3m':
        raise ValueError('No unique original H3M resource: ' + path)
    compressed = files[0].read_bytes()
    try:
        raw = gzip.decompress(compressed)
    except gzip.BadGzipFile:
        # Some legacy maps have an invalid gzip checksum. Only use their complete
        # deflate payload if the terrain section validates uniquely below.
        if compressed[:3] != b'\x1f\x8b\x08':
            raise
        flags, at = compressed[3], 10
        if flags & 4:
            at += 2 + struct.unpack_from('<H', compressed, at)[0]
        for flag in (8, 16):
            if flags & flag:
                at = compressed.index(b'\0', at) + 1
        if flags & 2:
            at += 2
        decoder = zlib.decompressobj(-15)
        raw = decoder.decompress(compressed[at:])
        if not decoder.eof:
            raise ValueError('Truncated map payload')
    version = struct.unpack_from('<I', raw)[0]
    if version not in (0x0e, 0x15, 0x1c):
        raise ValueError('Unsupported H3M terrain layout')
    size = struct.unpack_from('<I', raw, 5)[0]
    levels = 2 if raw[9] else 1
    if size not in (36, 72, 108, 144, 180, 216, 252):
        raise ValueError('Invalid map size')
    tiles = size*size*levels
    candidates = []
    # H3M terrain is a contiguous [z][y][x] array of seven-byte tiles. Check
    # every tile's terrain/river/road enums, then require the following section
    # to be a plausible object-template table with a real DEF resource name.
    def check(start, end):
        if (end-start)//7 < tiles:
            return
        for at in range(start, end-tiles*7+1, 7):
            tail = at+tiles*7
            if tail+8 > len(raw):
                continue
            count, length = struct.unpack_from('<II', raw, tail)
            name = raw[tail+8:tail+8+length]
            if 0 < count < 10000 and 1 <= length <= 128 and re.fullmatch(rb'[A-Za-z0-9_ .\\/\-]+\.[Dd][Ee][Ff]', name):
                candidates.append(at)
    for phase in range(7):
        start = phase
        for at in range(phase, len(raw)-6, 7):
            if raw[at] >= 10 or raw[at+2] >= 5 or raw[at+4] >= 4:
                check(start, at)
                start = at+7
        check(start, len(raw)-((len(raw)-phase)%7))
    if len(candidates) != 1:
        raise ValueError('Ambiguous terrain section: '+str(candidates))
    text = pathlib.Path('work/vcmi-wasm/config/terrains.json').read_text()
    text = re.sub(r'/\*.*?\*/|//[^\n]*', '', text, flags=re.S)
    data = json.loads(re.sub(r',\s*([}\]])', r'\1', text))
    colours = {row['index']: tuple(row['minimapUnblocked']) for row in data.values() if 'index' in row}
    images = []
    for level in range(levels):
        image = Image.new('RGB', (128, 128))
        image.putdata([colours[raw[candidates[0]+((level*size+y*size//128)*size+x*size//128)*7]] for y in range(128) for x in range(128)])
        images.append(png(image))
    return images


if __name__ == '__main__':
    if sys.argv[1] == 'terrain':
        print(json.dumps(terrain(sys.argv[2]), separators=(',', ':')))
    elif sys.argv[1] == 'pack':
        data = json.load(sys.stdin)
        unique, images, previews = {}, [], {}
        for key, source in sorted(data['previews'].items()):
            ids = []
            for image in source:
                packed = png(Image.open(io.BytesIO(base64.b64decode(image.split(',', 1)[1]))))
                if packed not in unique:
                    unique[packed] = len(images)
                    images.append(packed)
                ids.append(unique[packed])
            previews[key] = ids
        data.update(schema=2, previews=previews, images=images)
        print(json.dumps(data, separators=(',', ':'), ensure_ascii=False))
