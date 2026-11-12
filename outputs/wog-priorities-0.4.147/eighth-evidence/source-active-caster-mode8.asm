
ERA_REFERENCE_ROOT/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  44835e: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  448361: 85 c9                        	testl	%ecx, %ecx
  448363: 7c 78                        	jl	0x4483dd <.text+0x473dd>
  448365: 81 f9 bb 00 00 00            	cmpl	$0xbb, %ecx
  44836b: 7d 70                        	jge	0x4483dd <.text+0x473dd>
  44836d: 8b 46 4c                     	movl	0x4c(%esi), %eax
  448370: 8d 04 80                     	leal	(%eax,%eax,4), %eax
  448373: 50                           	pushl	%eax
  448374: 6a 02                        	pushl	$0x2
  448376: 6a ff                        	pushl	$-0x1
  448378: 6a 01                        	pushl	$0x1
  44837a: 51                           	pushl	%ecx
  44837b: 8b 8e e0 04 00 00            	movl	0x4e0(%esi), %ecx
  448381: 51                           	pushl	%ecx
  448382: eb 4e                        	jmp	0x4483d2 <.text+0x473d2>
