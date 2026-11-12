
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a4150: 55                           	pushl	%ebp
  5a4151: 8b ec                        	movl	%esp, %ebp
  5a4153: 51                           	pushl	%ecx
  5a4154: 8b 45 0c                     	movl	0xc(%ebp), %eax
  5a4157: 53                           	pushl	%ebx
  5a4158: 56                           	pushl	%esi
  5a4159: 57                           	pushl	%edi
  5a415a: 85 c0                        	testl	%eax, %eax
  5a415c: 89 4d fc                     	movl	%ecx, -0x4(%ebp)
  5a415f: 0f 8c bd 00 00 00            	jl	0x5a4222 <.text+0x1a3222>
  5a4165: 3d bb 00 00 00               	cmpl	$0xbb, %eax
  5a416a: 0f 8d b2 00 00 00            	jge	0x5a4222 <.text+0x1a3222>
  5a4170: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  5a4177: 2b d0                        	subl	%eax, %edx
  5a4179: c1 e2 04                     	shll	$0x4, %edx
  5a417c: 8a 84 0a d4 01 00 00         	movb	0x1d4(%edx,%ecx), %al
  5a4183: 8d 3c 0a                     	leal	(%edx,%ecx), %edi
  5a4186: a8 02                        	testb	$0x2, %al
  5a4188: 0f 85 94 00 00 00            	jne	0x5a4222 <.text+0x1a3222>
  5a418e: 8a 87 dc 01 00 00            	movb	0x1dc(%edi), %al
  5a4194: 84 c0                        	testb	%al, %al
  5a4196: 0f 8d 86 00 00 00            	jge	0x5a4222 <.text+0x1a3222>
  5a419c: 8b 9f e0 01 00 00            	movl	0x1e0(%edi), %ebx
  5a41a2: 4b                           	decl	%ebx
  5a41a3: 78 7d                        	js	0x5a4222 <.text+0x1a3222>
  5a41a5: 0f be b4 1f e4 01 00 00      	movsbl	0x1e4(%edi,%ebx), %esi
  5a41ad: 8b 45 08                     	movl	0x8(%ebp), %eax
  5a41b0: 0f be 8c 1f f2 01 00 00      	movsbl	0x1f2(%edi,%ebx), %ecx
  5a41b8: 3b f0                        	cmpl	%eax, %esi
  5a41ba: 75 63                        	jne	0x5a421f <.text+0x1a321f>
  5a41bc: 8d 04 f5 00 00 00 00         	leal	(,%esi,8), %eax
  5a41c3: 2b c6                        	subl	%esi, %eax
  5a41c5: 8d 14 41                     	leal	(%ecx,%eax,2), %edx
  5a41c8: 03 c2                        	addl	%edx, %eax
  5a41ca: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  5a41d1: 2b d0                        	subl	%eax, %edx
  5a41d3: 8d 14 52                     	leal	(%edx,%edx,2), %edx
  5a41d6: 8d 04 d0                     	leal	(%eax,%edx,8), %eax
  5a41d9: 8b 55 fc                     	movl	-0x4(%ebp), %edx
  5a41dc: 8b 84 c2 50 55 00 00         	movl	0x5550(%edx,%eax,8), %eax
  5a41e3: c1 e8 04                     	shrl	$0x4, %eax
  5a41e6: a8 01                        	testb	$0x1, %al
  5a41e8: 74 35                        	je	0x5a421f <.text+0x1a321f>
  5a41ea: 8a 84 3b 00 02 00 00         	movb	0x200(%ebx,%edi), %al
  5a41f1: 84 c0                        	testb	%al, %al
  5a41f3: 75 13                        	jne	0x5a4208 <.text+0x1a3208>
  5a41f5: 8a 97 4c 02 00 00            	movb	0x24c(%edi), %dl
  5a41fb: 84 d2                        	testb	%dl, %dl
  5a41fd: 7d 20                        	jge	0x5a421f <.text+0x1a321f>
  5a41ff: f6 87 44 02 00 00 02         	testb	$0x2, 0x244(%edi)
  5a4206: 75 17                        	jne	0x5a421f <.text+0x1a321f>
  5a4208: 3c 01                        	cmpb	$0x1, %al
  5a420a: 75 21                        	jne	0x5a422d <.text+0x1a322d>
  5a420c: 8a 87 6c 01 00 00            	movb	0x16c(%edi), %al
  5a4212: 84 c0                        	testb	%al, %al
  5a4214: 7d 09                        	jge	0x5a421f <.text+0x1a321f>
  5a4216: f6 87 64 01 00 00 02         	testb	$0x2, 0x164(%edi)
  5a421d: 74 0e                        	je	0x5a422d <.text+0x1a322d>
  5a421f: 4b                           	decl	%ebx
  5a4220: 79 83                        	jns	0x5a41a5 <.text+0x1a31a5>
  5a4222: 5f                           	popl	%edi
  5a4223: 5e                           	popl	%esi
  5a4224: 33 c0                        	xorl	%eax, %eax
  5a4226: 5b                           	popl	%ebx
  5a4227: 8b e5                        	movl	%ebp, %esp
  5a4229: 5d                           	popl	%ebp
  5a422a: c2 08 00                     	retl	$0x8
  5a422d: 8d 04 f5 00 00 00 00         	leal	(,%esi,8), %eax
