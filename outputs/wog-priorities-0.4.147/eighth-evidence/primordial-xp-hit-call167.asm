
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  441982: 8b 55 dc                     	movl	-0x24(%ebp), %edx
  441985: 8b 45 f4                     	movl	-0xc(%ebp), %eax
  441988: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  44198b: 52                           	pushl	%edx
  44198c: 50                           	pushl	%eax
  44198d: 51                           	pushl	%ecx
  44198e: 57                           	pushl	%edi
  44198f: 8b ce                        	movl	%esi, %ecx
  441991: e8 4a ef ff ff               	calll	0x4408e0 <.text+0x3f8e0>
  441996: 8b 45 e8                     	movl	-0x18(%ebp), %eax
  441999: 85 c0                        	testl	%eax, %eax
  44199b: 7e 08                        	jle	0x4419a5 <.text+0x409a5>
  44199d: 50                           	pushl	%eax
  44199e: 8b ce                        	movl	%esi, %ecx
  4419a0: e8 3b ed ff ff               	calll	0x4406e0 <.text+0x3f6e0>
