
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  464500: 55                           	pushl	%ebp
  464501: 8b ec                        	movl	%esp, %ebp
  464503: 83 ec 08                     	subl	$0x8, %esp
  464506: 53                           	pushl	%ebx
  464507: 56                           	pushl	%esi
  464508: 8b f1                        	movl	%ecx, %esi
  46450a: 57                           	pushl	%edi
  46450b: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  46450e: 85 c9                        	testl	%ecx, %ecx
  464510: 0f 8c f2 01 00 00            	jl	0x464708 <.text+0x63708>
  464516: 8b 55 0c                     	movl	0xc(%ebp), %edx
  464519: 85 d2                        	testl	%edx, %edx
  46451b: 0f 8c e7 01 00 00            	jl	0x464708 <.text+0x63708>
  464521: 8d 04 cd 00 00 00 00         	leal	(,%ecx,8), %eax
  464528: 2b c1                        	subl	%ecx, %eax
  46452a: 8d 0c 42                     	leal	(%edx,%eax,2), %ecx
  46452d: 03 c1                        	addl	%ecx, %eax
  46452f: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  464536: 2b c8                        	subl	%eax, %ecx
  464538: 8d 14 49                     	leal	(%ecx,%ecx,2), %edx
  46453b: 8d 04 d0                     	leal	(%eax,%edx,8), %eax
  46453e: 8d bc c6 cc 54 00 00         	leal	0x54cc(%esi,%eax,8), %edi
  464545: 8a 86 68 3d 01 00            	movb	0x13d68(%esi), %al
  46454b: 84 c0                        	testb	%al, %al
  46454d: 0f 85 b5 01 00 00            	jne	0x464708 <.text+0x63708>
  464553: 8b 87 84 00 00 00            	movl	0x84(%edi), %eax
  464559: 8b c8                        	movl	%eax, %ecx
  46455b: c1 e9 1b                     	shrl	$0x1b, %ecx
  46455e: f6 c1 01                     	testb	$0x1, %cl
  464561: 0f 85 a1 01 00 00            	jne	0x464708 <.text+0x63708>
  464567: c1 e8 18                     	shrl	$0x18, %eax
  46456a: a8 01                        	testb	$0x1, %al
  46456c: 0f 85 96 01 00 00            	jne	0x464708 <.text+0x63708>
  464572: 8b 47 4c                     	movl	0x4c(%edi), %eax
  464575: 85 c0                        	testl	%eax, %eax
  464577: 0f 84 8b 01 00 00            	je	0x464708 <.text+0x63708>
  46457d: 8b 87 e8 04 00 00            	movl	0x4e8(%edi), %eax
  464583: c7 45 0c 03 00 00 00         	movl	$0x3, 0xc(%ebp)
  46458a: 83 f8 fd                     	cmpl	$-0x3, %eax
  46458d: 89 45 fc                     	movl	%eax, -0x4(%ebp)
  464590: c7 45 08 fd ff ff ff         	movl	$0xfffffffd, 0x8(%ebp)  # imm = 0xFFFFFFFD
  464597: 7d 05                        	jge	0x46459e <.text+0x6359e>
  464599: 8d 5d 08                     	leal	0x8(%ebp), %ebx
  46459c: eb 0b                        	jmp	0x4645a9 <.text+0x635a9>
  46459e: 83 f8 03                     	cmpl	$0x3, %eax
  4645a1: 8d 5d 0c                     	leal	0xc(%ebp), %ebx
  4645a4: 7f 03                        	jg	0x4645a9 <.text+0x635a9>
  4645a6: 8d 5d fc                     	leal	-0x4(%ebp), %ebx
  4645a9: ba 18 00 00 00               	movl	$0x18, %edx
  4645ae: b9 01 00 00 00               	movl	$0x1, %ecx
  4645b3: e8 08 82 0a 00               	calll	0x50c7c0 <.text+0x10b7c0>
  4645b8: 3b 03                        	cmpl	(%ebx), %eax
  4645ba: 0f 8f 48 01 00 00            	jg	0x464708 <.text+0x63708>
  4645c0: 8b 97 84 00 00 00            	movl	0x84(%edi), %edx
  4645c6: 81 e2 ff ff ff fb            	andl	$0xfbffffff, %edx       # imm = 0xFBFFFFFF
  4645cc: 81 ca 00 00 00 01            	orl	$0x1000000, %edx        # imm = 0x1000000
  4645d2: 89 97 84 00 00 00            	movl	%edx, 0x84(%edi)
  4645d8: 8b 0d 38 95 69 00            	movl	0x699538, %ecx
  4645de: 8a 81 9d f6 01 00            	movb	0x1f69d(%ecx), %al
  4645e4: 84 c0                        	testb	%al, %al
  4645e6: 75 64                        	jne	0x46464c <.text+0x6364c>
  4645e8: a1 9c 95 69 00               	movl	0x69959c, %eax
  4645ed: 85 c0                        	testl	%eax, %eax
  4645ef: 74 48                        	je	0x464639 <.text+0x63639>
  4645f1: 8a 86 a4 54 00 00            	movb	0x54a4(%esi), %al
  4645f7: 84 c0                        	testb	%al, %al
  4645f9: 74 3e                        	je	0x464639 <.text+0x63639>
  4645fb: 8a 86 a5 54 00 00            	movb	0x54a5(%esi), %al
  464601: 84 c0                        	testb	%al, %al
  464603: 74 34                        	je	0x464639 <.text+0x63639>
  464605: 8b 86 a8 54 00 00            	movl	0x54a8(%esi), %eax
  46460b: 8d 04 80                     	leal	(%eax,%eax,4), %eax
  46460e: 8d 04 c0                     	leal	(%eax,%eax,8), %eax
  464611: 8b 94 c1 b4 0b 02 00         	movl	0x20bb4(%ecx,%eax,8), %edx
  464618: 85 d2                        	testl	%edx, %edx
  46461a: 74 30                        	je	0x46464c <.text+0x6364c>
  46461c: 8b 86 ac 54 00 00            	movl	0x54ac(%esi), %eax
  464622: 8d 04 80                     	leal	(%eax,%eax,4), %eax
  464625: 8d 14 c0                     	leal	(%eax,%eax,8), %edx
  464628: 8b 84 d1 b4 0b 02 00         	movl	0x20bb4(%ecx,%edx,8), %eax
  46462f: 85 c0                        	testl	%eax, %eax
  464631: 0f 85 b3 00 00 00            	jne	0x4646ea <.text+0x636ea>
  464637: eb 13                        	jmp	0x46464c <.text+0x6364c>
  464639: 8b 15 cc 87 69 00            	movl	0x6987cc, %edx
  46463f: 85 d2                        	testl	%edx, %edx
  464641: 0f 95 c0                     	setne	%al
  464644: 84 c0                        	testb	%al, %al
  464646: 0f 85 9e 00 00 00            	jne	0x4646ea <.text+0x636ea>
  46464c: b9 6c ff 66 00               	movl	$0x66ff6c, %ecx         # imm = 0x66FF6C
  464651: e8 1a 61 13 00               	calll	0x59a770 <.text+0x199770>
  464656: 6a 00                        	pushl	$0x0
  464658: 6a 64                        	pushl	$0x64
  46465a: 57                           	pushl	%edi
  46465b: 6a 14                        	pushl	$0x14
  46465d: 8b ce                        	movl	%esi, %ecx
  46465f: 8b d8                        	movl	%eax, %ebx
  464661: 89 55 fc                     	movl	%edx, -0x4(%ebp)
  464664: e8 57 1d 03 00               	calll	0x4963c0 <.text+0x953c0>
  464669: 8b 47 34                     	movl	0x34(%edi), %eax
  46466c: 85 c0                        	testl	%eax, %eax
  46466e: 7c 36                        	jl	0x4646a6 <.text+0x636a6>
  464670: 3d 96 00 00 00               	cmpl	$0x96, %eax
  464675: 7f 2f                        	jg	0x4646a6 <.text+0x636a6>
  464677: 8b 4f 4c                     	movl	0x4c(%edi), %ecx
  46467a: 83 f9 01                     	cmpl	$0x1, %ecx
  46467d: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  464684: 75 10                        	jne	0x464696 <.text+0x63696>
  464686: 2b c8                        	subl	%eax, %ecx
  464688: 8d 14 88                     	leal	(%eax,%ecx,4), %edx
  46468b: a1 b0 47 67 00               	movl	0x6747b0, %eax
  464690: 8b 44 90 14                  	movl	0x14(%eax,%edx,4), %eax
  464694: eb 15                        	jmp	0x4646ab <.text+0x636ab>
  464696: 2b c8                        	subl	%eax, %ecx
  464698: 8d 14 88                     	leal	(%eax,%ecx,4), %edx
  46469b: a1 b0 47 67 00               	movl	0x6747b0, %eax
  4646a0: 8b 44 90 18                  	movl	0x18(%eax,%edx,4), %eax
  4646a4: eb 05                        	jmp	0x4646ab <.text+0x636ab>
  4646a6: b8 60 12 69 00               	movl	$0x691260, %eax         # imm = 0x691260
  4646ab: 8b 0d c4 5d 6a 00            	movl	0x6a5dc4, %ecx
  4646b1: 50                           	pushl	%eax
  4646b2: 8b 51 20                     	movl	0x20(%ecx), %edx
  4646b5: 8b 82 88 00 00 00            	movl	0x88(%edx), %eax
  4646bb: 50                           	pushl	%eax
  4646bc: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  4646c1: e8 18 33 1b 00               	calll	0x6179de <.text+0x2169de>
  4646c6: 8b 8e fc 32 01 00            	movl	0x132fc(%esi), %ecx
  4646cc: 83 c4 0c                     	addl	$0xc, %esp
  4646cf: 6a 00                        	pushl	$0x0
  4646d1: 6a 01                        	pushl	$0x1
  4646d3: 68 28 74 69 00               	pushl	$0x697428               # imm = 0x697428
  4646d8: e8 f3 e2 00 00               	calll	0x4729d0 <.text+0x719d0>
  4646dd: 8b 55 fc                     	movl	-0x4(%ebp), %edx
  4646e0: 83 c9 ff                     	orl	$-0x1, %ecx
  4646e3: 52                           	pushl	%edx
  4646e4: 53                           	pushl	%ebx
  4646e5: e8 d6 60 13 00               	calll	0x59a7c0 <.text+0x1997c0>
  4646ea: 6a 01                        	pushl	$0x1
  4646ec: 6a 00                        	pushl	$0x0
  4646ee: 8b ce                        	movl	%esi, %ecx
  4646f0: e8 bb ed 02 00               	calll	0x4934b0 <.text+0x924b0>
  4646f5: 6a 00                        	pushl	$0x0
  4646f7: 6a 01                        	pushl	$0x1
  4646f9: 6a 00                        	pushl	$0x0
  4646fb: 6a 00                        	pushl	$0x0
  4646fd: 6a 00                        	pushl	$0x0
  4646ff: 6a 01                        	pushl	$0x1
  464701: 8b ce                        	movl	%esi, %ecx
  464703: e8 b8 f8 02 00               	calll	0x493fc0 <.text+0x92fc0>
  464708: 5f                           	popl	%edi
  464709: 5e                           	popl	%esi
  46470a: 5b                           	popl	%ebx
  46470b: 8b e5                        	movl	%ebp, %esp
  46470d: 5d                           	popl	%ebp
  46470e: c2 08 00                     	retl	$0x8
  464711: 90                           	nop
  464712: 90                           	nop
  464713: 90                           	nop
  464714: 90                           	nop
  464715: 90                           	nop
  464716: 90                           	nop
  464717: 90                           	nop
  464718: 90                           	nop
  464719: 90                           	nop
  46471a: 90                           	nop
  46471b: 90                           	nop
  46471c: 90                           	nop
  46471d: 90                           	nop
  46471e: 90                           	nop
  46471f: 90                           	nop
