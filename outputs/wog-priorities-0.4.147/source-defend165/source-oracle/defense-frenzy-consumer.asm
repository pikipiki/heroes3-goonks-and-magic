
/Users/sevenone./Documents/git/era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  4422b0: 55                           	pushl	%ebp
  4422b1: 8b ec                        	movl	%esp, %ebp
  4422b3: 8a 45 0c                     	movb	0xc(%ebp), %al
  4422b6: 57                           	pushl	%edi
  4422b7: 84 c0                        	testb	%al, %al
  4422b9: 8b f9                        	movl	%ecx, %edi
  4422bb: 74 11                        	je	0x4422ce <.text+0x412ce>
  4422bd: 8b 87 78 02 00 00            	movl	0x278(%edi), %eax
  4422c3: 85 c0                        	testl	%eax, %eax
  4422c5: 74 07                        	je	0x4422ce <.text+0x412ce>
  4422c7: 33 c0                        	xorl	%eax, %eax
  4422c9: 5f                           	popl	%edi
  4422ca: 5d                           	popl	%ebp
  4422cb: c2 08 00                     	retl	$0x8
  4422ce: 8b 45 08                     	movl	0x8(%ebp), %eax
  4422d1: 53                           	pushl	%ebx
  4422d2: 8b 9f cc 00 00 00            	movl	0xcc(%edi), %ebx
