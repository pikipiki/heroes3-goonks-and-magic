
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  4e2c70: 55                           	pushl	%ebp
  4e2c71: 8b ec                        	movl	%esp, %ebp
  4e2c73: 83 ec 14                     	subl	$0x14, %esp
  4e2c76: 53                           	pushl	%ebx
  4e2c77: 56                           	pushl	%esi
  4e2c78: 8b 75 0c                     	movl	0xc(%ebp), %esi
  4e2c7b: 57                           	pushl	%edi
  4e2c7c: 83 fe ff                     	cmpl	$-0x1, %esi
  4e2c7f: 8b f9                        	movl	%ecx, %edi
  4e2c81: 75 1c                        	jne	0x4e2c9f <.text+0xe1c9f>
  4e2c83: 33 f6                        	xorl	%esi, %esi
  4e2c85: 83 fe 13                     	cmpl	$0x13, %esi
  4e2c88: 7d 27                        	jge	0x4e2cb1 <.text+0xe1cb1>
  4e2c8a: 8b 5d 08                     	movl	0x8(%ebp), %ebx
  4e2c8d: 56                           	pushl	%esi
  4e2c8e: 8b cf                        	movl	%edi, %ecx
  4e2c90: 8b 03                        	movl	(%ebx), %eax
  4e2c92: 50                           	pushl	%eax
  4e2c93: e8 28 fb ff ff               	calll	0x4e27c0 <.text+0xe17c0>
  4e2c98: 84 c0                        	testb	%al, %al
  4e2c9a: 75 23                        	jne	0x4e2cbf <.text+0xe1cbf>
  4e2c9c: 46                           	incl	%esi
  4e2c9d: eb e6                        	jmp	0x4e2c85 <.text+0xe1c85>
  4e2c9f: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  4e2ca2: 56                           	pushl	%esi
  4e2ca3: 8b 11                        	movl	(%ecx), %edx
  4e2ca5: 8b cf                        	movl	%edi, %ecx
  4e2ca7: 52                           	pushl	%edx
  4e2ca8: e8 13 fb ff ff               	calll	0x4e27c0 <.text+0xe17c0>
  4e2cad: 84 c0                        	testb	%al, %al
  4e2caf: 75 0b                        	jne	0x4e2cbc <.text+0xe1cbc>
  4e2cb1: 5f                           	popl	%edi
  4e2cb2: 5e                           	popl	%esi
  4e2cb3: 32 c0                        	xorb	%al, %al
  4e2cb5: 5b                           	popl	%ebx
  4e2cb6: 8b e5                        	movl	%ebp, %esp
  4e2cb8: 5d                           	popl	%ebp
  4e2cb9: c2 08 00                     	retl	$0x8
  4e2cbc: 8b 5d 08                     	movl	0x8(%ebp), %ebx
  4e2cbf: 8b 03                        	movl	(%ebx), %eax
  4e2cc1: 89 84 f7 2d 01 00 00         	movl	%eax, 0x12d(%edi,%esi,8)
  4e2cc8: 8b 4b 04                     	movl	0x4(%ebx), %ecx
  4e2ccb: 89 8c f7 31 01 00 00         	movl	%ecx, 0x131(%edi,%esi,8)
  4e2cd2: 8b 03                        	movl	(%ebx), %eax
  4e2cd4: 3d 87 00 00 00               	cmpl	$0x87, %eax
  4e2cd9: 75 24                        	jne	0x4e2cff <.text+0xe1cff>
  4e2cdb: 8b 8f b5 01 00 00            	movl	0x1b5(%edi), %ecx
  4e2ce1: 83 c8 ff                     	orl	$-0x1, %eax
  4e2ce4: 3b c8                        	cmpl	%eax, %ecx
  4e2ce6: 75 17                        	jne	0x4e2cff <.text+0xe1cff>
  4e2ce8: 8d 55 ec                     	leal	-0x14(%ebp), %edx
  4e2ceb: 6a 11                        	pushl	$0x11
  4e2ced: 52                           	pushl	%edx
  4e2cee: 8b cf                        	movl	%edi, %ecx
  4e2cf0: c7 45 ec 00 00 00 00         	movl	$0x0, -0x14(%ebp)
  4e2cf7: 89 45 f0                     	movl	%eax, -0x10(%ebp)
  4e2cfa: e8 71 ff ff ff               	calll	0x4e2c70 <.text+0xe1c70>
  4e2cff: 8b 03                        	movl	(%ebx), %eax
  4e2d01: 8b 0d 68 0b 66 00            	movl	0x660b68, %ecx
  4e2d07: c1 e0 05                     	shll	$0x5, %eax
  4e2d0a: c6 45 0f 00                  	movb	$0x0, 0xf(%ebp)
  4e2d0e: 8b 44 08 14                  	movl	0x14(%eax,%ecx), %eax
  4e2d12: 83 f8 ff                     	cmpl	$-0x1, %eax
  4e2d15: 0f 84 cf 00 00 00            	je	0x4e2dea <.text+0xe1dea>
  4e2d1b: 8d 14 40                     	leal	(%eax,%eax,2), %edx
  4e2d1e: a1 6c 0b 66 00               	movl	0x660b6c, %eax
  4e2d23: 33 f6                        	xorl	%esi, %esi
  4e2d25: bb 58 e7 63 00               	movl	$0x63e758, %ebx         # imm = 0x63E758
  4e2d2a: 8d 4c d0 04                  	leal	0x4(%eax,%edx,8), %ecx
  4e2d2e: c6 45 ff 00                  	movb	$0x0, -0x1(%ebp)
  4e2d32: 89 4d f4                     	movl	%ecx, -0xc(%ebp)
  4e2d35: 89 75 f0                     	movl	%esi, -0x10(%ebp)
  4e2d38: 89 75 f8                     	movl	%esi, -0x8(%ebp)
  4e2d3b: 81 fb 98 e9 63 00            	cmpl	$0x63e998, %ebx         # imm = 0x63E998
  4e2d41: 72 08                        	jb	0x4e2d4b <.text+0xe1d4b>
  4e2d43: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
  4e2d46: e8 55 19 f5 ff               	calll	0x4346a0 <.text+0x336a0>
  4e2d4b: 8b 45 f4                     	movl	-0xc(%ebp), %eax
  4e2d4e: 8b ce                        	movl	%esi, %ecx
  4e2d50: 83 e1 1f                     	andl	$0x1f, %ecx
  4e2d53: ba 01 00 00 00               	movl	$0x1, %edx
  4e2d58: d3 e2                        	shll	%cl, %edx
  4e2d5a: c1 ee 05                     	shrl	$0x5, %esi
  4e2d5d: 85 14 b0                     	testl	%edx, (%eax,%esi,4)
  4e2d60: 74 66                        	je	0x4e2dc8 <.text+0xe1dc8>
  4e2d62: be 8a fb ff ff               	movl	$0xfffffb8a, %esi       # imm = 0xFFFFFB8A
  4e2d67: 8d 87 76 04 00 00            	leal	0x476(%edi), %eax
  4e2d6d: 8b cb                        	movl	%ebx, %ecx
  4e2d6f: 2b f7                        	subl	%edi, %esi
  4e2d71: 8a 11                        	movb	(%ecx), %dl
  4e2d73: 00 10                        	addb	%dl, (%eax)
  4e2d75: 41                           	incl	%ecx
  4e2d76: 40                           	incl	%eax
  4e2d77: 8d 14 06                     	leal	(%esi,%eax), %edx
  4e2d7a: 83 fa 04                     	cmpl	$0x4, %edx
  4e2d7d: 7c f2                        	jl	0x4e2d71 <.text+0xe1d71>
  4e2d7f: 8a 45 0f                     	movb	0xf(%ebp), %al
  4e2d82: 8b 0d 68 0b 66 00            	movl	0x660b68, %ecx
  4e2d88: 84 c0                        	testb	%al, %al
  4e2d8a: 75 0f                        	jne	0x4e2d9b <.text+0xe1d9b>
  4e2d8c: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  4e2d8f: c6 45 0f 00                  	movb	$0x0, 0xf(%ebp)
  4e2d93: 8a 54 08 1d                  	movb	0x1d(%eax,%ecx), %dl
  4e2d97: 84 d2                        	testb	%dl, %dl
  4e2d99: 74 04                        	je	0x4e2d9f <.text+0xe1d9f>
  4e2d9b: c6 45 0f 01                  	movb	$0x1, 0xf(%ebp)
  4e2d9f: 8b 55 f8                     	movl	-0x8(%ebp), %edx
  4e2da2: 8b 44 0a 08                  	movl	0x8(%edx,%ecx), %eax
  4e2da6: 8b 55 08                     	movl	0x8(%ebp), %edx
  4e2da9: 8b 12                        	movl	(%edx), %edx
  4e2dab: c1 e2 05                     	shll	$0x5, %edx
  4e2dae: 3b 44 0a 08                  	cmpl	0x8(%edx,%ecx), %eax
  4e2db2: 75 0d                        	jne	0x4e2dc1 <.text+0xe1dc1>
  4e2db4: 8a 4d ff                     	movb	-0x1(%ebp), %cl
  4e2db7: 84 c9                        	testb	%cl, %cl
  4e2db9: 75 06                        	jne	0x4e2dc1 <.text+0xe1dc1>
  4e2dbb: c6 45 ff 01                  	movb	$0x1, -0x1(%ebp)
  4e2dbf: eb 07                        	jmp	0x4e2dc8 <.text+0xe1dc8>
  4e2dc1: fe 84 38 c5 01 00 00         	incb	0x1c5(%eax,%edi)
  4e2dc8: 8b 75 f0                     	movl	-0x10(%ebp), %esi
  4e2dcb: 8b 4d f8                     	movl	-0x8(%ebp), %ecx
  4e2dce: 83 c3 04                     	addl	$0x4, %ebx
  4e2dd1: 46                           	incl	%esi
  4e2dd2: 83 c1 20                     	addl	$0x20, %ecx
  4e2dd5: 81 fb 98 e9 63 00            	cmpl	$0x63e998, %ebx         # imm = 0x63E998
  4e2ddb: 89 75 f0                     	movl	%esi, -0x10(%ebp)
  4e2dde: 89 4d f8                     	movl	%ecx, -0x8(%ebp)
  4e2de1: 0f 8c 5a ff ff ff            	jl	0x4e2d41 <.text+0xe1d41>
  4e2de7: 8b 5d 08                     	movl	0x8(%ebp), %ebx
  4e2dea: 33 c0                        	xorl	%eax, %eax
  4e2dec: 8b 0b                        	movl	(%ebx), %ecx
  4e2dee: 8a 94 88 58 e7 63 00         	movb	0x63e758(%eax,%ecx,4), %dl
  4e2df5: 8a 8c 07 76 04 00 00         	movb	0x476(%edi,%eax), %cl
  4e2dfc: 02 ca                        	addb	%dl, %cl
  4e2dfe: 88 8c 07 76 04 00 00         	movb	%cl, 0x476(%edi,%eax)
  4e2e05: 40                           	incl	%eax
  4e2e06: 83 f8 04                     	cmpl	$0x4, %eax
  4e2e09: 7c e1                        	jl	0x4e2dec <.text+0xe1dec>
  4e2e0b: 8a 45 0f                     	movb	0xf(%ebp), %al
  4e2e0e: 84 c0                        	testb	%al, %al
  4e2e10: 75 13                        	jne	0x4e2e25 <.text+0xe1e25>
  4e2e12: 8b 03                        	movl	(%ebx), %eax
  4e2e14: 8b 0d 68 0b 66 00            	movl	0x660b68, %ecx
  4e2e1a: c1 e0 05                     	shll	$0x5, %eax
  4e2e1d: 8a 54 08 1d                  	movb	0x1d(%eax,%ecx), %dl
  4e2e21: 84 d2                        	testb	%dl, %dl
  4e2e23: 74 07                        	je	0x4e2e2c <.text+0xe1e2c>
  4e2e25: 8b cf                        	movl	%edi, %ecx
  4e2e27: e8 14 6a ff ff               	calll	0x4d9840 <.text+0xd8840>
  4e2e2c: 5f                           	popl	%edi
  4e2e2d: 5e                           	popl	%esi
  4e2e2e: b0 01                        	movb	$0x1, %al
  4e2e30: 5b                           	popl	%ebx
  4e2e31: 8b e5                        	movl	%ebp, %esp
  4e2e33: 5d                           	popl	%ebp
  4e2e34: c2 08 00                     	retl	$0x8
  4e2e37: 90                           	nop
  4e2e38: 90                           	nop
  4e2e39: 90                           	nop
  4e2e3a: 90                           	nop
  4e2e3b: 90                           	nop
  4e2e3c: 90                           	nop
  4e2e3d: 90                           	nop
  4e2e3e: 90                           	nop
  4e2e3f: 90                           	nop
