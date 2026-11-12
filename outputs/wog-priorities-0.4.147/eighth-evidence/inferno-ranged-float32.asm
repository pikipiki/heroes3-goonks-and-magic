
../Third-Upgrade-Mod-Full/EraPlugins/amethyst2_4.dll:	file format coff-i386

Disassembly of section .text:

100088e0 <ChooseAnyCreatureType>:
1001b730: 55                           	pushl	%ebp
1001b731: 8b ec                        	movl	%esp, %ebp
1001b733: 83 ec 20                     	subl	$0x20, %esp
1001b736: c7 45 f4 10 c7 71 00         	movl	$0x71c710, -0xc(%ebp)   # imm = 0x71C710
1001b73d: 8b 45 08                     	movl	0x8(%ebp), %eax
1001b740: 8b 48 34                     	movl	0x34(%eax), %ecx
1001b743: 8b 55 08                     	movl	0x8(%ebp), %edx
1001b746: 8b 82 f8 00 00 00            	movl	0xf8(%edx), %eax
1001b74c: 8b 55 08                     	movl	0x8(%ebp), %edx
1001b74f: 6b 92 f4 00 00 00 15         	imull	$0x15, 0xf4(%edx), %edx
1001b756: 8d 84 10 00 04 00 00         	leal	0x400(%eax,%edx), %eax
1001b75d: f3 0f 10 04 8d 58 c5 30 11   	movss	0x1130c558(,%ecx,4), %xmm0
1001b766: f3 0f 58 04 85 58 c5 30 11   	addss	0x1130c558(,%eax,4), %xmm0
1001b76f: f3 0f 11 45 fc               	movss	%xmm0, -0x4(%ebp)
1001b774: 8b 4d 08                     	movl	0x8(%ebp), %ecx
1001b777: 8b 51 34                     	movl	0x34(%ecx), %edx
1001b77a: 8b 45 08                     	movl	0x8(%ebp), %eax
1001b77d: 8b 88 f8 00 00 00            	movl	0xf8(%eax), %ecx
1001b783: 8b 45 08                     	movl	0x8(%ebp), %eax
1001b786: 6b 80 f4 00 00 00 15         	imull	$0x15, 0xf4(%eax), %eax
1001b78d: 8d 8c 01 00 04 00 00         	leal	0x400(%ecx,%eax), %ecx
1001b794: f3 0f 10 04 95 58 d6 30 11   	movss	0x1130d658(,%edx,4), %xmm0
1001b79d: f3 0f 58 04 8d 58 d6 30 11   	addss	0x1130d658(,%ecx,4), %xmm0
1001b7a6: f3 0f 11 45 f8               	movss	%xmm0, -0x8(%ebp)
1001b7ab: 8b 15 20 94 69 00            	movl	0x699420, %edx
1001b7b1: 8b 42 3c                     	movl	0x3c(%edx), %eax
1001b7b4: 89 45 f0                     	movl	%eax, -0x10(%ebp)
1001b7b7: 83 7d f0 07                  	cmpl	$0x7, -0x10(%ebp)
1001b7bb: 75 73                        	jne	0x1001b830 <ChooseAnyCreatureType+0x12f50>
1001b7bd: f3 0f 10 45 fc               	movss	-0x4(%ebp), %xmm0
1001b7c2: 0f 2e 05 24 d0 03 10         	ucomiss	0x1003d024, %xmm0
1001b7c9: 9f                           	lahf
1001b7ca: f6 c4 44                     	testb	$0x44, %ah
1001b7cd: 7b 61                        	jnp	0x1001b830 <ChooseAnyCreatureType+0x12f50>
1001b7cf: f3 0f 10 45 fc               	movss	-0x4(%ebp), %xmm0
1001b7d4: 0f 2f 05 24 d0 03 10         	comiss	0x1003d024, %xmm0
1001b7db: 76 0e                        	jbe	0x1001b7eb <ChooseAnyCreatureType+0x12f0b>
1001b7dd: 6a 59                        	pushl	$0x59
1001b7df: 8b 4d 08                     	movl	0x8(%ebp), %ecx
1001b7e2: 51                           	pushl	%ecx
1001b7e3: e8 a8 bd ff ff               	calll	0x10017590 <ChooseAnyCreatureType+0xecb0>
1001b7e8: 90                           	nop
1001b7e9: eb 0c                        	jmp	0x1001b7f7 <ChooseAnyCreatureType+0x12f17>
1001b7eb: 6a 5a                        	pushl	$0x5a
1001b7ed: 8b 55 08                     	movl	0x8(%ebp), %edx
1001b7f0: 52                           	pushl	%edx
1001b7f1: e8 9a bd ff ff               	calll	0x10017590 <ChooseAnyCreatureType+0xecb0>
1001b7f6: 90                           	nop
1001b7f7: f2 0f 2a 45 0c               	cvtsi2sdl	0xc(%ebp), %xmm0
1001b7fc: f3 0f 5a 4d fc               	cvtss2sd	-0x4(%ebp), %xmm1
1001b801: f2 0f 10 15 60 fd 03 10      	movsd	0x1003fd60, %xmm2
1001b809: f2 0f 5c d1                  	subsd	%xmm1, %xmm2
1001b80d: f2 0f 59 c2                  	mulsd	%xmm2, %xmm0
1001b811: f2 0f 11 45 e8               	movsd	%xmm0, -0x18(%ebp)
1001b816: f2 0f 2c 45 e8               	cvttsd2si	-0x18(%ebp), %eax
1001b81b: 50                           	pushl	%eax
1001b81c: 8b 4d 08                     	movl	0x8(%ebp), %ecx
1001b81f: 51                           	pushl	%ecx
1001b820: ff 55 f4                     	calll	*-0xc(%ebp)
1001b823: 83 c4 08                     	addl	$0x8, %esp
1001b826: e9 86 00 00 00               	jmp	0x1001b8b1 <ChooseAnyCreatureType+0x12fd1>
1001b82b: e9 81 00 00 00               	jmp	0x1001b8b1 <ChooseAnyCreatureType+0x12fd1>
1001b830: 83 7d f0 06                  	cmpl	$0x6, -0x10(%ebp)
1001b834: 75 6d                        	jne	0x1001b8a3 <ChooseAnyCreatureType+0x12fc3>
1001b836: f3 0f 10 45 f8               	movss	-0x8(%ebp), %xmm0
1001b83b: 0f 2e 05 24 d0 03 10         	ucomiss	0x1003d024, %xmm0
1001b842: 9f                           	lahf
1001b843: f6 c4 44                     	testb	$0x44, %ah
1001b846: 7b 5b                        	jnp	0x1001b8a3 <ChooseAnyCreatureType+0x12fc3>
1001b848: f3 0f 10 45 f8               	movss	-0x8(%ebp), %xmm0
1001b84d: 0f 2f 05 24 d0 03 10         	comiss	0x1003d024, %xmm0
1001b854: 76 0e                        	jbe	0x1001b864 <ChooseAnyCreatureType+0x12f84>
1001b856: 6a 57                        	pushl	$0x57
1001b858: 8b 55 08                     	movl	0x8(%ebp), %edx
1001b85b: 52                           	pushl	%edx
1001b85c: e8 2f bd ff ff               	calll	0x10017590 <ChooseAnyCreatureType+0xecb0>
1001b861: 90                           	nop
1001b862: eb 0c                        	jmp	0x1001b870 <ChooseAnyCreatureType+0x12f90>
1001b864: 6a 58                        	pushl	$0x58
1001b866: 8b 45 08                     	movl	0x8(%ebp), %eax
1001b869: 50                           	pushl	%eax
1001b86a: e8 21 bd ff ff               	calll	0x10017590 <ChooseAnyCreatureType+0xecb0>
1001b86f: 90                           	nop
1001b870: f2 0f 2a 45 0c               	cvtsi2sdl	0xc(%ebp), %xmm0
1001b875: f3 0f 5a 4d f8               	cvtss2sd	-0x8(%ebp), %xmm1
1001b87a: f2 0f 10 15 60 fd 03 10      	movsd	0x1003fd60, %xmm2
1001b882: f2 0f 5c d1                  	subsd	%xmm1, %xmm2
1001b886: f2 0f 59 c2                  	mulsd	%xmm2, %xmm0
1001b88a: f2 0f 11 45 e0               	movsd	%xmm0, -0x20(%ebp)
1001b88f: f2 0f 2c 4d e0               	cvttsd2si	-0x20(%ebp), %ecx
1001b894: 51                           	pushl	%ecx
1001b895: 8b 55 08                     	movl	0x8(%ebp), %edx
1001b898: 52                           	pushl	%edx
1001b899: ff 55 f4                     	calll	*-0xc(%ebp)
1001b89c: 83 c4 08                     	addl	$0x8, %esp
1001b89f: eb 10                        	jmp	0x1001b8b1 <ChooseAnyCreatureType+0x12fd1>
1001b8a1: eb 0e                        	jmp	0x1001b8b1 <ChooseAnyCreatureType+0x12fd1>
1001b8a3: 8b 45 0c                     	movl	0xc(%ebp), %eax
1001b8a6: 50                           	pushl	%eax
1001b8a7: 8b 4d 08                     	movl	0x8(%ebp), %ecx
1001b8aa: 51                           	pushl	%ecx
1001b8ab: ff 55 f4                     	calll	*-0xc(%ebp)
1001b8ae: 83 c4 08                     	addl	$0x8, %esp
1001b8b1: 8b e5                        	movl	%ebp, %esp
