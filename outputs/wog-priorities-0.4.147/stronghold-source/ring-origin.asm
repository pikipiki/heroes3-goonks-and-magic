
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  440600: 86 f4                        	xchgb	%ah, %dh
  440602: 00 00                        	addb	%al, (%eax)
  440604: 00 8b 0d 20 94 69            	addb	%cl, 0x6994200d(%ebx)
  44060a: 00 6a 01                     	addb	%ch, 0x1(%edx)
  44060d: 6a 01                        	pushl	$0x1
  44060f: 57                           	pushl	%edi
  440610: 50                           	pushl	%eax
  440611: 6a 4a                        	pushl	$0x4a
  440613: e8 38 83 16 00               	calll	0x5a8950 <.text+0x1a7950>
  440618: 84 c0                        	testb	%al, %al
  44061a: 0f 84 8e fc ff ff            	je	0x4402ae <.text+0x3f2ae>
  440620: c7 87 ec 00 00 00 4a 00 00 00	movl	$0x4a, 0xec(%edi)
  44062a: 5f                           	popl	%edi
  44062b: b0 01                        	movb	$0x1, %al
  44062d: 5e                           	popl	%esi
  44062e: 8b e5                        	movl	%ebp, %esp
  440630: 5d                           	popl	%ebp
  440631: c2 04 00                     	retl	$0x4
  440634: a1 03 44 00 2d               	movl	0x2d004403, %eax
  440639: 03 44 00 b8                  	addl	-0x48(%eax,%eax), %eax
  44063d: 02 44 00 22                  	addb	0x22(%eax,%eax), %al
  440641: 04 44                        	addb	$0x44, %al
  440643: 00 42 02                     	addb	%al, 0x2(%edx)
  440646: 44                           	incl	%esp
  440647: 00 96 04 44 00 c0            	addb	%dl, -0x3fffbbfc(%esi)
  44064d: 05 44 00 3a 05               	addl	$0x53a0044, %eax        # imm = 0x53A0044
  440652: 44                           	incl	%esp
  440653: 00 0a                        	addb	%cl, (%edx)
  440655: 05 44 00 ae 02               	addl	$0x2ae0044, %eax        # imm = 0x2AE0044
  44065a: 44                           	incl	%esp
  44065b: 00 00                        	addb	%al, (%eax)
  44065d: 00 01                        	addb	%al, (%ecx)
  44065f: 01 09                        	addl	%ecx, (%ecx)
  440661: 09 09                        	orl	%ecx, (%ecx)
  440663: 09 09                        	orl	%ecx, (%ecx)
  440665: 09 09                        	orl	%ecx, (%ecx)
  440667: 09 09                        	orl	%ecx, (%ecx)
  440669: 09 09                        	orl	%ecx, (%ecx)
  44066b: 09 09                        	orl	%ecx, (%ecx)
  44066d: 09 09                        	orl	%ecx, (%ecx)
  44066f: 09 09                        	orl	%ecx, (%ecx)
  440671: 09 09                        	orl	%ecx, (%ecx)
  440673: 09 09                        	orl	%ecx, (%ecx)
  440675: 09 09                        	orl	%ecx, (%ecx)
  440677: 09 09                        	orl	%ecx, (%ecx)
  440679: 09 09                        	orl	%ecx, (%ecx)
  44067b: 09 09                        	orl	%ecx, (%ecx)
  44067d: 09 09                        	orl	%ecx, (%ecx)
  44067f: 09 09                        	orl	%ecx, (%ecx)
  440681: 02 09                        	addb	(%ecx), %cl
  440683: 09 09                        	orl	%ecx, (%ecx)
  440685: 09 09                        	orl	%ecx, (%ecx)
  440687: 09 03                        	orl	%eax, (%ebx)
  440689: 03 09                        	addl	(%ecx), %ecx
  44068b: 04 09                        	addb	$0x9, %al
  44068d: 09 09                        	orl	%ecx, (%ecx)
  44068f: 09 09                        	orl	%ecx, (%ecx)
  440691: 09 05 05 09 09 09            	orl	%eax, 0x9090905
  440697: 06                           	pushl	%es
  440698: 09 09                        	orl	%ecx, (%ecx)
  44069a: 09 09                        	orl	%ecx, (%ecx)
  44069c: 09 09                        	orl	%ecx, (%ecx)
  44069e: 09 09                        	orl	%ecx, (%ecx)
  4406a0: 09 09                        	orl	%ecx, (%ecx)
  4406a2: 09 09                        	orl	%ecx, (%ecx)
  4406a4: 09 09                        	orl	%ecx, (%ecx)
  4406a6: 09 09                        	orl	%ecx, (%ecx)
  4406a8: 09 09                        	orl	%ecx, (%ecx)
  4406aa: 09 09                        	orl	%ecx, (%ecx)
  4406ac: 09 09                        	orl	%ecx, (%ecx)
  4406ae: 09 09                        	orl	%ecx, (%ecx)
  4406b0: 05 05 09 07 09               	addl	$0x9070905, %eax        # imm = 0x9070905
  4406b5: 09 09                        	orl	%ecx, (%ecx)
  4406b7: 09 09                        	orl	%ecx, (%ecx)
  4406b9: 09 09                        	orl	%ecx, (%ecx)
  4406bb: 09 09                        	orl	%ecx, (%ecx)
  4406bd: 09 09                        	orl	%ecx, (%ecx)
  4406bf: 09 09                        	orl	%ecx, (%ecx)
  4406c1: 09 09                        	orl	%ecx, (%ecx)
  4406c3: 09 09                        	orl	%ecx, (%ecx)
  4406c5: 09 09                        	orl	%ecx, (%ecx)
  4406c7: 09 09                        	orl	%ecx, (%ecx)
  4406c9: 09 09                        	orl	%ecx, (%ecx)
  4406cb: 09 09                        	orl	%ecx, (%ecx)
  4406cd: 08 09                        	orb	%cl, (%ecx)
  4406cf: 09 09                        	orl	%ecx, (%ecx)
  4406d1: 09 09                        	orl	%ecx, (%ecx)
  4406d3: 03 90 90 90 90 90            	addl	-0x6f6f6f70(%eax), %edx
  4406d9: 90                           	nop
  4406da: 90                           	nop
  4406db: 90                           	nop
  4406dc: 90                           	nop
  4406dd: 90                           	nop
  4406de: 90                           	nop
  4406df: 90                           	nop
  4406e0: 55                           	pushl	%ebp
  4406e1: 8b ec                        	movl	%esp, %ebp
  4406e3: 83 ec 18                     	subl	$0x18, %esp
  4406e6: 53                           	pushl	%ebx
  4406e7: 56                           	pushl	%esi
  4406e8: 8b f1                        	movl	%ecx, %esi
  4406ea: 57                           	pushl	%edi
  4406eb: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  4406f1: 89 75 ec                     	movl	%esi, -0x14(%ebp)
  4406f4: e8 97 2b 05 00               	calll	0x493290 <.text+0x92290>
  4406f9: 8b be f8 00 00 00            	movl	0xf8(%esi), %edi
  4406ff: 8b b6 f4 00 00 00            	movl	0xf4(%esi), %esi
  440705: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  44070b: 8d 04 f5 00 00 00 00         	leal	(,%esi,8), %eax
  440712: 2b c6                        	subl	%esi, %eax
  440714: 8d 14 47                     	leal	(%edi,%eax,2), %edx
  440717: 03 c2                        	addl	%edx, %eax
  440719: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  440720: 2b d0                        	subl	%eax, %edx
  440722: 8d 14 52                     	leal	(%edx,%edx,2), %edx
  440725: 8d 04 d0                     	leal	(%eax,%edx,8), %eax
  440728: 8b 94 c1 00 55 00 00         	movl	0x5500(%ecx,%eax,8), %edx
  44072f: 81 fa 95 00 00 00            	cmpl	$0x95, %edx
  440735: 8d 04 c1                     	leal	(%ecx,%eax,8), %eax
  440738: 75 0d                        	jne	0x440747 <.text+0x3f747>
  44073a: 05 cc 54 00 00               	addl	$0x54cc, %eax           # imm = 0x54CC
  44073f: 50                           	pushl	%eax
  440740: e8 fb 98 02 00               	calll	0x46a040 <.text+0x69040>
  440745: eb 0e                        	jmp	0x440755 <.text+0x3f755>
  440747: 8d 94 b6 00 50 00 00         	leal	0x5000(%esi,%esi,4), %edx
  44074e: 8d 04 97                     	leal	(%edi,%edx,4), %eax
  440751: c6 04 08 01                  	movb	$0x1, (%eax,%ecx)
  440755: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  44075b: 33 db                        	xorl	%ebx, %ebx
  44075d: 33 ff                        	xorl	%edi, %edi
  44075f: ba bc 54 00 00               	movl	$0x54bc, %edx           # imm = 0x54BC
  440764: 89 7d f0                     	movl	%edi, -0x10(%ebp)
  440767: c7 45 fc 00 40 01 00         	movl	$0x14000, -0x4(%ebp)    # imm = 0x14000
  44076e: 89 55 f4                     	movl	%edx, -0xc(%ebp)
  440771: 8b 04 0a                     	movl	(%edx,%ecx), %eax
  440774: 8b f0                        	movl	%eax, %esi
  440776: 48                           	decl	%eax
  440777: 85 f6                        	testl	%esi, %esi
  440779: 7e 6d                        	jle	0x4407e8 <.text+0x3f7e8>
  44077b: 40                           	incl	%eax
  44077c: 8d bc 0f c4 55 00 00         	leal	0x55c4(%edi,%ecx), %edi
  440783: 89 45 f8                     	movl	%eax, -0x8(%ebp)
  440786: 8a 47 f0                     	movb	-0x10(%edi), %al
  440789: 84 c0                        	testb	%al, %al
  44078b: 74 49                        	je	0x4407d6 <.text+0x3f7d6>
  44078d: 8b 37                        	movl	(%edi), %esi
  44078f: 8d 14 33                     	leal	(%ebx,%esi), %edx
  440792: 8d 04 d5 00 00 00 00         	leal	(,%edx,8), %eax
  440799: 2b c2                        	subl	%edx, %eax
  44079b: 8d 04 40                     	leal	(%eax,%eax,2), %eax
  44079e: 8d 14 c2                     	leal	(%edx,%eax,8), %edx
  4407a1: 8d 04 d1                     	leal	(%ecx,%edx,8), %eax
  4407a4: 8b 94 d1 00 55 00 00         	movl	0x5500(%ecx,%edx,8), %edx
  4407ab: 81 fa 95 00 00 00            	cmpl	$0x95, %edx
  4407b1: 75 0d                        	jne	0x4407c0 <.text+0x3f7c0>
  4407b3: 05 cc 54 00 00               	addl	$0x54cc, %eax           # imm = 0x54CC
  4407b8: 50                           	pushl	%eax
  4407b9: e8 82 98 02 00               	calll	0x46a040 <.text+0x69040>
  4407be: eb 09                        	jmp	0x4407c9 <.text+0x3f7c9>
  4407c0: 8b 45 fc                     	movl	-0x4(%ebp), %eax
  4407c3: 03 c6                        	addl	%esi, %eax
  4407c5: c6 04 08 01                  	movb	$0x1, (%eax,%ecx)
  4407c9: c6 87 28 ff ff ff 01         	movb	$0x1, -0xd8(%edi)
  4407d0: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  4407d6: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  4407d9: 81 c7 48 05 00 00            	addl	$0x548, %edi            # imm = 0x548
  4407df: 48                           	decl	%eax
  4407e0: 89 45 f8                     	movl	%eax, -0x8(%ebp)
  4407e3: 75 a1                        	jne	0x440786 <.text+0x3f786>
  4407e5: 8b 55 f4                     	movl	-0xc(%ebp), %edx
  4407e8: 8b 7d f0                     	movl	-0x10(%ebp), %edi
  4407eb: 8b 75 fc                     	movl	-0x4(%ebp), %esi
  4407ee: 83 c2 04                     	addl	$0x4, %edx
  4407f1: 81 c7 e8 6e 00 00            	addl	$0x6ee8, %edi           # imm = 0x6EE8
  4407f7: 83 c3 15                     	addl	$0x15, %ebx
  4407fa: 83 c6 14                     	addl	$0x14, %esi
  4407fd: 81 fa c4 54 00 00            	cmpl	$0x54c4, %edx           # imm = 0x54C4
  440803: 89 55 f4                     	movl	%edx, -0xc(%ebp)
  440806: 89 7d f0                     	movl	%edi, -0x10(%ebp)
  440809: 89 75 fc                     	movl	%esi, -0x4(%ebp)
  44080c: 0f 8c 5f ff ff ff            	jl	0x440771 <.text+0x3f771>
  440812: 33 ff                        	xorl	%edi, %edi
  440814: be bc 54 00 00               	movl	$0x54bc, %esi           # imm = 0x54BC
  440819: 8b 14 0e                     	movl	(%esi,%ecx), %edx
  44081c: 8b c2                        	movl	%edx, %eax
  44081e: 4a                           	decl	%edx
  44081f: 85 c0                        	testl	%eax, %eax
  440821: 7e 1b                        	jle	0x44083e <.text+0x3f83e>
  440823: 8d 84 0f b4 55 00 00         	leal	0x55b4(%edi,%ecx), %eax
  44082a: 8d 4a 01                     	leal	0x1(%edx), %ecx
  44082d: c6 00 00                     	movb	$0x0, (%eax)
  440830: 05 48 05 00 00               	addl	$0x548, %eax            # imm = 0x548
  440835: 49                           	decl	%ecx
  440836: 75 f5                        	jne	0x44082d <.text+0x3f82d>
  440838: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  44083e: 83 c6 04                     	addl	$0x4, %esi
  440841: 81 c7 e8 6e 00 00            	addl	$0x6ee8, %edi           # imm = 0x6EE8
  440847: 81 fe c4 54 00 00            	cmpl	$0x54c4, %esi           # imm = 0x54C4
  44084d: 7c ca                        	jl	0x440819 <.text+0x3f819>
  44084f: 8b 75 08                     	movl	0x8(%ebp), %esi
  440852: 8b 5d ec                     	movl	-0x14(%ebp), %ebx
  440855: 56                           	pushl	%esi
  440856: 8b cb                        	movl	%ebx, %ecx
  440858: e8 53 35 00 00               	calll	0x443db0 <.text+0x42db0>
  44085d: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  440863: 8b f8                        	movl	%eax, %edi
  440865: e8 16 98 02 00               	calll	0x46a080 <.text+0x69080>
  44086a: 84 c0                        	testb	%al, %al
  44086c: 75 17                        	jne	0x440885 <.text+0x3f885>
  44086e: 8b 0d a8 7f 68 00            	movl	0x687fa8, %ecx
