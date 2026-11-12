
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  54eb50: 55                           	pushl	%ebp
  54eb51: 8b ec                        	movl	%esp, %ebp
  54eb53: 8b c1                        	movl	%ecx, %eax
  54eb55: 53                           	pushl	%ebx
  54eb56: 56                           	pushl	%esi
  54eb57: 8d 0c d5 00 00 00 00         	leal	(,%edx,8), %ecx
  54eb5e: 8d 34 c5 00 00 00 00         	leal	(,%eax,8), %esi
  54eb65: 2b ca                        	subl	%edx, %ecx
  54eb67: 2b f0                        	subl	%eax, %esi
  54eb69: 57                           	pushl	%edi
  54eb6a: 8d 0c 8a                     	leal	(%edx,%ecx,4), %ecx
  54eb6d: 8b 15 b0 47 67 00            	movl	0x6747b0, %edx
  54eb73: 8d 04 b0                     	leal	(%eax,%esi,4), %eax
  54eb76: 8b 75 0c                     	movl	0xc(%ebp), %esi
  54eb79: 8d 4c 8a 20                  	leal	0x20(%edx,%ecx,4), %ecx
  54eb7d: bb 07 00 00 00               	movl	$0x7, %ebx
  54eb82: 8d 44 82 20                  	leal	0x20(%edx,%eax,4), %eax
  54eb86: 8b f8                        	movl	%eax, %edi
  54eb88: 2b f9                        	subl	%ecx, %edi
  54eb8a: 2b f1                        	subl	%ecx, %esi
  54eb8c: 8b 01                        	movl	(%ecx), %eax
  54eb8e: 8b 14 0f                     	movl	(%edi,%ecx), %edx
  54eb91: 3b c2                        	cmpl	%edx, %eax
  54eb93: 7e 0b                        	jle	0x54eba0 <.text+0x14dba0>
  54eb95: 2b c2                        	subl	%edx, %eax
  54eb97: 0f af 45 08                  	imull	0x8(%ebp), %eax
  54eb9b: 89 04 0e                     	movl	%eax, (%esi,%ecx)
  54eb9e: eb 07                        	jmp	0x54eba7 <.text+0x14dba7>
  54eba0: c7 04 0e 00 00 00 00         	movl	$0x0, (%esi,%ecx)
  54eba7: 83 c1 04                     	addl	$0x4, %ecx
  54ebaa: 4b                           	decl	%ebx
  54ebab: 75 df                        	jne	0x54eb8c <.text+0x14db8c>
  54ebad: 5f                           	popl	%edi
  54ebae: 5e                           	popl	%esi
  54ebaf: 5b                           	popl	%ebx
  54ebb0: 5d                           	popl	%ebp
  54ebb1: c2 08 00                     	retl	$0x8
