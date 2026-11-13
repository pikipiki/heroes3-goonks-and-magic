
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  71d939: 55                           	pushl	%ebp
  71d93a: 8b ec                        	movl	%esp, %ebp
  71d93c: 83 ec 28                     	subl	$0x28, %esp
  71d93f: 53                           	pushl	%ebx
  71d940: 56                           	pushl	%esi
  71d941: 57                           	pushl	%edi
  71d942: 90                           	nop
  71d943: 90                           	nop
  71d944: 90                           	nop
  71d945: 90                           	nop
  71d946: 90                           	nop
  71d947: 90                           	nop
  71d948: 90                           	nop
  71d949: 90                           	nop
  71d94a: 90                           	nop
  71d94b: 90                           	nop
  71d94c: 90                           	nop
  71d94d: 90                           	nop
  71d94e: 90                           	nop
  71d94f: 90                           	nop
  71d950: 90                           	nop
  71d951: 90                           	nop
  71d952: 90                           	nop
  71d953: 90                           	nop
  71d954: 90                           	nop
  71d955: 83 3d 38 f1 79 00 00         	cmpl	$0x0, 0x79f138
  71d95c: 74 0a                        	je	0x71d968 <.text+0x1c968>
  71d95e: 90                           	nop
  71d95f: 90                           	nop
  71d960: 90                           	nop
  71d961: 90                           	nop
  71d962: 90                           	nop
  71d963: e9 10 02 00 00               	jmp	0x71db78 <.text+0x1cb78>
  71d968: 6a 01                        	pushl	$0x1
  71d96a: 8b 45 08                     	movl	0x8(%ebp), %eax
  71d96d: 50                           	pushl	%eax
  71d96e: e8 fa e7 ff ff               	calll	0x71c16d <.text+0x1b16d>
  71d973: 83 c4 08                     	addl	$0x8, %esp
  71d976: 85 c0                        	testl	%eax, %eax
  71d978: 75 0a                        	jne	0x71d984 <.text+0x1c984>
  71d97a: 90                           	nop
  71d97b: 90                           	nop
  71d97c: 90                           	nop
  71d97d: 90                           	nop
  71d97e: 90                           	nop
  71d97f: e9 f4 01 00 00               	jmp	0x71db78 <.text+0x1cb78>
  71d984: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  71d987: 8b 51 4c                     	movl	0x4c(%ecx), %edx
  71d98a: 89 55 fc                     	movl	%edx, -0x4(%ebp)
  71d98d: 83 7d fc 01                  	cmpl	$0x1, -0x4(%ebp)
  71d991: 7d 0a                        	jge	0x71d99d <.text+0x1c99d>
  71d993: 90                           	nop
  71d994: 90                           	nop
  71d995: 90                           	nop
  71d996: 90                           	nop
  71d997: 90                           	nop
  71d998: e9 db 01 00 00               	jmp	0x71db78 <.text+0x1cb78>
  71d99d: 8b 45 0c                     	movl	0xc(%ebp), %eax
  71d9a0: 83 78 4c 00                  	cmpl	$0x0, 0x4c(%eax)
  71d9a4: 7f 0a                        	jg	0x71d9b0 <.text+0x1c9b0>
  71d9a6: 90                           	nop
  71d9a7: 90                           	nop
  71d9a8: 90                           	nop
  71d9a9: 90                           	nop
  71d9aa: 90                           	nop
  71d9ab: e9 c8 01 00 00               	jmp	0x71db78 <.text+0x1cb78>
  71d9b0: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  71d9b3: 89 0d 78 58 84 00            	movl	%ecx, 0x845878
  71d9b9: 8b 55 0c                     	movl	0xc(%ebp), %edx
  71d9bc: 89 15 04 73 84 00            	movl	%edx, 0x847304
  71d9c2: 8a 45 10                     	movb	0x10(%ebp), %al
  71d9c5: a2 00 73 84 00               	movb	%al, 0x847300
  71d9ca: c7 45 f0 00 00 00 00         	movl	$0x0, -0x10(%ebp)
  71d9d1: c7 45 f8 ff ff ff ff         	movl	$0xffffffff, -0x8(%ebp) # imm = 0xFFFFFFFF
  71d9d8: c7 45 ec 00 00 00 00         	movl	$0x0, -0x14(%ebp)
  71d9df: eb 09                        	jmp	0x71d9ea <.text+0x1c9ea>
  71d9e1: 8b 4d ec                     	movl	-0x14(%ebp), %ecx
  71d9e4: 83 c1 01                     	addl	$0x1, %ecx
  71d9e7: 89 4d ec                     	movl	%ecx, -0x14(%ebp)
  71d9ea: 83 7d ec 0e                  	cmpl	$0xe, -0x14(%ebp)
  71d9ee: 0f 8d 64 01 00 00            	jge	0x71db58 <.text+0x1cb58>
  71d9f4: 8b 55 ec                     	movl	-0x14(%ebp), %edx
  71d9f7: 6b d2 11                     	imull	$0x11, %edx, %edx
  71d9fa: 81 c2 98 7d 84 00            	addl	$0x847d98, %edx         # imm = 0x847D98
  71da00: 89 55 e8                     	movl	%edx, -0x18(%ebp)
  71da03: 8b 45 e8                     	movl	-0x18(%ebp), %eax
  71da06: 8b 08                        	movl	(%eax), %ecx
  71da08: 83 e1 01                     	andl	$0x1, %ecx
  71da0b: 85 c9                        	testl	%ecx, %ecx
  71da0d: 75 02                        	jne	0x71da11 <.text+0x1ca11>
  71da0f: eb d0                        	jmp	0x71d9e1 <.text+0x1c9e1>
  71da11: 8b 55 e8                     	movl	-0x18(%ebp), %edx
  71da14: 0f be 42 04                  	movsbl	0x4(%edx), %eax
  71da18: 0f be 4d 10                  	movsbl	0x10(%ebp), %ecx
  71da1c: 3b c1                        	cmpl	%ecx, %eax
  71da1e: 0f 85 2f 01 00 00            	jne	0x71db53 <.text+0x1cb53>
  71da24: 8b 55 e8                     	movl	-0x18(%ebp), %edx
  71da27: 0f b6 42 05                  	movzbl	0x5(%edx), %eax
  71da2b: 89 45 f8                     	movl	%eax, -0x8(%ebp)
  71da2e: 8b 4d e8                     	movl	-0x18(%ebp), %ecx
  71da31: 03 0d 94 7d 84 00            	addl	0x847d94, %ecx
  71da37: 0f b6 51 06                  	movzbl	0x6(%ecx), %edx
  71da3b: 89 55 dc                     	movl	%edx, -0x24(%ebp)
  71da3e: db 45 dc                     	fildl	-0x24(%ebp)
  71da41: d9 5d f0                     	fstps	-0x10(%ebp)
  71da44: d9 45 f0                     	flds	-0x10(%ebp)
  71da47: d8 1d 20 51 78 00            	fcomps	0x785120
  71da4d: df e0                        	fnstsw	%ax
  71da4f: f6 c4 05                     	testb	$0x5, %ah
  71da52: 7a 02                        	jp	0x71da56 <.text+0x1ca56>
  71da54: eb 8b                        	jmp	0x71d9e1 <.text+0x1c9e1>
  71da56: 83 7d f8 00                  	cmpl	$0x0, -0x8(%ebp)
  71da5a: 7d 02                        	jge	0x71da5e <.text+0x1ca5e>
  71da5c: eb 83                        	jmp	0x71d9e1 <.text+0x1c9e1>
  71da5e: 83 7d f8 57                  	cmpl	$0x57, -0x8(%ebp)
  71da62: 7c 05                        	jl	0x71da69 <.text+0x1ca69>
  71da64: e9 78 ff ff ff               	jmp	0x71d9e1 <.text+0x1c9e1>
  71da69: 6a 64                        	pushl	$0x64
  71da6b: 6a 01                        	pushl	$0x1
  71da6d: e8 97 2a ff ff               	calll	0x710509 <.text+0xf509>
  71da72: 83 c4 08                     	addl	$0x8, %esp
  71da75: 89 45 d8                     	movl	%eax, -0x28(%ebp)
  71da78: db 45 d8                     	fildl	-0x28(%ebp)
  71da7b: d8 5d f0                     	fcomps	-0x10(%ebp)
  71da7e: df e0                        	fnstsw	%ax
  71da80: f6 c4 41                     	testb	$0x41, %ah
  71da83: 75 05                        	jne	0x71da8a <.text+0x1ca8a>
  71da85: e9 57 ff ff ff               	jmp	0x71d9e1 <.text+0x1c9e1>
  71da8a: 8b 45 08                     	movl	0x8(%ebp), %eax
  71da8d: 8b 88 f4 00 00 00            	movl	0xf4(%eax), %ecx
  71da93: 89 4d e0                     	movl	%ecx, -0x20(%ebp)
  71da96: 8b 55 08                     	movl	0x8(%ebp), %edx
  71da99: 83 ba 88 02 00 00 00         	cmpl	$0x0, 0x288(%edx)
  71daa0: 74 0c                        	je	0x71daae <.text+0x1caae>
  71daa2: 33 c0                        	xorl	%eax, %eax
  71daa4: 83 7d e0 00                  	cmpl	$0x0, -0x20(%ebp)
  71daa8: 0f 94 c0                     	sete	%al
  71daab: 89 45 e0                     	movl	%eax, -0x20(%ebp)
  71daae: c7 45 e4 03 00 00 00         	movl	$0x3, -0x1c(%ebp)
  71dab5: 0f be 4d 10                  	movsbl	0x10(%ebp), %ecx
  71dab9: 83 f9 4a                     	cmpl	$0x4a, %ecx
  71dabc: 74 09                        	je	0x71dac7 <.text+0x1cac7>
  71dabe: 0f be 55 10                  	movsbl	0x10(%ebp), %edx
  71dac2: 83 fa 4b                     	cmpl	$0x4b, %edx
  71dac5: 75 07                        	jne	0x71dace <.text+0x1cace>
  71dac7: c7 45 e4 02 00 00 00         	movl	$0x2, -0x1c(%ebp)
  71dace: 0f be 45 10                  	movsbl	0x10(%ebp), %eax
  71dad2: 83 f8 6a                     	cmpl	$0x6a, %eax
  71dad5: 74 09                        	je	0x71dae0 <.text+0x1cae0>
  71dad7: 0f be 4d 10                  	movsbl	0x10(%ebp), %ecx
  71dadb: 83 f9 6b                     	cmpl	$0x6b, %ecx
  71dade: 75 07                        	jne	0x71dae7 <.text+0x1cae7>
  71dae0: c7 45 e4 01 00 00 00         	movl	$0x1, -0x1c(%ebp)
  71dae7: 83 7d f8 0e                  	cmpl	$0xe, -0x8(%ebp)
  71daeb: 75 26                        	jne	0x71db13 <.text+0x1cb13>
  71daed: 83 7d e0 00                  	cmpl	$0x0, -0x20(%ebp)
  71daf1: 74 05                        	je	0x71daf8 <.text+0x1caf8>
  71daf3: e9 e9 fe ff ff               	jmp	0x71d9e1 <.text+0x1c9e1>
  71daf8: b8 20 94 69 00               	movl	$0x699420, %eax         # imm = 0x699420
  71dafd: 8b 00                        	movl	(%eax), %eax
  71daff: 8b 80 f4 32 01 00            	movl	0x132f4(%eax), %eax
  71db05: 89 45 f4                     	movl	%eax, -0xc(%ebp)
  71db08: 83 7d f4 01                  	cmpl	$0x1, -0xc(%ebp)
  71db0c: 7d 05                        	jge	0x71db13 <.text+0x1cb13>
  71db0e: e9 ce fe ff ff               	jmp	0x71d9e1 <.text+0x1c9e1>
  71db13: b9 20 94 69 00               	movl	$0x699420, %ecx         # imm = 0x699420
  71db18: 8b 09                        	movl	(%ecx), %ecx
  71db1a: 6a 01                        	pushl	$0x1
  71db1c: 6a 01                        	pushl	$0x1
  71db1e: ff 75 0c                     	pushl	0xc(%ebp)
  71db21: ff 75 e0                     	pushl	-0x20(%ebp)
  71db24: ff 75 f8                     	pushl	-0x8(%ebp)
  71db27: b8 50 89 5a 00               	movl	$0x5a8950, %eax         # imm = 0x5A8950
  71db2c: ff d0                        	calll	*%eax
  71db2e: 84 c0                        	testb	%al, %al
  71db30: 74 21                        	je	0x71db53 <.text+0x1cb53>
  71db32: 8b 7d 0c                     	movl	0xc(%ebp), %edi
  71db35: 8b 4f 38                     	movl	0x38(%edi), %ecx
  71db38: 6a 03                        	pushl	$0x3
  71db3a: ff 75 e4                     	pushl	-0x1c(%ebp)
  71db3d: 6a ff                        	pushl	$-0x1
  71db3f: 6a 01                        	pushl	$0x1
  71db41: 51                           	pushl	%ecx
  71db42: b9 20 94 69 00               	movl	$0x699420, %ecx         # imm = 0x699420
  71db47: 8b 09                        	movl	(%ecx), %ecx
  71db49: ff 75 f8                     	pushl	-0x8(%ebp)
  71db4c: b8 40 01 5a 00               	movl	$0x5a0140, %eax         # imm = 0x5A0140
  71db51: ff d0                        	calll	*%eax
  71db53: e9 89 fe ff ff               	jmp	0x71d9e1 <.text+0x1c9e1>
  71db58: c7 05 78 58 84 00 00 00 00 00	movl	$0x0, 0x845878
  71db62: c7 05 04 73 84 00 00 00 00 00	movl	$0x0, 0x847304
  71db6c: c6 05 00 73 84 00 00         	movb	$0x0, 0x847300
  71db73: 90                           	nop
  71db74: 90                           	nop
  71db75: 90                           	nop
  71db76: 90                           	nop
  71db77: 90                           	nop
  71db78: 5f                           	popl	%edi
