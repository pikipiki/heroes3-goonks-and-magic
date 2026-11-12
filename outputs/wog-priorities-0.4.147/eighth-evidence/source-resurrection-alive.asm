
ERA_REFERENCE_ROOT/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a4029: 8b 96 84 00 00 00            	movl	0x84(%esi), %edx
  5a402f: c1 ea 04                     	shrl	$0x4, %edx
  5a4032: f6 c2 01                     	testb	$0x1, %dl
  5a4035: 0f 84 ff 00 00 00            	je	0x5a413a <.text+0x1a313a>
  5a403b: 8b 4e 4c                     	movl	0x4c(%esi), %ecx
  5a403e: 8b 56 60                     	movl	0x60(%esi), %edx
  5a4041: 3b ca                        	cmpl	%edx, %ecx
  5a4043: 0f 8d f1 00 00 00            	jge	0x5a413a <.text+0x1a313a>
