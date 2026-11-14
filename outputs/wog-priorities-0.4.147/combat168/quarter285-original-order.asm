
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a7c1d: 85 c9                        	testl	%ecx, %ecx
  5a7c1f: 8b c3                        	movl	%ebx, %eax
  5a7c21: 74 08                        	je	0x5a7c2b <.text+0x1a6c2b>
  5a7c23: 57                           	pushl	%edi
  5a7c24: 53                           	pushl	%ebx
  5a7c25: 56                           	pushl	%esi
  5a7c26: e8 a5 dd f3 ff               	calll	0x4e59d0 <.text+0xe49d0>
  5a7c2b: 85 ff                        	testl	%edi, %edi
  5a7c2d: 0f 84 77 02 00 00            	je	0x5a7eaa <.text+0x1a6eaa>
  5a7c33: 8b 4f 34                     	movl	0x34(%edi), %ecx
  5a7c36: 8b d6                        	movl	%esi, %edx
  5a7c38: 51                           	pushl	%ecx
  5a7c39: 8b c8                        	movl	%eax, %ecx
  5a7c3b: e8 40 35 ea ff               	calll	0x44b180 <.text+0x4a180>
  5a7c40: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  5a7c43: 57                           	pushl	%edi
  5a7c44: 56                           	pushl	%esi
  5a7c45: 50                           	pushl	%eax
  5a7c46: e8 75 02 00 00               	calll	0x5a7ec0 <.text+0x1a6ec0>
