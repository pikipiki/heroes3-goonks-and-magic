
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  463dd0: 55                           	pushl	%ebp
  463dd1: 8b ec                        	movl	%esp, %ebp
  463dd3: 8b 45 08                     	movl	0x8(%ebp), %eax
  463dd6: 56                           	pushl	%esi
  463dd7: 33 f6                        	xorl	%esi, %esi
  463dd9: 57                           	pushl	%edi
  463dda: 33 d2                        	xorl	%edx, %edx
  463ddc: 8b bc 81 c4 54 00 00         	movl	0x54c4(%ecx,%eax,4), %edi
  463de3: 83 c2 04                     	addl	$0x4, %edx
  463de6: 83 fa 1c                     	cmpl	$0x1c, %edx
  463de9: c7 44 17 fc ff ff ff ff      	movl	$0xffffffff, -0x4(%edi,%edx) # imm = 0xFFFFFFFF
  463df1: 8b bc 81 c4 54 00 00         	movl	0x54c4(%ecx,%eax,4), %edi
  463df8: 89 74 17 18                  	movl	%esi, 0x18(%edi,%edx)
  463dfc: 7c de                        	jl	0x463ddc <.text+0x62ddc>
  463dfe: 8b 94 81 bc 54 00 00         	movl	0x54bc(%ecx,%eax,4), %edx
  463e05: 89 75 08                     	movl	%esi, 0x8(%ebp)
  463e08: 3b d6                        	cmpl	%esi, %edx
  463e0a: 0f 8e 94 00 00 00            	jle	0x463ea4 <.text+0x62ea4>
  463e10: 8d 14 c0                     	leal	(%eax,%eax,8), %edx
  463e13: 53                           	pushl	%ebx
  463e14: 8d 14 90                     	leal	(%eax,%edx,4), %edx
  463e17: c1 e2 05                     	shll	$0x5, %edx
  463e1a: 2b d0                        	subl	%eax, %edx
  463e1c: 8d 14 52                     	leal	(%edx,%edx,2), %edx
  463e1f: 8d b4 d1 50 55 00 00         	leal	0x5550(%ecx,%edx,8), %esi
  463e26: 8b 56 c8                     	movl	-0x38(%esi), %edx
  463e29: 85 d2                        	testl	%edx, %edx
  463e2b: 7e 5e                        	jle	0x463e8b <.text+0x62e8b>
  463e2d: 8b 3e                        	movl	(%esi), %edi
  463e2f: 8b d7                        	movl	%edi, %edx
  463e31: c1 ea 15                     	shrl	$0x15, %edx
  463e34: f6 c2 01                     	testb	$0x1, %dl
  463e37: 75 52                        	jne	0x463e8b <.text+0x62e8b>
  463e39: 83 bc 81 a8 54 00 00 ff      	cmpl	$-0x1, 0x54a8(%ecx,%eax,4)
  463e41: 74 0a                        	je	0x463e4d <.text+0x62e4d>
  463e43: 8b d7                        	movl	%edi, %edx
  463e45: c1 ea 16                     	shrl	$0x16, %edx
  463e48: f6 c2 01                     	testb	$0x1, %dl
  463e4b: 75 3e                        	jne	0x463e8b <.text+0x62e8b>
  463e4d: 8b d7                        	movl	%edi, %edx
  463e4f: c1 ea 17                     	shrl	$0x17, %edx
  463e52: f6 c2 01                     	testb	$0x1, %dl
  463e55: 75 34                        	jne	0x463e8b <.text+0x62e8b>
  463e57: 8b d7                        	movl	%edi, %edx
  463e59: c1 ea 06                     	shrl	$0x6, %edx
  463e5c: f6 c2 01                     	testb	$0x1, %dl
  463e5f: 75 2a                        	jne	0x463e8b <.text+0x62e8b>
  463e61: 8b 56 d8                     	movl	-0x28(%esi), %edx
  463e64: 85 d2                        	testl	%edx, %edx
  463e66: 7c 23                        	jl	0x463e8b <.text+0x62e8b>
  463e68: 83 fa 07                     	cmpl	$0x7, %edx
  463e6b: 7d 1e                        	jge	0x463e8b <.text+0x62e8b>
  463e6d: 8b bc 81 c4 54 00 00         	movl	0x54c4(%ecx,%eax,4), %edi
  463e74: 8b 5e b0                     	movl	-0x50(%esi), %ebx
  463e77: 89 1c 97                     	movl	%ebx, (%edi,%edx,4)
  463e7a: 8b 56 d8                     	movl	-0x28(%esi), %edx
  463e7d: 8b bc 81 c4 54 00 00         	movl	0x54c4(%ecx,%eax,4), %edi
  463e84: 8b 5e c8                     	movl	-0x38(%esi), %ebx
  463e87: 89 5c 97 1c                  	movl	%ebx, 0x1c(%edi,%edx,4)
  463e8b: 8b 55 08                     	movl	0x8(%ebp), %edx
  463e8e: 8b bc 81 bc 54 00 00         	movl	0x54bc(%ecx,%eax,4), %edi
  463e95: 42                           	incl	%edx
  463e96: 81 c6 48 05 00 00            	addl	$0x548, %esi            # imm = 0x548
  463e9c: 3b d7                        	cmpl	%edi, %edx
  463e9e: 89 55 08                     	movl	%edx, 0x8(%ebp)
  463ea1: 7c 83                        	jl	0x463e26 <.text+0x62e26>
  463ea3: 5b                           	popl	%ebx
  463ea4: 5f                           	popl	%edi
  463ea5: 5e                           	popl	%esi
  463ea6: 5d                           	popl	%ebp
  463ea7: c2 04 00                     	retl	$0x4
