
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a8950: 55                           	pushl	%ebp
  5a8951: 8b ec                        	movl	%esp, %ebp
  5a8953: 8b 45 18                     	movl	0x18(%ebp), %eax
  5a8956: 8b 55 14                     	movl	0x14(%ebp), %edx
  5a8959: 56                           	pushl	%esi
  5a895a: 50                           	pushl	%eax
  5a895b: 8b 45 10                     	movl	0x10(%ebp), %eax
  5a895e: 6a 01                        	pushl	$0x1
  5a8960: 52                           	pushl	%edx
  5a8961: 8b 55 0c                     	movl	0xc(%ebp), %edx
  5a8964: 50                           	pushl	%eax
  5a8965: 8b 45 08                     	movl	0x8(%ebp), %eax
  5a8968: 52                           	pushl	%edx
  5a8969: 50                           	pushl	%eax
  5a896a: e8 31 fa ff ff               	calll	0x5a83a0 <.text+0x1a73a0>
  5a896f: d8 0d 68 ac 63 00            	fmuls	0x63ac68
  5a8975: e8 1a f6 06 00               	calll	0x617f94 <.text+0x216f94>
  5a897a: ba 64 00 00 00               	movl	$0x64, %edx
  5a897f: b9 01 00 00 00               	movl	$0x1, %ecx
  5a8984: 8b f0                        	movl	%eax, %esi
  5a8986: e8 35 3e f6 ff               	calll	0x50c7c0 <.text+0x10b7c0>
  5a898b: 33 c9                        	xorl	%ecx, %ecx
  5a898d: 3b c6                        	cmpl	%esi, %eax
  5a898f: 0f 9e c1                     	setle	%cl
  5a8992: 8a c1                        	movb	%cl, %al
  5a8994: 5e                           	popl	%esi
  5a8995: 5d                           	popl	%ebp
  5a8996: c2 14 00                     	retl	$0x14
