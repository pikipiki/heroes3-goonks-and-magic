
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  75f118: 6a 00                        	pushl	$0x0
  75f11a: 8b 55 14                     	movl	0x14(%ebp), %edx
  75f11d: 52                           	pushl	%edx
  75f11e: 6a 04                        	pushl	$0x4
  75f120: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  75f123: 05 c0 00 00 00               	addl	$0xc0, %eax
  75f128: 50                           	pushl	%eax
  75f129: e8 2f 28 fe ff               	calll	0x74195d <.text+0x4095d>
  75f12e: 83 c4 10                     	addl	$0x10, %esp
  75f131: 85 c0                        	testl	%eax, %eax
  75f133: 74 05                        	je	0x75f13a <.text+0x5e13a>
  75f135: e9 23 07 00 00               	jmp	0x75f85d <.text+0x5e85d>
  75f13a: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  75f13d: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  75f140: 8b 82 c0 00 00 00            	movl	0xc0(%edx), %eax
  75f146: 89 41 6c                     	movl	%eax, 0x6c(%ecx)
  75f149: e9 0f 07 00 00               	jmp	0x75f85d <.text+0x5e85d>
