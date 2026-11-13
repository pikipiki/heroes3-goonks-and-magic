
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  446b7d: 8b 86 84 00 00 00            	movl	0x84(%esi), %eax
  446b83: c6 86 f0 04 00 00 01         	movb	$0x1, 0x4f0(%esi)
  446b8a: 8b c8                        	movl	%eax, %ecx
  446b8c: c1 e9 1b                     	shrl	$0x1b, %ecx
  446b8f: f6 c1 01                     	testb	$0x1, %cl
  446b92: 74 1f                        	je	0x446bb3 <.text+0x45bb3>
  446b94: 8b 96 dc 04 00 00            	movl	0x4dc(%esi), %edx
  446b9a: 8b be cc 00 00 00            	movl	0xcc(%esi), %edi
  446ba0: 2b fa                        	subl	%edx, %edi
  446ba2: 25 ff ff ff f7               	andl	$0xf7ffffff, %eax       # imm = 0xF7FFFFFF
  446ba7: 89 be cc 00 00 00            	movl	%edi, 0xcc(%esi)
  446bad: 89 86 84 00 00 00            	movl	%eax, 0x84(%esi)
