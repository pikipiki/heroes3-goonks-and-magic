
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  71c10c: db 45 10                     	fildl	0x10(%ebp)
  71c10f: 8b 55 08                     	movl	0x8(%ebp), %edx
  71c112: d8 0a                        	fmuls	(%edx)
  71c114: d8 35 28 51 78 00            	fdivs	0x785128
  71c11a: d8 05 3c 51 78 00            	fadds	0x78513c
  71c120: 8b 45 08                     	movl	0x8(%ebp), %eax
  71c123: d8 00                        	fadds	(%eax)
  71c125: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  71c128: d9 19                        	fstps	(%ecx)
