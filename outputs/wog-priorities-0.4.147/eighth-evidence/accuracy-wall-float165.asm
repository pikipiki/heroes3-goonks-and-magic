
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  59ffe0: 55                           	pushl	%ebp
  59ffe1: 8b ec                        	movl	%esp, %ebp
  59ffe3: 53                           	pushl	%ebx
  59ffe4: 56                           	pushl	%esi
  59ffe5: 8b 75 0c                     	movl	0xc(%ebp), %esi
  59ffe8: 57                           	pushl	%edi
  59ffe9: 8b f9                        	movl	%ecx, %edi
  59ffeb: 8b 46 4c                     	movl	0x4c(%esi), %eax
  59ffee: 85 c0                        	testl	%eax, %eax
  59fff0: 75 09                        	jne	0x59fffb <.text+0x19effb>
  59fff2: 5f                           	popl	%edi
  59fff3: 5e                           	popl	%esi
  59fff4: 32 c0                        	xorb	%al, %al
  59fff6: 5b                           	popl	%ebx
  59fff7: 5d                           	popl	%ebp
  59fff8: c2 0c 00                     	retl	$0xc
  59fffb: 8b 45 08                     	movl	0x8(%ebp), %eax
  59fffe: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  5a0005: 2b c8                        	subl	%eax, %ecx
  5a0007: c1 e1 04                     	shll	$0x4, %ecx
  5a000a: 8d 04 39                     	leal	(%ecx,%edi), %eax
  5a000d: 8a 8c 39 d4 01 00 00         	movb	0x1d4(%ecx,%edi), %cl
  5a0014: f6 c1 10                     	testb	$0x10, %cl
  5a0017: 75 09                        	jne	0x5a0022 <.text+0x19f022>
  5a0019: 5f                           	popl	%edi
  5a001a: 5e                           	popl	%esi
  5a001b: 32 c0                        	xorb	%al, %al
  5a001d: 5b                           	popl	%ebx
  5a001e: 5d                           	popl	%ebp
  5a001f: c2 0c 00                     	retl	$0xc
  5a0022: 8b 80 d8 01 00 00            	movl	0x1d8(%eax), %eax
  5a0028: 6a 00                        	pushl	$0x0
  5a002a: 6a 01                        	pushl	$0x1
  5a002c: 6a 00                        	pushl	$0x0
  5a002e: 8d 14 40                     	leal	(%eax,%eax,2), %edx
  5a0031: 8b 87 5c 3d 01 00            	movl	0x13d5c(%edi), %eax
  5a0037: 56                           	pushl	%esi
  5a0038: 0f be 4c d0 09               	movsbl	0x9(%eax,%edx,8), %ecx
  5a003d: 8d 1c d0                     	leal	(%eax,%edx,8), %ebx
  5a0040: 51                           	pushl	%ecx
  5a0041: 6a 0d                        	pushl	$0xd
  5a0043: 8b cf                        	movl	%edi, %ecx
  5a0045: e8 56 83 00 00               	calll	0x5a83a0 <.text+0x1a73a0>
  5a004a: d8 1d 64 ac 63 00            	fcomps	0x63ac64
  5a0050: df e0                        	fnstsw	%ax
  5a0052: f6 c4 41                     	testb	$0x41, %ah
  5a0055: 74 09                        	je	0x5a0060 <.text+0x19f060>
  5a0057: 5f                           	popl	%edi
  5a0058: 5e                           	popl	%esi
  5a0059: 32 c0                        	xorb	%al, %al
  5a005b: 5b                           	popl	%ebx
  5a005c: 5d                           	popl	%ebp
  5a005d: c2 0c 00                     	retl	$0xc
