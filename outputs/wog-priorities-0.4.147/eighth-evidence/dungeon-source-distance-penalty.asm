
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  46723e: 8b 47 34                     	movl	0x34(%edi), %eax
  467241: 3d 95 00 00 00               	cmpl	$0x95, %eax
  467246: 0f 84 c3 01 00 00            	je	0x46740f <.text+0x6640f>
  46724c: 3d 89 00 00 00               	cmpl	$0x89, %eax
  467251: 0f 84 b8 01 00 00            	je	0x46740f <.text+0x6640f>
  467257: 8b 45 0c                     	movl	0xc(%ebp), %eax
  46725a: 8b 4f 38                     	movl	0x38(%edi), %ecx
  46725d: 8b 70 38                     	movl	0x38(%eax), %esi
  467260: 8a 87 84 00 00 00            	movb	0x84(%edi), %al
  467266: a8 01                        	testb	$0x1, %al
  467268: 74 09                        	je	0x467273 <.text+0x66273>
  46726a: 8b cf                        	movl	%edi, %ecx
  46726c: e8 4f f1 fd ff               	calll	0x4463c0 <.text+0x453c0>
  467271: 8b c8                        	movl	%eax, %ecx
  467273: 8b c1                        	movl	%ecx, %eax
  467275: bf 11 00 00 00               	movl	$0x11, %edi
  46727a: 99                           	cltd
  46727b: f7 ff                        	idivl	%edi
  46727d: b8 79 78 78 78               	movl	$0x78787879, %eax       # imm = 0x78787879
  467282: 8b fa                        	movl	%edx, %edi
  467284: f7 e9                        	imull	%ecx
  467286: c1 fa 03                     	sarl	$0x3, %edx
  467289: 8b ca                        	movl	%edx, %ecx
  46728b: 8b c6                        	movl	%esi, %eax
  46728d: c1 e9 1f                     	shrl	$0x1f, %ecx
  467290: 03 d1                        	addl	%ecx, %edx
  467292: b9 11 00 00 00               	movl	$0x11, %ecx
  467297: 8b da                        	movl	%edx, %ebx
  467299: 99                           	cltd
  46729a: f7 f9                        	idivl	%ecx
  46729c: b8 79 78 78 78               	movl	$0x78787879, %eax       # imm = 0x78787879
  4672a1: 89 55 08                     	movl	%edx, 0x8(%ebp)
  4672a4: f7 ee                        	imull	%esi
  4672a6: c1 fa 03                     	sarl	$0x3, %edx
  4672a9: 8b c2                        	movl	%edx, %eax
  4672ab: c1 e8 1f                     	shrl	$0x1f, %eax
  4672ae: 03 d0                        	addl	%eax, %edx
  4672b0: 8b f2                        	movl	%edx, %esi
  4672b2: 8d 46 01                     	leal	0x1(%esi), %eax
  4672b5: 99                           	cltd
  4672b6: 2b c2                        	subl	%edx, %eax
  4672b8: 8b c8                        	movl	%eax, %ecx
  4672ba: 8d 43 01                     	leal	0x1(%ebx), %eax
  4672bd: 99                           	cltd
  4672be: d1 f9                        	sarl	%ecx
  4672c0: 2b c2                        	subl	%edx, %eax
  4672c2: 8b d1                        	movl	%ecx, %edx
  4672c4: 8b c8                        	movl	%eax, %ecx
  4672c6: 8b 45 08                     	movl	0x8(%ebp), %eax
  4672c9: d1 f9                        	sarl	%ecx
  4672cb: 2b ca                        	subl	%edx, %ecx
  4672cd: 2b cf                        	subl	%edi, %ecx
  4672cf: 03 c8                        	addl	%eax, %ecx
  4672d1: 8b c6                        	movl	%esi, %eax
  4672d3: 99                           	cltd
  4672d4: 2b c2                        	subl	%edx, %eax
  4672d6: 8b f0                        	movl	%eax, %esi
  4672d8: 8b c3                        	movl	%ebx, %eax
  4672da: 99                           	cltd
  4672db: 2b c2                        	subl	%edx, %eax
  4672dd: d1 fe                        	sarl	%esi
  4672df: d1 f8                        	sarl	%eax
  4672e1: 2b f0                        	subl	%eax, %esi
  4672e3: 8b 45 08                     	movl	0x8(%ebp), %eax
  4672e6: 2b f7                        	subl	%edi, %esi
  4672e8: 03 f0                        	addl	%eax, %esi
  4672ea: b8 00 00 00 00               	movl	$0x0, %eax
  4672ef: 0f 98 c0                     	sets	%al
  4672f2: 33 d2                        	xorl	%edx, %edx
  4672f4: 85 c9                        	testl	%ecx, %ecx
  4672f6: 0f 9c c2                     	setl	%dl
  4672f9: 3b d0                        	cmpl	%eax, %edx
  4672fb: 8b c6                        	movl	%esi, %eax
  4672fd: 99                           	cltd
  4672fe: 8b f0                        	movl	%eax, %esi
  467300: 75 1f                        	jne	0x467321 <.text+0x66321>
  467302: 33 f2                        	xorl	%edx, %esi
  467304: 8b c1                        	movl	%ecx, %eax
  467306: 2b f2                        	subl	%edx, %esi
  467308: 99                           	cltd
  467309: 33 c2                        	xorl	%edx, %eax
  46730b: 89 75 08                     	movl	%esi, 0x8(%ebp)
  46730e: 2b c2                        	subl	%edx, %eax
  467310: 89 45 fc                     	movl	%eax, -0x4(%ebp)
  467313: 3b c6                        	cmpl	%esi, %eax
  467315: 8d 45 08                     	leal	0x8(%ebp), %eax
  467318: 7c 03                        	jl	0x46731d <.text+0x6631d>
  46731a: 8d 45 fc                     	leal	-0x4(%ebp), %eax
  46731d: 8b 30                        	movl	(%eax), %esi
  46731f: eb 0d                        	jmp	0x46732e <.text+0x6632e>
  467321: 33 f2                        	xorl	%edx, %esi
  467323: 8b c1                        	movl	%ecx, %eax
  467325: 2b f2                        	subl	%edx, %esi
  467327: 99                           	cltd
  467328: 33 c2                        	xorl	%edx, %eax
  46732a: 2b c2                        	subl	%edx, %eax
  46732c: 03 f0                        	addl	%eax, %esi
  46732e: 83 fe 0a                     	cmpl	$0xa, %esi
  467331: 0f 8e d8 00 00 00            	jle	0x46740f <.text+0x6640f>
  467337: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  46733a: f6 81 84 00 00 00 01         	testb	$0x1, 0x84(%ecx)
  467341: 75 0b                        	jne	0x46734e <.text+0x6634e>
  467343: 5f                           	popl	%edi
  467344: 5e                           	popl	%esi
  467345: b0 01                        	movb	$0x1, %al
  467347: 5b                           	popl	%ebx
  467348: 8b e5                        	movl	%ebp, %esp
  46734a: 5d                           	popl	%ebp
  46734b: c2 08 00                     	retl	$0x8
  46734e: e8 6d f0 fd ff               	calll	0x4463c0 <.text+0x453c0>
