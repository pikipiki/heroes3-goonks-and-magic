
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  61931d: e8 63 7a 00 00               	calll	0x620d85 <.text+0x21fd85>
  619322: dd 5d f8                     	fstpl	-0x8(%ebp)
  619325: dd 45 f8                     	fldl	-0x8(%ebp)
  619328: dc 5d 08                     	fcompl	0x8(%ebp)
  61932b: 59                           	popl	%ecx
  61932c: 59                           	popl	%ecx
  61932d: df e0                        	fnstsw	%ax
  61932f: 9e                           	sahf
  619330: 75 0e                        	jne	0x619340 <.text+0x218340>
  619332: 56                           	pushl	%esi
  619333: 53                           	pushl	%ebx
  619334: e8 cb 72 00 00               	calll	0x620604 <.text+0x21f604>
  619339: dd 45 f8                     	fldl	-0x8(%ebp)
  61933c: 59                           	popl	%ecx
  61933d: 59                           	popl	%ecx
  61933e: eb 22                        	jmp	0x619362 <.text+0x218362>
  619340: f6 c3 20                     	testb	$0x20, %bl
  619343: 75 ed                        	jne	0x619332 <.text+0x218332>
  619345: dd 45 f8                     	fldl	-0x8(%ebp)
  619348: 53                           	pushl	%ebx
  619349: 51                           	pushl	%ecx
  61934a: 51                           	pushl	%ecx
  61934b: dd 1c 24                     	fstpl	(%esp)
  61934e: dd 45 08                     	fldl	0x8(%ebp)
  619351: 51                           	pushl	%ecx
  619352: 51                           	pushl	%ecx
  619353: dd 1c 24                     	fstpl	(%esp)
  619356: 6a 0c                        	pushl	$0xc
  619358: 6a 10                        	pushl	$0x10
  61935a: e8 e0 6a 00 00               	calll	0x61fe3f <.text+0x21ee3f>
  61935f: 83 c4 1c                     	addl	$0x1c, %esp
  619362: 5e                           	popl	%esi
  619363: 5b                           	popl	%ebx
  619364: c9                           	leave
  619365: c3                           	retl
  619366: 55                           	pushl	%ebp
  619367: 8b ec                        	movl	%esp, %ebp
  619369: 83 ec 18                     	subl	$0x18, %esp
  61936c: 56                           	pushl	%esi
  61936d: 8b 75 08                     	movl	0x8(%ebp), %esi
  619370: 83 3d b0 fb 68 00 01         	cmpl	$0x1, 0x68fbb0
  619377: 7e 0f                        	jle	0x619388 <.text+0x218388>
  619379: 0f b6 06                     	movzbl	(%esi), %eax
  61937c: 6a 08                        	pushl	$0x8
  61937e: 50                           	pushl	%eax
  61937f: e8 a2 27 00 00               	calll	0x61bb26 <.text+0x21ab26>
  619384: 59                           	popl	%ecx
  619385: 59                           	popl	%ecx
  619386: eb 0f                        	jmp	0x619397 <.text+0x218397>
  619388: 0f b6 06                     	movzbl	(%esi), %eax
  61938b: 8b 0d bc fb 68 00            	movl	0x68fbbc, %ecx
  619391: 8a 04 41                     	movb	(%ecx,%eax,2), %al
  619394: 83 e0 08                     	andl	$0x8, %eax
  619397: 85 c0                        	testl	%eax, %eax
  619399: 74 03                        	je	0x61939e <.text+0x21839e>
  61939b: 46                           	incl	%esi
  61939c: eb d2                        	jmp	0x619370 <.text+0x218370>
  61939e: 6a 00                        	pushl	$0x0
  6193a0: 6a 00                        	pushl	$0x0
  6193a2: 56                           	pushl	%esi
  6193a3: e8 28 19 00 00               	calll	0x61acd0 <.text+0x219cd0>
  6193a8: 59                           	popl	%ecx
  6193a9: 50                           	pushl	%eax
  6193aa: 8d 45 e8                     	leal	-0x18(%ebp), %eax
  6193ad: 56                           	pushl	%esi
  6193ae: 50                           	pushl	%eax
  6193af: e8 e3 79 00 00               	calll	0x620d97 <.text+0x21fd97>
  6193b4: dd 40 10                     	fldl	0x10(%eax)
  6193b7: 83 c4 14                     	addl	$0x14, %esp
  6193ba: 5e                           	popl	%esi
  6193bb: c9                           	leave
  6193bc: c3                           	retl
  6193bd: a1 28 f7 68 00               	movl	0x68f728, %eax
  6193c2: 85 c0                        	testl	%eax, %eax
  6193c4: 74 02                        	je	0x6193c8 <.text+0x2183c8>
  6193c6: ff d0                        	calll	*%eax
  6193c8: 68 00 f2 65 00               	pushl	$0x65f200               # imm = 0x65F200
  6193cd: 68 ec f1 65 00               	pushl	$0x65f1ec               # imm = 0x65F1EC
  6193d2: e8 ec 00 00 00               	calll	0x6194c3 <.text+0x2184c3>
