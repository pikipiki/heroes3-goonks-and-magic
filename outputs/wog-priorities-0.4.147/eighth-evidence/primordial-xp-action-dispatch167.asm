
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  75d327: 55                           	pushl	%ebp
  75d328: 8b ec                        	movl	%esp, %ebp
  75d32a: 53                           	pushl	%ebx
  75d32b: 56                           	pushl	%esi
  75d32c: 57                           	pushl	%edi
  75d32d: 89 0d ac 25 83 02            	movl	%ecx, 0x28325ac
  75d333: e8 5d f3 ff ff               	calll	0x75c695 <.text+0x5b695>
  75d338: 90                           	nop
  75d339: 90                           	nop
  75d33a: 90                           	nop
  75d33b: 90                           	nop
  75d33c: 90                           	nop
  75d33d: 90                           	nop
  75d33e: 90                           	nop
  75d33f: 90                           	nop
  75d340: 90                           	nop
  75d341: 90                           	nop
  75d342: 90                           	nop
  75d343: 90                           	nop
  75d344: 90                           	nop
  75d345: 90                           	nop
  75d346: 90                           	nop
  75d347: 90                           	nop
  75d348: 90                           	nop
  75d349: 90                           	nop
  75d34a: 90                           	nop
  75d34b: ff 75 0c                     	pushl	0xc(%ebp)
  75d34e: ff 75 08                     	pushl	0x8(%ebp)
  75d351: 8b 0d ac 25 83 02            	movl	0x28325ac, %ecx
  75d357: b8 b0 86 47 00               	movl	$0x4786b0, %eax         # imm = 0x4786B0
  75d35c: ff d0                        	calll	*%eax
  75d35e: 90                           	nop
  75d35f: 90                           	nop
  75d360: 90                           	nop
  75d361: 90                           	nop
  75d362: 90                           	nop
  75d363: e8 58 ff ff ff               	calll	0x75d2c0 <.text+0x5c2c0>
  75d368: 5f                           	popl	%edi
  75d369: 5e                           	popl	%esi
  75d36a: 5b                           	popl	%ebx
  75d36b: 5d                           	popl	%ebp
  75d36c: c2 08 00                     	retl	$0x8
