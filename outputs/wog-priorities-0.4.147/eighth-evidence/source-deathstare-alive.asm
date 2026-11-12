
ERA_REFERENCE_ROOT/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  440bd6: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  440bd9: 33 db                        	xorl	%ebx, %ebx
  440bdb: 8b 91 84 00 00 00            	movl	0x84(%ecx), %edx
  440be1: c1 ea 04                     	shrl	$0x4, %edx
  440be4: f6 c2 01                     	testb	$0x1, %dl
  440be7: 0f 84 be 06 00 00            	je	0x4412ab <.text+0x402ab>
