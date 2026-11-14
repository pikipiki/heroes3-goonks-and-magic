
ERA_REFERENCE_ROOT/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a7870: 55                           	pushl	%ebp
  5a7871: 8b ec                        	movl	%esp, %ebp
  5a7873: 51                           	pushl	%ecx
  5a7874: 53                           	pushl	%ebx
  5a7875: 56                           	pushl	%esi
  5a7876: 8b 75 08                     	movl	0x8(%ebp), %esi
  5a7879: 57                           	pushl	%edi
  5a787a: 8b d9                        	movl	%ecx, %ebx
  5a787c: 8b 46 38                     	movl	0x38(%esi), %eax
  5a787f: 89 45 fc                     	movl	%eax, -0x4(%ebp)
  5a7882: 8b 46 4c                     	movl	0x4c(%esi), %eax
  5a7885: 85 c0                        	testl	%eax, %eax
  5a7887: 89 45 08                     	movl	%eax, 0x8(%ebp)
  5a788a: 74 09                        	je	0x5a7895 <.text+0x1a6895>
  5a788c: 6a 00                        	pushl	$0x0
  5a788e: 8b ce                        	movl	%esi, %ecx
  5a7890: e8 0b b5 e9 ff               	calll	0x442da0 <.text+0x41da0>
  5a7895: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  5a7898: 8d 3c 08                     	leal	(%eax,%ecx), %edi
  5a789b: 8b 8e c0 00 00 00            	movl	0xc0(%esi), %ecx
  5a78a1: 8d 44 39 ff                  	leal	-0x1(%ecx,%edi), %eax
  5a78a5: 99                           	cltd
  5a78a6: f7 f9                        	idivl	%ecx
  5a78a8: 8b d0                        	movl	%eax, %edx
  5a78aa: 89 46 4c                     	movl	%eax, 0x4c(%esi)
  5a78ad: 0f af d1                     	imull	%ecx, %edx
  5a78b0: 8b 4e 60                     	movl	0x60(%esi), %ecx
  5a78b3: 2b d7                        	subl	%edi, %edx
  5a78b5: 3b c1                        	cmpl	%ecx, %eax
  5a78b7: 89 56 58                     	movl	%edx, 0x58(%esi)
  5a78ba: 7e 0a                        	jle	0x5a78c6 <.text+0x1a68c6>
  5a78bc: 89 4e 4c                     	movl	%ecx, 0x4c(%esi)
  5a78bf: c7 46 58 00 00 00 00         	movl	$0x0, 0x58(%esi)
  5a78c6: 8a 45 10                     	movb	0x10(%ebp), %al
  5a78c9: 84 c0                        	testb	%al, %al
  5a78cb: 74 29                        	je	0x5a78f6 <.text+0x1a68f6>
  5a78cd: 8b 46 4c                     	movl	0x4c(%esi), %eax
  5a78d0: 8b 7d 08                     	movl	0x8(%ebp), %edi
  5a78d3: 8b 56 54                     	movl	0x54(%esi), %edx
  5a78d6: 2b c7                        	subl	%edi, %eax
  5a78d8: 03 d0                        	addl	%eax, %edx
  5a78da: 89 4d 10                     	movl	%ecx, 0x10(%ebp)
  5a78dd: 8b c2                        	movl	%edx, %eax
  5a78df: 89 56 54                     	movl	%edx, 0x54(%esi)
  5a78e2: 89 45 08                     	movl	%eax, 0x8(%ebp)
  5a78e5: 3b c8                        	cmpl	%eax, %ecx
  5a78e7: 8d 45 10                     	leal	0x10(%ebp), %eax
  5a78ea: 7c 03                        	jl	0x5a78ef <.text+0x1a68ef>
  5a78ec: 8d 45 08                     	leal	0x8(%ebp), %eax
  5a78ef: 8b 08                        	movl	(%eax), %ecx
  5a78f1: 89 4e 54                     	movl	%ecx, 0x54(%esi)
  5a78f4: eb 03                        	jmp	0x5a78f9 <.text+0x1a68f9>
  5a78f6: 8b 7d 08                     	movl	0x8(%ebp), %edi
  5a78f9: 85 ff                        	testl	%edi, %edi
  5a78fb: 7f 78                        	jg	0x5a7975 <.text+0x1a6975>
  5a78fd: 8b ce                        	movl	%esi, %ecx
  5a78ff: e8 8c 6e e9 ff               	calll	0x43e790 <.text+0x3d790>
  5a7904: 8b 55 fc                     	movl	-0x4(%ebp), %edx
  5a7907: 8b cb                        	movl	%ebx, %ecx
  5a7909: 52                           	pushl	%edx
  5a790a: 56                           	pushl	%esi
  5a790b: e8 90 0a ec ff               	calll	0x4683a0 <.text+0x673a0>
  5a7910: 8b 86 f8 00 00 00            	movl	0xf8(%esi), %eax
  5a7916: 8b 8e f4 00 00 00            	movl	0xf4(%esi), %ecx
  5a791c: 50                           	pushl	%eax
  5a791d: 8b 46 38                     	movl	0x38(%esi), %eax
  5a7920: 51                           	pushl	%ecx
  5a7921: 8b cb                        	movl	%ebx, %ecx
  5a7923: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  5a792a: 2b d0                        	subl	%eax, %edx
  5a792c: c1 e2 04                     	shll	$0x4, %edx
  5a792f: 8d 84 1a c4 01 00 00         	leal	0x1c4(%edx,%ebx), %eax
  5a7936: 50                           	pushl	%eax
  5a7937: e8 f4 fc ff ff               	calll	0x5a7630 <.text+0x1a6630>
  5a793c: f6 86 84 00 00 00 01         	testb	$0x1, 0x84(%esi)
  5a7943: 74 30                        	je	0x5a7975 <.text+0x1a6975>
  5a7945: 8b 8e f8 00 00 00            	movl	0xf8(%esi), %ecx
  5a794b: 8b 96 f4 00 00 00            	movl	0xf4(%esi), %edx
  5a7951: 51                           	pushl	%ecx
  5a7952: 52                           	pushl	%edx
  5a7953: 8b ce                        	movl	%esi, %ecx
  5a7955: e8 66 ea e9 ff               	calll	0x4463c0 <.text+0x453c0>
  5a795a: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  5a7961: 2b c8                        	subl	%eax, %ecx
  5a7963: c1 e1 04                     	shll	$0x4, %ecx
  5a7966: 8d 94 19 c4 01 00 00         	leal	0x1c4(%ecx,%ebx), %edx
  5a796d: 8b cb                        	movl	%ebx, %ecx
  5a796f: 52                           	pushl	%edx
  5a7970: e8 bb fc ff ff               	calll	0x5a7630 <.text+0x1a6630>
  5a7975: 8b 96 f4 00 00 00            	movl	0xf4(%esi), %edx
  5a797b: 8b 4e 44                     	movl	0x44(%esi), %ecx
  5a797e: b8 01 00 00 00               	movl	$0x1, %eax
  5a7983: 2b c2                        	subl	%edx, %eax
  5a7985: 3b c8                        	cmpl	%eax, %ecx
  5a7987: 74 09                        	je	0x5a7992 <.text+0x1a6992>
  5a7989: 6a 00                        	pushl	$0x0
  5a798b: 8b ce                        	movl	%esi, %ecx
  5a798d: e8 ae ea e9 ff               	calll	0x446440 <.text+0x45440>
  5a7992: 8b cb                        	movl	%ebx, %ecx
  5a7994: e8 e7 26 ec ff               	calll	0x46a080 <.text+0x69080>
  5a7999: 84 c0                        	testb	%al, %al
  5a799b: 0f 85 cc 01 00 00            	jne	0x5a7b6d <.text+0x1a6b6d>
  5a79a1: 8b 4e 4c                     	movl	0x4c(%esi), %ecx
  5a79a4: 8b 46 34                     	movl	0x34(%esi), %eax
  5a79a7: 2b cf                        	subl	%edi, %ecx
  5a79a9: 83 f9 01                     	cmpl	$0x1, %ecx
  5a79ac: 74 3b                        	je	0x5a79e9 <.text+0x1a69e9>
  5a79ae: 85 c0                        	testl	%eax, %eax
  5a79b0: 7c 1f                        	jl	0x5a79d1 <.text+0x1a69d1>
  5a79b2: 3d 96 00 00 00               	cmpl	$0x96, %eax
  5a79b7: 7f 18                        	jg	0x5a79d1 <.text+0x1a69d1>
  5a79b9: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  5a79c0: 2b d0                        	subl	%eax, %edx
  5a79c2: 8d 04 90                     	leal	(%eax,%edx,4), %eax
  5a79c5: 8b 15 b0 47 67 00            	movl	0x6747b0, %edx
  5a79cb: 8b 44 82 18                  	movl	0x18(%edx,%eax,4), %eax
  5a79cf: eb 05                        	jmp	0x5a79d6 <.text+0x1a69d6>
  5a79d1: b8 60 12 69 00               	movl	$0x691260, %eax         # imm = 0x691260
  5a79d6: 50                           	pushl	%eax
  5a79d7: a1 c4 5d 6a 00               	movl	0x6a5dc4, %eax
  5a79dc: 51                           	pushl	%ecx
  5a79dd: 8b 48 20                     	movl	0x20(%eax), %ecx
  5a79e0: 8b 91 d4 01 00 00            	movl	0x1d4(%ecx), %edx
  5a79e6: 52                           	pushl	%edx
  5a79e7: eb 3a                        	jmp	0x5a7a23 <.text+0x1a6a23>
  5a79e9: 85 c0                        	testl	%eax, %eax
  5a79eb: 7c 1e                        	jl	0x5a7a0b <.text+0x1a6a0b>
  5a79ed: 3d 96 00 00 00               	cmpl	$0x96, %eax
  5a79f2: 7f 17                        	jg	0x5a7a0b <.text+0x1a6a0b>
  5a79f4: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  5a79fb: 2b c8                        	subl	%eax, %ecx
  5a79fd: 8d 14 88                     	leal	(%eax,%ecx,4), %edx
  5a7a00: a1 b0 47 67 00               	movl	0x6747b0, %eax
  5a7a05: 8b 44 90 14                  	movl	0x14(%eax,%edx,4), %eax
  5a7a09: eb 05                        	jmp	0x5a7a10 <.text+0x1a6a10>
  5a7a0b: b8 60 12 69 00               	movl	$0x691260, %eax         # imm = 0x691260
  5a7a10: 8b 0d c4 5d 6a 00            	movl	0x6a5dc4, %ecx
  5a7a16: 50                           	pushl	%eax
  5a7a17: 6a 01                        	pushl	$0x1
  5a7a19: 8b 51 20                     	movl	0x20(%ecx), %edx
  5a7a1c: 8b 82 d8 01 00 00            	movl	0x1d8(%edx), %eax
  5a7a22: 50                           	pushl	%eax
  5a7a23: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  5a7a28: e8 b1 ff 06 00               	calll	0x6179de <.text+0x2169de>
  5a7a2d: 8b 8b fc 32 01 00            	movl	0x132fc(%ebx), %ecx
  5a7a33: 83 c4 10                     	addl	$0x10, %esp
  5a7a36: 6a 00                        	pushl	$0x0
  5a7a38: 6a 01                        	pushl	$0x1
  5a7a3a: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  5a7a3f: e8 8c af ec ff               	calll	0x4729d0 <.text+0x719d0>
  5a7a44: 8b 0d a8 7f 68 00            	movl	0x687fa8, %ecx
  5a7a4a: 8b 83 ec 32 01 00            	movl	0x132ec(%ebx), %eax
  5a7a50: 8b b9 38 14 00 00            	movl	0x1438(%ecx), %edi
  5a7a56: 3b c7                        	cmpl	%edi, %eax
  5a7a58: 74 3b                        	je	0x5a7a95 <.text+0x1a6a95>
  5a7a5a: 8b 8b e8 32 01 00            	movl	0x132e8(%ebx), %ecx
  5a7a60: 85 c9                        	testl	%ecx, %ecx
  5a7a62: 74 05                        	je	0x5a7a69 <.text+0x1a6a69>
  5a7a64: 8b 11                        	movl	(%ecx), %edx
  5a7a66: ff 52 04                     	calll	*0x4(%edx)
  5a7a69: 83 ff ff                     	cmpl	$-0x1, %edi
  5a7a6c: 74 17                        	je	0x5a7a85 <.text+0x1a6a85>
  5a7a6e: 8d 04 7f                     	leal	(%edi,%edi,2), %eax
  5a7a71: 8b 0c 85 18 1e 64 00         	movl	0x641e18(,%eax,4), %ecx
  5a7a78: e8 43 4f fb ff               	calll	0x55c9c0 <.text+0x15b9c0>
  5a7a7d: 89 83 e8 32 01 00            	movl	%eax, 0x132e8(%ebx)
  5a7a83: eb 0a                        	jmp	0x5a7a8f <.text+0x1a6a8f>
  5a7a85: c7 83 e8 32 01 00 00 00 00 00	movl	$0x0, 0x132e8(%ebx)
  5a7a8f: 89 bb ec 32 01 00            	movl	%edi, 0x132ec(%ebx)
  5a7a95: 8b 83 e8 32 01 00            	movl	0x132e8(%ebx), %eax
  5a7a9b: 85 c0                        	testl	%eax, %eax
  5a7a9d: 74 18                        	je	0x5a7ab7 <.text+0x1a6ab7>
  5a7a9f: 8b 48 28                     	movl	0x28(%eax), %ecx
  5a7aa2: 85 c9                        	testl	%ecx, %ecx
  5a7aa4: 7e 11                        	jle	0x5a7ab7 <.text+0x1a6ab7>
  5a7aa6: 8b 48 2c                     	movl	0x2c(%eax), %ecx
  5a7aa9: 83 39 00                     	cmpl	$0x0, (%ecx)
  5a7aac: 74 09                        	je	0x5a7ab7 <.text+0x1a6ab7>
  5a7aae: 8b 50 1c                     	movl	0x1c(%eax), %edx
  5a7ab1: 8b 02                        	movl	(%edx), %eax
  5a7ab3: 8b 08                        	movl	(%eax), %ecx
  5a7ab5: eb 02                        	jmp	0x5a7ab9 <.text+0x1a6ab9>
  5a7ab7: 33 c9                        	xorl	%ecx, %ecx
  5a7ab9: 8b 86 64 01 00 00            	movl	0x164(%esi), %eax
  5a7abf: 83 78 28 05                  	cmpl	$0x5, 0x28(%eax)
  5a7ac3: 7e 16                        	jle	0x5a7adb <.text+0x1a6adb>
  5a7ac5: 8b 50 2c                     	movl	0x2c(%eax), %edx
  5a7ac8: 83 7a 14 00                  	cmpl	$0x0, 0x14(%edx)
  5a7acc: 74 0d                        	je	0x5a7adb <.text+0x1a6adb>
  5a7ace: 8b 40 1c                     	movl	0x1c(%eax), %eax
  5a7ad1: 8b 50 14                     	movl	0x14(%eax), %edx
  5a7ad4: 8b 02                        	movl	(%edx), %eax
  5a7ad6: 89 45 10                     	movl	%eax, 0x10(%ebp)
  5a7ad9: eb 0a                        	jmp	0x5a7ae5 <.text+0x1a6ae5>
  5a7adb: c7 45 10 00 00 00 00         	movl	$0x0, 0x10(%ebp)
  5a7ae2: 8b 45 10                     	movl	0x10(%ebp), %eax
  5a7ae5: 89 45 08                     	movl	%eax, 0x8(%ebp)
  5a7ae8: 3b c8                        	cmpl	%eax, %ecx
  5a7aea: 89 4d 0c                     	movl	%ecx, 0xc(%ebp)
  5a7aed: 8d 45 08                     	leal	0x8(%ebp), %eax
  5a7af0: 7c 03                        	jl	0x5a7af5 <.text+0x1a6af5>
  5a7af2: 8d 45 0c                     	leal	0xc(%ebp), %eax
  5a7af5: 8b 00                        	movl	(%eax), %eax
  5a7af7: 8d 0c 7f                     	leal	(%edi,%edi,2), %ecx
  5a7afa: c6 46 20 01                  	movb	$0x1, 0x20(%esi)
  5a7afe: ba 01 00 00 00               	movl	$0x1, %edx
  5a7b03: 8b 0c 8d 1c 1e 64 00         	movl	0x641e1c(,%ecx,4), %ecx
  5a7b0a: 89 45 0c                     	movl	%eax, 0xc(%ebp)
  5a7b0d: e8 3e ec f0 ff               	calll	0x4b6750 <.text+0xb5750>
  5a7b12: 8b 45 0c                     	movl	0xc(%ebp), %eax
  5a7b15: 33 ff                        	xorl	%edi, %edi
  5a7b17: 85 c0                        	testl	%eax, %eax
  5a7b19: 7e 52                        	jle	0x5a7b6d <.text+0x1a6b6d>
  5a7b1b: 8b 55 10                     	movl	0x10(%ebp), %edx
  5a7b1e: 4a                           	decl	%edx
  5a7b1f: 89 55 08                     	movl	%edx, 0x8(%ebp)
  5a7b22: 89 bb f0 32 01 00            	movl	%edi, 0x132f0(%ebx)
  5a7b28: 8b 46 3c                     	movl	0x3c(%esi), %eax
  5a7b2b: 83 f8 05                     	cmpl	$0x5, %eax
  5a7b2e: 75 1b                        	jne	0x5a7b4b <.text+0x1a6b4b>
  5a7b30: 3b 7d 10                     	cmpl	0x10(%ebp), %edi
  5a7b33: 7d 08                        	jge	0x5a7b3d <.text+0x1a6b3d>
  5a7b35: 8b 45 08                     	movl	0x8(%ebp), %eax
  5a7b38: 89 46 40                     	movl	%eax, 0x40(%esi)
  5a7b3b: eb 0e                        	jmp	0x5a7b4b <.text+0x1a6b4b>
  5a7b3d: c7 46 3c 02 00 00 00         	movl	$0x2, 0x3c(%esi)
  5a7b44: c7 46 40 00 00 00 00         	movl	$0x0, 0x40(%esi)
  5a7b4b: 6a 01                        	pushl	$0x1
  5a7b4d: 6a 01                        	pushl	$0x1
  5a7b4f: 6a 64                        	pushl	$0x64
  5a7b51: 6a 00                        	pushl	$0x0
  5a7b53: 6a 00                        	pushl	$0x0
  5a7b55: 6a 01                        	pushl	$0x1
  5a7b57: 8b cb                        	movl	%ebx, %ecx
  5a7b59: e8 62 c4 ee ff               	calll	0x493fc0 <.text+0x92fc0>
  5a7b5e: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  5a7b61: 8b 45 0c                     	movl	0xc(%ebp), %eax
  5a7b64: 47                           	incl	%edi
  5a7b65: 49                           	decl	%ecx
  5a7b66: 3b f8                        	cmpl	%eax, %edi
  5a7b68: 89 4d 08                     	movl	%ecx, 0x8(%ebp)
  5a7b6b: 7c b5                        	jl	0x5a7b22 <.text+0x1a6b22>
  5a7b6d: 8b 8e 84 00 00 00            	movl	0x84(%esi), %ecx
  5a7b73: 6a 00                        	pushl	$0x0
  5a7b75: 6a 01                        	pushl	$0x1
  5a7b77: 81 e1 ff ff df ff            	andl	$0xffdfffff, %ecx       # imm = 0xFFDFFFFF
  5a7b7d: 6a 00                        	pushl	$0x0
  5a7b7f: 6a 00                        	pushl	$0x0
  5a7b81: 89 8e 84 00 00 00            	movl	%ecx, 0x84(%esi)
  5a7b87: 6a 00                        	pushl	$0x0
  5a7b89: 6a 01                        	pushl	$0x1
  5a7b8b: 8b cb                        	movl	%ebx, %ecx
  5a7b8d: c6 46 20 00                  	movb	$0x0, 0x20(%esi)
  5a7b91: e8 2a c4 ee ff               	calll	0x493fc0 <.text+0x92fc0>
  5a7b96: 5f                           	popl	%edi
  5a7b97: 5e                           	popl	%esi
  5a7b98: 5b                           	popl	%ebx
  5a7b99: 8b e5                        	movl	%ebp, %esp
  5a7b9b: 5d                           	popl	%ebp
  5a7b9c: c2 0c 00                     	retl	$0xc
