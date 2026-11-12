
../Third-Upgrade-Mod-Full/EraPlugins/amethyst2_4.dll:	file format coff-i386

Disassembly of section .text:

100088e0 <ChooseAnyCreatureType>:
10012d9c: 8b 95 f4 fe ff ff            	movl	-0x10c(%ebp), %edx
10012da2: 83 c2 01                     	addl	$0x1, %edx
10012da5: 89 95 f4 fe ff ff            	movl	%edx, -0x10c(%ebp)
10012dab: 81 bd f4 fe ff ff 00 04 00 00	cmpl	$0x400, -0x10c(%ebp)    # imm = 0x400
10012db5: 7d 35                        	jge	0x10012dec <ChooseAnyCreatureType+0xa50c>
10012db7: 8b 85 f4 fe ff ff            	movl	-0x10c(%ebp), %eax
10012dbd: c7 04 85 a8 2e e9 10 01 00 00 00     	movl	$0x1, 0x10e92ea8(,%eax,4)
10012dc8: 8b 8d f4 fe ff ff            	movl	-0x10c(%ebp), %ecx
10012dce: c7 04 8d a8 3f e9 10 01 00 00 00     	movl	$0x1, 0x10e93fa8(,%ecx,4)
10012dd9: 8b 95 f4 fe ff ff            	movl	-0x10c(%ebp), %edx
10012ddf: c7 04 95 a8 50 e9 10 00 00 00 00     	movl	$0x0, 0x10e950a8(,%edx,4)
10012dea: eb b0                        	jmp	0x10012d9c <ChooseAnyCreatureType+0xa4bc>
10012dec: b8 04 00 00 00               	movl	$0x4, %eax
10012df1: 69 c8 86 00 00 00            	imull	$0x86, %eax, %ecx
10012df7: c7 81 a8 2e e9 10 05 00 00 00	movl	$0x5, 0x10e92ea8(%ecx)
