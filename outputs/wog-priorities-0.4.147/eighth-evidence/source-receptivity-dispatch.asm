
ERA_REFERENCE_ROOT/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  44a247: 81 7d f8 95 00 00 00         	cmpl	$0x95, -0x8(%ebp)
  44a24e: 0f 84 4d 01 00 00            	je	0x44a3a1 <.text+0x493a1>
  44a254: 83 c0 ef                     	addl	$-0x11, %eax
  44a257: 83 f8 36                     	cmpl	$0x36, %eax
  44a25a: 0f 87 b6 01 00 00            	ja	0x44a416 <.text+0x49416>
  44a260: 33 c9                        	xorl	%ecx, %ecx
  44a262: 8a 88 fc a5 44 00            	movb	0x44a5fc(%eax), %cl
  44a268: ff 24 8d b8 a5 44 00         	jmpl	*0x44a5b8(,%ecx,4)
