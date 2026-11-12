
ERA_REFERENCE_ROOT/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a40c1: 8b 93 84 00 00 00            	movl	0x84(%ebx), %edx
  5a40c7: c1 ea 04                     	shrl	$0x4, %edx
  5a40ca: f6 c2 01                     	testb	$0x1, %dl
  5a40cd: 74 55                        	je	0x5a4124 <.text+0x1a3124>
