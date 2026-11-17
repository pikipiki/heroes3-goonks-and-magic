#!/usr/bin/env python3
"""Attest the original h3era.exe learning-power ABI, without starting Windows."""
import argparse
import hashlib
import json
from pathlib import Path
import struct

MISSING = None
try:
    import pefile
    from unicorn import Uc, UC_ARCH_X86, UC_MODE_32
    from unicorn.x86_const import UC_X86_REG_ECX, UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_FPCW
except ImportError as error:
    MISSING = str(error)

ROOT = Path(__file__).resolve().parents[3]
SHA = '451e208cb2985bca75330f0e3c52f89f9219c0c3701bc6e1f354217890c36181'
def words(*values):
    return struct.pack('<'+'I'*len(values), *(value & 0xffffffff for value in values))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--artifact', type=Path, default=ROOT/'work/era-gameplay-reference/h3era.exe')
    parser.add_argument('--require-native', action='store_true')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    missing = MISSING or (None if args.artifact.is_file() else 'Reference h3era.exe unavailable')
    if missing:
        print(json.dumps({'status':'skipped','reason':missing}))
        return 1 if args.require_native else 0
    data = args.artifact.read_bytes()
    assert hashlib.sha256(data).hexdigest() == SHA, 'Reference EXE changed'
    pe = pefile.PE(data=data)
    image = pe.get_memory_mapped_image()
    vm = Uc(UC_ARCH_X86, UC_MODE_32)
    base = pe.OPTIONAL_HEADER.ImageBase
    vm.mem_map(base, (len(image)+4095)&~4095)
    vm.mem_write(base,image)
    scratch = 0x4000000
    vm.mem_map(scratch,0x10000)
    hero, special, result, thunk, stop, stack = [scratch+x for x in [0,0x1000,0x2000,0x3000,0x4000,0xf000]]
    # Observe the floating ABI at the same single-precision boundary as SN:E.
    vm.mem_write(thunk,b'\xd9\x1d'+words(result)+b'\xc3')
    vm.mem_write(0x679c80,words(special))
    vm.mem_write(hero+0x1a,words(0))
    vectors=[]
    for level in [0,1,2,7,10,20,30,50,70,74,100,255,1000,32767,-1]:
        for skill in range(4):
            for learning_specialist in [False,True]:
                vm.mem_write(hero+0x55,struct.pack('<h',level))
                vm.mem_write(hero+0xde,bytes([skill]))
                vm.mem_write(special,words(0,21 if learning_specialist else 0))
                vm.mem_write(stack,words(thunk,stop))
                vm.reg_write(UC_X86_REG_ESP,stack)
                vm.reg_write(UC_X86_REG_ECX,hero)
                vm.reg_write(UC_X86_REG_FPCW,0x037f)
                vm.emu_start(0x4e4ab0,stop,count=1000)
                assert vm.reg_read(UC_X86_REG_EIP)==stop
                raw=bytes(vm.mem_read(result,4))
                vectors.append({'level':level,'learning':skill,'specialist':learning_specialist,'powerBits':struct.unpack('<I',raw)[0]})
    proof={'schema':1,'artifact':{'file':'work/era-gameplay-reference/h3era.exe','sha256':SHA,'learningPower':'0x4e4ab0','stoneHook':'0x4a600a'},
        'execution':'Original PE32 machine code under Unicorn2.1.4; no learning formula reimplementation',
        'boundary':'Controlled hero/specialty records; x87 control0x037f; added fstp-single thunk observes native floating return as SN:E does. No full Windows/game startup.',
        'learningTable':[struct.unpack_from('<f',image,0x63ea58-base+4*i)[0]for i in range(4)],
        'baseStoneExperience':struct.unpack_from('<f',image,0x63e4f0-base)[0],
        'vectors':vectors}
    if args.output:
        args.output.write_text(json.dumps(proof,indent=2)+'\n')
    print(json.dumps({'artifactSha256':SHA,'vectors':len(vectors),'nativeFunction':'0x4e4ab0','status':'passed'}))
    return 0
if __name__=='__main__':
    raise SystemExit(main())
