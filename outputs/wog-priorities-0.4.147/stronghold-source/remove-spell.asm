
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  444230: 55                           	pushl	%ebp
  444231: 8b ec                        	movl	%esp, %ebp
  444233: 83 ec 38                     	subl	$0x38, %esp
  444236: 8b 45 08                     	movl	0x8(%ebp), %eax
  444239: 53                           	pushl	%ebx
  44423a: 56                           	pushl	%esi
  44423b: 8b f1                        	movl	%ecx, %esi
  44423d: 57                           	pushl	%edi
  44423e: 33 ff                        	xorl	%edi, %edi
  444240: 39 bc 86 98 01 00 00         	cmpl	%edi, 0x198(%esi,%eax,4)
  444247: 0f 8e 6e 03 00 00            	jle	0x4445bb <.text+0x435bb>
  44424d: 83 f8 2f                     	cmpl	$0x2f, %eax
  444250: 0f 84 65 03 00 00            	je	0x4445bb <.text+0x435bb>
  444256: 8b 96 94 01 00 00            	movl	0x194(%esi), %edx
  44425c: 83 c0 d3                     	addl	$-0x2d, %eax
  44425f: 4a                           	decl	%edx
  444260: 83 f8 1e                     	cmpl	$0x1e, %eax
  444263: 89 96 94 01 00 00            	movl	%edx, 0x194(%esi)
  444269: 89 bc 86 4c 02 00 00         	movl	%edi, 0x24c(%esi,%eax,4)
  444270: 0f 87 6b 02 00 00            	ja	0x4444e1 <.text+0x434e1>
  444276: 33 c9                        	xorl	%ecx, %ecx
  444278: 8a 88 ec 45 44 00            	movb	0x4445ec(%eax), %cl
  44427e: ff 24 8d c4 45 44 00         	jmpl	*0x4445c4(,%ecx,4)
  444285: 8b 86 08 05 00 00            	movl	0x508(%esi), %eax
  44428b: 3b c7                        	cmpl	%edi, %eax
  44428d: 75 04                        	jne	0x444293 <.text+0x43293>
  44428f: 33 db                        	xorl	%ebx, %ebx
  444291: eb 0b                        	jmp	0x44429e <.text+0x4329e>
  444293: 8b 9e 0c 05 00 00            	movl	0x50c(%esi), %ebx
  444299: 2b d8                        	subl	%eax, %ebx
  44429b: c1 fb 02                     	sarl	$0x2, %ebx
  44429e: 8b d3                        	movl	%ebx, %edx
  4442a0: 4b                           	decl	%ebx
  4442a1: 85 d2                        	testl	%edx, %edx
  4442a3: 89 5d fc                     	movl	%ebx, -0x4(%ebp)
  4442a6: 74 52                        	je	0x4442fa <.text+0x432fa>
  4442a8: 8b 86 08 05 00 00            	movl	0x508(%esi), %eax
  4442ae: 8b 0c 98                     	movl	(%eax,%ebx,4), %ecx
  4442b1: 81 c1 f4 04 00 00            	addl	$0x4f4, %ecx            # imm = 0x4F4
  4442b7: 8b 51 04                     	movl	0x4(%ecx), %edx
  4442ba: 85 d2                        	testl	%edx, %edx
  4442bc: 75 04                        	jne	0x4442c2 <.text+0x432c2>
  4442be: 33 c0                        	xorl	%eax, %eax
  4442c0: eb 08                        	jmp	0x4442ca <.text+0x432ca>
  4442c2: 8b 41 08                     	movl	0x8(%ecx), %eax
  4442c5: 2b c2                        	subl	%edx, %eax
  4442c7: c1 f8 02                     	sarl	$0x2, %eax
  4442ca: 8b f8                        	movl	%eax, %edi
  4442cc: 48                           	decl	%eax
  4442cd: 85 ff                        	testl	%edi, %edi
  4442cf: 74 1f                        	je	0x4442f0 <.text+0x432f0>
  4442d1: 8d 3c 82                     	leal	(%edx,%eax,4), %edi
  4442d4: 39 37                        	cmpl	%esi, (%edi)
  4442d6: 74 0f                        	je	0x4442e7 <.text+0x432e7>
  4442d8: 8b d8                        	movl	%eax, %ebx
  4442da: 48                           	decl	%eax
  4442db: 83 ef 04                     	subl	$0x4, %edi
  4442de: 85 db                        	testl	%ebx, %ebx
  4442e0: 8b 5d fc                     	movl	-0x4(%ebp), %ebx
  4442e3: 75 ef                        	jne	0x4442d4 <.text+0x432d4>
  4442e5: eb 09                        	jmp	0x4442f0 <.text+0x432f0>
  4442e7: 8d 14 82                     	leal	(%edx,%eax,4), %edx
  4442ea: 52                           	pushl	%edx
  4442eb: e8 d0 8a 10 00               	calll	0x54cdc0 <.text+0x14bdc0>
  4442f0: 8b c3                        	movl	%ebx, %eax
  4442f2: 4b                           	decl	%ebx
  4442f3: 85 c0                        	testl	%eax, %eax
  4442f5: 89 5d fc                     	movl	%ebx, -0x4(%ebp)
  4442f8: 75 ae                        	jne	0x4442a8 <.text+0x432a8>
  4442fa: 8b 8e 0c 05 00 00            	movl	0x50c(%esi), %ecx
  444300: 8b 86 08 05 00 00            	movl	0x508(%esi), %eax
  444306: 8d be 04 05 00 00            	leal	0x504(%esi), %edi
  44430c: 50                           	pushl	%eax
  44430d: 8b d1                        	movl	%ecx, %edx
  44430f: e8 fc 9a 10 00               	calll	0x54de10 <.text+0x14ce10>
  444314: 8b 4f 08                     	movl	0x8(%edi), %ecx
  444317: 8b d8                        	movl	%eax, %ebx
  444319: 51                           	pushl	%ecx
  44431a: 53                           	pushl	%ebx
  44431b: 8b cf                        	movl	%edi, %ecx
  44431d: e8 1e af 06 00               	calll	0x4af240 <.text+0xae240>
  444322: 89 5f 08                     	movl	%ebx, 0x8(%edi)
  444325: e9 b7 01 00 00               	jmp	0x4444e1 <.text+0x434e1>
  44432a: 8b 86 28 05 00 00            	movl	0x528(%esi), %eax
  444330: 8d 9e 24 05 00 00            	leal	0x524(%esi), %ebx
  444336: 3b c7                        	cmpl	%edi, %eax
  444338: 74 08                        	je	0x444342 <.text+0x43342>
  44433a: 8b 7b 08                     	movl	0x8(%ebx), %edi
  44433d: 2b f8                        	subl	%eax, %edi
  44433f: c1 ff 02                     	sarl	$0x2, %edi
  444342: 8b d7                        	movl	%edi, %edx
  444344: 4f                           	decl	%edi
  444345: 85 d2                        	testl	%edx, %edx
  444347: 7e 1d                        	jle	0x444366 <.text+0x43366>
  444349: 8b 86 28 05 00 00            	movl	0x528(%esi), %eax
  44434f: 8b d6                        	movl	%esi, %edx
  444351: 8b 0c b8                     	movl	(%eax,%edi,4), %ecx
  444354: 81 c1 14 05 00 00            	addl	$0x514, %ecx            # imm = 0x514
  44435a: e8 c1 a3 ff ff               	calll	0x43e720 <.text+0x3d720>
  44435f: 8b cf                        	movl	%edi, %ecx
  444361: 4f                           	decl	%edi
  444362: 85 c9                        	testl	%ecx, %ecx
  444364: 7f e3                        	jg	0x444349 <.text+0x43349>
  444366: 8b cb                        	movl	%ebx, %ecx
  444368: e8 d3 46 00 00               	calll	0x448a40 <.text+0x47a40>
  44436d: 8d 9e 14 05 00 00            	leal	0x514(%esi), %ebx
  444373: 8b cb                        	movl	%ebx, %ecx
  444375: e8 36 8f 10 00               	calll	0x54d2b0 <.text+0x14c2b0>
  44437a: 8b f8                        	movl	%eax, %edi
  44437c: 8b d7                        	movl	%edi, %edx
  44437e: 4f                           	decl	%edi
  44437f: 85 d2                        	testl	%edx, %edx
  444381: 7e 1d                        	jle	0x4443a0 <.text+0x433a0>
  444383: 8b 86 18 05 00 00            	movl	0x518(%esi), %eax
  444389: 8b d6                        	movl	%esi, %edx
  44438b: 8b 0c b8                     	movl	(%eax,%edi,4), %ecx
  44438e: 81 c1 24 05 00 00            	addl	$0x524, %ecx            # imm = 0x524
  444394: e8 87 a3 ff ff               	calll	0x43e720 <.text+0x3d720>
  444399: 8b cf                        	movl	%edi, %ecx
  44439b: 4f                           	decl	%edi
  44439c: 85 c9                        	testl	%ecx, %ecx
  44439e: 7f e3                        	jg	0x444383 <.text+0x43383>
  4443a0: 8b cb                        	movl	%ebx, %ecx
  4443a2: e8 99 46 00 00               	calll	0x448a40 <.text+0x47a40>
  4443a7: 8b ce                        	movl	%esi, %ecx
  4443a9: e8 e2 a3 ff ff               	calll	0x43e790 <.text+0x3d790>
  4443ae: e9 2e 01 00 00               	jmp	0x4444e1 <.text+0x434e1>
  4443b3: 8b 96 70 04 00 00            	movl	0x470(%esi), %edx
  4443b9: 8b 86 cc 00 00 00            	movl	0xcc(%esi), %eax
  4443bf: 2b c2                        	subl	%edx, %eax
  4443c1: e9 15 01 00 00               	jmp	0x4444db <.text+0x434db>
  4443c6: 8b 86 6c 04 00 00            	movl	0x46c(%esi), %eax
  4443cc: 8b 8e c8 00 00 00            	movl	0xc8(%esi), %ecx
  4443d2: 03 c8                        	addl	%eax, %ecx
  4443d4: 89 8e c8 00 00 00            	movl	%ecx, 0xc8(%esi)
  4443da: e9 02 01 00 00               	jmp	0x4444e1 <.text+0x434e1>
  4443df: 8b 86 78 04 00 00            	movl	0x478(%esi), %eax
  4443e5: 8b 8e c8 00 00 00            	movl	0xc8(%esi), %ecx
  4443eb: 8b 9e cc 00 00 00            	movl	0xcc(%esi), %ebx
  4443f1: 2b c8                        	subl	%eax, %ecx
  4443f3: 89 8e c8 00 00 00            	movl	%ecx, 0xc8(%esi)
  4443f9: 8b 8e 84 00 00 00            	movl	0x84(%esi), %ecx
  4443ff: c1 e9 06                     	shrl	$0x6, %ecx
  444402: 2b d8                        	subl	%eax, %ebx
  444404: f6 c1 01                     	testb	$0x1, %cl
  444407: 89 9e cc 00 00 00            	movl	%ebx, 0xcc(%esi)
  44440d: 0f 85 ce 00 00 00            	jne	0x4444e1 <.text+0x434e1>
  444413: 29 86 c4 00 00 00            	subl	%eax, 0xc4(%esi)
  444419: e9 c3 00 00 00               	jmp	0x4444e1 <.text+0x434e1>
  44441e: 8b 96 84 00 00 00            	movl	0x84(%esi), %edx
  444424: c1 ea 06                     	shrl	$0x6, %edx
  444427: f6 c2 01                     	testb	$0x1, %dl
  44442a: 0f 85 b1 00 00 00            	jne	0x4444e1 <.text+0x434e1>
  444430: 8b 86 cc 04 00 00            	movl	0x4cc(%esi), %eax
  444436: 8b 8e c4 00 00 00            	movl	0xc4(%esi), %ecx
  44443c: 2b c8                        	subl	%eax, %ecx
  44443e: 89 8e c4 00 00 00            	movl	%ecx, 0xc4(%esi)
  444444: 8b 4e 68                     	movl	0x68(%esi), %ecx
  444447: 89 8e 58 01 00 00            	movl	%ecx, 0x158(%esi)
  44444d: e9 8f 00 00 00               	jmp	0x4444e1 <.text+0x434e1>
  444452: 8b 56 68                     	movl	0x68(%esi), %edx
  444455: 89 96 58 01 00 00            	movl	%edx, 0x158(%esi)
  44445b: e9 81 00 00 00               	jmp	0x4444e1 <.text+0x434e1>
  444460: 8b 86 c4 02 00 00            	movl	0x2c4(%esi), %eax
  444466: db 46 6c                     	fildl	0x6c(%esi)
  444469: 3b c7                        	cmpl	%edi, %eax
  44446b: 74 14                        	je	0x444481 <.text+0x43481>
  44446d: d9 5d fc                     	fstps	-0x4(%ebp)
  444470: d9 45 fc                     	flds	-0x4(%ebp)
  444473: d8 8e a4 04 00 00            	fmuls	0x4a4(%esi)
  444479: d8 0d cc b8 63 00            	fmuls	0x63b8cc
  44447f: eb 0c                        	jmp	0x44448d <.text+0x4348d>
  444481: d9 5d fc                     	fstps	-0x4(%ebp)
  444484: d9 45 fc                     	flds	-0x4(%ebp)
  444487: d8 8e a4 04 00 00            	fmuls	0x4a4(%esi)
  44448d: d8 05 c8 b8 63 00            	fadds	0x63b8c8
  444493: e8 fc 3a 1d 00               	calll	0x617f94 <.text+0x216f94>
  444498: 8b 4e 58                     	movl	0x58(%esi), %ecx
  44449b: 89 86 c0 00 00 00            	movl	%eax, 0xc0(%esi)
  4444a1: 48                           	decl	%eax
  4444a2: 89 4d f8                     	movl	%ecx, -0x8(%ebp)
  4444a5: 89 45 fc                     	movl	%eax, -0x4(%ebp)
  4444a8: 3b c1                        	cmpl	%ecx, %eax
  4444aa: 8d 45 fc                     	leal	-0x4(%ebp), %eax
  4444ad: 7c 03                        	jl	0x4444b2 <.text+0x434b2>
  4444af: 8d 45 f8                     	leal	-0x8(%ebp), %eax
  4444b2: 8b 00                        	movl	(%eax), %eax
  4444b4: 89 46 58                     	movl	%eax, 0x58(%esi)
  4444b7: eb 28                        	jmp	0x4444e1 <.text+0x434e1>
  4444b9: 8b 8e d4 04 00 00            	movl	0x4d4(%esi), %ecx
  4444bf: 8b 96 c8 00 00 00            	movl	0xc8(%esi), %edx
  4444c5: 8b 86 cc 00 00 00            	movl	0xcc(%esi), %eax
  4444cb: 03 d1                        	addl	%ecx, %edx
  4444cd: 89 96 c8 00 00 00            	movl	%edx, 0xc8(%esi)
  4444d3: 8b 96 d0 04 00 00            	movl	0x4d0(%esi), %edx
  4444d9: 03 c2                        	addl	%edx, %eax
  4444db: 89 86 cc 00 00 00            	movl	%eax, 0xcc(%esi)
  4444e1: 8d 8e 34 04 00 00            	leal	0x434(%esi), %ecx
  4444e7: 8b c1                        	movl	%ecx, %eax
  4444e9: 8b 10                        	movl	(%eax), %edx
  4444eb: 89 55 e8                     	movl	%edx, -0x18(%ebp)
  4444ee: 8b 50 04                     	movl	0x4(%eax), %edx
  4444f1: 89 55 ec                     	movl	%edx, -0x14(%ebp)
  4444f4: 8b 50 08                     	movl	0x8(%eax), %edx
  4444f7: 89 55 f0                     	movl	%edx, -0x10(%ebp)
  4444fa: 8b 40 0c                     	movl	0xc(%eax), %eax
  4444fd: 89 45 f4                     	movl	%eax, -0xc(%ebp)
  444500: 8d 86 24 04 00 00            	leal	0x424(%esi), %eax
  444506: 8b 9e 24 04 00 00            	movl	0x424(%esi), %ebx
  44450c: 8b 78 04                     	movl	0x4(%eax), %edi
  44450f: 89 7d dc                     	movl	%edi, -0x24(%ebp)
  444512: 8b 78 08                     	movl	0x8(%eax), %edi
  444515: 3b fa                        	cmpl	%edx, %edi
  444517: 8b 40 0c                     	movl	0xc(%eax), %eax
  44451a: 89 45 e4                     	movl	%eax, -0x1c(%ebp)
  44451d: 74 2a                        	je	0x444549 <.text+0x43549>
  44451f: 8b 55 08                     	movl	0x8(%ebp), %edx
  444522: 39 17                        	cmpl	%edx, (%edi)
  444524: 74 20                        	je	0x444546 <.text+0x43546>
  444526: 8b 55 dc                     	movl	-0x24(%ebp), %edx
  444529: 83 c7 04                     	addl	$0x4, %edi
  44452c: 3b fa                        	cmpl	%edx, %edi
  44452e: 75 11                        	jne	0x444541 <.text+0x43541>
  444530: 8b 58 04                     	movl	0x4(%eax), %ebx
  444533: 83 c0 04                     	addl	$0x4, %eax
  444536: 8b fb                        	movl	%ebx, %edi
  444538: 8d 93 00 10 00 00            	leal	0x1000(%ebx), %edx
  44453e: 89 55 dc                     	movl	%edx, -0x24(%ebp)
  444541: 3b 7d f0                     	cmpl	-0x10(%ebp), %edi
  444544: 75 d9                        	jne	0x44451f <.text+0x4351f>
  444546: 89 45 e4                     	movl	%eax, -0x1c(%ebp)
  444549: 8b 11                        	movl	(%ecx), %edx
  44454b: 89 55 e8                     	movl	%edx, -0x18(%ebp)
  44454e: 8b 51 04                     	movl	0x4(%ecx), %edx
  444551: 89 55 ec                     	movl	%edx, -0x14(%ebp)
  444554: 8b 51 08                     	movl	0x8(%ecx), %edx
  444557: 8b 49 0c                     	movl	0xc(%ecx), %ecx
  44455a: 3b fa                        	cmpl	%edx, %edi
  44455c: 89 4d f4                     	movl	%ecx, -0xc(%ebp)
  44455f: 74 5a                        	je	0x4445bb <.text+0x435bb>
  444561: 8b 55 dc                     	movl	-0x24(%ebp), %edx
  444564: 6a 01                        	pushl	$0x1
  444566: 8d 4d e8                     	leal	-0x18(%ebp), %ecx
  444569: 89 5d e8                     	movl	%ebx, -0x18(%ebp)
  44456c: 89 55 ec                     	movl	%edx, -0x14(%ebp)
  44456f: 89 7d f0                     	movl	%edi, -0x10(%ebp)
  444572: 89 45 f4                     	movl	%eax, -0xc(%ebp)
  444575: e8 16 49 00 00               	calll	0x448e90 <.text+0x47e90>
  44457a: 8b 4d e8                     	movl	-0x18(%ebp), %ecx
  44457d: 8b 55 ec                     	movl	-0x14(%ebp), %edx
  444580: 83 ec 10                     	subl	$0x10, %esp
  444583: 8b c4                        	movl	%esp, %eax
  444585: 83 ec 10                     	subl	$0x10, %esp
  444588: 89 08                        	movl	%ecx, (%eax)
  44458a: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  44458d: 89 50 04                     	movl	%edx, 0x4(%eax)
  444590: 8b 55 f4                     	movl	-0xc(%ebp), %edx
  444593: 89 48 08                     	movl	%ecx, 0x8(%eax)
  444596: 8b 4d dc                     	movl	-0x24(%ebp), %ecx
  444599: 89 50 0c                     	movl	%edx, 0xc(%eax)
  44459c: 8b c4                        	movl	%esp, %eax
  44459e: 8b 55 e4                     	movl	-0x1c(%ebp), %edx
  4445a1: 89 18                        	movl	%ebx, (%eax)
  4445a3: 89 48 04                     	movl	%ecx, 0x4(%eax)
  4445a6: 8d 8e 20 04 00 00            	leal	0x420(%esi), %ecx
  4445ac: 89 78 08                     	movl	%edi, 0x8(%eax)
  4445af: 89 50 0c                     	movl	%edx, 0xc(%eax)
  4445b2: 8d 45 c8                     	leal	-0x38(%ebp), %eax
  4445b5: 50                           	pushl	%eax
  4445b6: e8 c5 44 00 00               	calll	0x448a80 <.text+0x47a80>
  4445bb: 5f                           	popl	%edi
  4445bc: 5e                           	popl	%esi
  4445bd: 5b                           	popl	%ebx
  4445be: 8b e5                        	movl	%ebp, %esp
