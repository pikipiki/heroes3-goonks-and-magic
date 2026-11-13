
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  75ca39: 81 7d d4 c3 00 00 00         	cmpl	$0xc3, -0x2c(%ebp)
  75ca40: 75 34                        	jne	0x75ca76 <.text+0x5ba76>
  75ca42: 8b 45 e0                     	movl	-0x20(%ebp), %eax
  75ca45: 83 38 06                     	cmpl	$0x6, (%eax)
  75ca48: 75 2c                        	jne	0x75ca76 <.text+0x5ba76>
  75ca4a: 8b 4d e4                     	movl	-0x1c(%ebp), %ecx
  75ca4d: 8b 11                        	movl	(%ecx), %edx
  75ca4f: 52                           	pushl	%edx
  75ca50: e8 b8 e7 ff ff               	calll	0x75b20d <.text+0x5a20d>
  75ca55: 83 c4 04                     	addl	$0x4, %esp
  75ca58: 89 45 ac                     	movl	%eax, -0x54(%ebp)
  75ca5b: 83 7d ac 00                  	cmpl	$0x0, -0x54(%ebp)
  75ca5f: 75 02                        	jne	0x75ca63 <.text+0x5ba63>
  75ca61: eb 13                        	jmp	0x75ca76 <.text+0x5ba76>
  75ca63: 8b 45 ac                     	movl	-0x54(%ebp), %eax
  75ca66: c7 80 ec 00 00 00 0d 00 00 00	movl	$0xd, 0xec(%eax)
  75ca70: 33 c9                        	xorl	%ecx, %ecx
  75ca72: 85 c9                        	testl	%ecx, %ecx
  75ca74: 75 d4                        	jne	0x75ca4a <.text+0x5ba4a>
  75ca76: 8b 55 e0                     	movl	-0x20(%ebp), %edx
  75ca79: 83 3a 07                     	cmpl	$0x7, (%edx)
  75ca7c: 74 0c                        	je	0x75ca8a <.text+0x5ba8a>
  75ca7e: 8b 45 e0                     	movl	-0x20(%ebp), %eax
  75ca81: 83 38 06                     	cmpl	$0x6, (%eax)
  75ca84: 0f 85 91 00 00 00            	jne	0x75cb1b <.text+0x5bb1b>
  75ca8a: 8b 4d e4                     	movl	-0x1c(%ebp), %ecx
  75ca8d: 8b 11                        	movl	(%ecx), %edx
  75ca8f: 52                           	pushl	%edx
  75ca90: e8 78 e7 ff ff               	calll	0x75b20d <.text+0x5a20d>
  75ca95: 83 c4 04                     	addl	$0x4, %esp
  75ca98: 89 45 98                     	movl	%eax, -0x68(%ebp)
  75ca9b: 83 7d 98 00                  	cmpl	$0x0, -0x68(%ebp)
  75ca9f: 75 02                        	jne	0x75caa3 <.text+0x5baa3>
  75caa1: eb 78                        	jmp	0x75cb1b <.text+0x5bb1b>
  75caa3: 8b 45 98                     	movl	-0x68(%ebp), %eax
  75caa6: 8b 88 f4 00 00 00            	movl	0xf4(%eax), %ecx
  75caac: 89 4d a0                     	movl	%ecx, -0x60(%ebp)
  75caaf: 83 7d a0 00                  	cmpl	$0x0, -0x60(%ebp)
  75cab3: 74 0e                        	je	0x75cac3 <.text+0x5bac3>
  75cab5: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  75cab8: 89 55 9c                     	movl	%edx, -0x64(%ebp)
  75cabb: 8b 45 ec                     	movl	-0x14(%ebp), %eax
  75cabe: 89 45 a4                     	movl	%eax, -0x5c(%ebp)
  75cac1: eb 0c                        	jmp	0x75cacf <.text+0x5bacf>
  75cac3: 8b 4d ec                     	movl	-0x14(%ebp), %ecx
  75cac6: 89 4d 9c                     	movl	%ecx, -0x64(%ebp)
  75cac9: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  75cacc: 89 55 a4                     	movl	%edx, -0x5c(%ebp)
  75cacf: 8b 45 9c                     	movl	-0x64(%ebp), %eax
  75cad2: 50                           	pushl	%eax
  75cad3: 8b 4d a4                     	movl	-0x5c(%ebp), %ecx
  75cad6: 51                           	pushl	%ecx
  75cad7: 8b 55 98                     	movl	-0x68(%ebp), %edx
  75cada: 52                           	pushl	%edx
  75cadb: a1 0c e6 82 02               	movl	0x282e60c, %eax
  75cae0: 50                           	pushl	%eax
  75cae1: e8 c3 0c fc ff               	calll	0x71d7a9 <.text+0x1c7a9>
  75cae6: 83 c4 10                     	addl	$0x10, %esp
  75cae9: 89 45 a8                     	movl	%eax, -0x58(%ebp)
  75caec: 83 7d a8 ff                  	cmpl	$-0x1, -0x58(%ebp)
  75caf0: 74 0c                        	je	0x75cafe <.text+0x5bafe>
  75caf2: 8b 4d 98                     	movl	-0x68(%ebp), %ecx
  75caf5: 8b 55 a8                     	movl	-0x58(%ebp), %edx
  75caf8: 89 91 ec 00 00 00            	movl	%edx, 0xec(%ecx)
  75cafe: 8b 45 98                     	movl	-0x68(%ebp), %eax
  75cb01: 50                           	pushl	%eax
  75cb02: 8b 0d 0c e6 82 02            	movl	0x282e60c, %ecx
  75cb08: 51                           	pushl	%ecx
  75cb09: e8 71 10 fc ff               	calll	0x71db7f <.text+0x1cb7f>
  75cb0e: 83 c4 08                     	addl	$0x8, %esp
  75cb11: 33 d2                        	xorl	%edx, %edx
  75cb13: 85 d2                        	testl	%edx, %edx
  75cb15: 0f 85 6f ff ff ff            	jne	0x75ca8a <.text+0x5ba8a>
