
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  479a30: 55                           	pushl	%ebp
  479a31: 8b ec                        	movl	%esp, %ebp
  479a33: 83 ec 08                     	subl	$0x8, %esp
  479a36: 53                           	pushl	%ebx
  479a37: 56                           	pushl	%esi
  479a38: 57                           	pushl	%edi
  479a39: 8b 7d 08                     	movl	0x8(%ebp), %edi
  479a3c: 33 d2                        	xorl	%edx, %edx
  479a3e: 8b f1                        	movl	%ecx, %esi
  479a40: 8d 04 ff                     	leal	(%edi,%edi,8), %eax
  479a43: 89 55 f8                     	movl	%edx, -0x8(%ebp)
  479a46: 89 55 fc                     	movl	%edx, -0x4(%ebp)
  479a49: 8d 04 87                     	leal	(%edi,%eax,4), %eax
  479a4c: c1 e0 05                     	shll	$0x5, %eax
  479a4f: 2b c7                        	subl	%edi, %eax
  479a51: 8d 0c 40                     	leal	(%eax,%eax,2), %ecx
  479a54: 8d 84 ce 50 55 00 00         	leal	0x5550(%esi,%ecx,8), %eax
  479a5b: 83 78 b0 ff                  	cmpl	$-0x1, -0x50(%eax)
  479a5f: 74 40                        	je	0x479aa1 <.text+0x78aa1>
  479a61: 8b 48 c8                     	movl	-0x38(%eax), %ecx
  479a64: 85 c9                        	testl	%ecx, %ecx
  479a66: 75 14                        	jne	0x479a7c <.text+0x78a7c>
  479a68: 8b 08                        	movl	(%eax), %ecx
  479a6a: 8b d9                        	movl	%ecx, %ebx
  479a6c: c1 eb 15                     	shrl	$0x15, %ebx
  479a6f: f6 c3 01                     	testb	$0x1, %bl
  479a72: 74 08                        	je	0x479a7c <.text+0x78a7c>
  479a74: c1 e9 16                     	shrl	$0x16, %ecx
  479a77: f6 c1 01                     	testb	$0x1, %cl
  479a7a: 75 19                        	jne	0x479a95 <.text+0x78a95>
  479a7c: 42                           	incl	%edx
  479a7d: 05 48 05 00 00               	addl	$0x548, %eax            # imm = 0x548
  479a82: 83 fa 14                     	cmpl	$0x14, %edx
  479a85: 7c d4                        	jl	0x479a5b <.text+0x78a5b>
  479a87: 89 55 fc                     	movl	%edx, -0x4(%ebp)
  479a8a: 5f                           	popl	%edi
  479a8b: 5e                           	popl	%esi
  479a8c: 33 c0                        	xorl	%eax, %eax
  479a8e: 5b                           	popl	%ebx
  479a8f: 8b e5                        	movl	%ebp, %esp
  479a91: 5d                           	popl	%ebp
  479a92: c2 18 00                     	retl	$0x18
  479a95: 89 55 fc                     	movl	%edx, -0x4(%ebp)
  479a98: c7 45 f8 01 00 00 00         	movl	$0x1, -0x8(%ebp)
  479a9f: eb 03                        	jmp	0x479aa4 <.text+0x78aa4>
  479aa1: 89 55 fc                     	movl	%edx, -0x4(%ebp)
  479aa4: 83 fa ff                     	cmpl	$-0x1, %edx
  479aa7: 74 e1                        	je	0x479a8a <.text+0x78a8a>
  479aa9: 8b 45 14                     	movl	0x14(%ebp), %eax
  479aac: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  479ab3: 2b c8                        	subl	%eax, %ecx
  479ab5: c1 e1 04                     	shll	$0x4, %ecx
  479ab8: 8a 84 31 dc 01 00 00         	movb	0x1dc(%ecx,%esi), %al
  479abf: 84 c0                        	testb	%al, %al
  479ac1: 7d c7                        	jge	0x479a8a <.text+0x78a8a>
  479ac3: 8d 04 fd 00 00 00 00         	leal	(,%edi,8), %eax
  479aca: 6a ff                        	pushl	$-0x1
  479acc: 2b c7                        	subl	%edi, %eax
  479ace: 8d 0c 42                     	leal	(%edx,%eax,2), %ecx
  479ad1: 03 c1                        	addl	%ecx, %eax
  479ad3: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  479ada: 2b c8                        	subl	%eax, %ecx
  479adc: 8d 0c 49                     	leal	(%ecx,%ecx,2), %ecx
  479adf: 8d 04 c8                     	leal	(%eax,%ecx,8), %eax
  479ae2: 8b 4d 14                     	movl	0x14(%ebp), %ecx
  479ae5: 51                           	pushl	%ecx
  479ae6: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  479ae9: 52                           	pushl	%edx
  479aea: 8b 94 be cc 53 00 00         	movl	0x53cc(%esi,%edi,4), %edx
  479af1: 8d 1c c6                     	leal	(%esi,%eax,8), %ebx
  479af4: 8b 45 10                     	movl	0x10(%ebp), %eax
  479af7: 57                           	pushl	%edi
  479af8: 89 5d 08                     	movl	%ebx, 0x8(%ebp)
  479afb: 52                           	pushl	%edx
  479afc: 81 c3 cc 54 00 00            	addl	$0x54cc, %ebx           # imm = 0x54CC
  479b02: 50                           	pushl	%eax
  479b03: 51                           	pushl	%ecx
  479b04: 8b cb                        	movl	%ebx, %ecx
  479b06: e8 c5 3a fc ff               	calll	0x43d5d0 <.text+0x3c5d0>
  479b0b: 8b cb                        	movl	%ebx, %ecx
  479b0d: e8 fe 3b fc ff               	calll	0x43d710 <.text+0x3c710>
  479b12: 8b 55 18                     	movl	0x18(%ebp), %edx
  479b15: 8b 8b 84 00 00 00            	movl	0x84(%ebx), %ecx
  479b1b: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  479b1e: 0b ca                        	orl	%edx, %ecx
  479b20: 85 c0                        	testl	%eax, %eax
  479b22: 89 8b 84 00 00 00            	movl	%ecx, 0x84(%ebx)
  479b28: 75 07                        	jne	0x479b31 <.text+0x78b31>
  479b2a: ff 84 be bc 54 00 00         	incl	0x54bc(%esi,%edi,4)
  479b31: 8b 45 1c                     	movl	0x1c(%ebp), %eax
  479b34: 85 c0                        	testl	%eax, %eax
  479b36: 0f 84 b6 00 00 00            	je	0x479bf2 <.text+0x78bf2>
  479b3c: 8b ce                        	movl	%esi, %ecx
  479b3e: e8 3d 05 ff ff               	calll	0x46a080 <.text+0x69080>
  479b43: 84 c0                        	testb	%al, %al
  479b45: 0f 85 a7 00 00 00            	jne	0x479bf2 <.text+0x78bf2>
  479b4b: 8b ce                        	movl	%esi, %ecx
  479b4d: e8 3e 97 01 00               	calll	0x493290 <.text+0x92290>
  479b52: 8b 45 08                     	movl	0x8(%ebp), %eax
  479b55: 81 b8 00 55 00 00 95 00 00 00	cmpl	$0x95, 0x5500(%eax)
  479b5f: 75 0a                        	jne	0x479b6b <.text+0x78b6b>
  479b61: 53                           	pushl	%ebx
  479b62: 8b ce                        	movl	%esi, %ecx
  479b64: e8 d7 04 ff ff               	calll	0x46a040 <.text+0x69040>
  479b69: eb 11                        	jmp	0x479b7c <.text+0x78b7c>
  479b6b: 8b 55 fc                     	movl	-0x4(%ebp), %edx
  479b6e: 8d 8c bf 00 50 00 00         	leal	0x5000(%edi,%edi,4), %ecx
  479b75: 8d 04 8a                     	leal	(%edx,%ecx,4), %eax
  479b78: c6 04 30 01                  	movb	$0x1, (%eax,%esi)
  479b7c: 8b ce                        	movl	%esi, %ecx
  479b7e: e8 ed bb 01 00               	calll	0x495770 <.text+0x94770>
  479b83: 8b 86 3c 3d 01 00            	movl	0x13d3c(%esi), %eax
  479b89: 8b 96 44 3d 01 00            	movl	0x13d44(%esi), %edx
  479b8f: 8b 8e 38 3d 01 00            	movl	0x13d38(%esi), %ecx
  479b95: 2b d0                        	subl	%eax, %edx
  479b97: 42                           	incl	%edx
  479b98: 52                           	pushl	%edx
  479b99: 8b 96 40 3d 01 00            	movl	0x13d40(%esi), %edx
  479b9f: 2b d1                        	subl	%ecx, %edx
  479ba1: 42                           	incl	%edx
  479ba2: 52                           	pushl	%edx
  479ba3: 50                           	pushl	%eax
  479ba4: 51                           	pushl	%ecx
  479ba5: 8b 0d d0 92 69 00            	movl	0x6992d0, %ecx
  479bab: e8 d0 96 18 00               	calll	0x603280 <.text+0x202280>
  479bb0: 6a 00                        	pushl	$0x0
  479bb2: 6a 01                        	pushl	$0x1
  479bb4: 6a 00                        	pushl	$0x0
  479bb6: 6a 00                        	pushl	$0x0
  479bb8: 6a 00                        	pushl	$0x0
  479bba: 6a 00                        	pushl	$0x0
  479bbc: 8b ce                        	movl	%esi, %ecx
  479bbe: e8 fd a3 01 00               	calll	0x493fc0 <.text+0x92fc0>
  479bc3: 8b 86 3c 3d 01 00            	movl	0x13d3c(%esi), %eax
  479bc9: 8b 96 44 3d 01 00            	movl	0x13d44(%esi), %edx
  479bcf: 8b 8e 38 3d 01 00            	movl	0x13d38(%esi), %ecx
  479bd5: 2b d0                        	subl	%eax, %edx
  479bd7: 42                           	incl	%edx
  479bd8: 6a 4b                        	pushl	$0x4b
  479bda: 52                           	pushl	%edx
  479bdb: 8b 96 40 3d 01 00            	movl	0x13d40(%esi), %edx
  479be1: 2b d1                        	subl	%ecx, %edx
  479be3: 42                           	incl	%edx
  479be4: 52                           	pushl	%edx
  479be5: 50                           	pushl	%eax
  479be6: 51                           	pushl	%ecx
  479be7: 8b 0d d0 92 69 00            	movl	0x6992d0, %ecx
  479bed: e8 8e 97 18 00               	calll	0x603380 <.text+0x202380>
  479bf2: 5f                           	popl	%edi
  479bf3: 8b c3                        	movl	%ebx, %eax
  479bf5: 5e                           	popl	%esi
  479bf6: 5b                           	popl	%ebx
  479bf7: 8b e5                        	movl	%ebp, %esp
  479bf9: 5d                           	popl	%ebp
  479bfa: c2 18 00                     	retl	$0x18
  479bfd: 90                           	nop
  479bfe: 90                           	nop
  479bff: 90                           	nop
  479c00: 55                           	pushl	%ebp
  479c01: 8b ec                        	movl	%esp, %ebp
  479c03: 51                           	pushl	%ecx
  479c04: 8b 55 0c                     	movl	0xc(%ebp), %edx
  479c07: 56                           	pushl	%esi
  479c08: c7 45 fc 00 00 00 00         	movl	$0x0, -0x4(%ebp)
  479c0f: 8b 84 91 60 3f 01 00         	movl	0x13f60(%ecx,%edx,4), %eax
  479c16: 85 c0                        	testl	%eax, %eax
  479c18: 7f 40                        	jg	0x479c5a <.text+0x78c5a>
  479c1a: 8b 81 c8 53 00 00            	movl	0x53c8(%ecx), %eax
  479c20: 8b 75 08                     	movl	0x8(%ebp), %esi
  479c23: 0f be 40 04                  	movsbl	0x4(%eax), %eax
  479c27: 8d 0c c0                     	leal	(%eax,%eax,8), %ecx
  479c2a: 8d 04 4a                     	leal	(%edx,%ecx,2), %eax
  479c2d: 8b 0d c4 5d 6a 00            	movl	0x6a5dc4, %ecx
  479c33: 8d 14 c0                     	leal	(%eax,%eax,8), %edx
  479c36: 8b 04 95 64 d8 66 00         	movl	0x66d864(,%edx,4), %eax
  479c3d: 8b 51 20                     	movl	0x20(%ecx), %edx
  479c40: 50                           	pushl	%eax
  479c41: 8b 82 6c 02 00 00            	movl	0x26c(%edx), %eax
  479c47: 50                           	pushl	%eax
  479c48: 56                           	pushl	%esi
  479c49: e8 a2 2b 09 00               	calll	0x50c7f0 <.text+0x10b7f0>
  479c4e: 83 c4 0c                     	addl	$0xc, %esp
  479c51: 8b c6                        	movl	%esi, %eax
  479c53: 5e                           	popl	%esi
  479c54: 8b e5                        	movl	%ebp, %esp
  479c56: 5d                           	popl	%ebp
  479c57: c2 10 00                     	retl	$0x10
  479c5a: 8b 45 10                     	movl	0x10(%ebp), %eax
  479c5d: 8b 89 c8 53 00 00            	movl	0x53c8(%ecx), %ecx
  479c63: 8d 34 40                     	leal	(%eax,%eax,2), %esi
  479c66: 03 c0                        	addl	%eax, %eax
  479c68: 56                           	pushl	%esi
  479c69: 50                           	pushl	%eax
  479c6a: 8b 45 14                     	movl	0x14(%ebp), %eax
  479c6d: 8b 75 08                     	movl	0x8(%ebp), %esi
  479c70: 50                           	pushl	%eax
  479c71: 0f be 41 04                  	movsbl	0x4(%ecx), %eax
  479c75: 8d 04 c0                     	leal	(%eax,%eax,8), %eax
  479c78: 8d 04 42                     	leal	(%edx,%eax,2), %eax
  479c7b: 8d 0c c0                     	leal	(%eax,%eax,8), %ecx
  479c7e: a1 c4 5d 6a 00               	movl	0x6a5dc4, %eax
  479c83: 8b 14 8d 64 d8 66 00         	movl	0x66d864(,%ecx,4), %edx
  479c8a: 8b 48 20                     	movl	0x20(%eax), %ecx
  479c8d: 52                           	pushl	%edx
  479c8e: 8b 91 70 02 00 00            	movl	0x270(%ecx), %edx
  479c94: 52                           	pushl	%edx
  479c95: 56                           	pushl	%esi
  479c96: e8 55 2b 09 00               	calll	0x50c7f0 <.text+0x10b7f0>
  479c9b: 83 c4 18                     	addl	$0x18, %esp
  479c9e: 8b c6                        	movl	%esi, %eax
  479ca0: 5e                           	popl	%esi
  479ca1: 8b e5                        	movl	%ebp, %esp
  479ca3: 5d                           	popl	%ebp
  479ca4: c2 10 00                     	retl	$0x10
  479ca7: 90                           	nop
  479ca8: 90                           	nop
  479ca9: 90                           	nop
  479caa: 90                           	nop
  479cab: 90                           	nop
  479cac: 90                           	nop
  479cad: 90                           	nop
  479cae: 90                           	nop
  479caf: 90                           	nop
  479cb0: 55                           	pushl	%ebp
  479cb1: 8b ec                        	movl	%esp, %ebp
  479cb3: 6a ff                        	pushl	$-0x1
  479cb5: 68 10 a9 62 00               	pushl	$0x62a910               # imm = 0x62A910
  479cba: 64 a1 00 00 00 00            	movl	%fs:0x0, %eax
  479cc0: 50                           	pushl	%eax
  479cc1: 64 89 25 00 00 00 00         	movl	%esp, %fs:0x0
  479cc8: 83 ec 28                     	subl	$0x28, %esp
  479ccb: 53                           	pushl	%ebx
  479ccc: 56                           	pushl	%esi
  479ccd: 8b f1                        	movl	%ecx, %esi
  479ccf: 83 be f4 32 01 00 02         	cmpl	$0x2, 0x132f4(%esi)
  479cd6: 0f 8c 42 01 00 00            	jl	0x479e1e <.text+0x78e1e>
  479cdc: 8a 45 0b                     	movb	0xb(%ebp), %al
  479cdf: 33 db                        	xorl	%ebx, %ebx
  479ce1: 53                           	pushl	%ebx
  479ce2: 8d 4d dc                     	leal	-0x24(%ebp), %ecx
  479ce5: 88 45 dc                     	movb	%al, -0x24(%ebp)
  479ce8: e8 43 a4 f8 ff               	calll	0x404130 <.text+0x3130>
  479ced: 8d 4d f0                     	leal	-0x10(%ebp), %ecx
  479cf0: 8d 55 ec                     	leal	-0x14(%ebp), %edx
  479cf3: 51                           	pushl	%ecx
  479cf4: 8b 8e c8 53 00 00            	movl	0x53c8(%esi), %ecx
  479cfa: 52                           	pushl	%edx
  479cfb: 89 5d fc                     	movl	%ebx, -0x4(%ebp)
  479cfe: e8 ed 5b 14 00               	calll	0x5bf8f0 <.text+0x1be8f0>
  479d03: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  479d06: 8b 4d ec                     	movl	-0x14(%ebp), %ecx
  479d09: 50                           	pushl	%eax
  479d0a: 51                           	pushl	%ecx
  479d0b: 8d 55 cc                     	leal	-0x34(%ebp), %edx
  479d0e: 6a 0e                        	pushl	$0xe
  479d10: 52                           	pushl	%edx
  479d11: 8b ce                        	movl	%esi, %ecx
  479d13: e8 e8 fe ff ff               	calll	0x479c00 <.text+0x78c00>
  479d18: 8b 0d 0c a6 63 00            	movl	0x63a60c, %ecx
  479d1e: c6 45 fc 01                  	movb	$0x1, -0x4(%ebp)
  479d22: 51                           	pushl	%ecx
  479d23: 53                           	pushl	%ebx
  479d24: 50                           	pushl	%eax
  479d25: 8d 4d dc                     	leal	-0x24(%ebp), %ecx
  479d28: e8 e3 aa f8 ff               	calll	0x404810 <.text+0x3810>
  479d2d: 6a 01                        	pushl	$0x1
  479d2f: 8d 4d cc                     	leal	-0x34(%ebp), %ecx
  479d32: 88 5d fc                     	movb	%bl, -0x4(%ebp)
  479d35: e8 f6 a3 f8 ff               	calll	0x404130 <.text+0x3130>
  479d3a: 83 be f4 32 01 00 03         	cmpl	$0x3, 0x132f4(%esi)
  479d41: 7c 7c                        	jl	0x479dbf <.text+0x78dbf>
  479d43: 8b 45 ec                     	movl	-0x14(%ebp), %eax
  479d46: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  479d49: 40                           	incl	%eax
  479d4a: 52                           	pushl	%edx
  479d4b: 99                           	cltd
  479d4c: 2b c2                        	subl	%edx, %eax
  479d4e: 8d 4d cc                     	leal	-0x34(%ebp), %ecx
  479d51: d1 f8                        	sarl	%eax
  479d53: 50                           	pushl	%eax
  479d54: 6a 05                        	pushl	$0x5
  479d56: 51                           	pushl	%ecx
  479d57: 8b ce                        	movl	%esi, %ecx
  479d59: e8 a2 fe ff ff               	calll	0x479c00 <.text+0x78c00>
  479d5e: 8b 15 0c a6 63 00            	movl	0x63a60c, %edx
  479d64: 8d 4d dc                     	leal	-0x24(%ebp), %ecx
  479d67: 52                           	pushl	%edx
  479d68: 53                           	pushl	%ebx
  479d69: 50                           	pushl	%eax
  479d6a: c6 45 fc 02                  	movb	$0x2, -0x4(%ebp)
  479d6e: e8 3d 14 fa ff               	calll	0x41b1b0 <.text+0x1a1b0>
  479d73: 6a 01                        	pushl	$0x1
  479d75: 8d 4d cc                     	leal	-0x34(%ebp), %ecx
  479d78: 88 5d fc                     	movb	%bl, -0x4(%ebp)
  479d7b: e8 b0 a3 f8 ff               	calll	0x404130 <.text+0x3130>
  479d80: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  479d83: 8b 4d ec                     	movl	-0x14(%ebp), %ecx
  479d86: 50                           	pushl	%eax
  479d87: 8d 41 01                     	leal	0x1(%ecx), %eax
  479d8a: 8b ce                        	movl	%esi, %ecx
  479d8c: 99                           	cltd
  479d8d: 2b c2                        	subl	%edx, %eax
  479d8f: 8d 55 cc                     	leal	-0x34(%ebp), %edx
  479d92: d1 f8                        	sarl	%eax
  479d94: 50                           	pushl	%eax
  479d95: 6a 0d                        	pushl	$0xd
  479d97: 52                           	pushl	%edx
  479d98: e8 63 fe ff ff               	calll	0x479c00 <.text+0x78c00>
  479d9d: 8b 0d 0c a6 63 00            	movl	0x63a60c, %ecx
  479da3: c6 45 fc 03                  	movb	$0x3, -0x4(%ebp)
  479da7: 51                           	pushl	%ecx
  479da8: 53                           	pushl	%ebx
  479da9: 50                           	pushl	%eax
  479daa: 8d 4d dc                     	leal	-0x24(%ebp), %ecx
  479dad: e8 fe 13 fa ff               	calll	0x41b1b0 <.text+0x1a1b0>
  479db2: 6a 01                        	pushl	$0x1
  479db4: 8d 4d cc                     	leal	-0x34(%ebp), %ecx
  479db7: 88 5d fc                     	movb	%bl, -0x4(%ebp)
  479dba: e8 71 a3 f8 ff               	calll	0x404130 <.text+0x3130>
  479dbf: 8b 4d e0                     	movl	-0x20(%ebp), %ecx
  479dc2: 3b cb                        	cmpl	%ebx, %ecx
  479dc4: 75 05                        	jne	0x479dcb <.text+0x78dcb>
  479dc6: b9 08 a6 63 00               	movl	$0x63a608, %ecx         # imm = 0x63A608
  479dcb: 8b 55 08                     	movl	0x8(%ebp), %edx
  479dce: 53                           	pushl	%ebx
  479dcf: 6a ff                        	pushl	$-0x1
  479dd1: 53                           	pushl	%ebx
  479dd2: 6a ff                        	pushl	$-0x1
  479dd4: 53                           	pushl	%ebx
  479dd5: f7 da                        	negl	%edx
  479dd7: 6a ff                        	pushl	$-0x1
  479dd9: 53                           	pushl	%ebx
  479dda: 1b d2                        	sbbl	%edx, %edx
  479ddc: 6a ff                        	pushl	$-0x1
  479dde: 83 e2 03                     	andl	$0x3, %edx
  479de1: 6a ff                        	pushl	$-0x1
  479de3: 6a ff                        	pushl	$-0x1
  479de5: 42                           	incl	%edx
  479de6: e8 15 ce 07 00               	calll	0x4f6c00 <.text+0xf5c00>
  479deb: 8b 4d e0                     	movl	-0x20(%ebp), %ecx
  479dee: 3b cb                        	cmpl	%ebx, %ecx
  479df0: 74 2c                        	je	0x479e1e <.text+0x78e1e>
  479df2: 8a 41 ff                     	movb	-0x1(%ecx), %al
  479df5: 3a c3                        	cmpb	%bl, %al
  479df7: 74 1b                        	je	0x479e14 <.text+0x78e14>
  479df9: 3c ff                        	cmpb	$-0x1, %al
  479dfb: 74 17                        	je	0x479e14 <.text+0x78e14>
  479dfd: fe c8                        	decb	%al
  479dff: 5e                           	popl	%esi
