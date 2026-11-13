
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a0b31: a1 a8 7f 68 00               	movl	0x687fa8, %eax
  5a0b36: 6a 00                        	pushl	$0x0
  5a0b38: 6a 00                        	pushl	$0x0
  5a0b3a: 6a 00                        	pushl	$0x0
  5a0b3c: 8b 90 18 07 00 00            	movl	0x718(%eax), %edx
  5a0b42: 8b 84 b0 1c 07 00 00         	movl	0x71c(%eax,%esi,4), %eax
  5a0b49: 0f af 55 1c                  	imull	0x1c(%ebp), %edx
  5a0b4d: 03 c2                        	addl	%edx, %eax
  5a0b4f: 6a 00                        	pushl	$0x0
  5a0b51: 6a 0d                        	pushl	$0xd
  5a0b53: 50                           	pushl	%eax
  5a0b54: 8b cb                        	movl	%ebx, %ecx
  5a0b56: e8 95 70 00 00               	calll	0x5a7bf0 <.text+0x1a6bf0>
  5a0b5b: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  5a0b5e: 89 45 1c                     	movl	%eax, 0x1c(%ebp)
  5a0b61: 33 c0                        	xorl	%eax, %eax
  5a0b63: 83 fe 02                     	cmpl	$0x2, %esi
  5a0b66: 0f 9d c0                     	setge	%al
  5a0b69: 83 c0 02                     	addl	$0x2, %eax
  5a0b6c: 89 4d 18                     	movl	%ecx, 0x18(%ebp)
  5a0b6f: 85 c0                        	testl	%eax, %eax
  5a0b71: 89 45 d4                     	movl	%eax, -0x2c(%ebp)
  5a0b74: c7 45 14 00 00 00 00         	movl	$0x0, 0x14(%ebp)
  5a0b7b: 7e 9e                        	jle	0x5a0b1b <.text+0x19fb1b>
  5a0b7d: 8d bb 58 3d 01 00            	leal	0x13d58(%ebx), %edi
  5a0b83: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  5a0b86: 8b 55 18                     	movl	0x18(%ebp), %edx
  5a0b89: 6a 01                        	pushl	$0x1
  5a0b8b: 6a 64                        	pushl	$0x64
  5a0b8d: 8b 48 08                     	movl	0x8(%eax), %ecx
  5a0b90: 52                           	pushl	%edx
  5a0b91: 51                           	pushl	%ecx
  5a0b92: 8b cb                        	movl	%ebx, %ecx
  5a0b94: e8 f7 59 ef ff               	calll	0x496590 <.text+0x95590>
  5a0b99: 8b 0d 78 cf 63 00            	movl	0x63cf78, %ecx
  5a0b9f: e8 1c be fb ff               	calll	0x55c9c0 <.text+0x15b9c0>
  5a0ba4: 8b 55 0c                     	movl	0xc(%ebp), %edx
  5a0ba7: 89 45 a4                     	movl	%eax, -0x5c(%ebp)
  5a0baa: 8b 45 14                     	movl	0x14(%ebp), %eax
  5a0bad: c7 45 a8 68 cf 63 00         	movl	$0x63cf68, -0x58(%ebp)  # imm = 0x63CF68
  5a0bb4: 83 f8 01                     	cmpl	$0x1, %eax
  5a0bb7: 8b ca                        	movl	%edx, %ecx
  5a0bb9: 75 31                        	jne	0x5a0bec <.text+0x19fbec>
  5a0bbb: b8 79 78 78 78               	movl	$0x78787879, %eax       # imm = 0x78787879
  5a0bc0: 8d 4a ef                     	leal	-0x11(%edx), %ecx
  5a0bc3: f7 ea                        	imull	%edx
  5a0bc5: 8b f2                        	movl	%edx, %esi
  5a0bc7: c1 fe 03                     	sarl	$0x3, %esi
  5a0bca: 8b d6                        	movl	%esi, %edx
  5a0bcc: 8b c6                        	movl	%esi, %eax
  5a0bce: c1 ea 1f                     	shrl	$0x1f, %edx
  5a0bd1: 03 c2                        	addl	%edx, %eax
  5a0bd3: a8 01                        	testb	$0x1, %al
  5a0bd5: 8b 83 c0 32 01 00            	movl	0x132c0(%ebx), %eax
  5a0bdb: 74 08                        	je	0x5a0be5 <.text+0x19fbe5>
  5a0bdd: 83 f8 01                     	cmpl	$0x1, %eax
  5a0be0: 75 12                        	jne	0x5a0bf4 <.text+0x19fbf4>
  5a0be2: 49                           	decl	%ecx
  5a0be3: eb 0f                        	jmp	0x5a0bf4 <.text+0x19fbf4>
  5a0be5: 85 c0                        	testl	%eax, %eax
  5a0be7: 75 0b                        	jne	0x5a0bf4 <.text+0x19fbf4>
  5a0be9: 41                           	incl	%ecx
  5a0bea: eb 08                        	jmp	0x5a0bf4 <.text+0x19fbf4>
  5a0bec: 83 f8 02                     	cmpl	$0x2, %eax
  5a0bef: 75 03                        	jne	0x5a0bf4 <.text+0x19fbf4>
  5a0bf1: 8d 4a de                     	leal	-0x22(%edx), %ecx
  5a0bf4: 8b 47 08                     	movl	0x8(%edi), %eax
  5a0bf7: 8b 55 1c                     	movl	0x1c(%ebp), %edx
  5a0bfa: 88 4d ac                     	movb	%cl, -0x54(%ebp)
  5a0bfd: 8a 8b c0 32 01 00            	movb	0x132c0(%ebx), %cl
  5a0c03: 88 4d ad                     	movb	%cl, -0x53(%ebp)
  5a0c06: 8d 4d a4                     	leal	-0x5c(%ebp), %ecx
  5a0c09: 51                           	pushl	%ecx
  5a0c0a: 6a 01                        	pushl	$0x1
  5a0c0c: 50                           	pushl	%eax
  5a0c0d: 8b cf                        	movl	%edi, %ecx
  5a0c0f: c6 45 ae 01                  	movb	$0x1, -0x52(%ebp)
  5a0c13: 89 55 b0                     	movl	%edx, -0x50(%ebp)
  5a0c16: c7 45 b4 02 00 00 00         	movl	$0x2, -0x4c(%ebp)
  5a0c1d: c7 45 b8 42 00 00 00         	movl	$0x42, -0x48(%ebp)
