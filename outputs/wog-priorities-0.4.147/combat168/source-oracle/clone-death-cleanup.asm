
ERA_REFERENCE_ROOT/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  443db0: 55                           	pushl	%ebp
  443db1: 8b ec                        	movl	%esp, %ebp
  443db3: 53                           	pushl	%ebx
  443db4: 56                           	pushl	%esi
  443db5: 8b f1                        	movl	%ecx, %esi
  443db7: 57                           	pushl	%edi
  443db8: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  443dbb: 8b 46 58                     	movl	0x58(%esi), %eax
  443dbe: 8b 9e c0 00 00 00            	movl	0xc0(%esi), %ebx
  443dc4: 03 c8                        	addl	%eax, %ecx
  443dc6: 8b c1                        	movl	%ecx, %eax
  443dc8: 99                           	cltd
  443dc9: f7 fb                        	idivl	%ebx
  443dcb: 8b f8                        	movl	%eax, %edi
  443dcd: 8b c1                        	movl	%ecx, %eax
  443dcf: 99                           	cltd
  443dd0: f7 fb                        	idivl	%ebx
  443dd2: 8b 86 84 00 00 00            	movl	0x84(%esi), %eax
  443dd8: b1 01                        	movb	$0x1, %cl
  443dda: c1 e8 17                     	shrl	$0x17, %eax
  443ddd: 84 c1                        	testb	%al, %cl
  443ddf: 89 56 58                     	movl	%edx, 0x58(%esi)
  443de2: 74 0a                        	je	0x443dee <.text+0x42dee>
  443de4: 8b 7e 4c                     	movl	0x4c(%esi), %edi
  443de7: c7 46 58 00 00 00 00         	movl	$0x0, 0x58(%esi)
  443dee: 85 ff                        	testl	%edi, %edi
  443df0: 88 8e e9 00 00 00            	movb	%cl, 0xe9(%esi)
  443df6: 7e 06                        	jle	0x443dfe <.text+0x42dfe>
  443df8: 8b 56 4c                     	movl	0x4c(%esi), %edx
  443dfb: 89 56 50                     	movl	%edx, 0x50(%esi)
  443dfe: 8b 46 4c                     	movl	0x4c(%esi), %eax
  443e01: 3b f8                        	cmpl	%eax, %edi
  443e03: 7e 02                        	jle	0x443e07 <.text+0x42e07>
  443e05: 8b f8                        	movl	%eax, %edi
  443e07: 8b 56 4c                     	movl	0x4c(%esi), %edx
  443e0a: 2b d7                        	subl	%edi, %edx
  443e0c: 8b c2                        	movl	%edx, %eax
  443e0e: 89 56 4c                     	movl	%edx, 0x4c(%esi)
  443e11: 85 c0                        	testl	%eax, %eax
  443e13: 7f 06                        	jg	0x443e1b <.text+0x42e1b>
  443e15: 88 8e ea 00 00 00            	movb	%cl, 0xea(%esi)
  443e1b: 6a 3e                        	pushl	$0x3e
  443e1d: 8b ce                        	movl	%esi, %ecx
  443e1f: e8 0c 04 00 00               	calll	0x444230 <.text+0x43230>
  443e24: 6a 46                        	pushl	$0x46
  443e26: 8b ce                        	movl	%esi, %ecx
  443e28: e8 03 04 00 00               	calll	0x444230 <.text+0x43230>
  443e2d: 6a 4a                        	pushl	$0x4a
  443e2f: 8b ce                        	movl	%esi, %ecx
  443e31: e8 fa 03 00 00               	calll	0x444230 <.text+0x43230>
  443e36: 8b c7                        	movl	%edi, %eax
  443e38: 5f                           	popl	%edi
  443e39: 5e                           	popl	%esi
  443e3a: 5b                           	popl	%ebx
  443e3b: 5d                           	popl	%ebp
  443e3c: c2 04 00                     	retl	$0x4
  443e3f: 90                           	nop
  443e40: 55                           	pushl	%ebp
  443e41: 8b ec                        	movl	%esp, %ebp
  443e43: 83 ec 10                     	subl	$0x10, %esp
  443e46: 53                           	pushl	%ebx
  443e47: 56                           	pushl	%esi
  443e48: 8b f1                        	movl	%ecx, %esi
  443e4a: 57                           	pushl	%edi
  443e4b: 8b 86 84 00 00 00            	movl	0x84(%esi), %eax
  443e51: c1 e8 15                     	shrl	$0x15, %eax
  443e54: a8 01                        	testb	$0x1, %al
  443e56: 0f 85 81 03 00 00            	jne	0x4441dd <.text+0x431dd>
  443e5c: 8b 86 28 05 00 00            	movl	0x528(%esi), %eax
  443e62: 8d 9e 24 05 00 00            	leal	0x524(%esi), %ebx
  443e68: 85 c0                        	testl	%eax, %eax
  443e6a: 75 04                        	jne	0x443e70 <.text+0x42e70>
  443e6c: 33 ff                        	xorl	%edi, %edi
  443e6e: eb 08                        	jmp	0x443e78 <.text+0x42e78>
  443e70: 8b 7b 08                     	movl	0x8(%ebx), %edi
  443e73: 2b f8                        	subl	%eax, %edi
  443e75: c1 ff 02                     	sarl	$0x2, %edi
  443e78: 8b cf                        	movl	%edi, %ecx
  443e7a: 4f                           	decl	%edi
  443e7b: 85 c9                        	testl	%ecx, %ecx
  443e7d: 7e 1d                        	jle	0x443e9c <.text+0x42e9c>
  443e7f: 8b 86 28 05 00 00            	movl	0x528(%esi), %eax
  443e85: 8b d6                        	movl	%esi, %edx
  443e87: 8b 0c b8                     	movl	(%eax,%edi,4), %ecx
  443e8a: 81 c1 14 05 00 00            	addl	$0x514, %ecx            # imm = 0x514
  443e90: e8 8b a8 ff ff               	calll	0x43e720 <.text+0x3d720>
  443e95: 8b cf                        	movl	%edi, %ecx
  443e97: 4f                           	decl	%edi
  443e98: 85 c9                        	testl	%ecx, %ecx
  443e9a: 7f e3                        	jg	0x443e7f <.text+0x42e7f>
  443e9c: 8b 53 08                     	movl	0x8(%ebx), %edx
  443e9f: 8b 43 04                     	movl	0x4(%ebx), %eax
  443ea2: 52                           	pushl	%edx
  443ea3: 50                           	pushl	%eax
  443ea4: 8b cb                        	movl	%ebx, %ecx
  443ea6: e8 e5 0f 09 00               	calll	0x4d4e90 <.text+0xd3e90>
  443eab: 8d 9e 14 05 00 00            	leal	0x514(%esi), %ebx
  443eb1: 8b cb                        	movl	%ebx, %ecx
  443eb3: e8 f8 93 10 00               	calll	0x54d2b0 <.text+0x14c2b0>
  443eb8: 8b f8                        	movl	%eax, %edi
  443eba: 8b cf                        	movl	%edi, %ecx
  443ebc: 4f                           	decl	%edi
  443ebd: 85 c9                        	testl	%ecx, %ecx
  443ebf: 7e 1d                        	jle	0x443ede <.text+0x42ede>
  443ec1: 8b 86 18 05 00 00            	movl	0x518(%esi), %eax
  443ec7: 8b d6                        	movl	%esi, %edx
  443ec9: 8b 0c b8                     	movl	(%eax,%edi,4), %ecx
  443ecc: 81 c1 24 05 00 00            	addl	$0x524, %ecx            # imm = 0x524
  443ed2: e8 49 a8 ff ff               	calll	0x43e720 <.text+0x3d720>
  443ed7: 8b cf                        	movl	%edi, %ecx
  443ed9: 4f                           	decl	%edi
  443eda: 85 c9                        	testl	%ecx, %ecx
  443edc: 7f e3                        	jg	0x443ec1 <.text+0x42ec1>
  443ede: 8b cb                        	movl	%ebx, %ecx
  443ee0: e8 5b 4b 00 00               	calll	0x448a40 <.text+0x47a40>
  443ee5: 8b ce                        	movl	%esi, %ecx
  443ee7: e8 44 ac ff ff               	calll	0x43eb30 <.text+0x3db30>
  443eec: 8b 86 88 02 00 00            	movl	0x288(%esi), %eax
  443ef2: 85 c0                        	testl	%eax, %eax
  443ef4: 75 52                        	jne	0x443f48 <.text+0x42f48>
  443ef6: ba 64 00 00 00               	movl	$0x64, %edx
  443efb: b9 01 00 00 00               	movl	$0x1, %ecx
  443f00: e8 bb 88 0c 00               	calll	0x50c7c0 <.text+0x10b7c0>
  443f05: 83 f8 3c                     	cmpl	$0x3c, %eax
  443f08: 7d 15                        	jge	0x443f1f <.text+0x42f1f>
  443f0a: 8b 96 f4 00 00 00            	movl	0xf4(%esi), %edx
  443f10: a1 20 94 69 00               	movl	0x699420, %eax
  443f15: c6 84 02 dc 53 00 00 01      	movb	$0x1, 0x53dc(%edx,%eax)
  443f1d: eb 29                        	jmp	0x443f48 <.text+0x42f48>
  443f1f: ba 64 00 00 00               	movl	$0x64, %edx
  443f24: b9 01 00 00 00               	movl	$0x1, %ecx
  443f29: e8 92 88 0c 00               	calll	0x50c7c0 <.text+0x10b7c0>
  443f2e: 83 f8 50                     	cmpl	$0x50, %eax
  443f31: 7d 15                        	jge	0x443f48 <.text+0x42f48>
  443f33: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  443f39: 8b 86 f4 00 00 00            	movl	0xf4(%esi), %eax
  443f3f: 2b c8                        	subl	%eax, %ecx
  443f41: c6 81 df 53 00 00 01         	movb	$0x1, 0x53df(%ecx)
  443f48: 33 ff                        	xorl	%edi, %edi
  443f4a: 8d 9e 98 01 00 00            	leal	0x198(%esi), %ebx
  443f50: 83 3b 00                     	cmpl	$0x0, (%ebx)
  443f53: 7e 08                        	jle	0x443f5d <.text+0x42f5d>
  443f55: 57                           	pushl	%edi
  443f56: 8b ce                        	movl	%esi, %ecx
  443f58: e8 d3 02 00 00               	calll	0x444230 <.text+0x43230>
  443f5d: 47                           	incl	%edi
  443f5e: 83 c3 04                     	addl	$0x4, %ebx
  443f61: 83 ff 51                     	cmpl	$0x51, %edi
  443f64: 7c ea                        	jl	0x443f50 <.text+0x42f50>
  443f66: 8b 8e 84 00 00 00            	movl	0x84(%esi), %ecx
  443f6c: c6 86 ea 00 00 00 00         	movb	$0x0, 0xea(%esi)
  443f73: 81 c9 00 00 20 00            	orl	$0x200000, %ecx         # imm = 0x200000
  443f79: 89 8e 84 00 00 00            	movl	%ecx, 0x84(%esi)
  443f7f: 8b d1                        	movl	%ecx, %edx
  443f81: 8b 4e 38                     	movl	0x38(%esi), %ecx
  443f84: 89 55 f0                     	movl	%edx, -0x10(%ebp)
  443f87: 85 c9                        	testl	%ecx, %ecx
  443f89: 0f 8c 4e 02 00 00            	jl	0x4441dd <.text+0x431dd>
  443f8f: 81 f9 bb 00 00 00            	cmpl	$0xbb, %ecx
  443f95: 0f 8d 42 02 00 00            	jge	0x4441dd <.text+0x431dd>
  443f9b: 8b 3d 20 94 69 00            	movl	0x699420, %edi
  443fa1: 8d 04 cd 00 00 00 00         	leal	(,%ecx,8), %eax
  443fa8: 2b c1                        	subl	%ecx, %eax
  443faa: c1 e0 04                     	shll	$0x4, %eax
  443fad: 03 c7                        	addl	%edi, %eax
  443faf: 80 e2 01                     	andb	$0x1, %dl
  443fb2: 88 55 ff                     	movb	%dl, -0x1(%ebp)
  443fb5: 74 28                        	je	0x443fdf <.text+0x42fdf>
  443fb7: 8b 56 44                     	movl	0x44(%esi), %edx
  443fba: f7 da                        	negl	%edx
  443fbc: 1b d2                        	sbbl	%edx, %edx
  443fbe: 83 e2 02                     	andl	$0x2, %edx
  443fc1: 4a                           	decl	%edx
  443fc2: 03 d1                        	addl	%ecx, %edx
  443fc4: 89 55 f4                     	movl	%edx, -0xc(%ebp)
  443fc7: 8d 0c d5 00 00 00 00         	leal	(,%edx,8), %ecx
  443fce: 2b ca                        	subl	%edx, %ecx
  443fd0: c1 e1 04                     	shll	$0x4, %ecx
  443fd3: 8d 9c 39 c4 01 00 00         	leal	0x1c4(%ecx,%edi), %ebx
  443fda: 89 5d f8                     	movl	%ebx, -0x8(%ebp)
  443fdd: eb 06                        	jmp	0x443fe5 <.text+0x42fe5>
  443fdf: 8b 5d f8                     	movl	-0x8(%ebp), %ebx
  443fe2: 8b 55 f4                     	movl	-0xc(%ebp), %edx
  443fe5: f7 45 f0 00 00 40 10         	testl	$0x10400000, -0x10(%ebp) # imm = 0x10400000
  443fec: 74 2c                        	je	0x44401a <.text+0x4301a>
  443fee: 8b 86 f4 00 00 00            	movl	0xf4(%esi), %eax
  443ff4: 8d 14 80                     	leal	(%eax,%eax,4), %edx
  443ff7: 8b 86 f8 00 00 00            	movl	0xf8(%esi), %eax
  443ffd: 8d 0c 90                     	leal	(%eax,%edx,4), %ecx
  444000: c6 84 39 38 34 01 00 01      	movb	$0x1, 0x13438(%ecx,%edi)
  444008: 8b 15 20 94 69 00            	movl	0x699420, %edx
  44400e: c6 82 60 34 01 00 01         	movb	$0x1, 0x13460(%edx)
  444015: e9 26 01 00 00               	jmp	0x444140 <.text+0x43140>
  44401a: 83 b8 e0 01 00 00 0e         	cmpl	$0xe, 0x1e0(%eax)
  444021: 0f 8d f2 00 00 00            	jge	0x444119 <.text+0x43119>
  444027: 8a 4d ff                     	movb	-0x1(%ebp), %cl
  44402a: 84 c9                        	testb	%cl, %cl
  44402c: 74 0a                        	je	0x444038 <.text+0x43038>
  44402e: 83 7b 1c 0e                  	cmpl	$0xe, 0x1c(%ebx)
  444032: 0f 8d e1 00 00 00            	jge	0x444119 <.text+0x43119>
  444038: 8a 88 dc 01 00 00            	movb	0x1dc(%eax), %cl
  44403e: 84 c9                        	testb	%cl, %cl
  444040: 7c 75                        	jl	0x4440b7 <.text+0x430b7>
  444042: 8b b8 e0 01 00 00            	movl	0x1e0(%eax), %edi
  444048: 88 8c 07 e4 01 00 00         	movb	%cl, 0x1e4(%edi,%eax)
  44404f: 8b 4e 38                     	movl	0x38(%esi), %ecx
  444052: 8b 1d 20 94 69 00            	movl	0x699420, %ebx
  444058: 8d 3c cd 00 00 00 00         	leal	(,%ecx,8), %edi
  44405f: 2b f9                        	subl	%ecx, %edi
  444061: 8b 88 e0 01 00 00            	movl	0x1e0(%eax), %ecx
  444067: c1 e7 04                     	shll	$0x4, %edi
  44406a: 8a 9c 1f dd 01 00 00         	movb	0x1dd(%edi,%ebx), %bl
  444071: 88 9c 01 f2 01 00 00         	movb	%bl, 0x1f2(%ecx,%eax)
  444078: 8b 4e 38                     	movl	0x38(%esi), %ecx
  44407b: 8b 1d 20 94 69 00            	movl	0x699420, %ebx
  444081: 8d 3c cd 00 00 00 00         	leal	(,%ecx,8), %edi
  444088: 2b f9                        	subl	%ecx, %edi
  44408a: 8b 88 e0 01 00 00            	movl	0x1e0(%eax), %ecx
  444090: c1 e7 04                     	shll	$0x4, %edi
  444093: 8a 9c 1f de 01 00 00         	movb	0x1de(%edi,%ebx), %bl
  44409a: 88 9c 01 00 02 00 00         	movb	%bl, 0x200(%ecx,%eax)
  4440a1: 8b 88 e0 01 00 00            	movl	0x1e0(%eax), %ecx
  4440a7: 8b 5d f8                     	movl	-0x8(%ebp), %ebx
  4440aa: 41                           	incl	%ecx
  4440ab: 89 88 e0 01 00 00            	movl	%ecx, 0x1e0(%eax)
  4440b1: 8b 3d 20 94 69 00            	movl	0x699420, %edi
  4440b7: f6 86 84 00 00 00 01         	testb	$0x1, 0x84(%esi)
  4440be: 74 59                        	je	0x444119 <.text+0x43119>
  4440c0: 8d 0c d5 00 00 00 00         	leal	(,%edx,8), %ecx
  4440c7: 2b ca                        	subl	%edx, %ecx
  4440c9: c1 e1 04                     	shll	$0x4, %ecx
  4440cc: 8a 94 39 dc 01 00 00         	movb	0x1dc(%ecx,%edi), %dl
  4440d3: 84 d2                        	testb	%dl, %dl
  4440d5: 7c 42                        	jl	0x444119 <.text+0x43119>
  4440d7: 8b 7b 1c                     	movl	0x1c(%ebx), %edi
  4440da: 88 54 1f 20                  	movb	%dl, 0x20(%edi,%ebx)
  4440de: 8b 53 1c                     	movl	0x1c(%ebx), %edx
  4440e1: 8b 3d 20 94 69 00            	movl	0x699420, %edi
  4440e7: 89 55 f0                     	movl	%edx, -0x10(%ebp)
  4440ea: 8a 94 39 dd 01 00 00         	movb	0x1dd(%ecx,%edi), %dl
  4440f1: 8b 7d f0                     	movl	-0x10(%ebp), %edi
  4440f4: 88 54 1f 2e                  	movb	%dl, 0x2e(%edi,%ebx)
  4440f8: 8b 3d 20 94 69 00            	movl	0x699420, %edi
  4440fe: 8b 53 1c                     	movl	0x1c(%ebx), %edx
  444101: 8a 8c 39 de 01 00 00         	movb	0x1de(%ecx,%edi), %cl
  444108: 88 4c 1a 3c                  	movb	%cl, 0x3c(%edx,%ebx)
  44410c: 8b 4b 1c                     	movl	0x1c(%ebx), %ecx
  44410f: 41                           	incl	%ecx
  444110: 89 4b 1c                     	movl	%ecx, 0x1c(%ebx)
  444113: 8b 3d 20 94 69 00            	movl	0x699420, %edi
  444119: c6 87 cc 32 01 00 00         	movb	$0x0, 0x132cc(%edi)
  444120: c6 80 dc 01 00 00 ff         	movb	$-0x1, 0x1dc(%eax)
  444127: c6 80 dd 01 00 00 ff         	movb	$-0x1, 0x1dd(%eax)
  44412e: 8a 86 84 00 00 00            	movb	0x84(%esi), %al
  444134: a8 01                        	testb	$0x1, %al
  444136: 74 08                        	je	0x444140 <.text+0x43140>
  444138: c6 43 18 ff                  	movb	$-0x1, 0x18(%ebx)
  44413c: c6 43 19 ff                  	movb	$-0x1, 0x19(%ebx)
  444140: 8b 56 24                     	movl	0x24(%esi), %edx
  444143: 83 fa ff                     	cmpl	$-0x1, %edx
  444146: 74 45                        	je	0x44418d <.text+0x4318d>
  444148: 8b 8e f4 00 00 00            	movl	0xf4(%esi), %ecx
  44414e: 8d 04 cd 00 00 00 00         	leal	(,%ecx,8), %eax
  444155: 2b c1                        	subl	%ecx, %eax
  444157: 8d 14 42                     	leal	(%edx,%eax,2), %edx
  44415a: 03 c2                        	addl	%edx, %eax
  44415c: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  444163: 2b c8                        	subl	%eax, %ecx
  444165: 8d 0c 49                     	leal	(%ecx,%ecx,2), %ecx
  444168: 8d 14 c8                     	leal	(%eax,%ecx,8), %edx
  44416b: a1 20 94 69 00               	movl	0x699420, %eax
  444170: 8b 8c d0 f4 54 00 00         	movl	0x54f4(%eax,%edx,8), %ecx
  444177: 8d 84 d0 cc 54 00 00         	leal	0x54cc(%eax,%edx,8), %eax
  44417e: 3b 8e f8 00 00 00            	cmpl	0xf8(%esi), %ecx
  444184: 75 07                        	jne	0x44418d <.text+0x4318d>
  444186: c7 40 28 ff ff ff ff         	movl	$0xffffffff, 0x28(%eax) # imm = 0xFFFFFFFF
  44418d: 8b 4e 28                     	movl	0x28(%esi), %ecx
  444190: 83 f9 ff                     	cmpl	$-0x1, %ecx
  444193: 74 48                        	je	0x4441dd <.text+0x431dd>
  444195: 8b b6 f4 00 00 00            	movl	0xf4(%esi), %esi
  44419b: 8d 04 f5 00 00 00 00         	leal	(,%esi,8), %eax
  4441a2: 2b c6                        	subl	%esi, %eax
  4441a4: 8d 14 41                     	leal	(%ecx,%eax,2), %edx
  4441a7: 03 c2                        	addl	%edx, %eax
  4441a9: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  4441b0: 2b c8                        	subl	%eax, %ecx
  4441b2: 8d 0c 49                     	leal	(%ecx,%ecx,2), %ecx
  4441b5: 8d 14 c8                     	leal	(%eax,%ecx,8), %edx
  4441b8: a1 20 94 69 00               	movl	0x699420, %eax
  4441bd: 8d b4 d0 cc 54 00 00         	leal	0x54cc(%eax,%edx,8), %esi
  4441c4: c7 46 4c 00 00 00 00         	movl	$0x0, 0x4c(%esi)
  4441cb: 8b 8e 84 00 00 00            	movl	0x84(%esi), %ecx
  4441d1: c1 e9 15                     	shrl	$0x15, %ecx
  4441d4: f6 c1 01                     	testb	$0x1, %cl
  4441d7: 0f 84 7f fc ff ff            	je	0x443e5c <.text+0x42e5c>
  4441dd: 5f                           	popl	%edi
  4441de: 5e                           	popl	%esi
  4441df: 5b                           	popl	%ebx
  4441e0: 8b e5                        	movl	%ebp, %esp
  4441e2: 5d                           	popl	%ebp
  4441e3: c2 04 00                     	retl	$0x4
