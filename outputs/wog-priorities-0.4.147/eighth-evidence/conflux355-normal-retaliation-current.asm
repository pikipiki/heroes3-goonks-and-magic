
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  441b43: a1 20 94 69 00               	movl	0x699420, %eax
  441b48: b9 01 00 00 00               	movl	$0x1, %ecx
  441b4d: 53                           	pushl	%ebx
  441b4e: 57                           	pushl	%edi
  441b4f: 2b 88 c0 32 01 00            	subl	0x132c0(%eax), %ecx
  441b55: 89 88 c0 32 01 00            	movl	%ecx, 0x132c0(%eax)
  441b5b: 8b ce                        	movl	%esi, %ecx
  441b5d: e8 ce f7 ff ff               	calll	0x441330 <.text+0x40330>
  441b62: a1 20 94 69 00               	movl	0x699420, %eax
  441b67: ba 01 00 00 00               	movl	$0x1, %edx
  441b6c: 2b 90 c0 32 01 00            	subl	0x132c0(%eax), %edx
  441b72: 89 90 c0 32 01 00            	movl	%edx, 0x132c0(%eax)
  441b78: 8b 86 54 04 00 00            	movl	0x454(%esi), %eax
  441b7e: 48                           	decl	%eax
  441b7f: 89 86 54 04 00 00            	movl	%eax, 0x454(%esi)
