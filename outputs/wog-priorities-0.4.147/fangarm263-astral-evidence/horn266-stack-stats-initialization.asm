
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  43d710: 55                           	pushl	%ebp
  43d711: 8b ec                        	movl	%esp, %ebp
  43d713: 51                           	pushl	%ecx
  43d714: 53                           	pushl	%ebx
  43d715: 8b d9                        	movl	%ecx, %ebx
  43d717: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  43d71d: 56                           	pushl	%esi
  43d71e: e8 5d c9 02 00               	calll	0x46a080 <.text+0x69080>
  43d723: 84 c0                        	testb	%al, %al
  43d725: 0f 85 2d 04 00 00            	jne	0x43db58 <.text+0x3cb58>
  43d72b: 8b 4b 34                     	movl	0x34(%ebx), %ecx
  43d72e: 57                           	pushl	%edi
  43d72f: 8d bb 10 01 00 00            	leal	0x110(%ebx), %edi
  43d735: 8d 04 cd 00 00 00 00         	leal	(,%ecx,8), %eax
  43d73c: 2b c1                        	subl	%ecx, %eax
  43d73e: 8b 0d 74 ff 67 00            	movl	0x67ff74, %ecx
  43d744: 8d 04 40                     	leal	(%eax,%eax,2), %eax
  43d747: 8d 34 81                     	leal	(%ecx,%eax,4), %esi
  43d74a: 8b 83 84 00 00 00            	movl	0x84(%ebx), %eax
  43d750: b9 15 00 00 00               	movl	$0x15, %ecx
  43d755: f3 a5                        	rep		movsl	(%esi), %es:(%edi)
  43d757: 8b 93 58 01 00 00            	movl	0x158(%ebx), %edx
  43d75d: c1 e8 06                     	shrl	$0x6, %eax
  43d760: a8 01                        	testb	$0x1, %al
  43d762: 89 53 68                     	movl	%edx, 0x68(%ebx)
  43d765: 75 3b                        	jne	0x43d7a2 <.text+0x3c7a2>
  43d767: 8b 4b 7c                     	movl	0x7c(%ebx), %ecx
  43d76a: 51                           	pushl	%ecx
  43d76b: 68 10 0a 66 00               	pushl	$0x660a10               # imm = 0x660A10
  43d770: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  43d775: e8 64 a2 1d 00               	calll	0x6179de <.text+0x2169de>
  43d77a: 83 c4 0c                     	addl	$0xc, %esp
  43d77d: b9 28 74 69 00               	movl	$0x697428, %ecx         # imm = 0x697428
  43d782: e8 a9 f1 11 00               	calll	0x55c930 <.text+0x15b930>
  43d787: 8b 8b 70 01 00 00            	movl	0x170(%ebx), %ecx
  43d78d: 33 ff                        	xorl	%edi, %edi
  43d78f: 3b cf                        	cmpl	%edi, %ecx
  43d791: 8b f0                        	movl	%eax, %esi
  43d793: 74 05                        	je	0x43d79a <.text+0x3c79a>
  43d795: 8b 11                        	movl	(%ecx), %edx
  43d797: ff 52 04                     	calll	*0x4(%edx)
  43d79a: 89 b3 70 01 00 00            	movl	%esi, 0x170(%ebx)
  43d7a0: eb 1b                        	jmp	0x43d7bd <.text+0x3c7bd>
  43d7a2: 8b 8b 70 01 00 00            	movl	0x170(%ebx), %ecx
  43d7a8: 85 c9                        	testl	%ecx, %ecx
  43d7aa: 74 05                        	je	0x43d7b1 <.text+0x3c7b1>
  43d7ac: 8b 01                        	movl	(%ecx), %eax
  43d7ae: ff 50 04                     	calll	*0x4(%eax)
  43d7b1: c7 83 70 01 00 00 00 00 00 00	movl	$0x0, 0x170(%ebx)
  43d7bb: 33 ff                        	xorl	%edi, %edi
  43d7bd: 81 7b 34 92 00 00 00         	cmpl	$0x92, 0x34(%ebx)
  43d7c4: 75 0b                        	jne	0x43d7d1 <.text+0x3c7d1>
  43d7c6: 8b 4b 7c                     	movl	0x7c(%ebx), %ecx
  43d7c9: 51                           	pushl	%ecx
  43d7ca: 68 04 0a 66 00               	pushl	$0x660a04               # imm = 0x660A04
  43d7cf: eb 22                        	jmp	0x43d7f3 <.text+0x3c7f3>
  43d7d1: 8b 93 84 00 00 00            	movl	0x84(%ebx), %edx
  43d7d7: c1 ea 06                     	shrl	$0x6, %edx
  43d7da: f6 c2 01                     	testb	$0x1, %dl
  43d7dd: 74 0b                        	je	0x43d7ea <.text+0x3c7ea>
  43d7df: 8b 43 7c                     	movl	0x7c(%ebx), %eax
  43d7e2: 50                           	pushl	%eax
  43d7e3: 68 f8 09 66 00               	pushl	$0x6609f8               # imm = 0x6609F8
  43d7e8: eb 09                        	jmp	0x43d7f3 <.text+0x3c7f3>
  43d7ea: 8b 4b 7c                     	movl	0x7c(%ebx), %ecx
  43d7ed: 51                           	pushl	%ecx
  43d7ee: 68 ec 09 66 00               	pushl	$0x6609ec               # imm = 0x6609EC
  43d7f3: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  43d7f8: e8 e1 a1 1d 00               	calll	0x6179de <.text+0x2169de>
  43d7fd: 83 c4 0c                     	addl	$0xc, %esp
  43d800: b9 28 74 69 00               	movl	$0x697428, %ecx         # imm = 0x697428
  43d805: e8 26 f1 11 00               	calll	0x55c930 <.text+0x15b930>
  43d80a: 8b 8b 74 01 00 00            	movl	0x174(%ebx), %ecx
  43d810: 8b f0                        	movl	%eax, %esi
  43d812: 3b cf                        	cmpl	%edi, %ecx
  43d814: 74 05                        	je	0x43d81b <.text+0x3c81b>
  43d816: 8b 11                        	movl	(%ecx), %edx
  43d818: ff 52 04                     	calll	*0x4(%edx)
  43d81b: 89 b3 74 01 00 00            	movl	%esi, 0x174(%ebx)
  43d821: 8b 43 7c                     	movl	0x7c(%ebx), %eax
  43d824: 50                           	pushl	%eax
  43d825: 68 f8 09 66 00               	pushl	$0x6609f8               # imm = 0x6609F8
  43d82a: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  43d82f: e8 aa a1 1d 00               	calll	0x6179de <.text+0x2169de>
  43d834: 83 c4 0c                     	addl	$0xc, %esp
  43d837: b9 28 74 69 00               	movl	$0x697428, %ecx         # imm = 0x697428
  43d83c: e8 ef f0 11 00               	calll	0x55c930 <.text+0x15b930>
  43d841: 8b 8b 78 01 00 00            	movl	0x178(%ebx), %ecx
  43d847: 8b f0                        	movl	%eax, %esi
  43d849: 3b cf                        	cmpl	%edi, %ecx
  43d84b: 74 05                        	je	0x43d852 <.text+0x3c852>
  43d84d: 8b 11                        	movl	(%ecx), %edx
  43d84f: ff 52 04                     	calll	*0x4(%edx)
  43d852: 89 b3 78 01 00 00            	movl	%esi, 0x178(%ebx)
  43d858: 8b 43 7c                     	movl	0x7c(%ebx), %eax
  43d85b: 50                           	pushl	%eax
  43d85c: 68 e0 09 66 00               	pushl	$0x6609e0               # imm = 0x6609E0
  43d861: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  43d866: e8 73 a1 1d 00               	calll	0x6179de <.text+0x2169de>
  43d86b: 83 c4 0c                     	addl	$0xc, %esp
  43d86e: b9 28 74 69 00               	movl	$0x697428, %ecx         # imm = 0x697428
  43d873: e8 b8 f0 11 00               	calll	0x55c930 <.text+0x15b930>
  43d878: 8b 8b 80 01 00 00            	movl	0x180(%ebx), %ecx
  43d87e: 8b f0                        	movl	%eax, %esi
  43d880: 3b cf                        	cmpl	%edi, %ecx
  43d882: 74 05                        	je	0x43d889 <.text+0x3c889>
  43d884: 8b 11                        	movl	(%ecx), %edx
  43d886: ff 52 04                     	calll	*0x4(%edx)
  43d889: 89 b3 80 01 00 00            	movl	%esi, 0x180(%ebx)
  43d88f: 8b 83 84 00 00 00            	movl	0x84(%ebx), %eax
  43d895: c1 e8 06                     	shrl	$0x6, %eax
  43d898: a8 01                        	testb	$0x1, %al
  43d89a: 74 0b                        	je	0x43d8a7 <.text+0x3c8a7>
  43d89c: 8b 4b 7c                     	movl	0x7c(%ebx), %ecx
  43d89f: 51                           	pushl	%ecx
  43d8a0: 68 f8 09 66 00               	pushl	$0x6609f8               # imm = 0x6609F8
  43d8a5: eb 09                        	jmp	0x43d8b0 <.text+0x3c8b0>
  43d8a7: 8b 53 7c                     	movl	0x7c(%ebx), %edx
  43d8aa: 52                           	pushl	%edx
  43d8ab: 68 d4 09 66 00               	pushl	$0x6609d4               # imm = 0x6609D4
  43d8b0: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  43d8b5: e8 24 a1 1d 00               	calll	0x6179de <.text+0x2169de>
  43d8ba: 83 c4 0c                     	addl	$0xc, %esp
  43d8bd: b9 28 74 69 00               	movl	$0x697428, %ecx         # imm = 0x697428
  43d8c2: e8 69 f0 11 00               	calll	0x55c930 <.text+0x15b930>
  43d8c7: 8b 8b 84 01 00 00            	movl	0x184(%ebx), %ecx
  43d8cd: 8b f0                        	movl	%eax, %esi
  43d8cf: 3b cf                        	cmpl	%edi, %ecx
  43d8d1: 74 05                        	je	0x43d8d8 <.text+0x3c8d8>
  43d8d3: 8b 01                        	movl	(%ecx), %eax
  43d8d5: ff 50 04                     	calll	*0x4(%eax)
  43d8d8: 89 b3 84 01 00 00            	movl	%esi, 0x184(%ebx)
  43d8de: 8b 8b 84 00 00 00            	movl	0x84(%ebx), %ecx
  43d8e4: c1 e9 02                     	shrl	$0x2, %ecx
  43d8e7: f6 c1 01                     	testb	$0x1, %cl
  43d8ea: 75 24                        	jne	0x43d910 <.text+0x3c910>
  43d8ec: 8b 43 34                     	movl	0x34(%ebx), %eax
  43d8ef: 83 f8 25                     	cmpl	$0x25, %eax
  43d8f2: 74 1c                        	je	0x43d910 <.text+0x3c910>
  43d8f4: 83 f8 5b                     	cmpl	$0x5b, %eax
  43d8f7: 74 17                        	je	0x43d910 <.text+0x3c910>
  43d8f9: 8b 8b 7c 01 00 00            	movl	0x17c(%ebx), %ecx
  43d8ff: 3b cf                        	cmpl	%edi, %ecx
  43d901: 74 05                        	je	0x43d908 <.text+0x3c908>
  43d903: 8b 11                        	movl	(%ecx), %edx
  43d905: ff 52 04                     	calll	*0x4(%edx)
  43d908: 89 bb 7c 01 00 00            	movl	%edi, 0x17c(%ebx)
  43d90e: eb 37                        	jmp	0x43d947 <.text+0x3c947>
  43d910: 8b 43 7c                     	movl	0x7c(%ebx), %eax
  43d913: 50                           	pushl	%eax
  43d914: 68 04 0a 66 00               	pushl	$0x660a04               # imm = 0x660A04
  43d919: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  43d91e: e8 bb a0 1d 00               	calll	0x6179de <.text+0x2169de>
  43d923: 83 c4 0c                     	addl	$0xc, %esp
  43d926: b9 28 74 69 00               	movl	$0x697428, %ecx         # imm = 0x697428
  43d92b: e8 00 f0 11 00               	calll	0x55c930 <.text+0x15b930>
  43d930: 8b 8b 7c 01 00 00            	movl	0x17c(%ebx), %ecx
  43d936: 8b f0                        	movl	%eax, %esi
  43d938: 3b cf                        	cmpl	%edi, %ecx
  43d93a: 74 05                        	je	0x43d941 <.text+0x3c941>
  43d93c: 8b 11                        	movl	(%ecx), %edx
  43d93e: ff 52 04                     	calll	*0x4(%edx)
  43d941: 89 b3 7c 01 00 00            	movl	%esi, 0x17c(%ebx)
  43d947: 8b 43 34                     	movl	0x34(%ebx), %eax
  43d94a: 83 f8 3e                     	cmpl	$0x3e, %eax
  43d94d: 74 3b                        	je	0x43d98a <.text+0x3c98a>
  43d94f: 83 f8 3f                     	cmpl	$0x3f, %eax
  43d952: 74 36                        	je	0x43d98a <.text+0x3c98a>
  43d954: 83 f8 36                     	cmpl	$0x36, %eax
  43d957: 74 31                        	je	0x43d98a <.text+0x3c98a>
  43d959: 83 f8 37                     	cmpl	$0x37, %eax
  43d95c: 74 2c                        	je	0x43d98a <.text+0x3c98a>
  43d95e: 8b 8b 88 01 00 00            	movl	0x188(%ebx), %ecx
  43d964: 3b cf                        	cmpl	%edi, %ecx
  43d966: 74 05                        	je	0x43d96d <.text+0x3c96d>
  43d968: 8b 01                        	movl	(%ecx), %eax
  43d96a: ff 50 04                     	calll	*0x4(%eax)
  43d96d: 89 bb 88 01 00 00            	movl	%edi, 0x188(%ebx)
  43d973: 8b 8b 8c 01 00 00            	movl	0x18c(%ebx), %ecx
  43d979: 3b cf                        	cmpl	%edi, %ecx
  43d97b: 74 05                        	je	0x43d982 <.text+0x3c982>
  43d97d: 8b 11                        	movl	(%ecx), %edx
  43d97f: ff 52 04                     	calll	*0x4(%edx)
  43d982: 89 bb 8c 01 00 00            	movl	%edi, 0x18c(%ebx)
  43d988: eb 6e                        	jmp	0x43d9f8 <.text+0x3c9f8>
  43d98a: 8b 43 7c                     	movl	0x7c(%ebx), %eax
  43d98d: 50                           	pushl	%eax
  43d98e: 68 c8 09 66 00               	pushl	$0x6609c8               # imm = 0x6609C8
  43d993: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  43d998: e8 41 a0 1d 00               	calll	0x6179de <.text+0x2169de>
  43d99d: 83 c4 0c                     	addl	$0xc, %esp
  43d9a0: b9 28 74 69 00               	movl	$0x697428, %ecx         # imm = 0x697428
  43d9a5: e8 86 ef 11 00               	calll	0x55c930 <.text+0x15b930>
  43d9aa: 8b 8b 88 01 00 00            	movl	0x188(%ebx), %ecx
  43d9b0: 8b f0                        	movl	%eax, %esi
  43d9b2: 3b cf                        	cmpl	%edi, %ecx
  43d9b4: 74 05                        	je	0x43d9bb <.text+0x3c9bb>
  43d9b6: 8b 11                        	movl	(%ecx), %edx
  43d9b8: ff 52 04                     	calll	*0x4(%edx)
  43d9bb: 89 b3 88 01 00 00            	movl	%esi, 0x188(%ebx)
  43d9c1: 8b 43 7c                     	movl	0x7c(%ebx), %eax
  43d9c4: 50                           	pushl	%eax
  43d9c5: 68 bc 09 66 00               	pushl	$0x6609bc               # imm = 0x6609BC
  43d9ca: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  43d9cf: e8 0a a0 1d 00               	calll	0x6179de <.text+0x2169de>
  43d9d4: 83 c4 0c                     	addl	$0xc, %esp
  43d9d7: b9 28 74 69 00               	movl	$0x697428, %ecx         # imm = 0x697428
  43d9dc: e8 4f ef 11 00               	calll	0x55c930 <.text+0x15b930>
  43d9e1: 8b 8b 8c 01 00 00            	movl	0x18c(%ebx), %ecx
  43d9e7: 8b f0                        	movl	%eax, %esi
  43d9e9: 3b cf                        	cmpl	%edi, %ecx
  43d9eb: 74 05                        	je	0x43d9f2 <.text+0x3c9f2>
  43d9ed: 8b 11                        	movl	(%ecx), %edx
  43d9ef: ff 52 04                     	calll	*0x4(%edx)
  43d9f2: 89 b3 8c 01 00 00            	movl	%esi, 0x18c(%ebx)
  43d9f8: 33 f6                        	xorl	%esi, %esi
  43d9fa: 8d 83 70 01 00 00            	leal	0x170(%ebx), %eax
  43da00: bf 03 00 00 00               	movl	$0x3, %edi
  43da05: 8b 08                        	movl	(%eax), %ecx
  43da07: 85 c9                        	testl	%ecx, %ecx
  43da09: 74 18                        	je	0x43da23 <.text+0x3ca23>
  43da0b: c7 41 2c 40 00 00 00         	movl	$0x40, 0x2c(%ecx)
  43da12: 8b 08                        	movl	(%eax), %ecx
  43da14: 33 d2                        	xorl	%edx, %edx
  43da16: 89 79 28                     	movl	%edi, 0x28(%ecx)
  43da19: 8b 08                        	movl	(%eax), %ecx
  43da1b: 85 f6                        	testl	%esi, %esi
  43da1d: 0f 95 c2                     	setne	%dl
  43da20: 89 51 30                     	movl	%edx, 0x30(%ecx)
  43da23: 46                           	incl	%esi
  43da24: 83 c0 04                     	addl	$0x4, %eax
  43da27: 83 fe 08                     	cmpl	$0x8, %esi
  43da2a: 7c d9                        	jl	0x43da05 <.text+0x3ca05>
  43da2c: 8b 43 34                     	movl	0x34(%ebx), %eax
  43da2f: 8b 0d b0 47 67 00            	movl	0x6747b0, %ecx
  43da35: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  43da3c: 2b d0                        	subl	%eax, %edx
  43da3e: 8d 04 90                     	leal	(%eax,%edx,4), %eax
  43da41: 8b 4c 81 0c                  	movl	0xc(%ecx,%eax,4), %ecx
  43da45: e8 76 ef 11 00               	calll	0x55c9c0 <.text+0x15b9c0>
  43da4a: 8b 8b 64 01 00 00            	movl	0x164(%ebx), %ecx
  43da50: 8b f0                        	movl	%eax, %esi
  43da52: 85 c9                        	testl	%ecx, %ecx
  43da54: 5f                           	popl	%edi
  43da55: 74 05                        	je	0x43da5c <.text+0x3ca5c>
  43da57: 8b 11                        	movl	(%ecx), %edx
  43da59: ff 52 04                     	calll	*0x4(%edx)
  43da5c: 8b c6                        	movl	%esi, %eax
  43da5e: 89 b3 64 01 00 00            	movl	%esi, 0x164(%ebx)
  43da64: 8b 48 1c                     	movl	0x1c(%eax), %ecx
  43da67: 8b 51 08                     	movl	0x8(%ecx), %edx
  43da6a: 8b 42 08                     	movl	0x8(%edx), %eax
  43da6d: ba 0b 01 00 00               	movl	$0x10b, %edx            # imm = 0x10B
  43da72: 8b 08                        	movl	(%eax), %ecx
  43da74: 8b 83 84 00 00 00            	movl	0x84(%ebx), %eax
  43da7a: c1 e8 02                     	shrl	$0x2, %eax
  43da7d: 2b 51 3c                     	subl	0x3c(%ecx), %edx
  43da80: a8 01                        	testb	$0x1, %al
  43da82: 89 93 6c 01 00 00            	movl	%edx, 0x16c(%ebx)
  43da88: 0f 84 b1 00 00 00            	je	0x43db3f <.text+0x3cb3f>
  43da8e: 8b 43 34                     	movl	0x34(%ebx), %eax
  43da91: 83 c0 fe                     	addl	$-0x2, %eax
  43da94: 3d 90 00 00 00               	cmpl	$0x90, %eax
  43da99: 77 7f                        	ja	0x43db1a <.text+0x3cb1a>
  43da9b: 33 c9                        	xorl	%ecx, %ecx
  43da9d: 8a 88 a4 db 43 00            	movb	0x43dba4(%eax), %cl
  43daa3: ff 24 8d 60 db 43 00         	jmpl	*0x43db60(,%ecx,4)
  43daaa: b9 b0 09 66 00               	movl	$0x6609b0, %ecx         # imm = 0x6609B0
  43daaf: eb 6c                        	jmp	0x43db1d <.text+0x3cb1d>
  43dab1: b9 a4 09 66 00               	movl	$0x6609a4, %ecx         # imm = 0x6609A4
  43dab6: eb 65                        	jmp	0x43db1d <.text+0x3cb1d>
  43dab8: b9 98 09 66 00               	movl	$0x660998, %ecx         # imm = 0x660998
  43dabd: eb 5e                        	jmp	0x43db1d <.text+0x3cb1d>
  43dabf: b9 8c 09 66 00               	movl	$0x66098c, %ecx         # imm = 0x66098C
  43dac4: eb 57                        	jmp	0x43db1d <.text+0x3cb1d>
  43dac6: b9 80 09 66 00               	movl	$0x660980, %ecx         # imm = 0x660980
  43dacb: eb 50                        	jmp	0x43db1d <.text+0x3cb1d>
  43dacd: b9 74 09 66 00               	movl	$0x660974, %ecx         # imm = 0x660974
  43dad2: eb 49                        	jmp	0x43db1d <.text+0x3cb1d>
  43dad4: b9 68 09 66 00               	movl	$0x660968, %ecx         # imm = 0x660968
  43dad9: eb 42                        	jmp	0x43db1d <.text+0x3cb1d>
  43dadb: b9 5c 09 66 00               	movl	$0x66095c, %ecx         # imm = 0x66095C
  43dae0: eb 3b                        	jmp	0x43db1d <.text+0x3cb1d>
  43dae2: b9 50 09 66 00               	movl	$0x660950, %ecx         # imm = 0x660950
  43dae7: eb 34                        	jmp	0x43db1d <.text+0x3cb1d>
  43dae9: b9 44 09 66 00               	movl	$0x660944, %ecx         # imm = 0x660944
  43daee: eb 2d                        	jmp	0x43db1d <.text+0x3cb1d>
  43daf0: b9 38 09 66 00               	movl	$0x660938, %ecx         # imm = 0x660938
  43daf5: eb 26                        	jmp	0x43db1d <.text+0x3cb1d>
  43daf7: b9 2c 09 66 00               	movl	$0x66092c, %ecx         # imm = 0x66092C
  43dafc: eb 1f                        	jmp	0x43db1d <.text+0x3cb1d>
  43dafe: b9 20 09 66 00               	movl	$0x660920, %ecx         # imm = 0x660920
  43db03: eb 18                        	jmp	0x43db1d <.text+0x3cb1d>
  43db05: b9 14 09 66 00               	movl	$0x660914, %ecx         # imm = 0x660914
  43db0a: eb 11                        	jmp	0x43db1d <.text+0x3cb1d>
  43db0c: b9 08 09 66 00               	movl	$0x660908, %ecx         # imm = 0x660908
  43db11: eb 0a                        	jmp	0x43db1d <.text+0x3cb1d>
  43db13: b9 fc 08 66 00               	movl	$0x6608fc, %ecx         # imm = 0x6608FC
  43db18: eb 03                        	jmp	0x43db1d <.text+0x3cb1d>
  43db1a: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  43db1d: e8 9e ee 11 00               	calll	0x55c9c0 <.text+0x15b9c0>
  43db22: 8b 8b 68 01 00 00            	movl	0x168(%ebx), %ecx
  43db28: 8b f0                        	movl	%eax, %esi
  43db2a: 85 c9                        	testl	%ecx, %ecx
  43db2c: 74 05                        	je	0x43db33 <.text+0x3cb33>
  43db2e: 8b 11                        	movl	(%ecx), %edx
  43db30: ff 52 04                     	calll	*0x4(%edx)
  43db33: 89 b3 68 01 00 00            	movl	%esi, 0x168(%ebx)
  43db39: 5e                           	popl	%esi
  43db3a: 5b                           	popl	%ebx
  43db3b: 8b e5                        	movl	%ebp, %esp
  43db3d: 5d                           	popl	%ebp
  43db3e: c3                           	retl
  43db3f: 8b 8b 68 01 00 00            	movl	0x168(%ebx), %ecx
  43db45: 85 c9                        	testl	%ecx, %ecx
  43db47: 74 05                        	je	0x43db4e <.text+0x3cb4e>
  43db49: 8b 01                        	movl	(%ecx), %eax
  43db4b: ff 50 04                     	calll	*0x4(%eax)
  43db4e: c7 83 68 01 00 00 00 00 00 00	movl	$0x0, 0x168(%ebx)
  43db58: 5e                           	popl	%esi
  43db59: 5b                           	popl	%ebx
  43db5a: 8b e5                        	movl	%ebp, %esp
  43db5c: 5d                           	popl	%ebp
  43db5d: c3                           	retl
  43db5e: 8b ff                        	movl	%edi, %edi
  43db60: aa                           	stosb	%al, %es:(%edi)
  43db61: da 43 00                     	fiaddl	(%ebx)
  43db64: b1 da                        	movb	$-0x26, %cl
  43db66: 43                           	incl	%ebx
  43db67: 00 b8 da 43 00 bf            	addb	%bh, -0x40ffbc26(%eax)
  43db6d: da 43 00                     	fiaddl	(%ebx)
