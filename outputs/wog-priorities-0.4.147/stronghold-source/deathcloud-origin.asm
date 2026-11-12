
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  43fcf0: 8d 0c 9b                     	leal	(%ebx,%ebx,4), %ecx
  43fcf3: 8d 04 8a                     	leal	(%edx,%ecx,4), %eax
  43fcf6: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  43fcfc: 8d 84 08 7c 54 00 00         	leal	0x547c(%eax,%ecx), %eax
  43fd03: 80 38 00                     	cmpb	$0x0, (%eax)
  43fd06: 75 74                        	jne	0x43fd7c <.text+0x3ed7c>
  43fd08: 85 ff                        	testl	%edi, %edi
  43fd0a: c6 00 01                     	movb	$0x1, (%eax)
  43fd0d: c7 45 e0 00 00 00 00         	movl	$0x0, -0x20(%ebp)
  43fd14: 74 36                        	je	0x43fd4c <.text+0x3ed4c>
  43fd16: 6a 00                        	pushl	$0x0
  43fd18: 8b ce                        	movl	%esi, %ecx
  43fd1a: e8 61 31 00 00               	calll	0x442e80 <.text+0x41e80>
  43fd1f: 8b 8e 90 04 00 00            	movl	0x490(%esi), %ecx
  43fd25: 8d 55 e0                     	leal	-0x20(%ebp), %edx
  43fd28: 52                           	pushl	%edx
  43fd29: 51                           	pushl	%ecx
  43fd2a: 6a 00                        	pushl	$0x0
  43fd2c: 6a 01                        	pushl	$0x1
  43fd2e: 50                           	pushl	%eax
  43fd2f: 57                           	pushl	%edi
  43fd30: 8b ce                        	movl	%esi, %ecx
  43fd32: e8 29 3f 00 00               	calll	0x443c60 <.text+0x42c60>
  43fd37: 50                           	pushl	%eax
  43fd38: 8b cf                        	movl	%edi, %ecx
  43fd3a: 89 45 e4                     	movl	%eax, -0x1c(%ebp)
  43fd3d: e8 6e 40 00 00               	calll	0x443db0 <.text+0x42db0>
  43fd42: 89 45 e8                     	movl	%eax, -0x18(%ebp)
  43fd45: c7 46 70 00 00 00 00         	movl	$0x0, 0x70(%esi)
  43fd4c: 8b 55 e4                     	movl	-0x1c(%ebp), %edx
  43fd4f: 8b 5d f4                     	movl	-0xc(%ebp), %ebx
  43fd52: 8b 45 e8                     	movl	-0x18(%ebp), %eax
  43fd55: 03 da                        	addl	%edx, %ebx
  43fd57: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  43fd5a: 89 5d f4                     	movl	%ebx, -0xc(%ebp)
  43fd5d: 03 d0                        	addl	%eax, %edx
  43fd5f: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  43fd62: 85 c0                        	testl	%eax, %eax
  43fd64: 89 55 f0                     	movl	%edx, -0x10(%ebp)
