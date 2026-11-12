
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a5cc3: 8b 0d d0 92 69 00            	movl	0x6992d0, %ecx
  5a5cc9: 8d 04 b6                     	leal	(%esi,%esi,4), %eax
  5a5ccc: 8b 51 40                     	movl	0x40(%ecx), %edx
  5a5ccf: 8d 04 80                     	leal	(%eax,%eax,4), %eax
  5a5cd2: c1 e0 05                     	shll	$0x5, %eax
  5a5cd5: 8b 4a 30                     	movl	0x30(%edx), %ecx
  5a5cd8: 66 8b 53 18                  	movw	0x18(%ebx), %dx
  5a5cdc: 03 c7                        	addl	%edi, %eax
  5a5cde: 66 89 14 41                  	movw	%dx, (%ecx,%eax,2)
