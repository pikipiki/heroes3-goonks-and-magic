
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
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
