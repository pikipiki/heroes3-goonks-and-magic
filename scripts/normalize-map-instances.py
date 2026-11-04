"""Normalize VMAP object IDs in the public build; never touch saves or source maps."""
import json
import sys
import zipfile
from pathlib import Path


def normalize(contents):
    objects = json.loads(contents['objects.json'])
    # The JSON owner field defaults to neutral; the string 'neutral' is not a player identifier.
    for obj in objects:
        if obj.get('options', {}).get('owner') == 'neutral':
            del obj['options']['owner']
    contents['objects.json'] = json.dumps(objects).encode()
    mapping = {o['instanceName']: o['instanceName'] + '_' + str(i)
               for i, o in enumerate(objects)
               if not o['instanceName'].rsplit('_', 1)[-1].isdigit() or '_' not in o['instanceName']}
    def update(value):
        if isinstance(value, str):
            return mapping.get(value, value)
        if isinstance(value, list):
            return [update(v) for v in value]
        if isinstance(value, dict):
            return {mapping.get(k, k): update(v) for k, v in value.items()}
        return value
    names = [mapping.get(o['instanceName'], o['instanceName']) for o in objects]
    assert len(names) == len(set(names)), 'Object ID collision'
    for name in ['objects.json', 'header.json']:
        contents[name] = json.dumps(update(json.loads(contents[name])), ensure_ascii=False, separators=(',', ':')).encode()
    return contents


def rewrite(filename):
    with zipfile.ZipFile(filename) as z:
        contents = normalize({n: z.read(n) for n in z.namelist()})
    with zipfile.ZipFile(filename, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in contents.items():
            info = zipfile.ZipInfo(name, (2026, 10, 31, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, data)


if __name__ == '__main__':
    for filename in Path(sys.argv[1]).glob('*.vmap'):
        rewrite(filename)
