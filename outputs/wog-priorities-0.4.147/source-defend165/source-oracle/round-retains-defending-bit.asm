
/Users/sevenone./Documents/git/era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  446e40: 55                           	pushl	%ebp
  446e41: 8b ec                        	movl	%esp, %ebp
  446e43: 83 ec 18                     	subl	$0x18, %esp
  446e46: 53                           	pushl	%ebx
  446e47: 56                           	pushl	%esi
  446e48: 8b f1                        	movl	%ecx, %esi
  446e4a: 57                           	pushl	%edi
  446e4b: 33 ff                        	xorl	%edi, %edi
  446e4d: 39 7e 4c                     	cmpl	%edi, 0x4c(%esi)
  446e50: 0f 8e ed 01 00 00            	jle	0x447043 <.text+0x46043>
  446e56: 8b 9e 84 00 00 00            	movl	0x84(%esi), %ebx
  446e5c: 8b 46 34                     	movl	0x34(%esi), %eax
  446e5f: 81 e3 ff ff ff f8            	andl	$0xf8ffffff, %ebx       # imm = 0xF8FFFFFF
  446e65: 83 f8 04                     	cmpl	$0x4, %eax
  446e68: 89 9e 84 00 00 00            	movl	%ebx, 0x84(%esi)
  446e6e: 8b cb                        	movl	%ebx, %ecx
  446e70: c6 86 f0 04 00 00 00         	movb	$0x0, 0x4f0(%esi)
  446e77: c7 86 54 04 00 00 01 00 00 00	movl	$0x1, 0x454(%esi)
  446e81: 75 0a                        	jne	0x446e8d <.text+0x45e8d>
  446e83: c7 86 54 04 00 00 02 00 00 00	movl	$0x2, 0x454(%esi)
  446e8d: 83 f8 05                     	cmpl	$0x5, %eax
  446e90: 75 0a                        	jne	0x446e9c <.text+0x45e9c>
  446e92: c7 86 54 04 00 00 88 13 00 00	movl	$0x1388, 0x454(%esi)    # imm = 0x1388
  446e9c: 39 be 80 02 00 00            	cmpl	%edi, 0x280(%esi)
  446ea2: 74 14                        	je	0x446eb8 <.text+0x45eb8>
  446ea4: 8b 86 94 04 00 00            	movl	0x494(%esi), %eax
  446eaa: 8b 96 54 04 00 00            	movl	0x454(%esi), %edx
  446eb0: 03 d0                        	addl	%eax, %edx
  446eb2: 89 96 54 04 00 00            	movl	%edx, 0x454(%esi)
  446eb8: c1 e9 06                     	shrl	$0x6, %ecx
  446ebb: f6 c1 01                     	testb	$0x1, %cl
  446ebe: 74 06                        	je	0x446ec6 <.text+0x45ec6>
  446ec0: 89 be 54 04 00 00            	movl	%edi, 0x454(%esi)
  446ec6: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  446ecc: 8a 81 68 3d 01 00            	movb	0x13d68(%ecx), %al
  446ed2: 84 c0                        	testb	%al, %al
  446ed4: 0f 85 69 01 00 00            	jne	0x447043 <.text+0x46043>
  446eda: 8d 9e 98 01 00 00            	leal	0x198(%esi), %ebx
