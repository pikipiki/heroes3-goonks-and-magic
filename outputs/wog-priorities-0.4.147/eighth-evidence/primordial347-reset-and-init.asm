
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  43d2e0: 55                           	pushl	%ebp
  43d2e1: 8b ec                        	movl	%esp, %ebp
  43d2e3: 83 ec 14                     	subl	$0x14, %esp
  43d2e6: 53                           	pushl	%ebx
  43d2e7: 56                           	pushl	%esi
  43d2e8: 8b f1                        	movl	%ecx, %esi
  43d2ea: 57                           	pushl	%edi
  43d2eb: c7 45 fc 08 00 00 00         	movl	$0x8, -0x4(%ebp)
  43d2f2: 33 db                        	xorl	%ebx, %ebx
  43d2f4: 8d be 70 01 00 00            	leal	0x170(%esi), %edi
  43d2fa: 8b 0f                        	movl	(%edi), %ecx
  43d2fc: 3b cb                        	cmpl	%ebx, %ecx
  43d2fe: 74 05                        	je	0x43d305 <.text+0x3c305>
  43d300: 8b 01                        	movl	(%ecx), %eax
  43d302: ff 50 04                     	calll	*0x4(%eax)
  43d305: 8b 45 fc                     	movl	-0x4(%ebp), %eax
  43d308: 89 1f                        	movl	%ebx, (%edi)
  43d30a: 83 c7 04                     	addl	$0x4, %edi
  43d30d: 48                           	decl	%eax
  43d30e: 89 45 fc                     	movl	%eax, -0x4(%ebp)
  43d311: 75 e7                        	jne	0x43d2fa <.text+0x3c2fa>
  43d313: b9 51 00 00 00               	movl	$0x51, %ecx
  43d318: 33 c0                        	xorl	%eax, %eax
  43d31a: 8d be 98 01 00 00            	leal	0x198(%esi), %edi
  43d320: c7 46 2c ff ff ff ff         	movl	$0xffffffff, 0x2c(%esi) # imm = 0xFFFFFFFF
  43d327: 89 9e 94 01 00 00            	movl	%ebx, 0x194(%esi)
  43d32d: 83 ec 10                     	subl	$0x10, %esp
  43d330: f3 ab                        	rep		stosl	%eax, %es:(%edi)
  43d332: 8d 8e 20 04 00 00            	leal	0x420(%esi), %ecx
  43d338: 8b c4                        	movl	%esp, %eax
  43d33a: 83 ec 10                     	subl	$0x10, %esp
  43d33d: 8d 51 14                     	leal	0x14(%ecx), %edx
  43d340: 8b 79 14                     	movl	0x14(%ecx), %edi
  43d343: 89 38                        	movl	%edi, (%eax)
  43d345: 8b 7a 04                     	movl	0x4(%edx), %edi
  43d348: 89 78 04                     	movl	%edi, 0x4(%eax)
  43d34b: 8b 7a 08                     	movl	0x8(%edx), %edi
  43d34e: 89 78 08                     	movl	%edi, 0x8(%eax)
  43d351: 8b 52 0c                     	movl	0xc(%edx), %edx
  43d354: 89 50 0c                     	movl	%edx, 0xc(%eax)
  43d357: 8d 41 04                     	leal	0x4(%ecx), %eax
  43d35a: 8b d4                        	movl	%esp, %edx
  43d35c: 8b 38                        	movl	(%eax), %edi
  43d35e: 89 3a                        	movl	%edi, (%edx)
  43d360: 8b 78 04                     	movl	0x4(%eax), %edi
  43d363: 89 7a 04                     	movl	%edi, 0x4(%edx)
  43d366: 8b 78 08                     	movl	0x8(%eax), %edi
  43d369: 89 7a 08                     	movl	%edi, 0x8(%edx)
  43d36c: 8b 40 0c                     	movl	0xc(%eax), %eax
  43d36f: 89 42 0c                     	movl	%eax, 0xc(%edx)
  43d372: 8d 55 ec                     	leal	-0x14(%ebp), %edx
  43d375: 52                           	pushl	%edx
  43d376: e8 05 b7 00 00               	calll	0x448a80 <.text+0x47a80>
  43d37b: e8 f0 b5 0b 00               	calll	0x4f8970 <.text+0xf7970>
  43d380: 89 86 fc 00 00 00            	movl	%eax, 0xfc(%esi)
  43d386: 8b 8e 64 01 00 00            	movl	0x164(%esi), %ecx
  43d38c: 3b cb                        	cmpl	%ebx, %ecx
  43d38e: 74 05                        	je	0x43d395 <.text+0x3c395>
  43d390: 8b 01                        	movl	(%ecx), %eax
  43d392: ff 50 04                     	calll	*0x4(%eax)
  43d395: 83 c8 ff                     	orl	$-0x1, %eax
  43d398: 89 9e 64 01 00 00            	movl	%ebx, 0x164(%esi)
  43d39e: 89 9e 6c 01 00 00            	movl	%ebx, 0x16c(%esi)
  43d3a4: 88 5e 20                     	movb	%bl, 0x20(%esi)
  43d3a7: 88 9e f0 04 00 00            	movb	%bl, 0x4f0(%esi)
  43d3ad: 89 86 ec 00 00 00            	movl	%eax, 0xec(%esi)
  43d3b3: 89 46 24                     	movl	%eax, 0x24(%esi)
  43d3b6: 89 46 28                     	movl	%eax, 0x28(%esi)
  43d3b9: 89 46 5c                     	movl	%eax, 0x5c(%esi)
  43d3bc: 89 46 50                     	movl	%eax, 0x50(%esi)
  43d3bf: 89 9e 90 04 00 00            	movl	%ebx, 0x490(%esi)
  43d3c5: 88 9e f1 04 00 00            	movb	%bl, 0x4f1(%esi)
  43d3cb: 8b 96 2c 05 00 00            	movl	0x52c(%esi), %edx
  43d3d1: 8b 8e 28 05 00 00            	movl	0x528(%esi), %ecx
  43d3d7: 8b c2                        	movl	%edx, %eax
  43d3d9: 3b c2                        	cmpl	%edx, %eax
  43d3db: 74 0e                        	je	0x43d3eb <.text+0x3c3eb>
  43d3dd: 8b 38                        	movl	(%eax), %edi
  43d3df: 83 c0 04                     	addl	$0x4, %eax
  43d3e2: 89 39                        	movl	%edi, (%ecx)
  43d3e4: 83 c1 04                     	addl	$0x4, %ecx
  43d3e7: 3b c2                        	cmpl	%edx, %eax
  43d3e9: 75 f2                        	jne	0x43d3dd <.text+0x3c3dd>
  43d3eb: 8b 96 2c 05 00 00            	movl	0x52c(%esi), %edx
  43d3f1: 89 8e 2c 05 00 00            	movl	%ecx, 0x52c(%esi)
  43d3f7: 8b 8e 18 05 00 00            	movl	0x518(%esi), %ecx
  43d3fd: 89 55 fc                     	movl	%edx, -0x4(%ebp)
  43d400: 8b 96 1c 05 00 00            	movl	0x51c(%esi), %edx
  43d406: 8b c2                        	movl	%edx, %eax
  43d408: 3b c2                        	cmpl	%edx, %eax
  43d40a: 74 24                        	je	0x43d430 <.text+0x3c430>
  43d40c: 8b 38                        	movl	(%eax), %edi
  43d40e: 83 c0 04                     	addl	$0x4, %eax
  43d411: 89 39                        	movl	%edi, (%ecx)
  43d413: 83 c1 04                     	addl	$0x4, %ecx
  43d416: 3b c2                        	cmpl	%edx, %eax
  43d418: 75 f2                        	jne	0x43d40c <.text+0x3c40c>
  43d41a: 8b 86 1c 05 00 00            	movl	0x51c(%esi), %eax
  43d420: 89 8e 1c 05 00 00            	movl	%ecx, 0x51c(%esi)
  43d426: 89 45 fc                     	movl	%eax, -0x4(%ebp)
  43d429: 5f                           	popl	%edi
  43d42a: 5e                           	popl	%esi
  43d42b: 5b                           	popl	%ebx
  43d42c: 8b e5                        	movl	%ebp, %esp
  43d42e: 5d                           	popl	%ebp
  43d42f: c3                           	retl
  43d430: 8b 96 1c 05 00 00            	movl	0x51c(%esi), %edx
  43d436: 89 8e 1c 05 00 00            	movl	%ecx, 0x51c(%esi)
  43d43c: 5f                           	popl	%edi
  43d43d: 5e                           	popl	%esi
  43d43e: 89 55 fc                     	movl	%edx, -0x4(%ebp)
  43d441: 5b                           	popl	%ebx
  43d442: 8b e5                        	movl	%ebp, %esp
  43d444: 5d                           	popl	%ebp
  43d445: c3                           	retl
  43d446: 90                           	nop
  43d447: 90                           	nop
  43d448: 90                           	nop
  43d449: 90                           	nop
  43d44a: 90                           	nop
  43d44b: 90                           	nop
  43d44c: 90                           	nop
  43d44d: 90                           	nop
  43d44e: 90                           	nop
  43d44f: 90                           	nop
  43d450: 55                           	pushl	%ebp
  43d451: 8b ec                        	movl	%esp, %ebp
  43d453: 53                           	pushl	%ebx
  43d454: 56                           	pushl	%esi
  43d455: 57                           	pushl	%edi
  43d456: 8b d9                        	movl	%ecx, %ebx
  43d458: e8 83 fe ff ff               	calll	0x43d2e0 <.text+0x3c2e0>
  43d45d: 8b 45 08                     	movl	0x8(%ebp), %eax
  43d460: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  43d463: 89 43 34                     	movl	%eax, 0x34(%ebx)
  43d466: 89 4b 4c                     	movl	%ecx, 0x4c(%ebx)
  43d469: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  43d470: c7 43 08 04 00 00 00         	movl	$0x4, 0x8(%ebx)
  43d477: 8b 0d b0 47 67 00            	movl	0x6747b0, %ecx
  43d47d: 2b d0                        	subl	%eax, %edx
  43d47f: 8d 7b 74                     	leal	0x74(%ebx), %edi
  43d482: 8d 14 90                     	leal	(%eax,%edx,4), %edx
  43d485: c1 e2 02                     	shll	$0x2, %edx
  43d488: 8d 34 0a                     	leal	(%edx,%ecx), %esi
  43d48b: b9 1d 00 00 00               	movl	$0x1d, %ecx
  43d490: f3 a5                        	rep		movsl	(%esi), %es:(%edi)
  43d492: 8b 0d 38 95 69 00            	movl	0x699538, %ecx
  43d498: 33 ff                        	xorl	%edi, %edi
  43d49a: 39 b9 98 f6 01 00            	cmpl	%edi, 0x1f698(%ecx)
  43d4a0: 75 19                        	jne	0x43d4bb <.text+0x3c4bb>
  43d4a2: 83 f8 70                     	cmpl	$0x70, %eax
  43d4a5: 74 0f                        	je	0x43d4b6 <.text+0x3c4b6>
  43d4a7: 83 f8 71                     	cmpl	$0x71, %eax
  43d4aa: 74 0a                        	je	0x43d4b6 <.text+0x3c4b6>
  43d4ac: 83 f8 72                     	cmpl	$0x72, %eax
  43d4af: 74 05                        	je	0x43d4b6 <.text+0x3c4b6>
  43d4b1: 83 f8 73                     	cmpl	$0x73, %eax
  43d4b4: 75 05                        	jne	0x43d4bb <.text+0x3c4bb>
  43d4b6: 83 ca ff                     	orl	$-0x1, %edx
  43d4b9: eb 09                        	jmp	0x43d4c4 <.text+0x3c4c4>
  43d4bb: 8b 0d b0 47 67 00            	movl	0x6747b0, %ecx
  43d4c1: 8b 14 0a                     	movl	(%edx,%ecx), %edx
  43d4c4: 8b 4d 10                     	movl	0x10(%ebp), %ecx
  43d4c7: 8d 73 74                     	leal	0x74(%ebx), %esi
  43d4ca: 3b cf                        	cmpl	%edi, %ecx
  43d4cc: 89 16                        	movl	%edx, (%esi)
  43d4ce: 74 07                        	je	0x43d4d7 <.text+0x3c4d7>
  43d4d0: 56                           	pushl	%esi
  43d4d1: 50                           	pushl	%eax
  43d4d2: e8 b9 8e 0a 00               	calll	0x4e6390 <.text+0xe5390>
  43d4d7: a1 20 94 69 00               	movl	0x699420, %eax
  43d4dc: b9 02 00 00 00               	movl	$0x2, %ecx
  43d4e1: 39 88 c0 53 00 00            	cmpl	%ecx, 0x53c0(%eax)
  43d4e7: 74 1d                        	je	0x43d506 <.text+0x3c506>
  43d4e9: 8b 53 74                     	movl	0x74(%ebx), %edx
  43d4ec: 8b b0 94 53 00 00            	movl	0x5394(%eax), %esi
  43d4f2: 8b 14 95 a8 36 64 00         	movl	0x6436a8(,%edx,4), %edx
  43d4f9: 3b d6                        	cmpl	%esi, %edx
  43d4fb: 75 09                        	jne	0x43d506 <.text+0x3c506>
  43d4fd: c6 83 d8 04 00 00 01         	movb	$0x1, 0x4d8(%ebx)
  43d504: eb 07                        	jmp	0x43d50d <.text+0x3c50d>
  43d506: c6 83 d8 04 00 00 00         	movb	$0x0, 0x4d8(%ebx)
  43d50d: 8a 83 d8 04 00 00            	movb	0x4d8(%ebx), %al
  43d513: 84 c0                        	testb	%al, %al
  43d515: 74 2d                        	je	0x43d544 <.text+0x3c544>
  43d517: 8b 83 84 00 00 00            	movl	0x84(%ebx), %eax
  43d51d: c1 e8 06                     	shrl	$0x6, %eax
  43d520: a8 01                        	testb	$0x1, %al
  43d522: 75 06                        	jne	0x43d52a <.text+0x3c52a>
  43d524: ff 83 c4 00 00 00            	incl	0xc4(%ebx)
  43d52a: 8b 93 c8 00 00 00            	movl	0xc8(%ebx), %edx
  43d530: 8b 83 cc 00 00 00            	movl	0xcc(%ebx), %eax
  43d536: 42                           	incl	%edx
  43d537: 40                           	incl	%eax
  43d538: 89 93 c8 00 00 00            	movl	%edx, 0xc8(%ebx)
  43d53e: 89 83 cc 00 00 00            	movl	%eax, 0xcc(%ebx)
  43d544: 8b 45 14                     	movl	0x14(%ebp), %eax
  43d547: ba 01 00 00 00               	movl	$0x1, %edx
  43d54c: 2b d0                        	subl	%eax, %edx
  43d54e: 89 4b 3c                     	movl	%ecx, 0x3c(%ebx)
  43d551: 83 c9 ff                     	orl	$-0x1, %ecx
  43d554: 89 83 f4 00 00 00            	movl	%eax, 0xf4(%ebx)
  43d55a: 8b 45 18                     	movl	0x18(%ebp), %eax
  43d55d: 89 4b 10                     	movl	%ecx, 0x10(%ebx)
  43d560: 89 4b 14                     	movl	%ecx, 0x14(%ebx)
  43d563: 8b 4d 1c                     	movl	0x1c(%ebp), %ecx
  43d566: 89 53 44                     	movl	%edx, 0x44(%ebx)
  43d569: 8b 53 4c                     	movl	0x4c(%ebx), %edx
  43d56c: 89 83 f8 00 00 00            	movl	%eax, 0xf8(%ebx)
  43d572: 8b 83 c4 00 00 00            	movl	0xc4(%ebx), %eax
  43d578: 89 4b 38                     	movl	%ecx, 0x38(%ebx)
  43d57b: 8b 8b c0 00 00 00            	movl	0xc0(%ebx), %ecx
  43d581: 89 7b 54                     	movl	%edi, 0x54(%ebx)
  43d584: 89 7b 40                     	movl	%edi, 0x40(%ebx)
  43d587: 89 7b 70                     	movl	%edi, 0x70(%ebx)
  43d58a: 89 7b 58                     	movl	%edi, 0x58(%ebx)
  43d58d: 5f                           	popl	%edi
  43d58e: c6 03 00                     	movb	$0x0, (%ebx)
  43d591: c6 83 c0 04 00 00 00         	movb	$0x0, 0x4c0(%ebx)
  43d598: c6 83 c1 04 00 00 00         	movb	$0x0, 0x4c1(%ebx)
  43d59f: c6 83 ea 00 00 00 00         	movb	$0x0, 0xea(%ebx)
  43d5a6: c6 83 e9 00 00 00 00         	movb	$0x0, 0xe9(%ebx)
  43d5ad: c6 83 e8 00 00 00 00         	movb	$0x0, 0xe8(%ebx)
  43d5b4: 89 53 60                     	movl	%edx, 0x60(%ebx)
  43d5b7: 89 43 64                     	movl	%eax, 0x64(%ebx)
  43d5ba: 89 4b 6c                     	movl	%ecx, 0x6c(%ebx)
  43d5bd: c7 83 a4 04 00 00 00 00 80 3f	movl	$0x3f800000, 0x4a4(%ebx) # imm = 0x3F800000
  43d5c7: 5e                           	popl	%esi
  43d5c8: 5b                           	popl	%ebx
  43d5c9: 5d                           	popl	%ebp
  43d5ca: c2 18 00                     	retl	$0x18
  43d5cd: 90                           	nop
  43d5ce: 90                           	nop
  43d5cf: 90                           	nop
