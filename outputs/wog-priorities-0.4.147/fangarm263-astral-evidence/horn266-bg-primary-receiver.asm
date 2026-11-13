
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  75c780: 45                           	incl	%ebp
  75c781: ec                           	inb	%dx, %al
  75c782: 8b 4d d0                     	movl	-0x30(%ebp), %ecx
  75c785: 89 4d f0                     	movl	%ecx, -0x10(%ebp)
  75c788: 83 7d ec 00                  	cmpl	$0x0, -0x14(%ebp)
  75c78c: 74 17                        	je	0x75c7a5 <.text+0x5b7a5>
  75c78e: 68 8e 00 00 00               	pushl	$0x8e
  75c793: 8b 55 ec                     	movl	-0x14(%ebp), %edx
  75c796: 52                           	pushl	%edx
  75c797: e8 08 81 fb ff               	calll	0x7148a4 <.text+0x138a4>
  75c79c: 83 c4 08                     	addl	$0x8, %esp
  75c79f: 85 c0                        	testl	%eax, %eax
  75c7a1: 74 02                        	je	0x75c7a5 <.text+0x5b7a5>
  75c7a3: eb 6e                        	jmp	0x75c813 <.text+0x5b813>
  75c7a5: 83 7d f0 00                  	cmpl	$0x0, -0x10(%ebp)
  75c7a9: 74 68                        	je	0x75c813 <.text+0x5b813>
  75c7ab: 68 8e 00 00 00               	pushl	$0x8e
  75c7b0: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  75c7b3: 50                           	pushl	%eax
  75c7b4: e8 eb 80 fb ff               	calll	0x7148a4 <.text+0x138a4>
  75c7b9: 83 c4 08                     	addl	$0x8, %esp
  75c7bc: 85 c0                        	testl	%eax, %eax
  75c7be: 74 53                        	je	0x75c813 <.text+0x5b813>
  75c7c0: 8b 4d e0                     	movl	-0x20(%ebp), %ecx
  75c7c3: c7 01 03 00 00 00            	movl	$0x3, (%ecx)
  75c7c9: 8b 15 ac 25 83 02            	movl	0x28325ac, %edx
  75c7cf: 52                           	pushl	%edx
  75c7d0: e8 d4 e7 ff ff               	calll	0x75afa9 <.text+0x59fa9>
  75c7d5: 83 c4 04                     	addl	$0x4, %esp
  75c7d8: 0f be c0                     	movsbl	%al, %eax
  75c7db: 85 c0                        	testl	%eax, %eax
  75c7dd: 75 34                        	jne	0x75c813 <.text+0x5b813>
  75c7df: 83 3d 20 6a 84 02 00         	cmpl	$0x0, 0x2846a20
  75c7e6: 74 2b                        	je	0x75c813 <.text+0x5b813>
  75c7e8: 6a 00                        	pushl	$0x0
  75c7ea: 6a 01                        	pushl	$0x1
  75c7ec: 68 3c 8e 7c 00               	pushl	$0x7c8e3c               # imm = 0x7C8E3C
  75c7f1: 6a 00                        	pushl	$0x0
  75c7f3: 68 c0 00 00 00               	pushl	$0xc0
  75c7f8: e8 0e a9 01 00               	calll	0x77710b <.text+0x7610b>
  75c7fd: 83 c4 0c                     	addl	$0xc, %esp
  75c800: 50                           	pushl	%eax
  75c801: e8 5d 33 fb ff               	calll	0x70fb63 <.text+0xeb63>
  75c806: 83 c4 0c                     	addl	$0xc, %esp
  75c809: c7 05 20 6a 84 02 00 00 00 00	movl	$0x0, 0x2846a20
  75c813: 81 7d d4 a0 00 00 00         	cmpl	$0xa0, -0x2c(%ebp)
  75c81a: 7c 09                        	jl	0x75c825 <.text+0x5b825>
  75c81c: 81 7d d4 a4 00 00 00         	cmpl	$0xa4, -0x2c(%ebp)
  75c823: 7c 1f                        	jl	0x75c844 <.text+0x5b844>
  75c825: 81 7d d4 93 00 00 00         	cmpl	$0x93, -0x2c(%ebp)
  75c82c: 75 11                        	jne	0x75c83f <.text+0x5b83f>
  75c82e: 8b 4d e0                     	movl	-0x20(%ebp), %ecx
  75c831: 83 39 0b                     	cmpl	$0xb, (%ecx)
  75c834: 74 09                        	je	0x75c83f <.text+0x5b83f>
  75c836: 8b 55 e0                     	movl	-0x20(%ebp), %edx
  75c839: c7 02 03 00 00 00            	movl	$0x3, (%edx)
  75c83f: e9 28 01 00 00               	jmp	0x75c96c <.text+0x5b96c>
  75c844: a1 ac 25 83 02               	movl	0x28325ac, %eax
  75c849: 50                           	pushl	%eax
  75c84a: e8 5a e7 ff ff               	calll	0x75afa9 <.text+0x59fa9>
  75c84f: 83 c4 04                     	addl	$0x4, %esp
  75c852: 0f be c8                     	movsbl	%al, %ecx
  75c855: 85 c9                        	testl	%ecx, %ecx
  75c857: 74 0e                        	je	0x75c867 <.text+0x5b867>
  75c859: 8b 55 e0                     	movl	-0x20(%ebp), %edx
  75c85c: c7 02 03 00 00 00            	movl	$0x3, (%edx)
  75c862: e9 05 01 00 00               	jmp	0x75c96c <.text+0x5b96c>
  75c867: 8b 45 e0                     	movl	-0x20(%ebp), %eax
  75c86a: 83 38 06                     	cmpl	$0x6, (%eax)
  75c86d: 74 0a                        	je	0x75c879 <.text+0x5b879>
  75c86f: 90                           	nop
  75c870: 90                           	nop
  75c871: 90                           	nop
  75c872: 90                           	nop
  75c873: 90                           	nop
  75c874: e9 bd 02 00 00               	jmp	0x75cb36 <.text+0x5bb36>
  75c879: 83 3d 10 27 83 02 00         	cmpl	$0x0, 0x2832710
  75c880: 74 28                        	je	0x75c8aa <.text+0x5b8aa>
  75c882: 6a 00                        	pushl	$0x0
  75c884: 6a 01                        	pushl	$0x1
  75c886: 68 3c 8e 7c 00               	pushl	$0x7c8e3c               # imm = 0x7C8E3C
  75c88b: 6a 00                        	pushl	$0x0
  75c88d: 6a 3b                        	pushl	$0x3b
  75c88f: e8 77 a8 01 00               	calll	0x77710b <.text+0x7610b>
  75c894: 83 c4 0c                     	addl	$0xc, %esp
  75c897: 50                           	pushl	%eax
  75c898: e8 c6 32 fb ff               	calll	0x70fb63 <.text+0xeb63>
  75c89d: 83 c4 0c                     	addl	$0xc, %esp
  75c8a0: c7 05 10 27 83 02 00 00 00 00	movl	$0x0, 0x2832710
  75c8aa: 8d 4d f8                     	leal	-0x8(%ebp), %ecx
  75c8ad: 51                           	pushl	%ecx
  75c8ae: 8d 55 f4                     	leal	-0xc(%ebp), %edx
  75c8b1: 52                           	pushl	%edx
  75c8b2: 8b 45 d8                     	movl	-0x28(%ebp), %eax
  75c8b5: 50                           	pushl	%eax
  75c8b6: e8 25 e7 ff ff               	calll	0x75afe0 <.text+0x59fe0>
  75c8bb: 83 c4 0c                     	addl	$0xc, %esp
  75c8be: 85 c0                        	testl	%eax, %eax
  75c8c0: 74 0a                        	je	0x75c8cc <.text+0x5b8cc>
  75c8c2: 90                           	nop
  75c8c3: 90                           	nop
  75c8c4: 90                           	nop
  75c8c5: 90                           	nop
  75c8c6: 90                           	nop
  75c8c7: e9 6a 02 00 00               	jmp	0x75cb36 <.text+0x5bb36>
  75c8cc: 8d 4d e8                     	leal	-0x18(%ebp), %ecx
  75c8cf: 51                           	pushl	%ecx
  75c8d0: 8d 55 dc                     	leal	-0x24(%ebp), %edx
  75c8d3: 52                           	pushl	%edx
  75c8d4: 8b 45 e4                     	movl	-0x1c(%ebp), %eax
  75c8d7: 8b 08                        	movl	(%eax), %ecx
  75c8d9: 51                           	pushl	%ecx
  75c8da: e8 01 e7 ff ff               	calll	0x75afe0 <.text+0x59fe0>
  75c8df: 83 c4 0c                     	addl	$0xc, %esp
  75c8e2: 85 c0                        	testl	%eax, %eax
  75c8e4: 74 0a                        	je	0x75c8f0 <.text+0x5b8f0>
  75c8e6: 90                           	nop
  75c8e7: 90                           	nop
  75c8e8: 90                           	nop
  75c8e9: 90                           	nop
  75c8ea: 90                           	nop
  75c8eb: e9 46 02 00 00               	jmp	0x75cb36 <.text+0x5bb36>
  75c8f0: 8b 55 f8                     	movl	-0x8(%ebp), %edx
  75c8f3: 3b 55 e8                     	cmpl	-0x18(%ebp), %edx
  75c8f6: 75 1e                        	jne	0x75c916 <.text+0x5b916>
  75c8f8: 8b 45 f4                     	movl	-0xc(%ebp), %eax
  75c8fb: 3b 45 dc                     	cmpl	-0x24(%ebp), %eax
  75c8fe: 7e 0b                        	jle	0x75c90b <.text+0x5b90b>
  75c900: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
  75c903: 83 c1 02                     	addl	$0x2, %ecx
  75c906: 89 4d f4                     	movl	%ecx, -0xc(%ebp)
  75c909: eb 09                        	jmp	0x75c914 <.text+0x5b914>
  75c90b: 8b 55 f4                     	movl	-0xc(%ebp), %edx
  75c90e: 83 ea 02                     	subl	$0x2, %edx
  75c911: 89 55 f4                     	movl	%edx, -0xc(%ebp)
  75c914: eb 38                        	jmp	0x75c94e <.text+0x5b94e>
  75c916: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  75c919: 3b 45 e8                     	cmpl	-0x18(%ebp), %eax
  75c91c: 7e 0b                        	jle	0x75c929 <.text+0x5b929>
  75c91e: 8b 4d f8                     	movl	-0x8(%ebp), %ecx
  75c921: 83 c1 01                     	addl	$0x1, %ecx
  75c924: 89 4d f8                     	movl	%ecx, -0x8(%ebp)
  75c927: eb 09                        	jmp	0x75c932 <.text+0x5b932>
  75c929: 8b 55 f8                     	movl	-0x8(%ebp), %edx
  75c92c: 83 ea 01                     	subl	$0x1, %edx
  75c92f: 89 55 f8                     	movl	%edx, -0x8(%ebp)
  75c932: 8b 45 f4                     	movl	-0xc(%ebp), %eax
  75c935: 3b 45 dc                     	cmpl	-0x24(%ebp), %eax
  75c938: 7e 0b                        	jle	0x75c945 <.text+0x5b945>
  75c93a: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
  75c93d: 83 c1 01                     	addl	$0x1, %ecx
  75c940: 89 4d f4                     	movl	%ecx, -0xc(%ebp)
  75c943: eb 09                        	jmp	0x75c94e <.text+0x5b94e>
  75c945: 8b 55 f4                     	movl	-0xc(%ebp), %edx
  75c948: 83 ea 01                     	subl	$0x1, %edx
  75c94b: 89 55 f4                     	movl	%edx, -0xc(%ebp)
  75c94e: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  75c951: 50                           	pushl	%eax
  75c952: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
  75c955: 51                           	pushl	%ecx
  75c956: e8 12 e7 ff ff               	calll	0x75b06d <.text+0x5a06d>
  75c95b: 83 c4 08                     	addl	$0x8, %esp
  75c95e: 8b 55 e4                     	movl	-0x1c(%ebp), %edx
  75c961: 89 02                        	movl	%eax, (%edx)
  75c963: 8b 45 e0                     	movl	-0x20(%ebp), %eax
  75c966: c7 00 02 00 00 00            	movl	$0x2, (%eax)
  75c96c: 81 7d d4 c1 00 00 00         	cmpl	$0xc1, -0x2c(%ebp)
  75c973: 0f 85 c0 00 00 00            	jne	0x75ca39 <.text+0x5ba39>
  75c979: 8b 4d e0                     	movl	-0x20(%ebp), %ecx
  75c97c: 83 39 07                     	cmpl	$0x7, (%ecx)
  75c97f: 0f 85 b4 00 00 00            	jne	0x75ca39 <.text+0x5ba39>
  75c985: 8b 55 e4                     	movl	-0x1c(%ebp), %edx
  75c988: 8b 02                        	movl	(%edx), %eax
  75c98a: 50                           	pushl	%eax
  75c98b: e8 7d e8 ff ff               	calll	0x75b20d <.text+0x5a20d>
  75c990: 83 c4 04                     	addl	$0x4, %esp
  75c993: 89 45 b0                     	movl	%eax, -0x50(%ebp)
  75c996: 83 7d b0 00                  	cmpl	$0x0, -0x50(%ebp)
  75c99a: 75 05                        	jne	0x75c9a1 <.text+0x5b9a1>
  75c99c: e9 98 00 00 00               	jmp	0x75ca39 <.text+0x5ba39>
  75c9a1: 8b 4d b0                     	movl	-0x50(%ebp), %ecx
  75c9a4: 8b 91 f4 00 00 00            	movl	0xf4(%ecx), %edx
  75c9aa: 89 55 b8                     	movl	%edx, -0x48(%ebp)
  75c9ad: 83 7d b8 00                  	cmpl	$0x0, -0x48(%ebp)
  75c9b1: 74 0e                        	je	0x75c9c1 <.text+0x5b9c1>
  75c9b3: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  75c9b6: 89 45 b4                     	movl	%eax, -0x4c(%ebp)
  75c9b9: 8b 4d ec                     	movl	-0x14(%ebp), %ecx
  75c9bc: 89 4d bc                     	movl	%ecx, -0x44(%ebp)
  75c9bf: eb 0c                        	jmp	0x75c9cd <.text+0x5b9cd>
  75c9c1: 8b 55 ec                     	movl	-0x14(%ebp), %edx
  75c9c4: 89 55 b4                     	movl	%edx, -0x4c(%ebp)
  75c9c7: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  75c9ca: 89 45 bc                     	movl	%eax, -0x44(%ebp)
  75c9cd: 8b 0d 0c e6 82 02            	movl	0x282e60c, %ecx
  75c9d3: 8b 51 4c                     	movl	0x4c(%ecx), %edx
  75c9d6: 89 55 c8                     	movl	%edx, -0x38(%ebp)
  75c9d9: 83 7d c8 00                  	cmpl	$0x0, -0x38(%ebp)
  75c9dd: 7f 02                        	jg	0x75c9e1 <.text+0x5b9e1>
  75c9df: eb 58                        	jmp	0x75ca39 <.text+0x5ba39>
  75c9e1: 8b 45 c8                     	movl	-0x38(%ebp), %eax
  75c9e4: 8d 4c 00 14                  	leal	0x14(%eax,%eax), %ecx
  75c9e8: 89 4d c0                     	movl	%ecx, -0x40(%ebp)
  75c9eb: 6a 64                        	pushl	$0x64
  75c9ed: 6a 01                        	pushl	$0x1
  75c9ef: e8 15 3b fb ff               	calll	0x710509 <.text+0xf509>
  75c9f4: 83 c4 08                     	addl	$0x8, %esp
  75c9f7: 3b 45 c0                     	cmpl	-0x40(%ebp), %eax
  75c9fa: 7e 02                        	jle	0x75c9fe <.text+0x5b9fe>
  75c9fc: eb 3b                        	jmp	0x75ca39 <.text+0x5ba39>
  75c9fe: 6a 00                        	pushl	$0x0
  75ca00: 6a ff                        	pushl	$-0x1
  75ca02: 8b 55 b4                     	movl	-0x4c(%ebp), %edx
  75ca05: 52                           	pushl	%edx
  75ca06: 8b 45 bc                     	movl	-0x44(%ebp), %eax
  75ca09: 50                           	pushl	%eax
  75ca0a: 8b 4d b0                     	movl	-0x50(%ebp), %ecx
  75ca0d: 51                           	pushl	%ecx
  75ca0e: 8b 55 c8                     	movl	-0x38(%ebp), %edx
  75ca11: 52                           	pushl	%edx
  75ca12: e8 b3 ea ff ff               	calll	0x75b4ca <.text+0x5a4ca>
  75ca17: 83 c4 18                     	addl	$0x18, %esp
  75ca1a: 89 45 c4                     	movl	%eax, -0x3c(%ebp)
  75ca1d: 83 7d c4 ff                  	cmpl	$-0x1, -0x3c(%ebp)
  75ca21: 74 0c                        	je	0x75ca2f <.text+0x5ba2f>
  75ca23: 8b 45 b0                     	movl	-0x50(%ebp), %eax
  75ca26: 8b 4d c4                     	movl	-0x3c(%ebp), %ecx
  75ca29: 89 88 ec 00 00 00            	movl	%ecx, 0xec(%eax)
  75ca2f: 33 d2                        	xorl	%edx, %edx
  75ca31: 85 d2                        	testl	%edx, %edx
  75ca33: 0f 85 4c ff ff ff            	jne	0x75c985 <.text+0x5b985>
  75ca39: 81 7d d4 c3 00 00 00         	cmpl	$0xc3, -0x2c(%ebp)
  75ca40: 75 34                        	jne	0x75ca76 <.text+0x5ba76>
  75ca42: 8b 45 e0                     	movl	-0x20(%ebp), %eax
  75ca45: 83 38 06                     	cmpl	$0x6, (%eax)
  75ca48: 75 2c                        	jne	0x75ca76 <.text+0x5ba76>
  75ca4a: 8b 4d e4                     	movl	-0x1c(%ebp), %ecx
  75ca4d: 8b 11                        	movl	(%ecx), %edx
  75ca4f: 52                           	pushl	%edx
  75ca50: e8 b8 e7 ff ff               	calll	0x75b20d <.text+0x5a20d>
  75ca55: 83 c4 04                     	addl	$0x4, %esp
  75ca58: 89 45 ac                     	movl	%eax, -0x54(%ebp)
  75ca5b: 83 7d ac 00                  	cmpl	$0x0, -0x54(%ebp)
  75ca5f: 75 02                        	jne	0x75ca63 <.text+0x5ba63>
  75ca61: eb 13                        	jmp	0x75ca76 <.text+0x5ba76>
  75ca63: 8b 45 ac                     	movl	-0x54(%ebp), %eax
  75ca66: c7 80 ec 00 00 00 0d 00 00 00	movl	$0xd, 0xec(%eax)
  75ca70: 33 c9                        	xorl	%ecx, %ecx
  75ca72: 85 c9                        	testl	%ecx, %ecx
  75ca74: 75 d4                        	jne	0x75ca4a <.text+0x5ba4a>
  75ca76: 8b 55 e0                     	movl	-0x20(%ebp), %edx
  75ca79: 83 3a 07                     	cmpl	$0x7, (%edx)
  75ca7c: 74 0c                        	je	0x75ca8a <.text+0x5ba8a>
  75ca7e: 8b 45 e0                     	movl	-0x20(%ebp), %eax
  75ca81: 83 38 06                     	cmpl	$0x6, (%eax)
  75ca84: 0f 85 91 00 00 00            	jne	0x75cb1b <.text+0x5bb1b>
  75ca8a: 8b 4d e4                     	movl	-0x1c(%ebp), %ecx
  75ca8d: 8b 11                        	movl	(%ecx), %edx
  75ca8f: 52                           	pushl	%edx
  75ca90: e8 78 e7 ff ff               	calll	0x75b20d <.text+0x5a20d>
  75ca95: 83 c4 04                     	addl	$0x4, %esp
  75ca98: 89 45 98                     	movl	%eax, -0x68(%ebp)
  75ca9b: 83 7d 98 00                  	cmpl	$0x0, -0x68(%ebp)
  75ca9f: 75 02                        	jne	0x75caa3 <.text+0x5baa3>
  75caa1: eb 78                        	jmp	0x75cb1b <.text+0x5bb1b>
  75caa3: 8b 45 98                     	movl	-0x68(%ebp), %eax
  75caa6: 8b 88 f4 00 00 00            	movl	0xf4(%eax), %ecx
  75caac: 89 4d a0                     	movl	%ecx, -0x60(%ebp)
  75caaf: 83 7d a0 00                  	cmpl	$0x0, -0x60(%ebp)
  75cab3: 74 0e                        	je	0x75cac3 <.text+0x5bac3>
  75cab5: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  75cab8: 89 55 9c                     	movl	%edx, -0x64(%ebp)
  75cabb: 8b 45 ec                     	movl	-0x14(%ebp), %eax
  75cabe: 89 45 a4                     	movl	%eax, -0x5c(%ebp)
  75cac1: eb 0c                        	jmp	0x75cacf <.text+0x5bacf>
  75cac3: 8b 4d ec                     	movl	-0x14(%ebp), %ecx
  75cac6: 89 4d 9c                     	movl	%ecx, -0x64(%ebp)
  75cac9: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  75cacc: 89 55 a4                     	movl	%edx, -0x5c(%ebp)
  75cacf: 8b 45 9c                     	movl	-0x64(%ebp), %eax
  75cad2: 50                           	pushl	%eax
  75cad3: 8b 4d a4                     	movl	-0x5c(%ebp), %ecx
  75cad6: 51                           	pushl	%ecx
  75cad7: 8b 55 98                     	movl	-0x68(%ebp), %edx
  75cada: 52                           	pushl	%edx
  75cadb: a1 0c e6 82 02               	movl	0x282e60c, %eax
  75cae0: 50                           	pushl	%eax
  75cae1: e8 c3 0c fc ff               	calll	0x71d7a9 <.text+0x1c7a9>
  75cae6: 83 c4 10                     	addl	$0x10, %esp
  75cae9: 89 45 a8                     	movl	%eax, -0x58(%ebp)
  75caec: 83 7d a8 ff                  	cmpl	$-0x1, -0x58(%ebp)
  75caf0: 74 0c                        	je	0x75cafe <.text+0x5bafe>
  75caf2: 8b 4d 98                     	movl	-0x68(%ebp), %ecx
  75caf5: 8b 55 a8                     	movl	-0x58(%ebp), %edx
  75caf8: 89 91 ec 00 00 00            	movl	%edx, 0xec(%ecx)
  75cafe: 8b 45 98                     	movl	-0x68(%ebp), %eax
  75cb01: 50                           	pushl	%eax
  75cb02: 8b 0d 0c e6 82 02            	movl	0x282e60c, %ecx
  75cb08: 51                           	pushl	%ecx
  75cb09: e8 71 10 fc ff               	calll	0x71db7f <.text+0x1cb7f>
  75cb0e: 83 c4 08                     	addl	$0x8, %esp
  75cb11: 33 d2                        	xorl	%edx, %edx
  75cb13: 85 d2                        	testl	%edx, %edx
  75cb15: 0f 85 6f ff ff ff            	jne	0x75ca8a <.text+0x5ba8a>
  75cb1b: a1 ac 25 83 02               	movl	0x28325ac, %eax
  75cb20: 8b 88 6c 3d 01 00            	movl	0x13d6c(%eax), %ecx
  75cb26: 51                           	pushl	%ecx
  75cb27: 6a 00                        	pushl	$0x0
  75cb29: e8 1a 08 ff ff               	calll	0x74d348 <.text+0x4c348>
  75cb2e: 83 c4 08                     	addl	$0x8, %esp
  75cb31: 90                           	nop
  75cb32: 90                           	nop
  75cb33: 90                           	nop
  75cb34: 90                           	nop
  75cb35: 90                           	nop
  75cb36: 5f                           	popl	%edi
  75cb37: 5e                           	popl	%esi
  75cb38: 5b                           	popl	%ebx
  75cb39: 8b e5                        	movl	%ebp, %esp
  75cb3b: 5d                           	popl	%ebp
  75cb3c: c3                           	retl
  75cb3d: 55                           	pushl	%ebp
  75cb3e: 8b ec                        	movl	%esp, %ebp
  75cb40: 83 ec 14                     	subl	$0x14, %esp
  75cb43: 53                           	pushl	%ebx
  75cb44: 56                           	pushl	%esi
  75cb45: 57                           	pushl	%edi
  75cb46: 90                           	nop
  75cb47: 90                           	nop
  75cb48: 90                           	nop
  75cb49: 90                           	nop
  75cb4a: 90                           	nop
  75cb4b: 90                           	nop
  75cb4c: 90                           	nop
  75cb4d: 90                           	nop
  75cb4e: 90                           	nop
  75cb4f: 90                           	nop
  75cb50: 90                           	nop
  75cb51: 90                           	nop
  75cb52: 90                           	nop
  75cb53: 90                           	nop
  75cb54: 90                           	nop
  75cb55: 90                           	nop
  75cb56: 90                           	nop
  75cb57: 90                           	nop
  75cb58: 90                           	nop
  75cb59: 90                           	nop
  75cb5a: 90                           	nop
  75cb5b: 90                           	nop
  75cb5c: 90                           	nop
  75cb5d: 90                           	nop
  75cb5e: 90                           	nop
  75cb5f: 90                           	nop
  75cb60: 90                           	nop
  75cb61: 90                           	nop
  75cb62: 90                           	nop
  75cb63: 83 3d 88 32 80 00 00         	cmpl	$0x0, 0x803288
  75cb6a: 75 0c                        	jne	0x75cb78 <.text+0x5bb78>
  75cb6c: 90                           	nop
  75cb6d: 90                           	nop
  75cb6e: 90                           	nop
  75cb6f: 90                           	nop
  75cb70: 90                           	nop
  75cb71: 33 c0                        	xorl	%eax, %eax
  75cb73: e9 f0 01 00 00               	jmp	0x75cd68 <.text+0x5bd68>
  75cb78: 83 3d 38 f1 79 00 00         	cmpl	$0x0, 0x79f138
  75cb7f: 74 20                        	je	0x75cba1 <.text+0x5bba1>
  75cb81: 68 a8 f9 79 00               	pushl	$0x79f9a8               # imm = 0x79F9A8
  75cb86: 68 90 0c 00 00               	pushl	$0xc90                  # imm = 0xC90
  75cb8b: 6a 06                        	pushl	$0x6
  75cb8d: e8 a1 57 fb ff               	calll	0x712333 <.text+0x11333>
  75cb92: 83 c4 0c                     	addl	$0xc, %esp
  75cb95: 90                           	nop
  75cb96: 90                           	nop
  75cb97: 90                           	nop
  75cb98: 90                           	nop
  75cb99: 90                           	nop
  75cb9a: 33 c0                        	xorl	%eax, %eax
  75cb9c: e9 c7 01 00 00               	jmp	0x75cd68 <.text+0x5bd68>
  75cba1: 90                           	nop
  75cba2: 90                           	nop
  75cba3: 90                           	nop
  75cba4: 90                           	nop
  75cba5: 90                           	nop
  75cba6: 90                           	nop
  75cba7: 90                           	nop
  75cba8: 90                           	nop
  75cba9: 90                           	nop
  75cbaa: 90                           	nop
  75cbab: 90                           	nop
  75cbac: 90                           	nop
  75cbad: 90                           	nop
  75cbae: 90                           	nop
  75cbaf: 90                           	nop
  75cbb0: 90                           	nop
  75cbb1: 90                           	nop
  75cbb2: 90                           	nop
  75cbb3: 90                           	nop
  75cbb4: b8 20 94 69 00               	movl	$0x699420, %eax         # imm = 0x699420
  75cbb9: 8b 00                        	movl	(%eax), %eax
  75cbbb: 89 45 f0                     	movl	%eax, -0x10(%ebp)
  75cbbe: 90                           	nop
  75cbbf: 90                           	nop
  75cbc0: 90                           	nop
  75cbc1: 90                           	nop
  75cbc2: 90                           	nop
  75cbc3: 0f be 45 08                  	movsbl	0x8(%ebp), %eax
  75cbc7: 89 45 ec                     	movl	%eax, -0x14(%ebp)
  75cbca: 8b 4d ec                     	movl	-0x14(%ebp), %ecx
  75cbcd: 83 e9 41                     	subl	$0x41, %ecx
  75cbd0: 89 4d ec                     	movl	%ecx, -0x14(%ebp)
  75cbd3: 83 7d ec 12                  	cmpl	$0x12, -0x14(%ebp)
  75cbd7: 0f 87 64 01 00 00            	ja	0x75cd41 <.text+0x5bd41>
  75cbdd: 8b 55 ec                     	movl	-0x14(%ebp), %edx
  75cbe0: 0f b6 82 8f cd 75 00         	movzbl	0x75cd8f(%edx), %eax
  75cbe7: ff 24 85 6f cd 75 00         	jmpl	*0x75cd6f(,%eax,4)
  75cbee: 6a 00                        	pushl	$0x0
  75cbf0: 8b 4d 14                     	movl	0x14(%ebp), %ecx
  75cbf3: 51                           	pushl	%ecx
  75cbf4: 6a 04                        	pushl	$0x4
  75cbf6: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  75cbf9: 83 c2 3c                     	addl	$0x3c, %edx
  75cbfc: 52                           	pushl	%edx
  75cbfd: e8 5b 4d fe ff               	calll	0x74195d <.text+0x4095d>
  75cc02: 83 c4 10                     	addl	$0x10, %esp
  75cc05: e9 54 01 00 00               	jmp	0x75cd5e <.text+0x5bd5e>
  75cc0a: 6a 00                        	pushl	$0x0
  75cc0c: 8b 45 14                     	movl	0x14(%ebp), %eax
  75cc0f: 50                           	pushl	%eax
  75cc10: 6a 04                        	pushl	$0x4
  75cc12: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  75cc15: 83 c1 40                     	addl	$0x40, %ecx
  75cc18: 51                           	pushl	%ecx
  75cc19: e8 3f 4d fe ff               	calll	0x74195d <.text+0x4095d>
  75cc1e: 83 c4 10                     	addl	$0x10, %esp
  75cc21: e9 38 01 00 00               	jmp	0x75cd5e <.text+0x5bd5e>
  75cc26: 6a 00                        	pushl	$0x0
  75cc28: 8b 55 14                     	movl	0x14(%ebp), %edx
  75cc2b: 52                           	pushl	%edx
  75cc2c: 6a 04                        	pushl	$0x4
  75cc2e: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  75cc31: 83 c0 44                     	addl	$0x44, %eax
  75cc34: 50                           	pushl	%eax
  75cc35: e8 23 4d fe ff               	calll	0x74195d <.text+0x4095d>
  75cc3a: 83 c4 10                     	addl	$0x10, %esp
  75cc3d: e9 1c 01 00 00               	jmp	0x75cd5e <.text+0x5bd5e>
  75cc42: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  75cc45: 8b 91 c0 32 01 00            	movl	0x132c0(%ecx), %edx
  75cc4b: 89 55 fc                     	movl	%edx, -0x4(%ebp)
  75cc4e: 6a 00                        	pushl	$0x0
  75cc50: 8b 45 14                     	movl	0x14(%ebp), %eax
  75cc53: 50                           	pushl	%eax
  75cc54: 6a 04                        	pushl	$0x4
  75cc56: 8d 4d fc                     	leal	-0x4(%ebp), %ecx
  75cc59: 51                           	pushl	%ecx
  75cc5a: e8 fe 4c fe ff               	calll	0x74195d <.text+0x4095d>
  75cc5f: 83 c4 10                     	addl	$0x10, %esp
  75cc62: e9 f7 00 00 00               	jmp	0x75cd5e <.text+0x5bd5e>
  75cc67: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  75cc6a: 8b 82 c0 32 01 00            	movl	0x132c0(%edx), %eax
  75cc70: 89 45 fc                     	movl	%eax, -0x4(%ebp)
  75cc73: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  75cc76: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  75cc79: 8b 84 8a cc 53 00 00         	movl	0x53cc(%edx,%ecx,4), %eax
  75cc80: 89 45 f4                     	movl	%eax, -0xc(%ebp)
  75cc83: 83 7d f4 00                  	cmpl	$0x0, -0xc(%ebp)
  75cc87: 75 09                        	jne	0x75cc92 <.text+0x5bc92>
  75cc89: c7 45 fc ff ff ff ff         	movl	$0xffffffff, -0x4(%ebp) # imm = 0xFFFFFFFF
  75cc90: eb 09                        	jmp	0x75cc9b <.text+0x5bc9b>
  75cc92: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
  75cc95: 8b 51 1a                     	movl	0x1a(%ecx), %edx
  75cc98: 89 55 fc                     	movl	%edx, -0x4(%ebp)
  75cc9b: 6a 00                        	pushl	$0x0
  75cc9d: 8b 45 14                     	movl	0x14(%ebp), %eax
  75cca0: 50                           	pushl	%eax
  75cca1: 6a 04                        	pushl	$0x4
  75cca3: 8d 4d fc                     	leal	-0x4(%ebp), %ecx
  75cca6: 51                           	pushl	%ecx
  75cca7: e8 b1 4c fe ff               	calll	0x74195d <.text+0x4095d>
  75ccac: 83 c4 10                     	addl	$0x10, %esp
  75ccaf: e9 aa 00 00 00               	jmp	0x75cd5e <.text+0x5bd5e>
  75ccb4: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  75ccb7: 8b 42 44                     	movl	0x44(%edx), %eax
  75ccba: 89 45 fc                     	movl	%eax, -0x4(%ebp)
  75ccbd: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  75ccc0: 51                           	pushl	%ecx
  75ccc1: e8 ac 8b fb ff               	calll	0x715872 <.text+0x14872>
  75ccc6: 83 c4 04                     	addl	$0x4, %esp
  75ccc9: 89 45 f8                     	movl	%eax, -0x8(%ebp)
  75cccc: 83 7d f8 00                  	cmpl	$0x0, -0x8(%ebp)
  75ccd0: 75 09                        	jne	0x75ccdb <.text+0x5bcdb>
  75ccd2: c7 45 fc ff ff ff ff         	movl	$0xffffffff, -0x4(%ebp) # imm = 0xFFFFFFFF
  75ccd9: eb 2b                        	jmp	0x75cd06 <.text+0x5bd06>
  75ccdb: 8b 55 f8                     	movl	-0x8(%ebp), %edx
  75ccde: 0f be 42 18                  	movsbl	0x18(%edx), %eax
  75cce2: 83 f8 ff                     	cmpl	$-0x1, %eax
  75cce5: 75 09                        	jne	0x75ccf0 <.text+0x5bcf0>
  75cce7: c7 45 fc ff ff ff ff         	movl	$0xffffffff, -0x4(%ebp) # imm = 0xFFFFFFFF
  75ccee: eb 16                        	jmp	0x75cd06 <.text+0x5bd06>
  75ccf0: 8b 4d f8                     	movl	-0x8(%ebp), %ecx
  75ccf3: 0f be 51 18                  	movsbl	0x18(%ecx), %edx
  75ccf7: 6b d2 15                     	imull	$0x15, %edx, %edx
  75ccfa: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  75ccfd: 0f be 48 19                  	movsbl	0x19(%eax), %ecx
  75cd01: 03 d1                        	addl	%ecx, %edx
  75cd03: 89 55 fc                     	movl	%edx, -0x4(%ebp)
  75cd06: 6a 00                        	pushl	$0x0
  75cd08: 8b 55 14                     	movl	0x14(%ebp), %edx
  75cd0b: 52                           	pushl	%edx
  75cd0c: 6a 04                        	pushl	$0x4
  75cd0e: 8d 45 fc                     	leal	-0x4(%ebp), %eax
  75cd11: 50                           	pushl	%eax
  75cd12: e8 46 4c fe ff               	calll	0x74195d <.text+0x4095d>
  75cd17: 83 c4 10                     	addl	$0x10, %esp
  75cd1a: eb 42                        	jmp	0x75cd5e <.text+0x5bd5e>
  75cd1c: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  75cd1f: 51                           	pushl	%ecx
  75cd20: e8 43 e2 ff ff               	calll	0x75af68 <.text+0x59f68>
  75cd25: 83 c4 04                     	addl	$0x4, %esp
  75cd28: 89 45 fc                     	movl	%eax, -0x4(%ebp)
  75cd2b: 6a 00                        	pushl	$0x0
  75cd2d: 8b 55 14                     	movl	0x14(%ebp), %edx
  75cd30: 52                           	pushl	%edx
  75cd31: 6a 04                        	pushl	$0x4
  75cd33: 8d 45 fc                     	leal	-0x4(%ebp), %eax
  75cd36: 50                           	pushl	%eax
  75cd37: e8 21 4c fe ff               	calll	0x74195d <.text+0x4095d>
  75cd3c: 83 c4 10                     	addl	$0x10, %esp
  75cd3f: eb 1d                        	jmp	0x75cd5e <.text+0x5bd5e>
  75cd41: 68 f8 f9 79 00               	pushl	$0x79f9f8               # imm = 0x79F9F8
  75cd46: 68 be 0c 00 00               	pushl	$0xcbe                  # imm = 0xCBE
  75cd4b: 6a 06                        	pushl	$0x6
  75cd4d: e8 e1 55 fb ff               	calll	0x712333 <.text+0x11333>
  75cd52: 83 c4 0c                     	addl	$0xc, %esp
  75cd55: 90                           	nop
  75cd56: 90                           	nop
  75cd57: 90                           	nop
  75cd58: 90                           	nop
  75cd59: 90                           	nop
  75cd5a: 33 c0                        	xorl	%eax, %eax
  75cd5c: eb 0a                        	jmp	0x75cd68 <.text+0x5bd68>
  75cd5e: 90                           	nop
  75cd5f: 90                           	nop
  75cd60: 90                           	nop
  75cd61: 90                           	nop
  75cd62: 90                           	nop
  75cd63: b8 01 00 00 00               	movl	$0x1, %eax
