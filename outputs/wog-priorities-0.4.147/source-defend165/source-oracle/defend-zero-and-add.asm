
/Users/sevenone./Documents/git/era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  4791f3: 89 bb dc 04 00 00            	movl	%edi, 0x4dc(%ebx)
  4791f9: 8b 83 dc 04 00 00            	movl	0x4dc(%ebx), %eax
  4791ff: 8b 8b cc 00 00 00            	movl	0xcc(%ebx), %ecx
  479205: 03 c8                        	addl	%eax, %ecx
  479207: 89 8b cc 00 00 00            	movl	%ecx, 0xcc(%ebx)
