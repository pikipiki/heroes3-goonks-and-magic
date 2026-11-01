  4ea800: 55                           	pushl	%ebp
  4ea801: 8b ec                        	movl	%esp, %ebp
  4ea803: 6a ff                        	pushl	$-0x1
  4ea805: 68 58 da 62 00               	pushl	$0x62da58               # imm = 0x62DA58
  4ea80a: 64 a1 00 00 00 00            	movl	%fs:0x0, %eax
  4ea810: 50                           	pushl	%eax
  4ea811: 64 89 25 00 00 00 00         	movl	%esp, %fs:0x0
  4ea818: 51                           	pushl	%ecx
  4ea819: 8b 45 30                     	movl	0x30(%ebp), %eax
  4ea81c: 8b 55 14                     	movl	0x14(%ebp), %edx
  4ea81f: 56                           	pushl	%esi
  4ea820: 8b f1                        	movl	%ecx, %esi
  4ea822: 8b 4d 18                     	movl	0x18(%ebp), %ecx
  4ea825: 50                           	pushl	%eax
  4ea826: 8b 45 10                     	movl	0x10(%ebp), %eax
  4ea829: 51                           	pushl	%ecx
  4ea82a: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  4ea82d: 52                           	pushl	%edx
  4ea82e: 8b 55 08                     	movl	0x8(%ebp), %edx
  4ea831: 50                           	pushl	%eax
  4ea832: 51                           	pushl	%ecx
  4ea833: 52                           	pushl	%edx
  4ea834: 8b ce                        	movl	%esi, %ecx
  4ea836: 89 75 f0                     	movl	%esi, -0x10(%ebp)
  4ea839: e8 c2 40 11 00               	calll	0x5fe900 <.text+0x1fd900>
  4ea83e: 8b 4d 20                     	movl	0x20(%ebp), %ecx
  4ea841: 8b 55 24                     	movl	0x24(%ebp), %edx
  4ea844: 89 4e 34                     	movl	%ecx, 0x34(%esi)
  4ea847: 8a 4d 28                     	movb	0x28(%ebp), %cl
  4ea84a: 88 4e 3c                     	movb	%cl, 0x3c(%esi)
  4ea84d: 8b 4d 1c                     	movl	0x1c(%ebp), %ecx
  4ea850: 33 c0                        	xorl	%eax, %eax
  4ea852: 89 56 38                     	movl	%edx, 0x38(%esi)
  4ea855: 66 8b 55 2c                  	movw	0x2c(%ebp), %dx
  4ea859: 3b c8                        	cmpl	%eax, %ecx
  4ea85b: 89 45 fc                     	movl	%eax, -0x4(%ebp)
  4ea85e: c7 46 40 02 00 00 00         	movl	$0x2, 0x40(%esi)
  5d5ac0: 68 10 c4 68 00               	pushl	$0x68c410               # imm = 0x68C410
  5d5ac5: 6a 01                        	pushl	$0x1
  5d5ac7: 51                           	pushl	%ecx
  5d5ac8: 52                           	pushl	%edx
  5d5ac9: 6a 00                        	pushl	$0x0
  5d5acb: 6a 00                        	pushl	$0x0
  5d5acd: 8b c8                        	movl	%eax, %ecx
  5d5acf: e8 cc a4 e7 ff               	calll	0x44ffa0 <.text+0x4efa0>
  5d5ad4: eb 02                        	jmp	0x5d5ad8 <.text+0x1d4ad8>
  5d5ad6: 33 c0                        	xorl	%eax, %eax
  5d5ad8: 8d 4d 0c                     	leal	0xc(%ebp), %ecx
  5d5adb: 89 45 0c                     	movl	%eax, 0xc(%ebp)
  5d5ade: 8b 46 08                     	movl	0x8(%esi), %eax
  5d5ae1: 51                           	pushl	%ecx
  5d5ae2: 6a 01                        	pushl	$0x1
  5d5ae4: 50                           	pushl	%eax
  5d5ae5: 8b ce                        	movl	%esi, %ecx
  5d5ae7: c6 45 fc 00                  	movb	$0x0, -0x4(%ebp)
  5d5aeb: e8 e0 87 02 00               	calll	0x5fe2d0 <.text+0x1fd2d0>
  5d5af0: 6a 48                        	pushl	$0x48
  5d5af2: e8 9b 19 04 00               	calll	0x617492 <.text+0x216492>
  5d5af7: 83 c4 04                     	addl	$0x4, %esp
  5d5afa: 89 45 08                     	movl	%eax, 0x8(%ebp)
  5d5afd: 85 c0                        	testl	%eax, %eax
  5d5aff: c6 45 fc 02                  	movb	$0x2, -0x4(%ebp)
  5d5b03: 74 37                        	je	0x5d5b3c <.text+0x1d4b3c>
  5d5b05: 8b 53 64                     	movl	0x64(%ebx), %edx
  5d5b08: 8b 0d 4c 95 69 00            	movl	0x69954c, %ecx
  5d5b0e: 6a 10                        	pushl	$0x10
  5d5b10: 6a 00                        	pushl	$0x0
  5d5b12: 6a 00                        	pushl	$0x0
  5d5b14: 6a 00                        	pushl	$0x0
  5d5b16: 52                           	pushl	%edx
  5d5b17: 8b 51 38                     	movl	0x38(%ecx), %edx
  5d5b1a: 0f be 4a 04                  	movsbl	0x4(%edx), %ecx
  5d5b1e: 8b 14 8d d4 f5 67 00         	movl	0x67f5d4(,%ecx,4), %edx
  5d5b25: 8b c8                        	movl	%eax, %ecx
  5d5b27: 52                           	pushl	%edx
  5d5b28: 6a 02                        	pushl	$0x2
  5d5b2a: 6a 46                        	pushl	$0x46
  5d5b2c: 68 96 00 00 00               	pushl	$0x96
  5d5b31: 6a 31                        	pushl	$0x31
  5d5b33: 6a 7c                        	pushl	$0x7c
  5d5b35: e8 c6 4c f1 ff               	calll	0x4ea800 <.text+0xe9800>
  5d5b3a: eb 02                        	jmp	0x5d5b3e <.text+0x1d4b3e>
  5d5b3c: 33 c0                        	xorl	%eax, %eax
  5d5b3e: 8d 4d 0c                     	leal	0xc(%ebp), %ecx
  5d5b41: 89 45 0c                     	movl	%eax, 0xc(%ebp)
  5d5b44: 8b 46 08                     	movl	0x8(%esi), %eax
  5d5b47: 51                           	pushl	%ecx
  5d5b48: 6a 01                        	pushl	$0x1
  5d5b4a: 50                           	pushl	%eax
  5d5b4b: 8b ce                        	movl	%esi, %ecx
  5d5b4d: c6 45 fc 00                  	movb	$0x0, -0x4(%ebp)
  5d5b51: e8 7a 87 02 00               	calll	0x5fe2d0 <.text+0x1fd2d0>
  5d5b56: 8b 15 c4 5d 6a 00            	movl	0x6a5dc4, %edx
  5d5b5c: 8b 42 20                     	movl	0x20(%edx), %eax
  5d5b5f: 8b 53 64                     	movl	0x64(%ebx), %edx
  5d5b62: 8b b8 50 09 00 00            	movl	0x950(%eax), %edi
  5d5b68: a1 4c 95 69 00               	movl	0x69954c, %eax
  5d5b6d: 8b 48 38                     	movl	0x38(%eax), %ecx
  5d5b70: 0f be 49 04                  	movsbl	0x4(%ecx), %ecx
  5d5b74: e8 47 b1 e8 ff               	calll	0x460cc0 <.text+0x5fcc0>
  5d5b79: 50                           	pushl	%eax
  5d5b7a: 57                           	pushl	%edi
  5d5b7b: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  5d5b80: e8 59 1e 04 00               	calll	0x6179de <.text+0x2169de>
  5d5b85: 6a 50                        	pushl	$0x50
  5d5b87: e8 06 19 04 00               	calll	0x617492 <.text+0x216492>
  5d5b8c: 83 c4 10                     	addl	$0x10, %esp
  5d5b8f: 89 45 08                     	movl	%eax, 0x8(%ebp)
