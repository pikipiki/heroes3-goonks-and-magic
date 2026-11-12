
../Third-Upgrade-Mod-Full/EraPlugins/amethyst2_4.dll:	file format coff-i386

Disassembly of section .text:

100088e0 <ChooseAnyCreatureType>:
100151d0: 55                           	pushl	%ebp
100151d1: 8b ec                        	movl	%esp, %ebp
100151d3: 83 ec 30                     	subl	$0x30, %esp
100151d6: 56                           	pushl	%esi
100151d7: 8b 45 0c                     	movl	0xc(%ebp), %eax
100151da: 8b 48 14                     	movl	0x14(%eax), %ecx
100151dd: 83 c1 10                     	addl	$0x10, %ecx
100151e0: 89 4d f4                     	movl	%ecx, -0xc(%ebp)
100151e3: 8b 55 f4                     	movl	-0xc(%ebp), %edx
100151e6: 83 3a 02                     	cmpl	$0x2, (%edx)
100151e9: 7e 13                        	jle	0x100151fe <ChooseAnyCreatureType+0xc91e>
100151eb: 8b 45 f4                     	movl	-0xc(%ebp), %eax
100151ee: c7 00 01 00 00 00            	movl	$0x1, (%eax)
100151f4: b8 01 00 00 00               	movl	$0x1, %eax
100151f9: e9 c5 01 00 00               	jmp	0x100153c3 <ChooseAnyCreatureType+0xcae3>
100151fe: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
10015201: 83 39 ff                     	cmpl	$-0x1, (%ecx)
10015204: 0f 85 9d 00 00 00            	jne	0x100152a7 <ChooseAnyCreatureType+0xc9c7>
1001520a: 8b 55 f4                     	movl	-0xc(%ebp), %edx
1001520d: c7 02 01 00 00 00            	movl	$0x1, (%edx)
10015213: 8b 45 0c                     	movl	0xc(%ebp), %eax
10015216: 8b 48 14                     	movl	0x14(%eax), %ecx
10015219: 8b 51 0c                     	movl	0xc(%ecx), %edx
1001521c: 89 55 d4                     	movl	%edx, -0x2c(%ebp)
1001521f: 8b 45 0c                     	movl	0xc(%ebp), %eax
10015222: 8b 48 04                     	movl	0x4(%eax), %ecx
10015225: 89 4d f0                     	movl	%ecx, -0x10(%ebp)
10015228: 8b 55 f0                     	movl	-0x10(%ebp), %edx
1001522b: 69 82 b8 32 01 00 e8 6e 00 00	imull	$0x6ee8, 0x132b8(%edx), %eax # imm = 0x6EE8
10015235: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
10015238: 8d 94 01 cc 54 00 00         	leal	0x54cc(%ecx,%eax), %edx
1001523f: 8b 45 f0                     	movl	-0x10(%ebp), %eax
10015242: 69 88 bc 32 01 00 48 05 00 00	imull	$0x548, 0x132bc(%eax), %ecx # imm = 0x548
1001524c: 03 d1                        	addl	%ecx, %edx
1001524e: 89 55 e0                     	movl	%edx, -0x20(%ebp)
10015251: 8b 55 e0                     	movl	-0x20(%ebp), %edx
10015254: 8b 42 34                     	movl	0x34(%edx), %eax
10015257: 0f be 88 18 2a 2f 11         	movsbl	0x112f2a18(%eax), %ecx
1001525e: 83 f9 0b                     	cmpl	$0xb, %ecx
10015261: 75 1b                        	jne	0x1001527e <ChooseAnyCreatureType+0xc99e>
10015263: 8b 55 e0                     	movl	-0x20(%ebp), %edx
10015266: 89 55 dc                     	movl	%edx, -0x24(%ebp)
10015269: 83 7d dc 00                  	cmpl	$0x0, -0x24(%ebp)
1001526d: 74 0d                        	je	0x1001527c <ChooseAnyCreatureType+0xc99c>
1001526f: 8b 45 dc                     	movl	-0x24(%ebp), %eax
10015272: c7 80 ec 00 00 00 ff ff ff ff	movl	$0xffffffff, 0xec(%eax) # imm = 0xFFFFFFFF
1001527c: eb 29                        	jmp	0x100152a7 <ChooseAnyCreatureType+0xc9c7>
1001527e: 6b 4d d4 70                  	imull	$0x70, -0x2c(%ebp), %ecx
10015282: 8b 55 f0                     	movl	-0x10(%ebp), %edx
10015285: 8d 8c 0a c4 01 00 00         	leal	0x1c4(%edx,%ecx), %ecx
1001528c: e8 6f 08 00 00               	calll	0x10015b00 <ChooseAnyCreatureType+0xd220>
10015291: 89 45 d8                     	movl	%eax, -0x28(%ebp)
10015294: 83 7d d8 00                  	cmpl	$0x0, -0x28(%ebp)
10015298: 74 0d                        	je	0x100152a7 <ChooseAnyCreatureType+0xc9c7>
1001529a: 8b 45 d8                     	movl	-0x28(%ebp), %eax
1001529d: c7 80 ec 00 00 00 ff ff ff ff	movl	$0xffffffff, 0xec(%eax) # imm = 0xFFFFFFFF
100152a7: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
100152aa: 83 39 01                     	cmpl	$0x1, (%ecx)
100152ad: 74 0a                        	je	0x100152b9 <ChooseAnyCreatureType+0xc9d9>
100152af: b8 01 00 00 00               	movl	$0x1, %eax
100152b4: e9 0a 01 00 00               	jmp	0x100153c3 <ChooseAnyCreatureType+0xcae3>
100152b9: e8 d2 e8 fe ff               	calll	0x10003b90 <writeCreatureDesc+0x15e0>
100152be: 89 45 ec                     	movl	%eax, -0x14(%ebp)
100152c1: 8b 55 0c                     	movl	0xc(%ebp), %edx
100152c4: 8b 42 14                     	movl	0x14(%edx), %eax
100152c7: 8b 48 08                     	movl	0x8(%eax), %ecx
100152ca: 89 4d e8                     	movl	%ecx, -0x18(%ebp)
100152cd: 8b 55 ec                     	movl	-0x14(%ebp), %edx
100152d0: 69 82 b8 32 01 00 e8 6e 00 00	imull	$0x6ee8, 0x132b8(%edx), %eax # imm = 0x6EE8
100152da: 8b 4d ec                     	movl	-0x14(%ebp), %ecx
100152dd: 8d 94 01 cc 54 00 00         	leal	0x54cc(%ecx,%eax), %edx
100152e4: 8b 45 ec                     	movl	-0x14(%ebp), %eax
100152e7: 69 88 bc 32 01 00 48 05 00 00	imull	$0x548, 0x132bc(%eax), %ecx # imm = 0x548
100152f1: 03 d1                        	addl	%ecx, %edx
100152f3: 89 55 e4                     	movl	%edx, -0x1c(%ebp)
100152f6: 8b 55 e4                     	movl	-0x1c(%ebp), %edx
100152f9: 8b 42 34                     	movl	0x34(%edx), %eax
100152fc: 89 45 f8                     	movl	%eax, -0x8(%ebp)
100152ff: 8b 4d e4                     	movl	-0x1c(%ebp), %ecx
10015302: 8b 51 4c                     	movl	0x4c(%ecx), %edx
10015305: 89 55 d0                     	movl	%edx, -0x30(%ebp)
10015308: 83 7d e8 46                  	cmpl	$0x46, -0x18(%ebp)
1001530c: 7c 1e                        	jl	0x1001532c <ChooseAnyCreatureType+0xca4c>
1001530e: 83 7d e8 50                  	cmpl	$0x50, -0x18(%ebp)
10015312: 7f 18                        	jg	0x1001532c <ChooseAnyCreatureType+0xca4c>
10015314: 8b 45 f8                     	movl	-0x8(%ebp), %eax
10015317: 0f be 88 20 f3 e8 10         	movsbl	0x10e8f320(%eax), %ecx
1001531e: 85 c9                        	testl	%ecx, %ecx
10015320: 75 0a                        	jne	0x1001532c <ChooseAnyCreatureType+0xca4c>
10015322: b8 01 00 00 00               	movl	$0x1, %eax
10015327: e9 97 00 00 00               	jmp	0x100153c3 <ChooseAnyCreatureType+0xcae3>
1001532c: 83 7d e8 3e                  	cmpl	$0x3e, -0x18(%ebp)
10015330: 75 15                        	jne	0x10015347 <ChooseAnyCreatureType+0xca67>
10015332: 8b 55 f8                     	movl	-0x8(%ebp), %edx
10015335: 0f be 82 20 f3 e8 10         	movsbl	0x10e8f320(%edx), %eax
1001533c: 85 c0                        	testl	%eax, %eax
1001533e: 75 07                        	jne	0x10015347 <ChooseAnyCreatureType+0xca67>
10015340: b8 01 00 00 00               	movl	$0x1, %eax
10015345: eb 7c                        	jmp	0x100153c3 <ChooseAnyCreatureType+0xcae3>
10015347: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
1001534a: 8b 51 14                     	movl	0x14(%ecx), %edx
1001534d: 83 c2 1c                     	addl	$0x1c, %edx
10015350: 89 55 fc                     	movl	%edx, -0x4(%ebp)
10015353: 8b 45 fc                     	movl	-0x4(%ebp), %eax
10015356: 8b 4d d0                     	movl	-0x30(%ebp), %ecx
10015359: 89 08                        	movl	%ecx, (%eax)
1001535b: 8b 55 f8                     	movl	-0x8(%ebp), %edx
1001535e: 0f be 82 18 89 e9 10         	movsbl	0x10e98918(%edx), %eax
10015365: 85 c0                        	testl	%eax, %eax
10015367: 74 16                        	je	0x1001537f <ChooseAnyCreatureType+0xca9f>
10015369: 8b 4d e4                     	movl	-0x1c(%ebp), %ecx
1001536c: 51                           	pushl	%ecx
1001536d: 68 ea be 76 00               	pushl	$0x76beea               # imm = 0x76BEEA
10015372: e8 59 02 ff ff               	calll	0x100055d0 <GetMaxMonsterId+0x10>
10015377: 83 c4 08                     	addl	$0x8, %esp
1001537a: 8b 55 fc                     	movl	-0x4(%ebp), %edx
1001537d: 89 02                        	movl	%eax, (%edx)
1001537f: 8b 45 fc                     	movl	-0x4(%ebp), %eax
10015382: 8b 4d f8                     	movl	-0x8(%ebp), %ecx
10015385: 8b 10                        	movl	(%eax), %edx
10015387: 0f af 14 8d a8 2e e9 10      	imull	0x10e92ea8(,%ecx,4), %edx
1001538f: 8b 45 fc                     	movl	-0x4(%ebp), %eax
10015392: 89 10                        	movl	%edx, (%eax)
10015394: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
10015397: 8b 75 f8                     	movl	-0x8(%ebp), %esi
1001539a: 8b 01                        	movl	(%ecx), %eax
1001539c: 33 d2                        	xorl	%edx, %edx
1001539e: f7 34 b5 a8 3f e9 10         	divl	0x10e93fa8(,%esi,4)
100153a5: 8b 55 fc                     	movl	-0x4(%ebp), %edx
100153a8: 89 02                        	movl	%eax, (%edx)
100153aa: 8b 45 fc                     	movl	-0x4(%ebp), %eax
100153ad: 8b 08                        	movl	(%eax), %ecx
100153af: 8b 55 f8                     	movl	-0x8(%ebp), %edx
100153b2: 03 0c 95 a8 50 e9 10         	addl	0x10e950a8(,%edx,4), %ecx
100153b9: 8b 45 fc                     	movl	-0x4(%ebp), %eax
100153bc: 89 08                        	movl	%ecx, (%eax)
100153be: b8 01 00 00 00               	movl	$0x1, %eax
100153c3: 5e                           	popl	%esi
100153c4: 8b e5                        	movl	%ebp, %esp
100153c6: 5d                           	popl	%ebp
100153c7: c2 08 00                     	retl	$0x8
