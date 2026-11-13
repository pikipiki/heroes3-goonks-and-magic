
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  756dbb: 55                           	pushl	%ebp
  756dbc: 8b ec                        	movl	%esp, %ebp
  756dbe: 53                           	pushl	%ebx
  756dbf: 56                           	pushl	%esi
  756dc0: 57                           	pushl	%edi
  756dc1: 89 0d 24 02 86 02            	movl	%ecx, 0x2860224
  756dc7: 8b 45 14                     	movl	0x14(%ebp), %eax
  756dca: a3 e4 6b 84 02               	movl	%eax, 0x2846be4
  756dcf: 8b 4d 10                     	movl	0x10(%ebp), %ecx
  756dd2: 89 0d 94 68 84 02            	movl	%ecx, 0x2846894
  756dd8: 8b 55 0c                     	movl	0xc(%ebp), %edx
  756ddb: 89 15 90 25 83 02            	movl	%edx, 0x2832590
  756de1: 8b 45 08                     	movl	0x8(%ebp), %eax
  756de4: a3 b8 68 84 02               	movl	%eax, 0x28468b8
  756de9: 60                           	pushal
  756dea: 90                           	nop
  756deb: 90                           	nop
  756dec: 90                           	nop
  756ded: 90                           	nop
  756dee: 90                           	nop
  756def: 90                           	nop
  756df0: 90                           	nop
  756df1: 90                           	nop
  756df2: 90                           	nop
  756df3: 90                           	nop
  756df4: 90                           	nop
  756df5: 90                           	nop
  756df6: 90                           	nop
  756df7: 90                           	nop
  756df8: 90                           	nop
  756df9: 90                           	nop
  756dfa: 90                           	nop
  756dfb: 90                           	nop
  756dfc: 90                           	nop
  756dfd: 8b 0d b4 90 78 00            	movl	0x7890b4, %ecx
  756e03: 89 0d 54 85 7c 00            	movl	%ecx, 0x7c8554
  756e09: e8 db fc ff ff               	calll	0x756ae9 <.text+0x55ae9>
  756e0e: a3 68 a3 82 02               	movl	%eax, 0x282a368
  756e13: 61                           	popal
  756e14: 83 3d 68 a3 82 02 00         	cmpl	$0x0, 0x282a368
  756e1b: 75 24                        	jne	0x756e41 <.text+0x55e41>
  756e1d: 8b 0d 24 02 86 02            	movl	0x2860224, %ecx
  756e23: ff 35 e4 6b 84 02            	pushl	0x2846be4
  756e29: ff 35 94 68 84 02            	pushl	0x2846894
  756e2f: ff 35 90 25 83 02            	pushl	0x2832590
  756e35: ff 35 b8 68 84 02            	pushl	0x28468b8
  756e3b: ff 15 54 85 7c 00            	calll	*0x7c8554
  756e41: 60                           	pushal
  756e42: 8b 15 b8 68 84 02            	movl	0x28468b8, %edx
  756e48: 52                           	pushl	%edx
  756e49: a1 24 02 86 02               	movl	0x2860224, %eax
  756e4e: 50                           	pushl	%eax
  756e4f: e8 59 05 01 00               	calll	0x7673ad <.text+0x663ad>
  756e54: 83 c4 08                     	addl	$0x8, %esp
  756e57: 8b 0d b8 68 84 02            	movl	0x28468b8, %ecx
  756e5d: 51                           	pushl	%ecx
  756e5e: 8b 15 24 02 86 02            	movl	0x2860224, %edx
  756e64: 52                           	pushl	%edx
  756e65: e8 6e 6d fc ff               	calll	0x71dbd8 <.text+0x1cbd8>
  756e6a: 83 c4 08                     	addl	$0x8, %esp
  756e6d: 90                           	nop
  756e6e: 90                           	nop
  756e6f: 90                           	nop
  756e70: 90                           	nop
  756e71: 90                           	nop
  756e72: 61                           	popal
  756e73: 5f                           	popl	%edi
  756e74: 5e                           	popl	%esi
  756e75: 5b                           	popl	%ebx
  756e76: 5d                           	popl	%ebp
  756e77: c2 10 00                     	retl	$0x10
