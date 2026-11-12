
ERA_REFERENCE_ROOT/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  44add0: 55                           	pushl	%ebp
  44add1: 8b ec                        	movl	%esp, %ebp
  44add3: 53                           	pushl	%ebx
  44add4: 8b 5d 14                     	movl	0x14(%ebp), %ebx
  44add7: 57                           	pushl	%edi
  44add8: 83 fb 02                     	cmpl	$0x2, %ebx
  44addb: 8b f9                        	movl	%ecx, %edi
  44addd: 75 08                        	jne	0x44ade7 <.text+0x49de7>
  44addf: 5f                           	popl	%edi
  44ade0: 33 c0                        	xorl	%eax, %eax
  44ade2: 5b                           	popl	%ebx
  44ade3: 5d                           	popl	%ebp
  44ade4: c2 18 00                     	retl	$0x18
  44ade7: 8b 45 08                     	movl	0x8(%ebp), %eax
  44adea: 8b 04 87                     	movl	(%edi,%eax,4), %eax
  44aded: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  44adf4: 2b c8                        	subl	%eax, %ecx
  44adf6: 8d 14 88                     	leal	(%eax,%ecx,4), %edx
  44adf9: a1 b0 47 67 00               	movl	0x6747b0, %eax
  44adfe: f7 44 90 10 00 00 02 00      	testl	$0x20000, 0x10(%eax,%edx,4) # imm = 0x20000
  44ae06: 74 08                        	je	0x44ae10 <.text+0x49e10>
  44ae08: 5f                           	popl	%edi
  44ae09: 33 c0                        	xorl	%eax, %eax
  44ae0b: 5b                           	popl	%ebx
  44ae0c: 5d                           	popl	%ebp
  44ae0d: c2 18 00                     	retl	$0x18
