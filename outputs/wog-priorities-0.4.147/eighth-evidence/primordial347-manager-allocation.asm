
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  4ee34f: 68 ec 40 01 00               	pushl	$0x140ec                # imm = 0x140EC
  4ee354: 89 75 fc                     	movl	%esi, -0x4(%ebp)
  4ee357: a3 b8 92 69 00               	movl	%eax, 0x6992b8
  4ee35c: e8 31 91 12 00               	calll	0x617492 <.text+0x216492>
  4ee361: 83 c4 04                     	addl	$0x4, %esp
  4ee364: 89 45 f0                     	movl	%eax, -0x10(%ebp)
  4ee367: 85 c0                        	testl	%eax, %eax
  4ee369: c7 45 fc 08 00 00 00         	movl	$0x8, -0x4(%ebp)
  4ee370: 74 09                        	je	0x4ee37b <.text+0xed37b>
  4ee372: 8b c8                        	movl	%eax, %ecx
  4ee374: e8 c7 3f f7 ff               	calll	0x462340 <.text+0x61340>
  4ee379: eb 02                        	jmp	0x4ee37d <.text+0xed37d>
  4ee37b: 33 c0                        	xorl	%eax, %eax
