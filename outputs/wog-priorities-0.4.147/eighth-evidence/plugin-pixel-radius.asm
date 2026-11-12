
TUM_SOURCE/EraPlugins/amethyst2_4.dll:	file format coff-i386

Disassembly of section .text:

100088e0 <ChooseAnyCreatureType>:
10016e00: 55                           	pushl	%ebp
10016e01: 8b ec                        	movl	%esp, %ebp
10016e03: 51                           	pushl	%ecx
10016e04: 8b 45 08                     	movl	0x8(%ebp), %eax
10016e07: 8b 48 38                     	movl	0x38(%eax), %ecx
10016e0a: 89 4d fc                     	movl	%ecx, -0x4(%ebp)
10016e0d: 8b 55 0c                     	movl	0xc(%ebp), %edx
10016e10: 52                           	pushl	%edx
10016e11: 8b 45 fc                     	movl	-0x4(%ebp), %eax
10016e14: 50                           	pushl	%eax
10016e15: e8 d6 ed ff ff               	calll	0x10015bf0 <ChooseAnyCreatureType+0xd310>
10016e1a: 83 c4 08                     	addl	$0x8, %esp
10016e1d: 8b 4d 10                     	movl	0x10(%ebp), %ecx
10016e20: 0f af 4d 10                  	imull	0x10(%ebp), %ecx
10016e24: 3b c1                        	cmpl	%ecx, %eax
10016e26: 7f 04                        	jg	0x10016e2c <ChooseAnyCreatureType+0xe54c>
10016e28: b0 01                        	movb	$0x1, %al
10016e2a: eb 34                        	jmp	0x10016e60 <ChooseAnyCreatureType+0xe580>
10016e2c: 8b 55 08                     	movl	0x8(%ebp), %edx
10016e2f: 8b 82 84 00 00 00            	movl	0x84(%edx), %eax
10016e35: 83 e0 01                     	andl	$0x1, %eax
10016e38: 74 24                        	je	0x10016e5e <ChooseAnyCreatureType+0xe57e>
10016e3a: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
10016e3d: 51                           	pushl	%ecx
10016e3e: 8b 4d 08                     	movl	0x8(%ebp), %ecx
10016e41: e8 da ec ff ff               	calll	0x10015b20 <ChooseAnyCreatureType+0xd240>
10016e46: 50                           	pushl	%eax
10016e47: e8 a4 ed ff ff               	calll	0x10015bf0 <ChooseAnyCreatureType+0xd310>
10016e4c: 83 c4 08                     	addl	$0x8, %esp
10016e4f: 8b 55 10                     	movl	0x10(%ebp), %edx
10016e52: 0f af 55 10                  	imull	0x10(%ebp), %edx
10016e56: 3b c2                        	cmpl	%edx, %eax
10016e58: 7f 04                        	jg	0x10016e5e <ChooseAnyCreatureType+0xe57e>
10016e5a: b0 01                        	movb	$0x1, %al
10016e5c: eb 02                        	jmp	0x10016e60 <ChooseAnyCreatureType+0xe580>
10016e5e: 32 c0                        	xorb	%al, %al
10016e60: 8b e5                        	movl	%ebp, %esp
10016e62: 5d                           	popl	%ebp
10016e63: c3                           	retl
