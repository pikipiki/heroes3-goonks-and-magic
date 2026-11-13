
/Users/sevenone./Documents/git/era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  479036: 8b 83 84 00 00 00            	movl	0x84(%ebx), %eax
  47903c: a9 00 00 00 0c               	testl	$0xc000000, %eax        # imm = 0xC000000
  479041: 0f 85 c6 01 00 00            	jne	0x47920d <.text+0x7820d>
  479047: 0d 00 00 00 04               	orl	$0x4000000, %eax        # imm = 0x4000000
  47904c: 89 83 84 00 00 00            	movl	%eax, 0x84(%ebx)
  479052: 8a 8e 68 3d 01 00            	movb	0x13d68(%esi), %cl
  479058: 84 c9                        	testb	%cl, %cl
  47905a: 0f 85 93 01 00 00            	jne	0x4791f3 <.text+0x781f3>
  479060: c1 e8 06                     	shrl	$0x6, %eax
  479063: a8 01                        	testb	$0x1, %al
  479065: 0f 85 88 01 00 00            	jne	0x4791f3 <.text+0x781f3>
  47906b: 8a 55 0b                     	movb	0xb(%ebp), %dl
  47906e: 57                           	pushl	%edi
  47906f: 8d 4d c0                     	leal	-0x40(%ebp), %ecx
  479072: 88 55 c0                     	movb	%dl, -0x40(%ebp)
  479075: e8 b6 b0 f8 ff               	calll	0x404130 <.text+0x3130>
  47907a: 8b 8b cc 00 00 00            	movl	0xcc(%ebx), %ecx
  479080: b8 1f 85 eb 51               	movl	$0x51eb851f, %eax       # imm = 0x51EB851F
  479085: 89 7d fc                     	movl	%edi, -0x4(%ebp)
  479088: 8b bb 84 00 00 00            	movl	0x84(%ebx), %edi
  47908e: 8d 0c 89                     	leal	(%ecx,%ecx,4), %ecx
  479091: 81 cf 00 00 00 08            	orl	$0x8000000, %edi        # imm = 0x8000000
  479097: c1 e1 02                     	shll	$0x2, %ecx
  47909a: f7 e9                        	imull	%ecx
  47909c: c1 fa 05                     	sarl	$0x5, %edx
  47909f: 8b c2                        	movl	%edx, %eax
  4790a1: 89 bb 84 00 00 00            	movl	%edi, 0x84(%ebx)
  4790a7: c1 e8 1f                     	shrl	$0x1f, %eax
  4790aa: bf 01 00 00 00               	movl	$0x1, %edi
  4790af: 03 d0                        	addl	%eax, %edx
  4790b1: 3b d7                        	cmpl	%edi, %edx
  4790b3: 89 7d e4                     	movl	%edi, -0x1c(%ebp)
  4790b6: 89 55 e8                     	movl	%edx, -0x18(%ebp)
  4790b9: 8d 45 e4                     	leal	-0x1c(%ebp), %eax
  4790bc: 7c 03                        	jl	0x4790c1 <.text+0x780c1>
  4790be: 8d 45 e8                     	leal	-0x18(%ebp), %eax
  4790c1: 8b 08                        	movl	(%eax), %ecx
  4790c3: 8b 43 4c                     	movl	0x4c(%ebx), %eax
  4790c6: 3b c7                        	cmpl	%edi, %eax
  4790c8: 8b 43 34                     	movl	0x34(%ebx), %eax
  4790cb: 89 8b dc 04 00 00            	movl	%ecx, 0x4dc(%ebx)
