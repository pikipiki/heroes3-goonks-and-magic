
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  75caba: 9c                           	pushfl
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
