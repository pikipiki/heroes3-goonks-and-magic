#!/usr/bin/env python3
"""Execute the reference ERA DLL's RNG methods, without loading the Windows DLL.

Requires pefile and unicorn. This is an offline verification tool: the only
substituted operation is the Windows entropy provider, with recorded input words.
No source-language reimplementation of the random algorithm runs in this test.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

DEPENDENCY_ERROR = None
try:
    import pefile
    from unicorn import Uc, UC_ARCH_X86, UC_MODE_32, UC_HOOK_CODE
    from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EDX, UC_X86_REG_ECX, UC_X86_REG_ESP, UC_X86_REG_EIP
except ImportError as error:
    DEPENDENCY_ERROR = str(error)

ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_SHA256 = 'ced15e83ddab9b4edf8039cf337341b5810609fbe1f84f3bc1d8ec7d118ea451'

def words(*values):
    return struct.pack('<' + 'I' * len(values), *(v & 0xffffffff for v in values))

class NativeRng:
    def __init__(self, artifact):
        data = artifact.read_bytes()
        assert hashlib.sha256(data).hexdigest() == ARTIFACT_SHA256, 'Reference DLL changed; re-attest method locations'
        pe = pefile.PE(data=data)
        self.base = pe.OPTIONAL_HEADER.ImageBase
        self.image = pe.get_memory_mapped_image()
        self.vm = Uc(UC_ARCH_X86, UC_MODE_32)
        self.vm.mem_map(self.base, (len(self.image) + 4095) & ~4095)
        self.vm.mem_write(self.base, self.image)
        self.vm.mem_map(0x2000000, 0x20000)
        self.stop = 0x201fff0
        self.obj, self.seeder, self.secure = 0x2000000, 0x2000100, 0x2000200
        self.methods = {}
        for name, addr in [('TXoroshiro128Rng', self.obj), ('TSplitMix32Rng', self.seeder), ('TSecureRng', self.secure)]:
            string_va = self.base + self.image.index(name.encode()) - 1
            refs = [i for i in range(0, len(self.image) - 4, 4) if self.image[i:i+4] == words(string_va)]
            assert len(refs) == 1, (name, refs)
            vmt = struct.unpack_from('<I', self.image, refs[0] - 32)[0]
            methods = struct.unpack_from('<7I', self.image, vmt - self.base)
            self.methods[name] = methods
            self.vm.mem_write(addr, words(vmt))
        self.vm.mem_write(self.obj + 20, words(self.seeder))
        self.entropy_requests = []
        self.entropy_words = []
        self.vm.hook_add(UC_HOOK_CODE, self.entropy, begin=0x42c398, end=0x42c398)

    def entropy(self, vm, address, size, _):
        esp = vm.reg_read(UC_X86_REG_ESP)
        ret, target, length = struct.unpack('<III', vm.mem_read(esp, 12))
        self.entropy_requests.append(length)
        assert length == 128 and len(self.entropy_words) == 32
        vm.mem_write(target, words(*self.entropy_words))
        vm.reg_write(UC_X86_REG_EAX, 1)
        vm.reg_write(UC_X86_REG_ESP, esp + 12)
        vm.reg_write(UC_X86_REG_EIP, ret)

    def call(self, address, eax, edx=0, ecx=0):
        esp = 0x201f000
        self.vm.mem_write(esp, words(self.stop))
        for reg, value in [(UC_X86_REG_EAX, eax), (UC_X86_REG_EDX, edx), (UC_X86_REG_ECX, ecx), (UC_X86_REG_ESP, esp)]:
            self.vm.reg_write(reg, value & 0xffffffff)
        self.vm.emu_start(address, self.stop, count=10000)
        assert self.vm.reg_read(UC_X86_REG_EIP) == self.stop, 'Native call did not return within instruction limit'
        return self.vm.reg_read(UC_X86_REG_EAX)

    def seed(self, seed):
        self.call(self.methods['TXoroshiro128Rng'][0], self.obj, seed)

    def random(self):
        return self.call(self.methods['TXoroshiro128Rng'][2], self.obj)

    def range(self, low, high):
        value = self.call(self.methods['TXoroshiro128Rng'][6], self.obj, low, high)
        return value if value < 0x80000000 else value - 0x100000000

    def secure_seed(self, state):
        self.entropy_words = state + [0xdead0000 + i for i in range(28)]
        self.vm.mem_write(self.secure + 4, bytes(136))
        self.call(self.methods['TXoroshiro128Rng'][1], self.obj, self.secure)
        assert list(struct.unpack('<4I', self.vm.mem_read(self.obj + 4, 16))) == state
        assert struct.unpack('<I', self.vm.mem_read(self.secure + 132, 4))[0] == 4


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--artifact', type=Path, default=ROOT / 'work/era-gameplay-reference/era.dll')
    parser.add_argument('--fixture', type=Path, default=ROOT / 'tests/fixtures/era-gameplay/mithril-random-reference.json')
    parser.add_argument('--require-native', action='store_true', help='Fail instead of skipping if optional tools or reference artifact are absent')
    args = parser.parse_args()
    missing = DEPENDENCY_ERROR or (None if args.artifact.is_file() else 'Reference ERA DLL is unavailable')
    if missing:
        print(json.dumps({'status': 'skipped', 'reason': missing}))
        return 1 if args.require_native else 0
    fixture = json.loads(args.fixture.read_text())
    native = NativeRng(args.artifact)
    for vector in fixture['vectors']:
        native.seed(vector['seed'])
        assert [native.random() for _ in vector['raw']] == vector['raw'], ('raw', vector['seed'])
        native.seed(vector['seed'])
        assert [native.range(*bounds) for bounds in fixture['rangeBounds']] == vector['ranges'], ('range', vector['seed'])
        native.seed(vector['seed'])
        values = list(range(70))
        for i in range(70):
            j = native.range(i, 69)
            values[i], values[j] = values[j], values[i]
        assert values == vector['shuffle'], ('shuffle', vector['seed'])
    for vector in fixture['startupVectors']:
        native.secure_seed(vector['state'])
        assert [native.range(11, 55) for _ in vector['sequence']] == vector['sequence'], ('startup', vector['state'])
    assert native.entropy_requests == [128] * len(fixture['startupVectors'])
    print(json.dumps({'artifactSha256': ARTIFACT_SHA256, 'execution': 'Original PE32 machine code under Unicorn',
        'seedVectors': len(fixture['vectors']), 'rawDrawsPerSeed': 16, 'rangeCallsPerSeed': 8,
        'shuffleSize': 70, 'secureStartupVectors': len(fixture['startupVectors']), 'startupDrawsPerState': 32,
        'entropyBoundary': 'Controlled 128-byte RtlGenRandom buffer; original SecureRng consumes exactly four words for Xoshiro seed',
        'methods': {name: [hex(address) for address in methods] for name, methods in native.methods.items()}}, indent=2))

if __name__ == '__main__':
    raise SystemExit(main())
