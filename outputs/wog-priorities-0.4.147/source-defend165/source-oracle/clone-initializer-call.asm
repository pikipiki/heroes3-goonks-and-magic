
/Users/sevenone./Documents/git/era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  479ae2: 8b 4d 14                     	movl	0x14(%ebp), %ecx
  479ae5: 51                           	pushl	%ecx
  479ae6: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  479ae9: 52                           	pushl	%edx
  479aea: 8b 94 be cc 53 00 00         	movl	0x53cc(%esi,%edi,4), %edx
  479af1: 8d 1c c6                     	leal	(%esi,%eax,8), %ebx
  479af4: 8b 45 10                     	movl	0x10(%ebp), %eax
  479af7: 57                           	pushl	%edi
  479af8: 89 5d 08                     	movl	%ebx, 0x8(%ebp)
  479afb: 52                           	pushl	%edx
  479afc: 81 c3 cc 54 00 00            	addl	$0x54cc, %ebx           # imm = 0x54CC
  479b02: 50                           	pushl	%eax
  479b03: 51                           	pushl	%ecx
  479b04: 8b cb                        	movl	%ebx, %ecx
  479b06: e8 c5 3a fc ff               	calll	0x43d5d0 <.text+0x3c5d0>
  479b0b: 8b cb                        	movl	%ebx, %ecx
  479b0d: e8 fe 3b fc ff               	calll	0x43d710 <.text+0x3c710>
