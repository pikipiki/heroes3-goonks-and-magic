
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
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
