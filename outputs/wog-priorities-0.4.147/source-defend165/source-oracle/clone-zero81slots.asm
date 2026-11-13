
/Users/sevenone./Documents/git/era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  43d313: b9 51 00 00 00               	movl	$0x51, %ecx
  43d318: 33 c0                        	xorl	%eax, %eax
  43d31a: 8d be 98 01 00 00            	leal	0x198(%esi), %edi
  43d320: c7 46 2c ff ff ff ff         	movl	$0xffffffff, 0x2c(%esi) # imm = 0xFFFFFFFF
  43d327: 89 9e 94 01 00 00            	movl	%ebx, 0x194(%esi)
  43d32d: 83 ec 10                     	subl	$0x10, %esp
  43d330: f3 ab                        	rep		stosl	%eax, %es:(%edi)
