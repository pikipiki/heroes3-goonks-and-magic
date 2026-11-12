
../Third-Upgrade-Mod-Full/EraPlugins/amethyst2_4.dll:	file format coff-i386

Disassembly of section .text:

100088e0 <ChooseAnyCreatureType>:
10014ed1: 68 00 80 01 10               	pushl	$0x10018000             # imm = 0x10018000
10014ed6: 68 ff 1a 44 00               	pushl	$0x441aff               # imm = 0x441AFF
10014edb: 8b 15 74 d5 a6 10            	movl	0x10a6d574, %edx
10014ee1: 8b 02                        	movl	(%edx), %eax
10014ee3: 8b 0d 74 d5 a6 10            	movl	0x10a6d574, %ecx
10014ee9: 51                           	pushl	%ecx
10014eea: 8b 50 18                     	movl	0x18(%eax), %edx
10014eed: ff d2                        	calll	*%edx
10014eef: 68 00 04 00 00               	pushl	$0x400                  # imm = 0x400
10014ef4: 6a 00                        	pushl	$0x0
10014ef6: 68 20 15 e9 10               	pushl	$0x10e91520             # imm = 0x10E91520
10014efb: e8 50 cc 00 00               	calll	0x10021b50 <set_check_resistence_for_creature_cast+0x1d00>
10014f00: 83 c4 0c                     	addl	$0xc, %esp
10014f03: 68 30 80 01 10               	pushl	$0x10018030             # imm = 0x10018030
10014f08: 68 62 1b 44 00               	pushl	$0x441b62               # imm = 0x441B62
10014f0d: a1 74 d5 a6 10               	movl	0x10a6d574, %eax
10014f12: 8b 08                        	movl	(%eax), %ecx
10014f14: 8b 15 74 d5 a6 10            	movl	0x10a6d574, %edx
10014f1a: 52                           	pushl	%edx
10014f1b: 8b 41 18                     	movl	0x18(%ecx), %eax
10014f1e: ff d0                        	calll	*%eax
10014f20: 68 00 04 00 00               	pushl	$0x400                  # imm = 0x400
