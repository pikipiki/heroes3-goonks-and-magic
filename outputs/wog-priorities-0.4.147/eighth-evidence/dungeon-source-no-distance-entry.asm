
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  75dd41: 55                           	pushl	%ebp
  75dd42: 8b ec                        	movl	%esp, %ebp
  75dd44: 53                           	pushl	%ebx
  75dd45: 56                           	pushl	%esi
  75dd46: 57                           	pushl	%edi
  75dd47: 89 3d e0 60 84 02            	movl	%edi, 0x28460e0
  75dd4d: 8b 47 34                     	movl	0x34(%edi), %eax
  75dd50: 3d 95 00 00 00               	cmpl	$0x95, %eax
  75dd55: 74 7b                        	je	0x75ddd2 <.text+0x5cdd2>
  75dd57: 3d 89 00 00 00               	cmpl	$0x89, %eax
  75dd5c: 74 74                        	je	0x75ddd2 <.text+0x5cdd2>
  75dd5e: 3d aa 00 00 00               	cmpl	$0xaa, %eax
  75dd63: 74 6d                        	je	0x75ddd2 <.text+0x5cdd2>
  75dd65: 3d ab 00 00 00               	cmpl	$0xab, %eax
  75dd6a: 74 66                        	je	0x75ddd2 <.text+0x5cdd2>
  75dd6c: 60                           	pushal
  75dd6d: a3 34 64 84 02               	movl	%eax, 0x2846434
  75dd72: 90                           	nop
  75dd73: 90                           	nop
  75dd74: 90                           	nop
  75dd75: 90                           	nop
  75dd76: 90                           	nop
  75dd77: 90                           	nop
  75dd78: 90                           	nop
  75dd79: 90                           	nop
  75dd7a: 90                           	nop
  75dd7b: 90                           	nop
  75dd7c: 90                           	nop
  75dd7d: 90                           	nop
  75dd7e: 90                           	nop
  75dd7f: 90                           	nop
  75dd80: 90                           	nop
  75dd81: 90                           	nop
  75dd82: 90                           	nop
  75dd83: 90                           	nop
  75dd84: 90                           	nop
  75dd85: a1 e0 60 84 02               	movl	0x28460e0, %eax
  75dd8a: 50                           	pushl	%eax
  75dd8b: 6a 00                        	pushl	$0x0
  75dd8d: 8b 0d 34 64 84 02            	movl	0x2846434, %ecx
  75dd93: 51                           	pushl	%ecx
  75dd94: e8 fa 07 01 00               	calll	0x76e593 <.text+0x6d593>
  75dd99: 83 c4 0c                     	addl	$0xc, %esp
  75dd9c: a3 34 64 84 02               	movl	%eax, 0x2846434
  75dda1: 83 3d 34 64 84 02 01         	cmpl	$0x1, 0x2846434
  75dda8: 75 14                        	jne	0x75ddbe <.text+0x5cdbe>
  75ddaa: 8b 15 e0 60 84 02            	movl	0x28460e0, %edx
  75ddb0: 52                           	pushl	%edx
  75ddb1: e8 a1 f4 fb ff               	calll	0x71d257 <.text+0x1c257>
  75ddb6: 83 c4 04                     	addl	$0x4, %esp
  75ddb9: a3 34 64 84 02               	movl	%eax, 0x2846434
  75ddbe: 90                           	nop
  75ddbf: 90                           	nop
  75ddc0: 90                           	nop
  75ddc1: 90                           	nop
  75ddc2: 90                           	nop
  75ddc3: 61                           	popal
  75ddc4: a1 34 64 84 02               	movl	0x2846434, %eax
  75ddc9: eb 09                        	jmp	0x75ddd4 <.text+0x5cdd4>
  75ddcb: b8 01 00 00 00               	movl	$0x1, %eax
  75ddd0: eb 02                        	jmp	0x75ddd4 <.text+0x5cdd4>
  75ddd2: 33 c0                        	xorl	%eax, %eax
  75ddd4: 5f                           	popl	%edi
  75ddd5: 5e                           	popl	%esi
  75ddd6: 5b                           	popl	%ebx
  75ddd7: 5d                           	popl	%ebp
  75ddd8: c3                           	retl
