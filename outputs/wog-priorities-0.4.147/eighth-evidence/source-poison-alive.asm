
ERA_REFERENCE_ROOT/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  44a3e3: f6 c2 10                     	testb	$0x10, %dl
  44a3e6: 75 0f                        	jne	0x44a3f7 <.text+0x493f7>
  44a3e8: d9 05 64 ac 63 00            	flds	0x63ac64
  44a3ee: 5f                           	popl	%edi
  44a3ef: 5e                           	popl	%esi
  44a3f0: 5b                           	popl	%ebx
  44a3f1: 8b e5                        	movl	%ebp, %esp
  44a3f3: 5d                           	popl	%ebp
  44a3f4: c2 08 00                     	retl	$0x8
  44a3f7: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  44a3fa: 83 f8 1e                     	cmpl	$0x1e, %eax
  44a3fd: 74 05                        	je	0x44a404 <.text+0x49404>
  44a3ff: 83 f8 1f                     	cmpl	$0x1f, %eax
  44a402: 75 12                        	jne	0x44a416 <.text+0x49416>
  44a404: d9 05 64 ac 63 00            	flds	0x63ac64
  44a40a: 5f                           	popl	%edi
  44a40b: 5e                           	popl	%esi
  44a40c: 5b                           	popl	%ebx
  44a40d: 8b e5                        	movl	%ebp, %esp
  44a40f: 5d                           	popl	%ebp
  44a410: c2 08 00                     	retl	$0x8
  44a413: 8b 55 fc                     	movl	-0x4(%ebp), %edx
