
TUM_SOURCE/EraPlugins/amethyst2_4.dll:	file format coff-i386

Disassembly of section .text:

100088e0 <ChooseAnyCreatureType>:
10015bf0: 55                           	pushl	%ebp
10015bf1: 8b ec                        	movl	%esp, %ebp
10015bf3: 83 ec 10                     	subl	$0x10, %esp
10015bf6: 56                           	pushl	%esi
10015bf7: 83 7d 08 00                  	cmpl	$0x0, 0x8(%ebp)
10015bfb: 7c 09                        	jl	0x10015c06 <ChooseAnyCreatureType+0xd326>
10015bfd: 81 7d 08 bb 00 00 00         	cmpl	$0xbb, 0x8(%ebp)
10015c04: 7c 0a                        	jl	0x10015c10 <ChooseAnyCreatureType+0xd330>
10015c06: b8 ff c9 9a 3b               	movl	$0x3b9ac9ff, %eax       # imm = 0x3B9AC9FF
10015c0b: e9 91 00 00 00               	jmp	0x10015ca1 <ChooseAnyCreatureType+0xd3c1>
10015c10: 83 7d 0c 00                  	cmpl	$0x0, 0xc(%ebp)
10015c14: 7c 09                        	jl	0x10015c1f <ChooseAnyCreatureType+0xd33f>
10015c16: 81 7d 0c bb 00 00 00         	cmpl	$0xbb, 0xc(%ebp)
10015c1d: 7c 07                        	jl	0x10015c26 <ChooseAnyCreatureType+0xd346>
10015c1f: b8 ff c9 9a 3b               	movl	$0x3b9ac9ff, %eax       # imm = 0x3B9AC9FF
10015c24: eb 7b                        	jmp	0x10015ca1 <ChooseAnyCreatureType+0xd3c1>
10015c26: e8 65 df fe ff               	calll	0x10003b90 <writeCreatureDesc+0x15e0>
10015c2b: 89 45 f4                     	movl	%eax, -0xc(%ebp)
10015c2e: 6b 45 08 70                  	imull	$0x70, 0x8(%ebp), %eax
10015c32: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
10015c35: 8d 94 01 c4 01 00 00         	leal	0x1c4(%ecx,%eax), %edx
10015c3c: 89 55 fc                     	movl	%edx, -0x4(%ebp)
10015c3f: 6b 45 0c 70                  	imull	$0x70, 0xc(%ebp), %eax
10015c43: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
10015c46: 8d 94 01 c4 01 00 00         	leal	0x1c4(%ecx,%eax), %edx
10015c4d: 89 55 f8                     	movl	%edx, -0x8(%ebp)
10015c50: c7 45 f0 00 00 00 00         	movl	$0x0, -0x10(%ebp)
10015c57: 8b 45 fc                     	movl	-0x4(%ebp), %eax
10015c5a: 0f bf 00                     	movswl	(%eax), %eax
10015c5d: 8b 4d f8                     	movl	-0x8(%ebp), %ecx
10015c60: 0f bf 11                     	movswl	(%ecx), %edx
10015c63: 2b c2                        	subl	%edx, %eax
10015c65: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
10015c68: 0f bf 11                     	movswl	(%ecx), %edx
10015c6b: 8b 4d f8                     	movl	-0x8(%ebp), %ecx
10015c6e: 0f bf 09                     	movswl	(%ecx), %ecx
10015c71: 2b d1                        	subl	%ecx, %edx
10015c73: 0f af c2                     	imull	%edx, %eax
10015c76: 8b 55 fc                     	movl	-0x4(%ebp), %edx
10015c79: 0f bf 4a 02                  	movswl	0x2(%edx), %ecx
10015c7d: 8b 55 f8                     	movl	-0x8(%ebp), %edx
10015c80: 0f bf 52 02                  	movswl	0x2(%edx), %edx
10015c84: 2b ca                        	subl	%edx, %ecx
10015c86: 8b 55 fc                     	movl	-0x4(%ebp), %edx
10015c89: 0f bf 52 02                  	movswl	0x2(%edx), %edx
10015c8d: 8b 75 f8                     	movl	-0x8(%ebp), %esi
10015c90: 0f bf 76 02                  	movswl	0x2(%esi), %esi
10015c94: 2b d6                        	subl	%esi, %edx
10015c96: 0f af ca                     	imull	%edx, %ecx
10015c99: 03 c1                        	addl	%ecx, %eax
10015c9b: 2b 45 f0                     	subl	-0x10(%ebp), %eax
10015c9e: c1 f8 0c                     	sarl	$0xc, %eax
10015ca1: 5e                           	popl	%esi
10015ca2: 8b e5                        	movl	%ebp, %esp
10015ca4: 5d                           	popl	%ebp
10015ca5: c3                           	retl
