
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  442e50: 8b 81 0c 02 00 00            	movl	0x20c(%ecx), %eax
  442e56: 85 c0                        	testl	%eax, %eax
  442e58: 74 07                        	je	0x442e61 <.text+0x41e61>
  442e5a: d9 81 a0 04 00 00            	flds	0x4a0(%ecx)
  442e60: c3                           	retl
  442e61: 83 79 34 35                  	cmpl	$0x35, 0x34(%ecx)
  442e65: 75 07                        	jne	0x442e6e <.text+0x41e6e>
  442e67: d9 05 b4 b8 63 00            	flds	0x63b8b4
  442e6d: c3                           	retl
  442e6e: d9 05 64 ac 63 00            	flds	0x63ac64
  442e74: c3                           	retl
