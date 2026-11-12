
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  766a9b: 52                           	pushl	%edx
  766a9c: a1 38 64 84 02               	movl	0x2846438, %eax
  766aa1: 50                           	pushl	%eax
  766aa2: e8 02 5b fb ff               	calll	0x71c5a9 <.text+0x1b5a9>
  766aa7: 83 c4 08                     	addl	$0x8, %esp
  766aaa: 85 c0                        	testl	%eax, %eax
  766aac: 74 0c                        	je	0x766aba <.text+0x65aba>
  766aae: c7 05 f4 26 83 02 00 00 00 00	movl	$0x0, 0x28326f4
  766ab8: eb 33                        	jmp	0x766aed <.text+0x65aed>
  766aba: 8b 0d 88 18 81 02            	movl	0x2811888, %ecx
  766ac0: 51                           	pushl	%ecx
  766ac1: 8b 15 38 64 84 02            	movl	0x2846438, %edx
  766ac7: 52                           	pushl	%edx
  766ac8: e8 43 5c fb ff               	calll	0x71c710 <.text+0x1b710>
  766acd: 83 c4 08                     	addl	$0x8, %esp
  766ad0: a3 88 18 81 02               	movl	%eax, 0x2811888
  766ad5: a1 88 18 81 02               	movl	0x2811888, %eax
