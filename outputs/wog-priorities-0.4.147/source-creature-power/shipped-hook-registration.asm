
../Third-Upgrade-Mod-Full/EraPlugins/amethyst2_4.dll:	file format coff-i386

Disassembly of section .text:

100088e0 <ChooseAnyCreatureType>:
10012efe: 68 d0 51 01 10               	pushl	$0x100151d0             # imm = 0x100151D0
10012f03: 68 45 01 5a 00               	pushl	$0x5a0145               # imm = 0x5A0145
10012f08: 8b 0d 74 d5 a6 10            	movl	0x10a6d574, %ecx
10012f0e: 8b 11                        	movl	(%ecx), %edx
10012f10: a1 74 d5 a6 10               	movl	0x10a6d574, %eax
10012f15: 50                           	pushl	%eax
10012f16: 8b 4a 18                     	movl	0x18(%edx), %ecx
10012f19: ff d1                        	calll	*%ecx
