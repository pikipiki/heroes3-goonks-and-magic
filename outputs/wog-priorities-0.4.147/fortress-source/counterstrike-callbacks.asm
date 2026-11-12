
../Third-Upgrade-Mod-Full/EraPlugins/amethyst2_4.dll:	file format coff-i386

Disassembly of section .text:

100088e0 <ChooseAnyCreatureType>:
10018000: 55                           	pushl	%ebp
10018001: 8b ec                        	movl	%esp, %ebp
10018003: 8b 45 0c                     	movl	0xc(%ebp), %eax
10018006: 8b 48 18                     	movl	0x18(%eax), %ecx
10018009: 8b 51 34                     	movl	0x34(%ecx), %edx
1001800c: 0f be 82 20 15 e9 10         	movsbl	0x10e91520(%edx), %eax
10018013: 85 c0                        	testl	%eax, %eax
10018015: 74 10                        	je	0x10018027 <ChooseAnyCreatureType+0xf747>
10018017: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
1001801a: c7 41 20 0d 1b 44 00         	movl	$0x441b0d, 0x20(%ecx)   # imm = 0x441B0D
10018021: 33 c0                        	xorl	%eax, %eax
10018023: eb 07                        	jmp	0x1001802c <ChooseAnyCreatureType+0xf74c>
10018025: eb 05                        	jmp	0x1001802c <ChooseAnyCreatureType+0xf74c>
10018027: b8 01 00 00 00               	movl	$0x1, %eax
1001802c: 5d                           	popl	%ebp
1001802d: c2 08 00                     	retl	$0x8
10018030: 55                           	pushl	%ebp
10018031: 8b ec                        	movl	%esp, %ebp
10018033: 51                           	pushl	%ecx
10018034: 8b 45 0c                     	movl	0xc(%ebp), %eax
10018037: 8b 48 18                     	movl	0x18(%eax), %ecx
1001803a: 8b 51 34                     	movl	0x34(%ecx), %edx
1001803d: 89 55 fc                     	movl	%edx, -0x4(%ebp)
10018040: 8b 45 fc                     	movl	-0x4(%ebp), %eax
10018043: 0f be 88 60 19 e9 10         	movsbl	0x10e91960(%eax), %ecx
1001804a: 85 c9                        	testl	%ecx, %ecx
1001804c: 74 22                        	je	0x10018070 <ChooseAnyCreatureType+0xf790>
1001804e: 8b 55 0c                     	movl	0xc(%ebp), %edx
10018051: 8b 42 0c                     	movl	0xc(%edx), %eax
10018054: 50                           	pushl	%eax
10018055: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
10018058: 8b 51 1c                     	movl	0x1c(%ecx), %edx
1001805b: 52                           	pushl	%edx
1001805c: 8b 45 0c                     	movl	0xc(%ebp), %eax
1001805f: 8b 48 18                     	movl	0x18(%eax), %ecx
10018062: 51                           	pushl	%ecx
10018063: 68 30 13 44 00               	pushl	$0x441330               # imm = 0x441330
10018068: e8 73 d6 fe ff               	calll	0x100056e0 <GetMaxMonsterId+0x120>
1001806d: 83 c4 10                     	addl	$0x10, %esp
10018070: b8 01 00 00 00               	movl	$0x1, %eax
10018075: 8b e5                        	movl	%ebp, %esp
10018077: 5d                           	popl	%ebp
10018078: c2 08 00                     	retl	$0x8
