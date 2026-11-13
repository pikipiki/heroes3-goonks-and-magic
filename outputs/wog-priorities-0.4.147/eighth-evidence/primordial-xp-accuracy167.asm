
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a88a2: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  5a88a5: 85 c0                        	testl	%eax, %eax
  5a88a7: 7f 39                        	jg	0x5a88e2 <.text+0x1a78e2>
  5a88a9: 8b 87 28 05 00 00            	movl	0x528(%edi), %eax
  5a88af: 85 c0                        	testl	%eax, %eax
  5a88b1: 74 2f                        	je	0x5a88e2 <.text+0x1a78e2>
  5a88b3: 8b 97 2c 05 00 00            	movl	0x52c(%edi), %edx
  5a88b9: 2b d0                        	subl	%eax, %edx
  5a88bb: c1 fa 02                     	sarl	$0x2, %edx
  5a88be: 74 22                        	je	0x5a88e2 <.text+0x1a78e2>
  5a88c0: 8b 45 10                     	movl	0x10(%ebp), %eax
  5a88c3: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  5a88c6: 8b 55 f4                     	movl	-0xc(%ebp), %edx
  5a88c9: 50                           	pushl	%eax
  5a88ca: 51                           	pushl	%ecx
  5a88cb: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  5a88ce: e8 cd 18 ea ff               	calll	0x44a1a0 <.text+0x491a0>
  5a88d3: d8 0d ac b8 63 00            	fmuls	0x63b8ac
  5a88d9: 5f                           	popl	%edi
  5a88da: 5e                           	popl	%esi
  5a88db: 5b                           	popl	%ebx
  5a88dc: 8b e5                        	movl	%ebp, %esp
  5a88de: 5d                           	popl	%ebp
  5a88df: c2 18 00                     	retl	$0x18
  5a88e2: 8b 55 10                     	movl	0x10(%ebp), %edx
  5a88e5: 8b 45 fc                     	movl	-0x4(%ebp), %eax
  5a88e8: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  5a88eb: 52                           	pushl	%edx
  5a88ec: 8b 55 f4                     	movl	-0xc(%ebp), %edx
  5a88ef: 50                           	pushl	%eax
  5a88f0: e8 ab 18 ea ff               	calll	0x44a1a0 <.text+0x491a0>
  5a88f5: 5f                           	popl	%edi
  5a88f6: 5e                           	popl	%esi
  5a88f7: 5b                           	popl	%ebx
  5a88f8: 8b e5                        	movl	%ebp, %esp
  5a88fa: 5d                           	popl	%ebp
  5a88fb: c2 18 00                     	retl	$0x18
