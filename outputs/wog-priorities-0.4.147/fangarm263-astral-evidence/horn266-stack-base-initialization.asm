
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  43d5d0: 55                           	pushl	%ebp
  43d5d1: 8b ec                        	movl	%esp, %ebp
  43d5d3: 8b 45 1c                     	movl	0x1c(%ebp), %eax
  43d5d6: 8b 55 14                     	movl	0x14(%ebp), %edx
  43d5d9: 56                           	pushl	%esi
  43d5da: 8b f1                        	movl	%ecx, %esi
  43d5dc: 8b 4d 18                     	movl	0x18(%ebp), %ecx
  43d5df: 50                           	pushl	%eax
  43d5e0: 8b 45 10                     	movl	0x10(%ebp), %eax
  43d5e3: 51                           	pushl	%ecx
  43d5e4: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  43d5e7: 52                           	pushl	%edx
  43d5e8: 8b 55 08                     	movl	0x8(%ebp), %edx
  43d5eb: 50                           	pushl	%eax
  43d5ec: 51                           	pushl	%ecx
  43d5ed: 52                           	pushl	%edx
  43d5ee: 8b ce                        	movl	%esi, %ecx
  43d5f0: e8 5b fe ff ff               	calll	0x43d450 <.text+0x3c450>
  43d5f5: 8b 46 38                     	movl	0x38(%esi), %eax
  43d5f8: 85 c0                        	testl	%eax, %eax
  43d5fa: 0f 8c 9a 00 00 00            	jl	0x43d69a <.text+0x3c69a>
  43d600: 3d bb 00 00 00               	cmpl	$0xbb, %eax
  43d605: 0f 8d 8f 00 00 00            	jge	0x43d69a <.text+0x3c69a>
  43d60b: 8b 15 20 94 69 00            	movl	0x699420, %edx
  43d611: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  43d618: 2b c8                        	subl	%eax, %ecx
  43d61a: 8a 86 f4 00 00 00            	movb	0xf4(%esi), %al
  43d620: c1 e1 04                     	shll	$0x4, %ecx
  43d623: 8d 8c 11 c4 01 00 00         	leal	0x1c4(%ecx,%edx), %ecx
  43d62a: 88 41 18                     	movb	%al, 0x18(%ecx)
  43d62d: 8a 96 f8 00 00 00            	movb	0xf8(%esi), %dl
  43d633: 88 51 19                     	movb	%dl, 0x19(%ecx)
  43d636: c6 41 1a ff                  	movb	$-0x1, 0x1a(%ecx)
  43d63a: f6 86 84 00 00 00 01         	testb	$0x1, 0x84(%esi)
  43d641: 74 50                        	je	0x43d693 <.text+0x3c693>
  43d643: 8b 46 44                     	movl	0x44(%esi), %eax
  43d646: 8b 56 38                     	movl	0x38(%esi), %edx
  43d649: f7 d8                        	negl	%eax
  43d64b: 1b c0                        	sbbl	%eax, %eax
  43d64d: 83 e0 02                     	andl	$0x2, %eax
  43d650: 48                           	decl	%eax
  43d651: 03 c2                        	addl	%edx, %eax
  43d653: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  43d65a: 2b d0                        	subl	%eax, %edx
  43d65c: a1 20 94 69 00               	movl	0x699420, %eax
  43d661: c1 e2 04                     	shll	$0x4, %edx
  43d664: 8d 84 02 c4 01 00 00         	leal	0x1c4(%edx,%eax), %eax
  43d66b: 8a 96 f4 00 00 00            	movb	0xf4(%esi), %dl
  43d671: 88 50 18                     	movb	%dl, 0x18(%eax)
  43d674: 8a 96 f8 00 00 00            	movb	0xf8(%esi), %dl
  43d67a: 88 50 19                     	movb	%dl, 0x19(%eax)
  43d67d: 8b 56 44                     	movl	0x44(%esi), %edx
  43d680: 85 d2                        	testl	%edx, %edx
  43d682: 0f 95 c2                     	setne	%dl
  43d685: 88 50 1a                     	movb	%dl, 0x1a(%eax)
  43d688: 8b 46 44                     	movl	0x44(%esi), %eax
  43d68b: 85 c0                        	testl	%eax, %eax
  43d68d: 0f 94 c0                     	sete	%al
  43d690: 88 41 1a                     	movb	%al, 0x1a(%ecx)
  43d693: 8b ce                        	movl	%esi, %ecx
  43d695: e8 f6 10 00 00               	calll	0x43e790 <.text+0x3d790>
  43d69a: 8b 46 34                     	movl	0x34(%esi), %eax
  43d69d: 8b 4d 20                     	movl	0x20(%ebp), %ecx
  43d6a0: 83 f8 04                     	cmpl	$0x4, %eax
  43d6a3: 89 4e 5c                     	movl	%ecx, 0x5c(%esi)
  43d6a6: c7 86 54 04 00 00 01 00 00 00	movl	$0x1, 0x454(%esi)
  43d6b0: 75 0a                        	jne	0x43d6bc <.text+0x3c6bc>
  43d6b2: c7 86 54 04 00 00 02 00 00 00	movl	$0x2, 0x454(%esi)
  43d6bc: 83 f8 05                     	cmpl	$0x5, %eax
  43d6bf: 75 0a                        	jne	0x43d6cb <.text+0x3c6cb>
  43d6c1: c7 86 54 04 00 00 88 13 00 00	movl	$0x1388, 0x454(%esi)    # imm = 0x1388
  43d6cb: 8b 86 80 02 00 00            	movl	0x280(%esi), %eax
  43d6d1: 85 c0                        	testl	%eax, %eax
  43d6d3: 74 14                        	je	0x43d6e9 <.text+0x3c6e9>
  43d6d5: 8b 96 94 04 00 00            	movl	0x494(%esi), %edx
  43d6db: 8b 86 54 04 00 00            	movl	0x454(%esi), %eax
  43d6e1: 03 c2                        	addl	%edx, %eax
  43d6e3: 89 86 54 04 00 00            	movl	%eax, 0x454(%esi)
  43d6e9: 8b 86 84 00 00 00            	movl	0x84(%esi), %eax
  43d6ef: c1 e8 06                     	shrl	$0x6, %eax
  43d6f2: a8 01                        	testb	$0x1, %al
  43d6f4: 74 0a                        	je	0x43d700 <.text+0x3c700>
  43d6f6: c7 86 54 04 00 00 00 00 00 00	movl	$0x0, 0x454(%esi)
  43d700: 5e                           	popl	%esi
  43d701: 5d                           	popl	%ebp
  43d702: c2 1c 00                     	retl	$0x1c
  43d705: 90                           	nop
  43d706: 90                           	nop
  43d707: 90                           	nop
  43d708: 90                           	nop
  43d709: 90                           	nop
  43d70a: 90                           	nop
  43d70b: 90                           	nop
  43d70c: 90                           	nop
  43d70d: 90                           	nop
  43d70e: 90                           	nop
  43d70f: 90                           	nop
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
