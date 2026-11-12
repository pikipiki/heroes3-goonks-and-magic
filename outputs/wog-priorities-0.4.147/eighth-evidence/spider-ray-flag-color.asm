
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  43f23d: 8b 8b 84 00 00 00            	movl	0x84(%ebx), %ecx
  43f243: c1 e9 0b                     	shrl	$0xb, %ecx
  43f246: f6 c1 01                     	testb	$0x1, %cl
  43f249: 0f 84 a7 00 00 00            	je	0x43f2f6 <.text+0x3e2f6>
  43f24f: 8b 15 3c 88 69 00            	movl	0x69883c, %edx
  43f255: d9 04 95 7c cf 63 00         	flds	0x63cf7c(,%edx,4)
  43f25c: d8 0d a4 b8 63 00            	fmuls	0x63b8a4
  43f262: e8 2d 8d 1d 00               	calll	0x617f94 <.text+0x216f94>
  43f267: 8b c8                        	movl	%eax, %ecx
  43f269: e8 e2 97 0b 00               	calll	0x4f8a50 <.text+0xf7a50>
  43f26e: 8b 5b 34                     	movl	0x34(%ebx), %ebx
  43f271: 8d 43 dd                     	leal	-0x23(%ebx), %eax
  43f274: 83 f8 56                     	cmpl	$0x56, %eax
  43f277: 77 1d                        	ja	0x43f296 <.text+0x3e296>
  43f279: 33 c9                        	xorl	%ecx, %ecx
  43f27b: 8a 88 c4 f5 43 00            	movb	0x43f5c4(%eax), %cl
  43f281: ff 24 8d b8 f5 43 00         	jmpl	*0x43f5b8(,%ecx,4)
  43f288: b9 2e 01 00 00               	movl	$0x12e, %ecx            # imm = 0x12E
  43f28d: eb 09                        	jmp	0x43f298 <.text+0x3e298>
  43f28f: b9 30 01 00 00               	movl	$0x130, %ecx            # imm = 0x130
  43f294: eb 02                        	jmp	0x43f298 <.text+0x3e298>
  43f296: 33 c9                        	xorl	%ecx, %ecx
  43f298: 8b 75 f0                     	movl	-0x10(%ebp), %esi
  43f29b: b8 89 88 88 88               	movl	$0x88888889, %eax       # imm = 0x88888889
  43f2a0: f7 ee                        	imull	%esi
  43f2a2: 03 d6                        	addl	%esi, %edx
  43f2a4: 6a 00                        	pushl	$0x0
  43f2a6: c1 fa 03                     	sarl	$0x3, %edx
  43f2a9: 8b c2                        	movl	%edx, %eax
  43f2ab: 6a 0a                        	pushl	$0xa
  43f2ad: c1 e8 1f                     	shrl	$0x1f, %eax
  43f2b0: 6a 00                        	pushl	$0x0
  43f2b2: 6a 01                        	pushl	$0x1
  43f2b4: 8d 54 02 0f                  	leal	0xf(%edx,%eax), %edx
  43f2b8: 8b 45 cc                     	movl	-0x34(%ebp), %eax
  43f2bb: 52                           	pushl	%edx
  43f2bc: 8b 55 d0                     	movl	-0x30(%ebp), %edx
  43f2bf: 6a 00                        	pushl	$0x0
  43f2c1: 6a 00                        	pushl	$0x0
  43f2c3: 51                           	pushl	%ecx
  43f2c4: 8b 4d ec                     	movl	-0x14(%ebp), %ecx
  43f2c7: 6a 04                        	pushl	$0x4
  43f2c9: 6a 05                        	pushl	$0x5
  43f2cb: 6a 00                        	pushl	$0x0
  43f2cd: 6a 00                        	pushl	$0x0
  43f2cf: 50                           	pushl	%eax
  43f2d0: 8b 45 d4                     	movl	-0x2c(%ebp), %eax
  43f2d3: 51                           	pushl	%ecx
  43f2d4: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  43f2da: 52                           	pushl	%edx
  43f2db: 50                           	pushl	%eax
  43f2dc: 6a 01                        	pushl	$0x1
  43f2de: e8 4d 6c 16 00               	calll	0x5a5f30 <.text+0x1a4f30>
