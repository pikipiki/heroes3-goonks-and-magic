
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  478950: 00 00                        	addb	%al, (%eax)
  478952: 8b 46 3c                     	movl	0x3c(%esi), %eax
  478955: 48                           	decl	%eax
  478956: 83 f8 0b                     	cmpl	$0xb, %eax
  478959: 0f 87 a4 0b 00 00            	ja	0x479503 <.text+0x78503>
  47895f: ff 24 85 d4 96 47 00         	jmpl	*0x4796d4(,%eax,4)
  478966: 8b ce                        	movl	%esi, %ecx
  478968: c6 86 30 40 01 00 01         	movb	$0x1, 0x14030(%esi)
  47896f: e8 9c 0d 00 00               	calll	0x479710 <.text+0x78710>
  478974: 8b 56 48                     	movl	0x48(%esi), %edx
  478977: 8b 46 44                     	movl	0x44(%esi), %eax
  47897a: 8b 4e 40                     	movl	0x40(%esi), %ecx
  47897d: 6a 03                        	pushl	$0x3
  47897f: 57                           	pushl	%edi
  478980: 52                           	pushl	%edx
  478981: 57                           	pushl	%edi
  478982: 50                           	pushl	%eax
  478983: 51                           	pushl	%ecx
  478984: 8b ce                        	movl	%esi, %ecx
  478986: e8 b5 77 12 00               	calll	0x5a0140 <.text+0x19f140>
  47898b: 39 7b 4c                     	cmpl	%edi, 0x4c(%ebx)
  47898e: 7f 07                        	jg	0x478997 <.text+0x77997>
  478990: c7 45 e0 01 00 00 00         	movl	$0x1, -0x20(%ebp)
  478997: e8 d4 ff 07 00               	calll	0x4f8970 <.text+0xf7970>
  47899c: 89 45 e4                     	movl	%eax, -0x1c(%ebp)
  47899f: 89 86 fc 53 00 00            	movl	%eax, 0x53fc(%esi)
  4789a5: 89 86 00 54 00 00            	movl	%eax, 0x5400(%esi)
  4789ab: 8d 96 20 56 00 00            	leal	0x5620(%esi), %edx
  4789b1: 8d 86 bc 54 00 00            	leal	0x54bc(%esi), %eax
  4789b7: 89 55 f0                     	movl	%edx, -0x10(%ebp)
  4789ba: 89 45 ec                     	movl	%eax, -0x14(%ebp)
  4789bd: c7 45 e8 02 00 00 00         	movl	$0x2, -0x18(%ebp)
  4789c4: 8b 08                        	movl	(%eax), %ecx
  4789c6: 33 ff                        	xorl	%edi, %edi
  4789c8: 85 c9                        	testl	%ecx, %ecx
  4789ca: 7e 32                        	jle	0x4789fe <.text+0x779fe>
  4789cc: 8b 5d f0                     	movl	-0x10(%ebp), %ebx
  4789cf: 8b 13                        	movl	(%ebx), %edx
  4789d1: 83 fa 33                     	cmpl	$0x33, %edx
  4789d4: 7e 1b                        	jle	0x4789f1 <.text+0x779f1>
  4789d6: b9 32 00 00 00               	movl	$0x32, %ecx
  4789db: e8 e0 3d 09 00               	calll	0x50c7c0 <.text+0x10b7c0>
  4789e0: 8b 13                        	movl	(%ebx), %edx
  4789e2: 8b 4d e4                     	movl	-0x1c(%ebp), %ecx
  4789e5: d1 e0                        	shll	%eax
  4789e7: 2b c2                        	subl	%edx, %eax
  4789e9: 03 c1                        	addl	%ecx, %eax
  4789eb: 89 43 a8                     	movl	%eax, -0x58(%ebx)
  4789ee: 8b 45 ec                     	movl	-0x14(%ebp), %eax
  4789f1: 8b 08                        	movl	(%eax), %ecx
  4789f3: 47                           	incl	%edi
  4789f4: 81 c3 48 05 00 00            	addl	$0x548, %ebx            # imm = 0x548
  4789fa: 3b f9                        	cmpl	%ecx, %edi
  4789fc: 7c d1                        	jl	0x4789cf <.text+0x779cf>
  4789fe: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  478a01: 8b 4d e8                     	movl	-0x18(%ebp), %ecx
  478a04: 83 c0 04                     	addl	$0x4, %eax
  478a07: 81 c2 e8 6e 00 00            	addl	$0x6ee8, %edx           # imm = 0x6EE8
  478a0d: 49                           	decl	%ecx
  478a0e: 89 45 ec                     	movl	%eax, -0x14(%ebp)
  478a11: 89 55 f0                     	movl	%edx, -0x10(%ebp)
  478a14: 89 4d e8                     	movl	%ecx, -0x18(%ebp)
  478a17: 75 ab                        	jne	0x4789c4 <.text+0x779c4>
  478a19: 33 ff                        	xorl	%edi, %edi
  478a1b: e9 e3 0a 00 00               	jmp	0x479503 <.text+0x78503>
  478a20: 8b ce                        	movl	%esi, %ecx
  478a22: c6 86 30 40 01 00 01         	movb	$0x1, 0x14030(%esi)
  478a29: e8 e2 0c 00 00               	calll	0x479710 <.text+0x78710>
  478a2e: 8b 4e 44                     	movl	0x44(%esi), %ecx
  478a31: 6a 01                        	pushl	$0x1
  478a33: 51                           	pushl	%ecx
  478a34: 8b cb                        	movl	%ebx, %ecx
  478a36: e8 f5 cf fc ff               	calll	0x445a30 <.text+0x44a30>
  478a3b: 8b 83 84 00 00 00            	movl	0x84(%ebx), %eax
  478a41: 8b 55 08                     	movl	0x8(%ebp), %edx
  478a44: 0d 00 00 00 04               	orl	$0x4000000, %eax        # imm = 0x4000000
  478a49: 52                           	pushl	%edx
  478a4a: 8b ce                        	movl	%esi, %ecx
  478a4c: 89 bb 90 04 00 00            	movl	%edi, 0x490(%ebx)
  478a52: 89 83 84 00 00 00            	movl	%eax, 0x84(%ebx)
  478a58: e8 c3 d1 ff ff               	calll	0x475c20 <.text+0x74c20>
  478a5d: 85 c0                        	testl	%eax, %eax
  478a5f: 0f 84 88 00 00 00            	je	0x478aed <.text+0x77aed>
  478a65: 8b ce                        	movl	%esi, %ecx
  478a67: 89 3d 3c 8a 69 00            	movl	%edi, 0x698a3c
  478a6d: e8 0e 16 ff ff               	calll	0x46a080 <.text+0x69080>
  478a72: 84 c0                        	testb	%al, %al
  478a74: 0f 85 01 0b 00 00            	jne	0x47957b <.text+0x7857b>
  478a7a: 39 be b4 32 01 00            	cmpl	%edi, 0x132b4(%esi)
  478a80: 0f 84 e6 0a 00 00            	je	0x47956c <.text+0x7856c>
  478a86: 8b 86 c0 32 01 00            	movl	0x132c0(%esi), %eax
  478a8c: 8b 84 86 a8 54 00 00         	movl	0x54a8(%esi,%eax,4), %eax
  478a93: 3b c7                        	cmpl	%edi, %eax
  478a95: 0f 8c d1 0a 00 00            	jl	0x47956c <.text+0x7856c>
  478a9b: 8b 0d 38 95 69 00            	movl	0x699538, %ecx
  478aa1: 50                           	pushl	%eax
  478aa2: e8 59 5b 05 00               	calll	0x4ce600 <.text+0xcd600>
  478aa7: 84 c0                        	testb	%al, %al
  478aa9: 0f 84 bd 0a 00 00            	je	0x47956c <.text+0x7856c>
  478aaf: c7 86 d4 32 01 00 ff ff ff ff	movl	$0xffffffff, 0x132d4(%esi) # imm = 0xFFFFFFFF
  478ab9: 8b b6 fc 32 01 00            	movl	0x132fc(%esi), %esi
  478abf: 3b f7                        	cmpl	%edi, %esi
  478ac1: 74 07                        	je	0x478aca <.text+0x77aca>
  478ac3: 8b ce                        	movl	%esi, %ecx
  478ac5: e8 66 9c ff ff               	calll	0x472730 <.text+0x71730>
  478aca: 8b 0d 30 95 69 00            	movl	0x699530, %ecx
  478ad0: e8 fb 41 07 00               	calll	0x4eccd0 <.text+0xebcd0>
  478ad5: 5f                           	popl	%edi
  478ad6: 5e                           	popl	%esi
  478ad7: b8 02 00 00 00               	movl	$0x2, %eax
  478adc: 5b                           	popl	%ebx
  478add: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
  478ae0: 64 89 0d 00 00 00 00         	movl	%ecx, %fs:0x0
  478ae7: 8b e5                        	movl	%ebp, %esp
  478ae9: 5d                           	popl	%ebp
  478aea: c2 08 00                     	retl	$0x8
  478aed: 8b 8e bc 32 01 00            	movl	0x132bc(%esi), %ecx
  478af3: 8b 96 b8 32 01 00            	movl	0x132b8(%esi), %edx
  478af9: 51                           	pushl	%ecx
  478afa: 52                           	pushl	%edx
  478afb: 8b ce                        	movl	%esi, %ecx
  478afd: e8 fe b9 fe ff               	calll	0x464500 <.text+0x63500>
  478b02: c7 45 e0 01 00 00 00         	movl	$0x1, -0x20(%ebp)
  478b09: e8 62 fe 07 00               	calll	0x4f8970 <.text+0xf7970>
  478b0e: 89 45 e4                     	movl	%eax, -0x1c(%ebp)
  478b11: 89 86 fc 53 00 00            	movl	%eax, 0x53fc(%esi)
  478b17: 89 86 00 54 00 00            	movl	%eax, 0x5400(%esi)
  478b1d: 8d 86 20 56 00 00            	leal	0x5620(%esi), %eax
  478b23: 8d 8e bc 54 00 00            	leal	0x54bc(%esi), %ecx
  478b29: 89 45 ec                     	movl	%eax, -0x14(%ebp)
  478b2c: 89 4d f0                     	movl	%ecx, -0x10(%ebp)
  478b2f: c7 45 e8 02 00 00 00         	movl	$0x2, -0x18(%ebp)
  478b36: 8b c1                        	movl	%ecx, %eax
  478b38: 8b 08                        	movl	(%eax), %ecx
  478b3a: 33 ff                        	xorl	%edi, %edi
  478b3c: 85 c9                        	testl	%ecx, %ecx
  478b3e: 7e 32                        	jle	0x478b72 <.text+0x77b72>
  478b40: 8b 5d ec                     	movl	-0x14(%ebp), %ebx
  478b43: 8b 13                        	movl	(%ebx), %edx
  478b45: 83 fa 33                     	cmpl	$0x33, %edx
  478b48: 7e 1b                        	jle	0x478b65 <.text+0x77b65>
  478b4a: b9 32 00 00 00               	movl	$0x32, %ecx
  478b4f: e8 6c 3c 09 00               	calll	0x50c7c0 <.text+0x10b7c0>
  478b54: 8b 13                        	movl	(%ebx), %edx
  478b56: 8b 4d e4                     	movl	-0x1c(%ebp), %ecx
  478b59: d1 e0                        	shll	%eax
  478b5b: 2b c2                        	subl	%edx, %eax
  478b5d: 03 c1                        	addl	%ecx, %eax
  478b5f: 89 43 a8                     	movl	%eax, -0x58(%ebx)
  478b62: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  478b65: 8b 08                        	movl	(%eax), %ecx
  478b67: 47                           	incl	%edi
  478b68: 81 c3 48 05 00 00            	addl	$0x548, %ebx            # imm = 0x548
  478b6e: 3b f9                        	cmpl	%ecx, %edi
  478b70: 7c d1                        	jl	0x478b43 <.text+0x77b43>
  478b72: 8b 55 ec                     	movl	-0x14(%ebp), %edx
  478b75: 8b 4d e8                     	movl	-0x18(%ebp), %ecx
  478b78: 83 c0 04                     	addl	$0x4, %eax
  478b7b: 81 c2 e8 6e 00 00            	addl	$0x6ee8, %edx           # imm = 0x6EE8
  478b81: 49                           	decl	%ecx
  478b82: 89 45 f0                     	movl	%eax, -0x10(%ebp)
  478b85: 89 55 ec                     	movl	%edx, -0x14(%ebp)
  478b88: 89 4d e8                     	movl	%ecx, -0x18(%ebp)
  478b8b: 75 ab                        	jne	0x478b38 <.text+0x77b38>
  478b8d: 33 ff                        	xorl	%edi, %edi
  478b8f: e9 6f 09 00 00               	jmp	0x479503 <.text+0x78503>
  478b94: 8b ce                        	movl	%esi, %ecx
  478b96: c6 86 30 40 01 00 01         	movb	$0x1, 0x14030(%esi)
  478b9d: e8 6e 0b 00 00               	calll	0x479710 <.text+0x78710>
  478ba2: 8b 56 44                     	movl	0x44(%esi), %edx
  478ba5: 6a 01                        	pushl	$0x1
  478ba7: 52                           	pushl	%edx
  478ba8: 8b cb                        	movl	%ebx, %ecx
  478baa: e8 d1 cb fc ff               	calll	0x445780 <.text+0x44780>
  478baf: 8b 83 84 00 00 00            	movl	0x84(%ebx), %eax
  478bb5: 8b ce                        	movl	%esi, %ecx
  478bb7: 0d 00 00 00 04               	orl	$0x4000000, %eax        # imm = 0x4000000
  478bbc: 89 83 84 00 00 00            	movl	%eax, 0x84(%ebx)
  478bc2: 8b 45 08                     	movl	0x8(%ebp), %eax
  478bc5: 50                           	pushl	%eax
  478bc6: e8 55 d0 ff ff               	calll	0x475c20 <.text+0x74c20>
  478bcb: 85 c0                        	testl	%eax, %eax
  478bcd: 0f 85 42 09 00 00            	jne	0x479515 <.text+0x78515>
  478bd3: 81 7b 34 95 00 00 00         	cmpl	$0x95, 0x34(%ebx)
  478bda: 74 30                        	je	0x478c0c <.text+0x77c0c>
  478bdc: 8b 96 bc 32 01 00            	movl	0x132bc(%esi), %edx
  478be2: 8b 86 b8 32 01 00            	movl	0x132b8(%esi), %eax
  478be8: 52                           	pushl	%edx
  478be9: 50                           	pushl	%eax
  478bea: 8b ce                        	movl	%esi, %ecx
  478bec: e8 0f b9 fe ff               	calll	0x464500 <.text+0x63500>
  478bf1: b9 2e 00 00 00               	movl	$0x2e, %ecx
  478bf6: 33 c0                        	xorl	%eax, %eax
  478bf8: 8d be 31 40 01 00            	leal	0x14031(%esi), %edi
  478bfe: 6a 00                        	pushl	$0x0
  478c00: f3 ab                        	rep		stosl	%eax, %es:(%edi)
  478c02: 66 ab                        	stosw	%ax, %es:(%edi)
  478c04: 8b cb                        	movl	%ebx, %ecx
  478c06: aa                           	stosb	%al, %es:(%edi)
  478c07: e8 84 90 fc ff               	calll	0x441c90 <.text+0x40c90>
  478c0c: c7 45 e0 01 00 00 00         	movl	$0x1, -0x20(%ebp)
  478c13: e8 58 fd 07 00               	calll	0x4f8970 <.text+0xf7970>
  478c18: 8d 8e 20 56 00 00            	leal	0x5620(%esi), %ecx
  478c1e: 8d 96 bc 54 00 00            	leal	0x54bc(%esi), %edx
  478c24: 89 45 e4                     	movl	%eax, -0x1c(%ebp)
  478c27: 89 86 fc 53 00 00            	movl	%eax, 0x53fc(%esi)
  478c2d: 89 86 00 54 00 00            	movl	%eax, 0x5400(%esi)
  478c33: 89 4d ec                     	movl	%ecx, -0x14(%ebp)
  478c36: 89 55 f0                     	movl	%edx, -0x10(%ebp)
  478c39: c7 45 e8 02 00 00 00         	movl	$0x2, -0x18(%ebp)
  478c40: 8b c2                        	movl	%edx, %eax
  478c42: 8b 08                        	movl	(%eax), %ecx
  478c44: 33 ff                        	xorl	%edi, %edi
  478c46: 85 c9                        	testl	%ecx, %ecx
  478c48: 7e 32                        	jle	0x478c7c <.text+0x77c7c>
  478c4a: 8b 5d ec                     	movl	-0x14(%ebp), %ebx
  478c4d: 8b 13                        	movl	(%ebx), %edx
  478c4f: 83 fa 33                     	cmpl	$0x33, %edx
  478c52: 7e 1b                        	jle	0x478c6f <.text+0x77c6f>
  478c54: b9 32 00 00 00               	movl	$0x32, %ecx
  478c59: e8 62 3b 09 00               	calll	0x50c7c0 <.text+0x10b7c0>
  478c5e: 8b 13                        	movl	(%ebx), %edx
  478c60: 8b 4d e4                     	movl	-0x1c(%ebp), %ecx
  478c63: d1 e0                        	shll	%eax
  478c65: 2b c2                        	subl	%edx, %eax
  478c67: 03 c1                        	addl	%ecx, %eax
  478c69: 89 43 a8                     	movl	%eax, -0x58(%ebx)
  478c6c: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  478c6f: 8b 08                        	movl	(%eax), %ecx
  478c71: 47                           	incl	%edi
  478c72: 81 c3 48 05 00 00            	addl	$0x548, %ebx            # imm = 0x548
  478c78: 3b f9                        	cmpl	%ecx, %edi
  478c7a: 7c d1                        	jl	0x478c4d <.text+0x77c4d>
  478c7c: 8b 55 ec                     	movl	-0x14(%ebp), %edx
  478c7f: 8b 4d e8                     	movl	-0x18(%ebp), %ecx
  478c82: 83 c0 04                     	addl	$0x4, %eax
  478c85: 81 c2 e8 6e 00 00            	addl	$0x6ee8, %edx           # imm = 0x6EE8
  478c8b: 49                           	decl	%ecx
  478c8c: 89 45 f0                     	movl	%eax, -0x10(%ebp)
  478c8f: 89 55 ec                     	movl	%edx, -0x14(%ebp)
  478c92: 89 4d e8                     	movl	%ecx, -0x18(%ebp)
  478c95: 75 ab                        	jne	0x478c42 <.text+0x77c42>
  478c97: 33 ff                        	xorl	%edi, %edi
  478c99: e9 65 08 00 00               	jmp	0x479503 <.text+0x78503>
  478c9e: 8b ce                        	movl	%esi, %ecx
  478ca0: c6 86 30 40 01 00 01         	movb	$0x1, 0x14030(%esi)
  478ca7: e8 64 0a 00 00               	calll	0x479710 <.text+0x78710>
  478cac: 8b 46 44                     	movl	0x44(%esi), %eax
  478caf: 8b cb                        	movl	%ebx, %ecx
  478cb1: 50                           	pushl	%eax
  478cb2: e8 c9 f2 fc ff               	calll	0x447f80 <.text+0x46f80>
  478cb7: 8b bb 84 00 00 00            	movl	0x84(%ebx), %edi
  478cbd: 81 cf 00 00 00 04            	orl	$0x4000000, %edi        # imm = 0x4000000
  478cc3: 89 bb 84 00 00 00            	movl	%edi, 0x84(%ebx)
  478cc9: 8b 8e bc 32 01 00            	movl	0x132bc(%esi), %ecx
  478ccf: 8b 96 b8 32 01 00            	movl	0x132b8(%esi), %edx
  478cd5: 51                           	pushl	%ecx
  478cd6: 52                           	pushl	%edx
  478cd7: 8b ce                        	movl	%esi, %ecx
  478cd9: e8 22 b8 fe ff               	calll	0x464500 <.text+0x63500>
  478cde: c7 45 e0 01 00 00 00         	movl	$0x1, -0x20(%ebp)
  478ce5: e8 86 fc 07 00               	calll	0x4f8970 <.text+0xf7970>
  478cea: 89 45 e4                     	movl	%eax, -0x1c(%ebp)
  478ced: 89 86 fc 53 00 00            	movl	%eax, 0x53fc(%esi)
  478cf3: 89 86 00 54 00 00            	movl	%eax, 0x5400(%esi)
  478cf9: 8d 86 20 56 00 00            	leal	0x5620(%esi), %eax
  478cff: 89 45 f0                     	movl	%eax, -0x10(%ebp)
  478d02: 8d be bc 54 00 00            	leal	0x54bc(%esi), %edi
  478d08: c7 45 ec 02 00 00 00         	movl	$0x2, -0x14(%ebp)
  478d0f: 8b 07                        	movl	(%edi), %eax
  478d11: c7 45 e8 00 00 00 00         	movl	$0x0, -0x18(%ebp)
  478d18: 85 c0                        	testl	%eax, %eax
  478d1a: 7e 35                        	jle	0x478d51 <.text+0x77d51>
  478d1c: 8b 5d f0                     	movl	-0x10(%ebp), %ebx
  478d1f: 8b 13                        	movl	(%ebx), %edx
  478d21: 83 fa 33                     	cmpl	$0x33, %edx
  478d24: 7e 18                        	jle	0x478d3e <.text+0x77d3e>
  478d26: b9 32 00 00 00               	movl	$0x32, %ecx
  478d2b: e8 90 3a 09 00               	calll	0x50c7c0 <.text+0x10b7c0>
  478d30: 8b 13                        	movl	(%ebx), %edx
  478d32: 8b 4d e4                     	movl	-0x1c(%ebp), %ecx
  478d35: d1 e0                        	shll	%eax
  478d37: 2b c2                        	subl	%edx, %eax
  478d39: 03 c1                        	addl	%ecx, %eax
  478d3b: 89 43 a8                     	movl	%eax, -0x58(%ebx)
  478d3e: 8b 45 e8                     	movl	-0x18(%ebp), %eax
  478d41: 8b 0f                        	movl	(%edi), %ecx
  478d43: 40                           	incl	%eax
  478d44: 81 c3 48 05 00 00            	addl	$0x548, %ebx            # imm = 0x548
  478d4a: 3b c1                        	cmpl	%ecx, %eax
  478d4c: 89 45 e8                     	movl	%eax, -0x18(%ebp)
  478d4f: 7c ce                        	jl	0x478d1f <.text+0x77d1f>
  478d51: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  478d54: 8b 45 ec                     	movl	-0x14(%ebp), %eax
  478d57: 83 c7 04                     	addl	$0x4, %edi
  478d5a: 81 c1 e8 6e 00 00            	addl	$0x6ee8, %ecx           # imm = 0x6EE8
  478d60: 48                           	decl	%eax
  478d61: 89 4d f0                     	movl	%ecx, -0x10(%ebp)
  478d64: 89 45 ec                     	movl	%eax, -0x14(%ebp)
  478d67: 75 a6                        	jne	0x478d0f <.text+0x77d0f>
  478d69: 33 ff                        	xorl	%edi, %edi
  478d6b: e9 93 07 00 00               	jmp	0x479503 <.text+0x78503>
  478d70: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  478d73: c6 86 30 40 01 00 01         	movb	$0x1, 0x14030(%esi)
  478d7a: 51                           	pushl	%ecx
  478d7b: 8b ce                        	movl	%esi, %ecx
  478d7d: e8 ae f4 ff ff               	calll	0x478230 <.text+0x77230>
  478d82: 84 c0                        	testb	%al, %al
  478d84: 0f 84 72 07 00 00            	je	0x4794fc <.text+0x784fc>
  478d8a: 5f                           	popl	%edi
  478d8b: 5e                           	popl	%esi
  478d8c: b8 02 00 00 00               	movl	$0x2, %eax
  478d91: 5b                           	popl	%ebx
  478d92: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
  478d95: 64 89 0d 00 00 00 00         	movl	%ecx, %fs:0x0
  478d9c: 8b e5                        	movl	%ebp, %esp
  478d9e: 5d                           	popl	%ebp
  478d9f: c2 08 00                     	retl	$0x8
  478da2: 8b 8e cc 53 00 00            	movl	0x53cc(%esi), %ecx
  478da8: 3b cf                        	cmpl	%edi, %ecx
  478daa: 74 0b                        	je	0x478db7 <.text+0x77db7>
  478dac: 6a 7d                        	pushl	$0x7d
  478dae: e8 ad 06 06 00               	calll	0x4d9460 <.text+0xd8460>
  478db3: 84 c0                        	testb	%al, %al
  478db5: 75 15                        	jne	0x478dcc <.text+0x77dcc>
  478db7: 8b 8e d0 53 00 00            	movl	0x53d0(%esi), %ecx
  478dbd: 3b cf                        	cmpl	%edi, %ecx
  478dbf: 74 5d                        	je	0x478e1e <.text+0x77e1e>
  478dc1: 6a 7d                        	pushl	$0x7d
  478dc3: e8 98 06 06 00               	calll	0x4d9460 <.text+0xd8460>
  478dc8: 84 c0                        	testb	%al, %al
  478dca: 74 52                        	je	0x478e1e <.text+0x77e1e>
  478dcc: 8b 96 c0 32 01 00            	movl	0x132c0(%esi), %edx
  478dd2: 8b 0d c4 5d 6a 00            	movl	0x6a5dc4, %ecx
  478dd8: 8b 84 96 cc 53 00 00         	movl	0x53cc(%esi,%edx,4), %eax
  478ddf: 8b 51 20                     	movl	0x20(%ecx), %edx
  478de2: 83 c0 23                     	addl	$0x23, %eax
  478de5: 50                           	pushl	%eax
  478de6: 8b 82 54 05 00 00            	movl	0x554(%edx), %eax
  478dec: 50                           	pushl	%eax
  478ded: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  478df2: e8 e7 eb 19 00               	calll	0x6179de <.text+0x2169de>
  478df7: 83 c4 0c                     	addl	$0xc, %esp
  478dfa: ba 01 00 00 00               	movl	$0x1, %edx
  478dff: b9 28 74 69 00               	movl	$0x697428, %ecx         # imm = 0x697428
  478e04: 57                           	pushl	%edi
  478e05: 6a ff                        	pushl	$-0x1
  478e07: 57                           	pushl	%edi
  478e08: 6a ff                        	pushl	$-0x1
  478e0a: 57                           	pushl	%edi
  478e0b: 6a ff                        	pushl	$-0x1
  478e0d: 57                           	pushl	%edi
  478e0e: 6a ff                        	pushl	$-0x1
  478e10: 6a ff                        	pushl	$-0x1
  478e12: 6a ff                        	pushl	$-0x1
  478e14: e8 e7 dd 07 00               	calll	0x4f6c00 <.text+0xf5c00>
  478e19: e9 e5 06 00 00               	jmp	0x479503 <.text+0x78503>
  478e1e: 8b 8e c0 32 01 00            	movl	0x132c0(%esi), %ecx
  478e24: c6 86 30 40 01 00 01         	movb	$0x1, 0x14030(%esi)
  478e2b: c6 84 31 b0 32 01 00 01      	movb	$0x1, 0x132b0(%ecx,%esi)
  478e33: e8 38 fb 07 00               	calll	0x4f8970 <.text+0xf7970>
  478e38: 89 45 e4                     	movl	%eax, -0x1c(%ebp)
  478e3b: 89 86 fc 53 00 00            	movl	%eax, 0x53fc(%esi)
  478e41: 89 86 00 54 00 00            	movl	%eax, 0x5400(%esi)
  478e47: 8d 96 20 56 00 00            	leal	0x5620(%esi), %edx
  478e4d: 8d 86 bc 54 00 00            	leal	0x54bc(%esi), %eax
  478e53: 89 55 ec                     	movl	%edx, -0x14(%ebp)
  478e56: 89 45 f0                     	movl	%eax, -0x10(%ebp)
  478e59: c7 45 e8 02 00 00 00         	movl	$0x2, -0x18(%ebp)
  478e60: 8b 08                        	movl	(%eax), %ecx
  478e62: 33 ff                        	xorl	%edi, %edi
  478e64: 85 c9                        	testl	%ecx, %ecx
  478e66: 7e 32                        	jle	0x478e9a <.text+0x77e9a>
  478e68: 8b 5d ec                     	movl	-0x14(%ebp), %ebx
  478e6b: 8b 13                        	movl	(%ebx), %edx
  478e6d: 83 fa 33                     	cmpl	$0x33, %edx
  478e70: 7e 1b                        	jle	0x478e8d <.text+0x77e8d>
  478e72: b9 32 00 00 00               	movl	$0x32, %ecx
  478e77: e8 44 39 09 00               	calll	0x50c7c0 <.text+0x10b7c0>
  478e7c: 8b 13                        	movl	(%ebx), %edx
  478e7e: 8b 4d e4                     	movl	-0x1c(%ebp), %ecx
  478e81: d1 e0                        	shll	%eax
  478e83: 2b c2                        	subl	%edx, %eax
  478e85: 03 c1                        	addl	%ecx, %eax
  478e87: 89 43 a8                     	movl	%eax, -0x58(%ebx)
  478e8a: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  478e8d: 8b 08                        	movl	(%eax), %ecx
  478e8f: 47                           	incl	%edi
  478e90: 81 c3 48 05 00 00            	addl	$0x548, %ebx            # imm = 0x548
  478e96: 3b f9                        	cmpl	%ecx, %edi
  478e98: 7c d1                        	jl	0x478e6b <.text+0x77e6b>
  478e9a: 8b 55 ec                     	movl	-0x14(%ebp), %edx
  478e9d: 8b 4d e8                     	movl	-0x18(%ebp), %ecx
  478ea0: 83 c0 04                     	addl	$0x4, %eax
  478ea3: 81 c2 e8 6e 00 00            	addl	$0x6ee8, %edx           # imm = 0x6EE8
  478ea9: 49                           	decl	%ecx
  478eaa: 89 45 f0                     	movl	%eax, -0x10(%ebp)
  478ead: 89 55 ec                     	movl	%edx, -0x14(%ebp)
  478eb0: 89 4d e8                     	movl	%ecx, -0x18(%ebp)
  478eb3: 75 ab                        	jne	0x478e60 <.text+0x77e60>
  478eb5: 33 ff                        	xorl	%edi, %edi
  478eb7: e9 47 06 00 00               	jmp	0x479503 <.text+0x78503>
  478ebc: 8b 8e cc 53 00 00            	movl	0x53cc(%esi), %ecx
  478ec2: 3b cf                        	cmpl	%edi, %ecx
  478ec4: 74 0b                        	je	0x478ed1 <.text+0x77ed1>
  478ec6: 6a 7d                        	pushl	$0x7d
  478ec8: e8 93 05 06 00               	calll	0x4d9460 <.text+0xd8460>
  478ecd: 84 c0                        	testb	%al, %al
  478ecf: 75 15                        	jne	0x478ee6 <.text+0x77ee6>
  478ed1: 8b 8e d0 53 00 00            	movl	0x53d0(%esi), %ecx
  478ed7: 3b cf                        	cmpl	%edi, %ecx
  478ed9: 74 5c                        	je	0x478f37 <.text+0x77f37>
  478edb: 6a 7d                        	pushl	$0x7d
  478edd: e8 7e 05 06 00               	calll	0x4d9460 <.text+0xd8460>
  478ee2: 84 c0                        	testb	%al, %al
  478ee4: 74 51                        	je	0x478f37 <.text+0x77f37>
  478ee6: 8b 8e c0 32 01 00            	movl	0x132c0(%esi), %ecx
  478eec: a1 c4 5d 6a 00               	movl	0x6a5dc4, %eax
  478ef1: 8b 94 8e cc 53 00 00         	movl	0x53cc(%esi,%ecx,4), %edx
  478ef8: 8b 48 20                     	movl	0x20(%eax), %ecx
  478efb: 83 c2 23                     	addl	$0x23, %edx
  478efe: 52                           	pushl	%edx
  478eff: 8b 91 58 05 00 00            	movl	0x558(%ecx), %edx
  478f05: 52                           	pushl	%edx
  478f06: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  478f0b: e8 ce ea 19 00               	calll	0x6179de <.text+0x2169de>
  478f10: 83 c4 0c                     	addl	$0xc, %esp
  478f13: ba 01 00 00 00               	movl	$0x1, %edx
  478f18: b9 28 74 69 00               	movl	$0x697428, %ecx         # imm = 0x697428
  478f1d: 57                           	pushl	%edi
  478f1e: 6a ff                        	pushl	$-0x1
  478f20: 57                           	pushl	%edi
  478f21: 6a ff                        	pushl	$-0x1
  478f23: 57                           	pushl	%edi
  478f24: 6a ff                        	pushl	$-0x1
  478f26: 57                           	pushl	%edi
  478f27: 6a ff                        	pushl	$-0x1
  478f29: 6a ff                        	pushl	$-0x1
  478f2b: 6a ff                        	pushl	$-0x1
  478f2d: e8 ce dc 07 00               	calll	0x4f6c00 <.text+0xf5c00>
  478f32: e9 cc 05 00 00               	jmp	0x479503 <.text+0x78503>
  478f37: 8b 86 c0 32 01 00            	movl	0x132c0(%esi), %eax
  478f3d: c6 86 30 40 01 00 01         	movb	$0x1, 0x14030(%esi)
  478f44: c6 84 30 b2 32 01 00 01      	movb	$0x1, 0x132b2(%eax,%esi)
  478f4c: 8b 8e c0 32 01 00            	movl	0x132c0(%esi), %ecx
  478f52: 8b 84 8e a8 54 00 00         	movl	0x54a8(%esi,%ecx,4), %eax
  478f59: 8b 4e 40                     	movl	0x40(%esi), %ecx
  478f5c: 8d 04 80                     	leal	(%eax,%eax,4), %eax
  478f5f: 8d 14 c0                     	leal	(%eax,%eax,8), %edx
  478f62: a1 38 95 69 00               	movl	0x699538, %eax
  478f67: 8b 9c d0 84 0b 02 00         	movl	0x20b84(%eax,%edx,8), %ebx
  478f6e: 8d 84 d0 84 0b 02 00         	leal	0x20b84(%eax,%edx,8), %eax
  478f75: 2b d9                        	subl	%ecx, %ebx
  478f77: ba 2b 15 00 00               	movl	$0x152b, %edx           # imm = 0x152B
  478f7c: 89 18                        	movl	%ebx, (%eax)
  478f7e: 8b be c0 32 01 00            	movl	0x132c0(%esi), %edi
  478f84: 2b d7                        	subl	%edi, %edx
  478f86: 8b 0d 38 95 69 00            	movl	0x699538, %ecx
  478f8c: 8b 04 96                     	movl	(%esi,%edx,4), %eax
  478f8f: 8b 56 40                     	movl	0x40(%esi), %edx
  478f92: 8d 04 80                     	leal	(%eax,%eax,4), %eax
  478f95: 8d 04 c0                     	leal	(%eax,%eax,8), %eax
  478f98: 8d 84 c1 84 0b 02 00         	leal	0x20b84(%ecx,%eax,8), %eax
  478f9f: 01 10                        	addl	%edx, (%eax)
  478fa1: e8 ca f9 07 00               	calll	0x4f8970 <.text+0xf7970>
  478fa6: 8b f8                        	movl	%eax, %edi
  478fa8: 8d 86 20 56 00 00            	leal	0x5620(%esi), %eax
  478fae: 8d 8e bc 54 00 00            	leal	0x54bc(%esi), %ecx
  478fb4: 89 be fc 53 00 00            	movl	%edi, 0x53fc(%esi)
  478fba: 89 be 00 54 00 00            	movl	%edi, 0x5400(%esi)
  478fc0: 89 45 f0                     	movl	%eax, -0x10(%ebp)
  478fc3: 89 4d ec                     	movl	%ecx, -0x14(%ebp)
  478fc6: c7 45 e4 02 00 00 00         	movl	$0x2, -0x1c(%ebp)
  478fcd: 8b 55 ec                     	movl	-0x14(%ebp), %edx
  478fd0: c7 45 e8 00 00 00 00         	movl	$0x0, -0x18(%ebp)
  478fd7: 83 3a 00                     	cmpl	$0x0, (%edx)
  478fda: 7e 35                        	jle	0x479011 <.text+0x78011>
  478fdc: 8b 5d f0                     	movl	-0x10(%ebp), %ebx
  478fdf: 8b 13                        	movl	(%ebx), %edx
  478fe1: 83 fa 33                     	cmpl	$0x33, %edx
  478fe4: 7e 15                        	jle	0x478ffb <.text+0x77ffb>
  478fe6: b9 32 00 00 00               	movl	$0x32, %ecx
  478feb: e8 d0 37 09 00               	calll	0x50c7c0 <.text+0x10b7c0>
  478ff0: 8b 13                        	movl	(%ebx), %edx
  478ff2: d1 e0                        	shll	%eax
  478ff4: 2b c2                        	subl	%edx, %eax
  478ff6: 03 c7                        	addl	%edi, %eax
  478ff8: 89 43 a8                     	movl	%eax, -0x58(%ebx)
  478ffb: 8b 4d ec                     	movl	-0x14(%ebp), %ecx
  478ffe: 8b 45 e8                     	movl	-0x18(%ebp), %eax
  479001: 40                           	incl	%eax
  479002: 81 c3 48 05 00 00            	addl	$0x548, %ebx            # imm = 0x548
  479008: 8b 11                        	movl	(%ecx), %edx
  47900a: 89 45 e8                     	movl	%eax, -0x18(%ebp)
  47900d: 3b c2                        	cmpl	%edx, %eax
  47900f: 7c ce                        	jl	0x478fdf <.text+0x77fdf>
  479011: 8b 55 ec                     	movl	-0x14(%ebp), %edx
  479014: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  479017: 8b 45 e4                     	movl	-0x1c(%ebp), %eax
  47901a: 83 c2 04                     	addl	$0x4, %edx
  47901d: 81 c1 e8 6e 00 00            	addl	$0x6ee8, %ecx           # imm = 0x6EE8
  479023: 48                           	decl	%eax
  479024: 89 55 ec                     	movl	%edx, -0x14(%ebp)
  479027: 89 4d f0                     	movl	%ecx, -0x10(%ebp)
  47902a: 89 45 e4                     	movl	%eax, -0x1c(%ebp)
  47902d: 75 9e                        	jne	0x478fcd <.text+0x77fcd>
  47902f: 33 ff                        	xorl	%edi, %edi
  479031: e9 cd 04 00 00               	jmp	0x479503 <.text+0x78503>
  479036: 8b 83 84 00 00 00            	movl	0x84(%ebx), %eax
  47903c: a9 00 00 00 0c               	testl	$0xc000000, %eax        # imm = 0xC000000
  479041: 0f 85 c6 01 00 00            	jne	0x47920d <.text+0x7820d>
  479047: 0d 00 00 00 04               	orl	$0x4000000, %eax        # imm = 0x4000000
  47904c: 89 83 84 00 00 00            	movl	%eax, 0x84(%ebx)
  479052: 8a 8e 68 3d 01 00            	movb	0x13d68(%esi), %cl
  479058: 84 c9                        	testb	%cl, %cl
  47905a: 0f 85 93 01 00 00            	jne	0x4791f3 <.text+0x781f3>
  479060: c1 e8 06                     	shrl	$0x6, %eax
  479063: a8 01                        	testb	$0x1, %al
  479065: 0f 85 88 01 00 00            	jne	0x4791f3 <.text+0x781f3>
  47906b: 8a 55 0b                     	movb	0xb(%ebp), %dl
  47906e: 57                           	pushl	%edi
  47906f: 8d 4d c0                     	leal	-0x40(%ebp), %ecx
  479072: 88 55 c0                     	movb	%dl, -0x40(%ebp)
  479075: e8 b6 b0 f8 ff               	calll	0x404130 <.text+0x3130>
  47907a: 8b 8b cc 00 00 00            	movl	0xcc(%ebx), %ecx
  479080: b8 1f 85 eb 51               	movl	$0x51eb851f, %eax       # imm = 0x51EB851F
  479085: 89 7d fc                     	movl	%edi, -0x4(%ebp)
  479088: 8b bb 84 00 00 00            	movl	0x84(%ebx), %edi
  47908e: 8d 0c 89                     	leal	(%ecx,%ecx,4), %ecx
  479091: 81 cf 00 00 00 08            	orl	$0x8000000, %edi        # imm = 0x8000000
  479097: c1 e1 02                     	shll	$0x2, %ecx
  47909a: f7 e9                        	imull	%ecx
  47909c: c1 fa 05                     	sarl	$0x5, %edx
  47909f: 8b c2                        	movl	%edx, %eax
  4790a1: 89 bb 84 00 00 00            	movl	%edi, 0x84(%ebx)
  4790a7: c1 e8 1f                     	shrl	$0x1f, %eax
  4790aa: bf 01 00 00 00               	movl	$0x1, %edi
  4790af: 03 d0                        	addl	%eax, %edx
  4790b1: 3b d7                        	cmpl	%edi, %edx
  4790b3: 89 7d e4                     	movl	%edi, -0x1c(%ebp)
  4790b6: 89 55 e8                     	movl	%edx, -0x18(%ebp)
  4790b9: 8d 45 e4                     	leal	-0x1c(%ebp), %eax
  4790bc: 7c 03                        	jl	0x4790c1 <.text+0x780c1>
  4790be: 8d 45 e8                     	leal	-0x18(%ebp), %eax
  4790c1: 8b 08                        	movl	(%eax), %ecx
  4790c3: 8b 43 4c                     	movl	0x4c(%ebx), %eax
  4790c6: 3b c7                        	cmpl	%edi, %eax
  4790c8: 8b 43 34                     	movl	0x34(%ebx), %eax
  4790cb: 89 8b dc 04 00 00            	movl	%ecx, 0x4dc(%ebx)
  4790d1: 75 6b                        	jne	0x47913e <.text+0x7813e>
  4790d3: 85 c0                        	testl	%eax, %eax
  4790d5: 7c 1f                        	jl	0x4790f6 <.text+0x780f6>
  4790d7: 3d 96 00 00 00               	cmpl	$0x96, %eax
  4790dc: 7f 18                        	jg	0x4790f6 <.text+0x780f6>
  4790de: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  4790e5: 2b d0                        	subl	%eax, %edx
  4790e7: 8d 04 90                     	leal	(%eax,%edx,4), %eax
  4790ea: 8b 15 b0 47 67 00            	movl	0x6747b0, %edx
  4790f0: 8b 54 82 14                  	movl	0x14(%edx,%eax,4), %edx
  4790f4: eb 05                        	jmp	0x4790fb <.text+0x780fb>
  4790f6: ba 60 12 69 00               	movl	$0x691260, %edx         # imm = 0x691260
  4790fb: a1 c4 5d 6a 00               	movl	0x6a5dc4, %eax
  479100: 51                           	pushl	%ecx
  479101: 52                           	pushl	%edx
  479102: 8d 8d 68 ff ff ff            	leal	-0x98(%ebp), %ecx
  479108: 8b 40 20                     	movl	0x20(%eax), %eax
  47910b: 8b 80 e4 01 00 00            	movl	0x1e4(%eax), %eax
  479111: 50                           	pushl	%eax
  479112: 51                           	pushl	%ecx
  479113: e8 d8 36 09 00               	calll	0x50c7f0 <.text+0x10b7f0>
  479118: 83 c4 10                     	addl	$0x10, %esp
  47911b: 8b 15 0c a6 63 00            	movl	0x63a60c, %edx
  479121: 8d 4d c0                     	leal	-0x40(%ebp), %ecx
  479124: 52                           	pushl	%edx
  479125: 6a 00                        	pushl	$0x0
  479127: 50                           	pushl	%eax
  479128: c6 45 fc 01                  	movb	$0x1, -0x4(%ebp)
  47912c: e8 df b6 f8 ff               	calll	0x404810 <.text+0x3810>
  479131: c6 45 fc 00                  	movb	$0x0, -0x4(%ebp)
  479135: 57                           	pushl	%edi
  479136: 8d 8d 68 ff ff ff            	leal	-0x98(%ebp), %ecx
  47913c: eb 69                        	jmp	0x4791a7 <.text+0x781a7>
  47913e: 85 c0                        	testl	%eax, %eax
  479140: 7c 1f                        	jl	0x479161 <.text+0x78161>
  479142: 3d 96 00 00 00               	cmpl	$0x96, %eax
  479147: 7f 18                        	jg	0x479161 <.text+0x78161>
  479149: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  479150: 2b d0                        	subl	%eax, %edx
  479152: 8d 04 90                     	leal	(%eax,%edx,4), %eax
  479155: 8b 15 b0 47 67 00            	movl	0x6747b0, %edx
  47915b: 8b 54 82 18                  	movl	0x18(%edx,%eax,4), %edx
  47915f: eb 05                        	jmp	0x479166 <.text+0x78166>
  479161: ba 60 12 69 00               	movl	$0x691260, %edx         # imm = 0x691260
  479166: a1 c4 5d 6a 00               	movl	0x6a5dc4, %eax
  47916b: 51                           	pushl	%ecx
  47916c: 52                           	pushl	%edx
  47916d: 8d 8d 58 ff ff ff            	leal	-0xa8(%ebp), %ecx
  479173: 8b 40 20                     	movl	0x20(%eax), %eax
  479176: 8b 80 e8 01 00 00            	movl	0x1e8(%eax), %eax
  47917c: 50                           	pushl	%eax
  47917d: 51                           	pushl	%ecx
  47917e: e8 6d 36 09 00               	calll	0x50c7f0 <.text+0x10b7f0>
  479183: 83 c4 10                     	addl	$0x10, %esp
  479186: 8b 15 0c a6 63 00            	movl	0x63a60c, %edx
  47918c: 8d 4d c0                     	leal	-0x40(%ebp), %ecx
  47918f: 52                           	pushl	%edx
  479190: 6a 00                        	pushl	$0x0
  479192: 50                           	pushl	%eax
  479193: c6 45 fc 02                  	movb	$0x2, -0x4(%ebp)
  479197: e8 74 b6 f8 ff               	calll	0x404810 <.text+0x3810>
  47919c: c6 45 fc 00                  	movb	$0x0, -0x4(%ebp)
  4791a0: 57                           	pushl	%edi
  4791a1: 8d 8d 58 ff ff ff            	leal	-0xa8(%ebp), %ecx
  4791a7: e8 84 af f8 ff               	calll	0x404130 <.text+0x3130>
  4791ac: 8b 45 c4                     	movl	-0x3c(%ebp), %eax
  4791af: 85 c0                        	testl	%eax, %eax
  4791b1: 75 05                        	jne	0x4791b8 <.text+0x781b8>
  4791b3: b8 08 a6 63 00               	movl	$0x63a608, %eax         # imm = 0x63A608
  4791b8: 8b 8e fc 32 01 00            	movl	0x132fc(%esi), %ecx
  4791be: 6a 00                        	pushl	$0x0
  4791c0: 57                           	pushl	%edi
  4791c1: 50                           	pushl	%eax
  4791c2: e8 09 98 ff ff               	calll	0x4729d0 <.text+0x719d0>
  4791c7: 8b 4d c4                     	movl	-0x3c(%ebp), %ecx
  4791ca: c7 45 fc ff ff ff ff         	movl	$0xffffffff, -0x4(%ebp) # imm = 0xFFFFFFFF
  4791d1: 85 c9                        	testl	%ecx, %ecx
  4791d3: 74 24                        	je	0x4791f9 <.text+0x781f9>
  4791d5: 8a 41 ff                     	movb	-0x1(%ecx), %al
  4791d8: 84 c0                        	testb	%al, %al
  4791da: 74 0b                        	je	0x4791e7 <.text+0x781e7>
  4791dc: 3c ff                        	cmpb	$-0x1, %al
  4791de: 74 07                        	je	0x4791e7 <.text+0x781e7>
  4791e0: fe c8                        	decb	%al
  4791e2: 88 41 ff                     	movb	%al, -0x1(%ecx)
  4791e5: eb 12                        	jmp	0x4791f9 <.text+0x781f9>
  4791e7: 49                           	decl	%ecx
  4791e8: 51                           	pushl	%ecx
  4791e9: e8 02 1f 19 00               	calll	0x60b0f0 <.text+0x20a0f0>
  4791ee: 83 c4 04                     	addl	$0x4, %esp
  4791f1: eb 06                        	jmp	0x4791f9 <.text+0x781f9>
  4791f3: 89 bb dc 04 00 00            	movl	%edi, 0x4dc(%ebx)
  4791f9: 8b 83 dc 04 00 00            	movl	0x4dc(%ebx), %eax
  4791ff: 8b 8b cc 00 00 00            	movl	0xcc(%ebx), %ecx
  479205: 03 c8                        	addl	%eax, %ecx
  479207: 89 8b cc 00 00 00            	movl	%ecx, 0xcc(%ebx)
  47920d: b9 2e 00 00 00               	movl	$0x2e, %ecx
  479212: 33 c0                        	xorl	%eax, %eax
  479214: 8d be 31 40 01 00            	leal	0x14031(%esi), %edi
  47921a: 6a 00                        	pushl	$0x0
  47921c: f3 ab                        	rep		stosl	%eax, %es:(%edi)
  47921e: 66 ab                        	stosw	%ax, %es:(%edi)
  479220: 8b cb                        	movl	%ebx, %ecx
  479222: aa                           	stosb	%al, %es:(%edi)
  479223: e8 68 8a fc ff               	calll	0x441c90 <.text+0x40c90>
  479228: c7 45 e0 01 00 00 00         	movl	$0x1, -0x20(%ebp)
  47922f: 33 ff                        	xorl	%edi, %edi
  479231: e9 cd 02 00 00               	jmp	0x479503 <.text+0x78503>
  479236: 8b 8b 84 00 00 00            	movl	0x84(%ebx), %ecx
  47923c: 81 c9 00 00 00 02            	orl	$0x2000000, %ecx        # imm = 0x2000000
  479242: 89 8b 84 00 00 00            	movl	%ecx, 0x84(%ebx)
  479248: 8a 86 68 3d 01 00            	movb	0x13d68(%esi), %al
  47924e: 84 c0                        	testb	%al, %al
  479250: 0f 85 9a 01 00 00            	jne	0x4793f0 <.text+0x783f0>
  479256: 8a 4d 0b                     	movb	0xb(%ebp), %cl
  479259: 89 7d d4                     	movl	%edi, -0x2c(%ebp)
  47925c: 88 4d d0                     	movb	%cl, -0x30(%ebp)
  47925f: 89 7d d8                     	movl	%edi, -0x28(%ebp)
  479262: 89 7d dc                     	movl	%edi, -0x24(%ebp)
  479265: 8b 43 4c                     	movl	0x4c(%ebx), %eax
  479268: c7 45 fc 03 00 00 00         	movl	$0x3, -0x4(%ebp)
  47926f: 83 f8 01                     	cmpl	$0x1, %eax
  479272: 8b 43 34                     	movl	0x34(%ebx), %eax
  479275: 0f 85 9c 00 00 00            	jne	0x479317 <.text+0x78317>
  47927b: 3b c7                        	cmpl	%edi, %eax
  47927d: 7c 1f                        	jl	0x47929e <.text+0x7829e>
  47927f: 3d 96 00 00 00               	cmpl	$0x96, %eax
  479284: 7f 18                        	jg	0x47929e <.text+0x7829e>
  479286: 8b 0d b0 47 67 00            	movl	0x6747b0, %ecx
  47928c: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  479293: 2b d0                        	subl	%eax, %edx
  479295: 8d 04 90                     	leal	(%eax,%edx,4), %eax
  479298: 8b 4c 81 14                  	movl	0x14(%ecx,%eax,4), %ecx
  47929c: eb 05                        	jmp	0x4792a3 <.text+0x782a3>
  47929e: b9 60 12 69 00               	movl	$0x691260, %ecx         # imm = 0x691260
  4792a3: 8b 15 c4 5d 6a 00            	movl	0x6a5dc4, %edx
  4792a9: 51                           	pushl	%ecx
  4792aa: 8b 42 20                     	movl	0x20(%edx), %eax
  4792ad: 8b 80 24 02 00 00            	movl	0x224(%eax), %eax
  4792b3: 50                           	pushl	%eax
  4792b4: 8d 45 a0                     	leal	-0x60(%ebp), %eax
  4792b7: 50                           	pushl	%eax
  4792b8: e8 33 35 09 00               	calll	0x50c7f0 <.text+0x10b7f0>
  4792bd: 83 c4 0c                     	addl	$0xc, %esp
  4792c0: 8b 0d 0c a6 63 00            	movl	0x63a60c, %ecx
  4792c6: c6 45 fc 04                  	movb	$0x4, -0x4(%ebp)
  4792ca: 51                           	pushl	%ecx
  4792cb: 57                           	pushl	%edi
  4792cc: 50                           	pushl	%eax
  4792cd: 8d 4d d0                     	leal	-0x30(%ebp), %ecx
  4792d0: e8 3b b5 f8 ff               	calll	0x404810 <.text+0x3810>
  4792d5: 8b 45 a4                     	movl	-0x5c(%ebp), %eax
  4792d8: c6 45 fc 03                  	movb	$0x3, -0x4(%ebp)
  4792dc: 3b c7                        	cmpl	%edi, %eax
  4792de: 74 29                        	je	0x479309 <.text+0x78309>
  4792e0: 8d 48 ff                     	leal	-0x1(%eax), %ecx
  4792e3: 8a 40 ff                     	movb	-0x1(%eax), %al
  4792e6: 84 c0                        	testb	%al, %al
  4792e8: 74 16                        	je	0x479300 <.text+0x78300>
  4792ea: 3c ff                        	cmpb	$-0x1, %al
  4792ec: 74 12                        	je	0x479300 <.text+0x78300>
  4792ee: fe c8                        	decb	%al
  4792f0: 88 01                        	movb	%al, (%ecx)
  4792f2: 89 7d a4                     	movl	%edi, -0x5c(%ebp)
  4792f5: 89 7d a8                     	movl	%edi, -0x58(%ebp)
  4792f8: 89 7d ac                     	movl	%edi, -0x54(%ebp)
  4792fb: e9 a2 00 00 00               	jmp	0x4793a2 <.text+0x783a2>
  479300: 51                           	pushl	%ecx
  479301: e8 ea 1d 19 00               	calll	0x60b0f0 <.text+0x20a0f0>
  479306: 83 c4 04                     	addl	$0x4, %esp
  479309: 89 7d a4                     	movl	%edi, -0x5c(%ebp)
  47930c: 89 7d a8                     	movl	%edi, -0x58(%ebp)
  47930f: 89 7d ac                     	movl	%edi, -0x54(%ebp)
  479312: e9 8b 00 00 00               	jmp	0x4793a2 <.text+0x783a2>
  479317: 3b c7                        	cmpl	%edi, %eax
  479319: 7c 1f                        	jl	0x47933a <.text+0x7833a>
  47931b: 3d 96 00 00 00               	cmpl	$0x96, %eax
  479320: 7f 18                        	jg	0x47933a <.text+0x7833a>
  479322: 8b 0d b0 47 67 00            	movl	0x6747b0, %ecx
  479328: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  47932f: 2b d0                        	subl	%eax, %edx
  479331: 8d 04 90                     	leal	(%eax,%edx,4), %eax
  479334: 8b 4c 81 18                  	movl	0x18(%ecx,%eax,4), %ecx
  479338: eb 05                        	jmp	0x47933f <.text+0x7833f>
  47933a: b9 60 12 69 00               	movl	$0x691260, %ecx         # imm = 0x691260
  47933f: 8b 15 c4 5d 6a 00            	movl	0x6a5dc4, %edx
  479345: 51                           	pushl	%ecx
  479346: 8b 42 20                     	movl	0x20(%edx), %eax
  479349: 8b 80 28 02 00 00            	movl	0x228(%eax), %eax
  47934f: 50                           	pushl	%eax
  479350: 8d 45 b0                     	leal	-0x50(%ebp), %eax
  479353: 50                           	pushl	%eax
  479354: e8 97 34 09 00               	calll	0x50c7f0 <.text+0x10b7f0>
  479359: 83 c4 0c                     	addl	$0xc, %esp
  47935c: 8b 0d 0c a6 63 00            	movl	0x63a60c, %ecx
  479362: c6 45 fc 05                  	movb	$0x5, -0x4(%ebp)
  479366: 51                           	pushl	%ecx
  479367: 57                           	pushl	%edi
  479368: 50                           	pushl	%eax
  479369: 8d 4d d0                     	leal	-0x30(%ebp), %ecx
  47936c: e8 9f b4 f8 ff               	calll	0x404810 <.text+0x3810>
  479371: 8b 45 b4                     	movl	-0x4c(%ebp), %eax
  479374: c6 45 fc 03                  	movb	$0x3, -0x4(%ebp)
  479378: 3b c7                        	cmpl	%edi, %eax
  47937a: 74 1d                        	je	0x479399 <.text+0x78399>
  47937c: 8d 48 ff                     	leal	-0x1(%eax), %ecx
  47937f: 8a 40 ff                     	movb	-0x1(%eax), %al
  479382: 84 c0                        	testb	%al, %al
  479384: 74 0a                        	je	0x479390 <.text+0x78390>
  479386: 3c ff                        	cmpb	$-0x1, %al
  479388: 74 06                        	je	0x479390 <.text+0x78390>
  47938a: fe c8                        	decb	%al
  47938c: 88 01                        	movb	%al, (%ecx)
  47938e: eb 09                        	jmp	0x479399 <.text+0x78399>
  479390: 51                           	pushl	%ecx
  479391: e8 5a 1d 19 00               	calll	0x60b0f0 <.text+0x20a0f0>
  479396: 83 c4 04                     	addl	$0x4, %esp
  479399: 89 7d b4                     	movl	%edi, -0x4c(%ebp)
  47939c: 89 7d b8                     	movl	%edi, -0x48(%ebp)
  47939f: 89 7d bc                     	movl	%edi, -0x44(%ebp)
  4793a2: 8b 45 d4                     	movl	-0x2c(%ebp), %eax
  4793a5: 3b c7                        	cmpl	%edi, %eax
  4793a7: 75 05                        	jne	0x4793ae <.text+0x783ae>
  4793a9: b8 08 a6 63 00               	movl	$0x63a608, %eax         # imm = 0x63A608
  4793ae: 8b 8e fc 32 01 00            	movl	0x132fc(%esi), %ecx
  4793b4: 57                           	pushl	%edi
  4793b5: 6a 01                        	pushl	$0x1
  4793b7: 50                           	pushl	%eax
  4793b8: e8 13 96 ff ff               	calll	0x4729d0 <.text+0x719d0>
  4793bd: 8b 4d d4                     	movl	-0x2c(%ebp), %ecx
  4793c0: c7 45 fc ff ff ff ff         	movl	$0xffffffff, -0x4(%ebp) # imm = 0xFFFFFFFF
  4793c7: 3b cf                        	cmpl	%edi, %ecx
  4793c9: 74 1c                        	je	0x4793e7 <.text+0x783e7>
  4793cb: 8a 41 ff                     	movb	-0x1(%ecx), %al
  4793ce: 84 c0                        	testb	%al, %al
  4793d0: 74 0b                        	je	0x4793dd <.text+0x783dd>
  4793d2: 3c ff                        	cmpb	$-0x1, %al
  4793d4: 74 07                        	je	0x4793dd <.text+0x783dd>
  4793d6: fe c8                        	decb	%al
  4793d8: 88 41 ff                     	movb	%al, -0x1(%ecx)
  4793db: eb 0a                        	jmp	0x4793e7 <.text+0x783e7>
  4793dd: 49                           	decl	%ecx
  4793de: 51                           	pushl	%ecx
  4793df: e8 0c 1d 19 00               	calll	0x60b0f0 <.text+0x20a0f0>
  4793e4: 83 c4 04                     	addl	$0x4, %esp
  4793e7: 89 7d d4                     	movl	%edi, -0x2c(%ebp)
  4793ea: 89 7d d8                     	movl	%edi, -0x28(%ebp)
  4793ed: 89 7d dc                     	movl	%edi, -0x24(%ebp)
  4793f0: b9 2e 00 00 00               	movl	$0x2e, %ecx
  4793f5: 33 c0                        	xorl	%eax, %eax
  4793f7: 8d be 31 40 01 00            	leal	0x14031(%esi), %edi
  4793fd: 6a 00                        	pushl	$0x0
  4793ff: f3 ab                        	rep		stosl	%eax, %es:(%edi)
  479401: 66 ab                        	stosw	%ax, %es:(%edi)
  479403: 8b cb                        	movl	%ebx, %ecx
  479405: aa                           	stosb	%al, %es:(%edi)
  479406: e8 85 88 fc ff               	calll	0x441c90 <.text+0x40c90>
  47940b: c7 45 e0 01 00 00 00         	movl	$0x1, -0x20(%ebp)
  479412: 33 ff                        	xorl	%edi, %edi
  479414: e9 ea 00 00 00               	jmp	0x479503 <.text+0x78503>
  479419: 8b ce                        	movl	%esi, %ecx
  47941b: e8 f0 02 00 00               	calll	0x479710 <.text+0x78710>
  479420: 8b 56 44                     	movl	0x44(%esi), %edx
  479423: 8b cb                        	movl	%ebx, %ecx
  479425: 52                           	pushl	%edx
  479426: c6 86 30 40 01 00 01         	movb	$0x1, 0x14030(%esi)
  47942d: e8 1e c6 fc ff               	calll	0x445a50 <.text+0x44a50>
  479432: 8b 93 84 00 00 00            	movl	0x84(%ebx), %edx
  479438: 81 ca 00 00 00 04            	orl	$0x4000000, %edx        # imm = 0x4000000
  47943e: 89 93 84 00 00 00            	movl	%edx, 0x84(%ebx)
  479444: 8b 86 bc 32 01 00            	movl	0x132bc(%esi), %eax
  47944a: 8b 8e b8 32 01 00            	movl	0x132b8(%esi), %ecx
  479450: 50                           	pushl	%eax
  479451: 51                           	pushl	%ecx
  479452: 8b ce                        	movl	%esi, %ecx
  479454: e8 a7 b0 fe ff               	calll	0x464500 <.text+0x63500>
  479459: c7 45 e0 01 00 00 00         	movl	$0x1, -0x20(%ebp)
  479460: e8 0b f5 07 00               	calll	0x4f8970 <.text+0xf7970>
  479465: 8d 96 20 56 00 00            	leal	0x5620(%esi), %edx
  47946b: 89 45 ec                     	movl	%eax, -0x14(%ebp)
  47946e: 89 86 fc 53 00 00            	movl	%eax, 0x53fc(%esi)
  479474: 89 86 00 54 00 00            	movl	%eax, 0x5400(%esi)
  47947a: 89 55 f0                     	movl	%edx, -0x10(%ebp)
  47947d: 8d be bc 54 00 00            	leal	0x54bc(%esi), %edi
  479483: c7 45 e8 02 00 00 00         	movl	$0x2, -0x18(%ebp)
  47948a: 8b 07                        	movl	(%edi), %eax
  47948c: c7 45 e4 00 00 00 00         	movl	$0x0, -0x1c(%ebp)
  479493: 85 c0                        	testl	%eax, %eax
  479495: 7e 35                        	jle	0x4794cc <.text+0x784cc>
  479497: 8b 5d f0                     	movl	-0x10(%ebp), %ebx
  47949a: 8b 13                        	movl	(%ebx), %edx
  47949c: 83 fa 33                     	cmpl	$0x33, %edx
  47949f: 7e 18                        	jle	0x4794b9 <.text+0x784b9>
  4794a1: b9 32 00 00 00               	movl	$0x32, %ecx
  4794a6: e8 15 33 09 00               	calll	0x50c7c0 <.text+0x10b7c0>
  4794ab: 8b 13                        	movl	(%ebx), %edx
  4794ad: 8b 4d ec                     	movl	-0x14(%ebp), %ecx
  4794b0: d1 e0                        	shll	%eax
  4794b2: 2b c2                        	subl	%edx, %eax
  4794b4: 03 c1                        	addl	%ecx, %eax
  4794b6: 89 43 a8                     	movl	%eax, -0x58(%ebx)
  4794b9: 8b 45 e4                     	movl	-0x1c(%ebp), %eax
  4794bc: 8b 0f                        	movl	(%edi), %ecx
  4794be: 40                           	incl	%eax
  4794bf: 81 c3 48 05 00 00            	addl	$0x548, %ebx            # imm = 0x548
  4794c5: 3b c1                        	cmpl	%ecx, %eax
  4794c7: 89 45 e4                     	movl	%eax, -0x1c(%ebp)
  4794ca: 7c ce                        	jl	0x47949a <.text+0x7849a>
  4794cc: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  4794cf: 8b 45 e8                     	movl	-0x18(%ebp), %eax
  4794d2: 83 c7 04                     	addl	$0x4, %edi
  4794d5: 81 c1 e8 6e 00 00            	addl	$0x6ee8, %ecx           # imm = 0x6EE8
  4794db: 48                           	decl	%eax
  4794dc: 89 4d f0                     	movl	%ecx, -0x10(%ebp)
  4794df: 89 45 e8                     	movl	%eax, -0x18(%ebp)
  4794e2: 75 a6                        	jne	0x47948a <.text+0x7848a>
  4794e4: 33 ff                        	xorl	%edi, %edi
  4794e6: eb 1b                        	jmp	0x479503 <.text+0x78503>
  4794e8: 53                           	pushl	%ebx
  4794e9: 8b ce                        	movl	%esi, %ecx
  4794eb: e8 d0 ef ff ff               	calll	0x4784c0 <.text+0x774c0>
  4794f0: eb 0a                        	jmp	0x4794fc <.text+0x784fc>
  4794f2: 81 8b 84 00 00 00 00 00 00 04	orl	$0x4000000, 0x84(%ebx)  # imm = 0x4000000
  4794fc: c7 45 e0 01 00 00 00         	movl	$0x1, -0x20(%ebp)
  479503: 8b 45 08                     	movl	0x8(%ebp), %eax
  479506: 8b ce                        	movl	%esi, %ecx
  479508: 50                           	pushl	%eax
  479509: 89 7e 3c                     	movl	%edi, 0x3c(%esi)
  47950c: e8 0f c7 ff ff               	calll	0x475c20 <.text+0x74c20>
