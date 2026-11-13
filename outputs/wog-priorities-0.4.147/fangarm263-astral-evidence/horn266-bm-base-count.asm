
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  75f020: 08 00                        	orb	%al, (%eax)
  75f022: 00 8b 45 bc ff 24            	addb	%cl, 0x24ffbc45(%ebx)
  75f028: 85 6e f8                     	testl	%ebp, -0x8(%esi)
  75f02b: 75 00                        	jne	0x75f02d <.text+0x5e02d>
  75f02d: 6a 00                        	pushl	$0x0
  75f02f: 8b 4d 14                     	movl	0x14(%ebp), %ecx
  75f032: 51                           	pushl	%ecx
  75f033: 6a 04                        	pushl	$0x4
  75f035: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  75f038: 83 c2 34                     	addl	$0x34, %edx
  75f03b: 52                           	pushl	%edx
  75f03c: e8 1c 29 fe ff               	calll	0x74195d <.text+0x4095d>
  75f041: 83 c4 10                     	addl	$0x10, %esp
  75f044: e9 14 08 00 00               	jmp	0x75f85d <.text+0x5e85d>
  75f049: 6a 00                        	pushl	$0x0
  75f04b: 8b 45 14                     	movl	0x14(%ebp), %eax
  75f04e: 50                           	pushl	%eax
  75f04f: 6a 04                        	pushl	$0x4
  75f051: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  75f054: 83 c1 4c                     	addl	$0x4c, %ecx
  75f057: 51                           	pushl	%ecx
  75f058: e8 00 29 fe ff               	calll	0x74195d <.text+0x4095d>
  75f05d: 83 c4 10                     	addl	$0x10, %esp
  75f060: e9 f8 07 00 00               	jmp	0x75f85d <.text+0x5e85d>
  75f065: 6a 00                        	pushl	$0x0
  75f067: 8b 55 14                     	movl	0x14(%ebp), %edx
  75f06a: 52                           	pushl	%edx
  75f06b: 6a 04                        	pushl	$0x4
  75f06d: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  75f070: 83 c0 58                     	addl	$0x58, %eax
  75f073: 50                           	pushl	%eax
  75f074: e8 e4 28 fe ff               	calll	0x74195d <.text+0x4095d>
  75f079: 83 c4 10                     	addl	$0x10, %esp
  75f07c: e9 dc 07 00 00               	jmp	0x75f85d <.text+0x5e85d>
  75f081: 6a 00                        	pushl	$0x0
  75f083: 8b 4d 14                     	movl	0x14(%ebp), %ecx
  75f086: 51                           	pushl	%ecx
  75f087: 6a 04                        	pushl	$0x4
  75f089: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  75f08c: 83 c2 60                     	addl	$0x60, %edx
  75f08f: 52                           	pushl	%edx
  75f090: e8 c8 28 fe ff               	calll	0x74195d <.text+0x4095d>
  75f095: 83 c4 10                     	addl	$0x10, %esp
  75f098: e9 c0 07 00 00               	jmp	0x75f85d <.text+0x5e85d>
  75f09d: 6a 00                        	pushl	$0x0
  75f09f: 8b 45 14                     	movl	0x14(%ebp), %eax
  75f0a2: 50                           	pushl	%eax
  75f0a3: 6a 04                        	pushl	$0x4
  75f0a5: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  75f0a8: 81 c1 dc 00 00 00            	addl	$0xdc, %ecx
  75f0ae: 51                           	pushl	%ecx
  75f0af: e8 a9 28 fe ff               	calll	0x74195d <.text+0x4095d>
  75f0b4: 83 c4 10                     	addl	$0x10, %esp
  75f0b7: e9 a1 07 00 00               	jmp	0x75f85d <.text+0x5e85d>
  75f0bc: 6a 00                        	pushl	$0x0
  75f0be: 8b 55 14                     	movl	0x14(%ebp), %edx
  75f0c1: 52                           	pushl	%edx
  75f0c2: 6a 04                        	pushl	$0x4
  75f0c4: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  75f0c7: 05 f4 00 00 00               	addl	$0xf4, %eax
  75f0cc: 50                           	pushl	%eax
  75f0cd: e8 8b 28 fe ff               	calll	0x74195d <.text+0x4095d>
  75f0d2: 83 c4 10                     	addl	$0x10, %esp
  75f0d5: e9 83 07 00 00               	jmp	0x75f85d <.text+0x5e85d>
  75f0da: 6a 00                        	pushl	$0x0
  75f0dc: 8b 4d 14                     	movl	0x14(%ebp), %ecx
  75f0df: 51                           	pushl	%ecx
  75f0e0: 6a 04                        	pushl	$0x4
  75f0e2: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  75f0e5: 81 c2 c8 00 00 00            	addl	$0xc8, %edx
  75f0eb: 52                           	pushl	%edx
  75f0ec: e8 6c 28 fe ff               	calll	0x74195d <.text+0x4095d>
  75f0f1: 83 c4 10                     	addl	$0x10, %esp
  75f0f4: e9 64 07 00 00               	jmp	0x75f85d <.text+0x5e85d>
  75f0f9: 6a 00                        	pushl	$0x0
  75f0fb: 8b 45 14                     	movl	0x14(%ebp), %eax
  75f0fe: 50                           	pushl	%eax
  75f0ff: 6a 04                        	pushl	$0x4
  75f101: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  75f104: 81 c1 cc 00 00 00            	addl	$0xcc, %ecx
  75f10a: 51                           	pushl	%ecx
  75f10b: e8 4d 28 fe ff               	calll	0x74195d <.text+0x4095d>
  75f110: 83 c4 10                     	addl	$0x10, %esp
  75f113: e9 45 07 00 00               	jmp	0x75f85d <.text+0x5e85d>
  75f118: 6a 00                        	pushl	$0x0
  75f11a: 8b 55 14                     	movl	0x14(%ebp), %edx
  75f11d: 52                           	pushl	%edx
  75f11e: 6a 04                        	pushl	$0x4
