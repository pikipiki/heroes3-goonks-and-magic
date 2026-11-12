
TUM_SOURCE/EraPlugins/amethyst2_4.dll:	file format coff-i386

Disassembly of section .text:

100088e0 <ChooseAnyCreatureType>:
100132cb: 68 00 04 00 00               	pushl	$0x400                  # imm = 0x400
100132d0: 6a 09                        	pushl	$0x9
100132d2: 68 18 2a 2f 11               	pushl	$0x112f2a18             # imm = 0x112F2A18
100132d7: e8 74 e8 00 00               	calll	0x10021b50 <set_check_resistence_for_creature_cast+0x1d00>
100132dc: 83 c4 0c                     	addl	$0xc, %esp
100132df: b9 2b 00 00 00               	movl	$0x2b, %ecx
100132e4: 8b 35 37 02 44 00            	movl	0x440237, %esi
100132ea: bf 2e 2a 2f 11               	movl	$0x112f2a2e, %edi       # imm = 0x112F2A2E
100132ef: f3 a5                        	rep		movsl	(%esi), %es:(%edi)
100132f1: 66 a5                        	movsw	(%esi), %es:(%edi)
100132f3: a4                           	movsb	(%esi), %es:(%edi)
