
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  4e2e40: 55                           	pushl	%ebp
  4e2e41: 8b ec                        	movl	%esp, %ebp
  4e2e43: 83 ec 1c                     	subl	$0x1c, %esp
  4e2e46: 8b 55 08                     	movl	0x8(%ebp), %edx
  4e2e49: 53                           	pushl	%ebx
  4e2e4a: 56                           	pushl	%esi
  4e2e4b: 57                           	pushl	%edi
  4e2e4c: 8b f9                        	movl	%ecx, %edi
  4e2e4e: 8b b4 d7 2d 01 00 00         	movl	0x12d(%edi,%edx,8), %esi
  4e2e55: 8b 84 d7 31 01 00 00         	movl	0x131(%edi,%edx,8), %eax
  4e2e5c: 83 fe ff                     	cmpl	$-0x1, %esi
  4e2e5f: 89 75 e4                     	movl	%esi, -0x1c(%ebp)
  4e2e62: 89 45 e8                     	movl	%eax, -0x18(%ebp)
  4e2e65: 0f 84 40 01 00 00            	je	0x4e2fab <.text+0xe1fab>
  4e2e6b: 8b 0d 68 0b 66 00            	movl	0x660b68, %ecx
  4e2e71: 8b de                        	movl	%esi, %ebx
  4e2e73: c1 e3 05                     	shll	$0x5, %ebx
  4e2e76: c6 45 ff 00                  	movb	$0x0, -0x1(%ebp)
  4e2e7a: 89 5d ec                     	movl	%ebx, -0x14(%ebp)
  4e2e7d: 8b 44 0b 14                  	movl	0x14(%ebx,%ecx), %eax
  4e2e81: 83 f8 ff                     	cmpl	$-0x1, %eax
  4e2e84: 0f 84 d0 00 00 00            	je	0x4e2f5a <.text+0xe1f5a>
  4e2e8a: 8d 14 40                     	leal	(%eax,%eax,2), %edx
  4e2e8d: a1 6c 0b 66 00               	movl	0x660b6c, %eax
  4e2e92: 33 f6                        	xorl	%esi, %esi
  4e2e94: bb 58 e7 63 00               	movl	$0x63e758, %ebx         # imm = 0x63E758
  4e2e99: 8d 4c d0 04                  	leal	0x4(%eax,%edx,8), %ecx
  4e2e9d: c6 45 fe 00                  	movb	$0x0, -0x2(%ebp)
  4e2ea1: 89 4d f4                     	movl	%ecx, -0xc(%ebp)
  4e2ea4: 89 75 f0                     	movl	%esi, -0x10(%ebp)
  4e2ea7: 89 75 f8                     	movl	%esi, -0x8(%ebp)
  4e2eaa: 81 fb 98 e9 63 00            	cmpl	$0x63e998, %ebx         # imm = 0x63E998
  4e2eb0: 72 08                        	jb	0x4e2eba <.text+0xe1eba>
  4e2eb2: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
  4e2eb5: e8 e6 17 f5 ff               	calll	0x4346a0 <.text+0x336a0>
  4e2eba: 8b 45 f4                     	movl	-0xc(%ebp), %eax
  4e2ebd: 8b ce                        	movl	%esi, %ecx
  4e2ebf: 83 e1 1f                     	andl	$0x1f, %ecx
  4e2ec2: ba 01 00 00 00               	movl	$0x1, %edx
  4e2ec7: d3 e2                        	shll	%cl, %edx
  4e2ec9: c1 ee 05                     	shrl	$0x5, %esi
  4e2ecc: 85 14 b0                     	testl	%edx, (%eax,%esi,4)
  4e2ecf: 74 61                        	je	0x4e2f32 <.text+0xe1f32>
  4e2ed1: be 8a fb ff ff               	movl	$0xfffffb8a, %esi       # imm = 0xFFFFFB8A
  4e2ed6: 8d 87 76 04 00 00            	leal	0x476(%edi), %eax
  4e2edc: 8b cb                        	movl	%ebx, %ecx
  4e2ede: 2b f7                        	subl	%edi, %esi
  4e2ee0: 8a 11                        	movb	(%ecx), %dl
  4e2ee2: 28 10                        	subb	%dl, (%eax)
  4e2ee4: 41                           	incl	%ecx
  4e2ee5: 40                           	incl	%eax
  4e2ee6: 8d 14 06                     	leal	(%esi,%eax), %edx
  4e2ee9: 83 fa 04                     	cmpl	$0x4, %edx
  4e2eec: 7c f2                        	jl	0x4e2ee0 <.text+0xe1ee0>
  4e2eee: 8a 45 ff                     	movb	-0x1(%ebp), %al
  4e2ef1: 8b 0d 68 0b 66 00            	movl	0x660b68, %ecx
  4e2ef7: 84 c0                        	testb	%al, %al
  4e2ef9: 75 0f                        	jne	0x4e2f0a <.text+0xe1f0a>
  4e2efb: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  4e2efe: c6 45 ff 00                  	movb	$0x0, -0x1(%ebp)
  4e2f02: 8a 54 08 1d                  	movb	0x1d(%eax,%ecx), %dl
  4e2f06: 84 d2                        	testb	%dl, %dl
  4e2f08: 74 04                        	je	0x4e2f0e <.text+0xe1f0e>
  4e2f0a: c6 45 ff 01                  	movb	$0x1, -0x1(%ebp)
  4e2f0e: 8b 55 f8                     	movl	-0x8(%ebp), %edx
  4e2f11: 8b 44 0a 08                  	movl	0x8(%edx,%ecx), %eax
  4e2f15: 8b 55 ec                     	movl	-0x14(%ebp), %edx
  4e2f18: 3b 44 0a 08                  	cmpl	0x8(%edx,%ecx), %eax
  4e2f1c: 75 0d                        	jne	0x4e2f2b <.text+0xe1f2b>
  4e2f1e: 8a 4d fe                     	movb	-0x2(%ebp), %cl
  4e2f21: 84 c9                        	testb	%cl, %cl
  4e2f23: 75 06                        	jne	0x4e2f2b <.text+0xe1f2b>
  4e2f25: c6 45 fe 01                  	movb	$0x1, -0x2(%ebp)
  4e2f29: eb 07                        	jmp	0x4e2f32 <.text+0xe1f32>
  4e2f2b: fe 8c 38 c5 01 00 00         	decb	0x1c5(%eax,%edi)
  4e2f32: 8b 75 f0                     	movl	-0x10(%ebp), %esi
  4e2f35: 8b 4d f8                     	movl	-0x8(%ebp), %ecx
  4e2f38: 83 c3 04                     	addl	$0x4, %ebx
  4e2f3b: 46                           	incl	%esi
  4e2f3c: 83 c1 20                     	addl	$0x20, %ecx
  4e2f3f: 81 fb 98 e9 63 00            	cmpl	$0x63e998, %ebx         # imm = 0x63E998
  4e2f45: 89 75 f0                     	movl	%esi, -0x10(%ebp)
  4e2f48: 89 4d f8                     	movl	%ecx, -0x8(%ebp)
  4e2f4b: 0f 8c 5f ff ff ff            	jl	0x4e2eb0 <.text+0xe1eb0>
  4e2f51: 8b 5d ec                     	movl	-0x14(%ebp), %ebx
  4e2f54: 8b 75 e4                     	movl	-0x1c(%ebp), %esi
  4e2f57: 8b 55 08                     	movl	0x8(%ebp), %edx
  4e2f5a: 83 c8 ff                     	orl	$-0x1, %eax
  4e2f5d: 83 c9 ff                     	orl	$-0x1, %ecx
  4e2f60: 89 84 d7 2d 01 00 00         	movl	%eax, 0x12d(%edi,%edx,8)
  4e2f67: 89 8c d7 31 01 00 00         	movl	%ecx, 0x131(%edi,%edx,8)
  4e2f6e: b9 8a fb ff ff               	movl	$0xfffffb8a, %ecx       # imm = 0xFFFFFB8A
  4e2f73: 8d 87 76 04 00 00            	leal	0x476(%edi), %eax
  4e2f79: 8d 34 b5 58 e7 63 00         	leal	0x63e758(,%esi,4), %esi
  4e2f80: 2b cf                        	subl	%edi, %ecx
  4e2f82: 8a 16                        	movb	(%esi), %dl
  4e2f84: 28 10                        	subb	%dl, (%eax)
  4e2f86: 46                           	incl	%esi
  4e2f87: 40                           	incl	%eax
  4e2f88: 8d 14 08                     	leal	(%eax,%ecx), %edx
  4e2f8b: 83 fa 04                     	cmpl	$0x4, %edx
  4e2f8e: 7c f2                        	jl	0x4e2f82 <.text+0xe1f82>
  4e2f90: 8a 45 ff                     	movb	-0x1(%ebp), %al
  4e2f93: 84 c0                        	testb	%al, %al
  4e2f95: 75 0d                        	jne	0x4e2fa4 <.text+0xe1fa4>
  4e2f97: a1 68 0b 66 00               	movl	0x660b68, %eax
  4e2f9c: 8a 4c 03 1d                  	movb	0x1d(%ebx,%eax), %cl
  4e2fa0: 84 c9                        	testb	%cl, %cl
  4e2fa2: 74 07                        	je	0x4e2fab <.text+0xe1fab>
  4e2fa4: 8b cf                        	movl	%edi, %ecx
  4e2fa6: e8 95 68 ff ff               	calll	0x4d9840 <.text+0xd8840>
  4e2fab: 5f                           	popl	%edi
  4e2fac: 5e                           	popl	%esi
  4e2fad: 5b                           	popl	%ebx
  4e2fae: 8b e5                        	movl	%ebp, %esp
  4e2fb0: 5d                           	popl	%ebp
  4e2fb1: c2 04 00                     	retl	$0x4
