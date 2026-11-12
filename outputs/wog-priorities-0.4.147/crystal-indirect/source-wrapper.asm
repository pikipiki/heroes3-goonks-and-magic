
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  766a15: 55                           	pushl	%ebp
  766a16: 8b ec                        	movl	%esp, %ebp
  766a18: 53                           	pushl	%ebx
  766a19: 56                           	pushl	%esi
  766a1a: 57                           	pushl	%edi
  766a1b: 89 0d 38 64 84 02            	movl	%ecx, 0x2846438
  766a21: 8b 45 08                     	movl	0x8(%ebp), %eax
  766a24: a3 74 a3 82 02               	movl	%eax, 0x282a374
  766a29: 8b 45 04                     	movl	0x4(%ebp), %eax
  766a2c: a3 c0 26 83 02               	movl	%eax, 0x28326c0
  766a31: 60                           	pushal
  766a32: 90                           	nop
  766a33: 90                           	nop
  766a34: 90                           	nop
  766a35: 90                           	nop
  766a36: 90                           	nop
  766a37: 90                           	nop
  766a38: 90                           	nop
  766a39: 90                           	nop
  766a3a: 90                           	nop
  766a3b: 90                           	nop
  766a3c: 90                           	nop
  766a3d: 90                           	nop
  766a3e: 90                           	nop
  766a3f: 90                           	nop
  766a40: 90                           	nop
  766a41: 90                           	nop
  766a42: 90                           	nop
  766a43: 90                           	nop
  766a44: 90                           	nop
  766a45: e8 76 ff ff ff               	calll	0x7669c0 <.text+0x659c0>
  766a4a: 83 3d dc 60 84 02 00         	cmpl	$0x0, 0x28460dc
  766a51: 0f 84 98 00 00 00            	je	0x766aef <.text+0x65aef>
  766a57: a1 74 a3 82 02               	movl	0x282a374, %eax
  766a5c: 50                           	pushl	%eax
  766a5d: 8b 0d 38 64 84 02            	movl	0x2846438, %ecx
  766a63: 8b 51 34                     	movl	0x34(%ecx), %edx
  766a66: 52                           	pushl	%edx
  766a67: a1 38 64 84 02               	movl	0x2846438, %eax
  766a6c: 50                           	pushl	%eax
  766a6d: e8 ad 7c 00 00               	calll	0x76e71f <.text+0x6d71f>
  766a72: 83 c4 0c                     	addl	$0xc, %esp
  766a75: 85 c0                        	testl	%eax, %eax
  766a77: 74 0c                        	je	0x766a85 <.text+0x65a85>
  766a79: c7 05 f4 26 83 02 00 00 00 00	movl	$0x0, 0x28326f4
  766a83: eb 68                        	jmp	0x766aed <.text+0x65aed>
  766a85: 8b 0d 38 64 84 02            	movl	0x2846438, %ecx
  766a8b: 33 d2                        	xorl	%edx, %edx
  766a8d: 81 79 34 c4 00 00 00         	cmpl	$0xc4, 0x34(%ecx)
  766a94: 0f 95 c2                     	setne	%dl
  766a97: 4a                           	decl	%edx
  766a98: 83 e2 14                     	andl	$0x14, %edx
  766a9b: 52                           	pushl	%edx
  766a9c: a1 38 64 84 02               	movl	0x2846438, %eax
  766aa1: 50                           	pushl	%eax
  766aa2: e8 02 5b fb ff               	calll	0x71c5a9 <.text+0x1b5a9>
  766aa7: 83 c4 08                     	addl	$0x8, %esp
  766aaa: 85 c0                        	testl	%eax, %eax
  766aac: 74 0c                        	je	0x766aba <.text+0x65aba>
  766aae: c7 05 f4 26 83 02 00 00 00 00	movl	$0x0, 0x28326f4
  766ab8: eb 33                        	jmp	0x766aed <.text+0x65aed>
  766aba: 8b 0d 88 18 81 02            	movl	0x2811888, %ecx
  766ac0: 51                           	pushl	%ecx
  766ac1: 8b 15 38 64 84 02            	movl	0x2846438, %edx
  766ac7: 52                           	pushl	%edx
  766ac8: e8 43 5c fb ff               	calll	0x71c710 <.text+0x1b710>
  766acd: 83 c4 08                     	addl	$0x8, %esp
  766ad0: a3 88 18 81 02               	movl	%eax, 0x2811888
  766ad5: a1 88 18 81 02               	movl	0x2811888, %eax
  766ada: 8b 0d 38 64 84 02            	movl	0x2846438, %ecx
  766ae0: 50                           	pushl	%eax
  766ae1: b8 b0 3d 44 00               	movl	$0x443db0, %eax         # imm = 0x443DB0
  766ae6: ff d0                        	calll	*%eax
  766ae8: a3 f4 26 83 02               	movl	%eax, 0x28326f4
  766aed: eb 0a                        	jmp	0x766af9 <.text+0x65af9>
  766aef: c7 05 f4 26 83 02 00 00 00 00	movl	$0x0, 0x28326f4
  766af9: 90                           	nop
  766afa: 90                           	nop
  766afb: 90                           	nop
  766afc: 90                           	nop
  766afd: 90                           	nop
  766afe: 61                           	popal
  766aff: a1 f4 26 83 02               	movl	0x28326f4, %eax
  766b04: 5f                           	popl	%edi
  766b05: 5e                           	popl	%esi
  766b06: 5b                           	popl	%ebx
  766b07: 5d                           	popl	%ebp
  766b08: c2 04 00                     	retl	$0x4
