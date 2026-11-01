  43f77b: 8b 0c 8d 18 1e 64 00         	movl	0x641e18(,%ecx,4), %ecx
  43f782: e8 39 d2 11 00               	calll	0x55c9c0 <.text+0x15b9c0>
  43f787: 8b d8                        	movl	%eax, %ebx
  43f789: 8b 47 38                     	movl	0x38(%edi), %eax
  43f78c: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  43f793: 2b d0                        	subl	%eax, %edx
  43f795: a1 20 94 69 00               	movl	0x699420, %eax
  43f79a: c1 e2 04                     	shll	$0x4, %edx
  43f79d: 03 c2                        	addl	%edx, %eax
  43f79f: 89 45 08                     	movl	%eax, 0x8(%ebp)
  43f7a2: 0f bf 88 c4 01 00 00         	movswl	0x1c4(%eax), %ecx
  43f7a9: f6 87 84 00 00 00 01         	testb	$0x1, 0x84(%edi)
  43f7b0: 74 0f                        	je	0x43f7c1 <.text+0x3e7c1>
  43f7b2: 8b 57 44                     	movl	0x44(%edi), %edx
  43f7b5: f7 da                        	negl	%edx
  43f7b7: 1b d2                        	sbbl	%edx, %edx
  43f7b9: 83 e2 2c                     	andl	$0x2c, %edx
  43f7bc: 83 c2 ea                     	addl	$-0x16, %edx
  43f7bf: 03 ca                        	addl	%edx, %ecx
  43f7c1: 8b 43 30                     	movl	0x30(%ebx), %eax
  43f7c4: 99                           	cltd
  43f7c5: 2b c2                        	subl	%edx, %eax
  43f7c7: d1 f8                        	sarl	%eax
  43f7c9: 2b c8                        	subl	%eax, %ecx
  43f7cb: 8b 45 08                     	movl	0x8(%ebp), %eax
  43f7ce: 89 4d f0                     	movl	%ecx, -0x10(%ebp)
  43f7d1: 0f bf 88 c6 01 00 00         	movswl	0x1c6(%eax), %ecx
  43f7d8: 8b 87 6c 01 00 00            	movl	0x16c(%edi), %eax
  43f7de: 99                           	cltd
  43f7df: 2b c2                        	subl	%edx, %eax
  43f7e1: d1 f8                        	sarl	%eax
  43f7e3: 2b c8                        	subl	%eax, %ecx
  43f7e5: 8b 43 34                     	movl	0x34(%ebx), %eax
  43f7e8: 99                           	cltd
  43f7e9: 2b c2                        	subl	%edx, %eax
  43f7eb: d1 f8                        	sarl	%eax
  43f7ed: 2b c8                        	subl	%eax, %ecx
  43f7ef: 33 ff                        	xorl	%edi, %edi
  43f7f1: 89 4d 08                     	movl	%ecx, 0x8(%ebp)
  43f7f4: 8b 43 28                     	movl	0x28(%ebx), %eax
  43f7f7: 85 c0                        	testl	%eax, %eax
  43f7f9: 7e 11                        	jle	0x43f80c <.text+0x3e80c>
  43f7fb: 8b 4b 2c                     	movl	0x2c(%ebx), %ecx
  43f7fe: 83 39 00                     	cmpl	$0x0, (%ecx)
  43f801: 74 09                        	je	0x43f80c <.text+0x3e80c>
  43f803: 8b 53 1c                     	movl	0x1c(%ebx), %edx
  43f806: 8b 02                        	movl	(%edx), %eax
  43f808: 8b 00                        	movl	(%eax), %eax
  43f80a: eb 02                        	jmp	0x43f80e <.text+0x3e80e>
  43f80c: 33 c0                        	xorl	%eax, %eax
  43f80e: 3b f8                        	cmpl	%eax, %edi
  43f810: 7d 3e                        	jge	0x43f850 <.text+0x3e850>
  43f812: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  43f818: 6a 01                        	pushl	$0x1
  43f81a: 6a 01                        	pushl	$0x1
  43f81c: 6a 32                        	pushl	$0x32
  43f81e: 6a 00                        	pushl	$0x0
  43f820: 6a 00                        	pushl	$0x0
  43f822: 6a 00                        	pushl	$0x0
  43f824: e8 97 47 05 00               	calll	0x493fc0 <.text+0x92fc0>
  43f829: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  43f82c: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  43f82f: 6a 00                        	pushl	$0x0
  43f831: 6a 00                        	pushl	$0x0
  43f833: 51                           	pushl	%ecx
  43f834: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  43f83a: 52                           	pushl	%edx
  43f83b: 57                           	pushl	%edi
  43f83c: 53                           	pushl	%ebx
  43f83d: e8 ee 56 05 00               	calll	0x494f30 <.text+0x93f30>
  43f842: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  43f848: e8 b3 3a 05 00               	calll	0x493300 <.text+0x92300>
  43f84d: 47                           	incl	%edi
  43f84e: eb a4                        	jmp	0x43f7f4 <.text+0x3e7f4>
  43f850: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  43f856: 6a 00                        	pushl	$0x0
  43f858: 6a 01                        	pushl	$0x1
  43f85a: 6a 00                        	pushl	$0x0
  43f85c: 6a 00                        	pushl	$0x0
  43f85e: 6a 00                        	pushl	$0x0
  43f860: 6a 01                        	pushl	$0x1
  43f862: e8 59 47 05 00               	calll	0x493fc0 <.text+0x92fc0>
  43f867: 8b 03                        	movl	(%ebx), %eax
  43f869: 8b cb                        	movl	%ebx, %ecx
  43f86b: ff 50 04                     	calll	*0x4(%eax)
  43f86e: 33 db                        	xorl	%ebx, %ebx
  43f870: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  43f876: e8 45 71 16 00               	calll	0x5a69c0 <.text+0x1a59c0>
  43f87b: 33 ff                        	xorl	%edi, %edi
  43f936: e8 45 35 00 00               	calll	0x442e80 <.text+0x41e80>
  43f93b: 8b 8e 90 04 00 00            	movl	0x490(%esi), %ecx
  43f941: 8d 55 e8                     	leal	-0x18(%ebp), %edx
  43f944: 52                           	pushl	%edx
  43f945: 51                           	pushl	%ecx
  43f946: 6a 00                        	pushl	$0x0
  43f948: 6a 01                        	pushl	$0x1
  43f94a: 50                           	pushl	%eax
  43f94b: 57                           	pushl	%edi
  43f94c: 8b ce                        	movl	%esi, %ecx
  43f94e: e8 0d 43 00 00               	calll	0x443c60 <.text+0x42c60>
  43f953: 8b d8                        	movl	%eax, %ebx
  43f955: 8b cf                        	movl	%edi, %ecx
  43f957: 53                           	pushl	%ebx
  43f958: 89 5d e4                     	movl	%ebx, -0x1c(%ebp)
  43f95b: e8 50 44 00 00               	calll	0x443db0 <.text+0x42db0>
  43f960: 89 45 e0                     	movl	%eax, -0x20(%ebp)
  43fa38: 6a 00                        	pushl	$0x0
  43fa3a: 8b ce                        	movl	%esi, %ecx
  43fa3c: e8 3f 34 00 00               	calll	0x442e80 <.text+0x41e80>
  43fa41: 8b 96 90 04 00 00            	movl	0x490(%esi), %edx
  43fa47: 8d 4d 08                     	leal	0x8(%ebp), %ecx
  43fa4a: 51                           	pushl	%ecx
  43fa4b: 52                           	pushl	%edx
  43fa4c: 6a 00                        	pushl	$0x0
  43fa4e: 6a 01                        	pushl	$0x1
  43fa50: 50                           	pushl	%eax
  43fa51: 57                           	pushl	%edi
  43fa52: 8b ce                        	movl	%esi, %ecx
  43fa54: e8 07 42 00 00               	calll	0x443c60 <.text+0x42c60>
  43fa59: 8b d8                        	movl	%eax, %ebx
  43fa5b: 8b cf                        	movl	%edi, %ecx
  43fa5d: 53                           	pushl	%ebx
  43fa5e: e8 4d 43 00 00               	calll	0x443db0 <.text+0x42db0>
  43fa63: 89 45 08                     	movl	%eax, 0x8(%ebp)
  43fa66: c7 46 70 00 00 00 00         	movl	$0x0, 0x70(%esi)
  43fa6d: eb 03                        	jmp	0x43fa72 <.text+0x3ea72>
  43fa6f: 8b 5d 08                     	movl	0x8(%ebp), %ebx
  43fa72: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  43fa78: 6a 00                        	pushl	$0x0
  43fa7a: 6a ff                        	pushl	$-0x1
  43fa7c: e8 ef 8a 02 00               	calll	0x468570 <.text+0x67570>
