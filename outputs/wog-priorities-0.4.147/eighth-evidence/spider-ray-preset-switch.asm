
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a58b7: 8b 43 18                     	movl	0x18(%ebx), %eax
  5a58ba: 05 d4 fe ff ff               	addl	$0xfffffed4, %eax       # imm = 0xFFFFFED4
  5a58bf: 83 f8 05                     	cmpl	$0x5, %eax
  5a58c2: 0f 87 fb 03 00 00            	ja	0x5a5cc3 <.text+0x1a4cc3>
  5a58c8: ff 24 85 84 5d 5a 00         	jmpl	*0x5a5d84(,%eax,4)
