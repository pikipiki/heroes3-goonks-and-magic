
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a3f90: 55                           	pushl	%ebp
  5a3f91: 8b ec                        	movl	%esp, %ebp
  5a3f93: 8b 45 18                     	movl	0x18(%ebp), %eax
  5a3f96: 8b 55 14                     	movl	0x14(%ebp), %edx
  5a3f99: 50                           	pushl	%eax
  5a3f9a: 8b 45 10                     	movl	0x10(%ebp), %eax
  5a3f9d: 52                           	pushl	%edx
  5a3f9e: 8b 55 0c                     	movl	0xc(%ebp), %edx
  5a3fa1: 6a 00                        	pushl	$0x0
  5a3fa3: 50                           	pushl	%eax
  5a3fa4: 8b 45 08                     	movl	0x8(%ebp), %eax
  5a3fa7: 52                           	pushl	%edx
  5a3fa8: 50                           	pushl	%eax
  5a3fa9: e8 f2 43 00 00               	calll	0x5a83a0 <.text+0x1a73a0>
  5a3fae: dc 1d 38 ac 63 00            	fcompl	0x63ac38
  5a3fb4: df e0                        	fnstsw	%ax
  5a3fb6: f6 c4 41                     	testb	$0x41, %ah
  5a3fb9: 75 09                        	jne	0x5a3fc4 <.text+0x1a2fc4>
  5a3fbb: b8 01 00 00 00               	movl	$0x1, %eax
  5a3fc0: 5d                           	popl	%ebp
  5a3fc1: c2 14 00                     	retl	$0x14
  5a3fc4: 33 c0                        	xorl	%eax, %eax
  5a3fc6: 5d                           	popl	%ebp
  5a3fc7: c2 14 00                     	retl	$0x14
