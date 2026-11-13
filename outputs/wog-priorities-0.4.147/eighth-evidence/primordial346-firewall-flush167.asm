
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  468c99: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  468c9c: c7 45 d8 02 00 00 00         	movl	$0x2, -0x28(%ebp)
  468ca3: 8d 88 b8 55 00 00            	leal	0x55b8(%eax), %ecx
  468ca9: 05 bc 54 00 00               	addl	$0x54bc, %eax           # imm = 0x54BC
  468cae: 89 4d 08                     	movl	%ecx, 0x8(%ebp)
  468cb1: 8b f8                        	movl	%eax, %edi
  468cb3: 8b 07                        	movl	(%edi), %eax
  468cb5: 33 db                        	xorl	%ebx, %ebx
  468cb7: 85 c0                        	testl	%eax, %eax
  468cb9: 7e 3f                        	jle	0x468cfa <.text+0x67cfa>
  468cbb: 8b 75 08                     	movl	0x8(%ebp), %esi
  468cbe: 8b 06                        	movl	(%esi), %eax
  468cc0: 83 f8 ff                     	cmpl	$-0x1, %eax
  468cc3: 74 28                        	je	0x468ced <.text+0x67ced>
  468cc5: 8b 8e 60 ff ff ff            	movl	-0xa0(%esi), %ecx
  468ccb: 85 c9                        	testl	%ecx, %ecx
  468ccd: 7e 18                        	jle	0x468ce7 <.text+0x67ce7>
  468ccf: 8b 96 4c ff ff ff            	movl	-0xb4(%esi), %edx
  468cd5: 8b 4d f8                     	movl	-0x8(%ebp), %ecx
  468cd8: 6a 03                        	pushl	$0x3
  468cda: 6a 00                        	pushl	$0x0
  468cdc: 6a ff                        	pushl	$-0x1
  468cde: 6a 01                        	pushl	$0x1
  468ce0: 52                           	pushl	%edx
  468ce1: 50                           	pushl	%eax
  468ce2: e8 59 74 13 00               	calll	0x5a0140 <.text+0x19f140>
  468ce7: c7 06 ff ff ff ff            	movl	$0xffffffff, (%esi)     # imm = 0xFFFFFFFF
  468ced: 8b 07                        	movl	(%edi), %eax
  468cef: 43                           	incl	%ebx
  468cf0: 81 c6 48 05 00 00            	addl	$0x548, %esi            # imm = 0x548
  468cf6: 3b d8                        	cmpl	%eax, %ebx
  468cf8: 7c c4                        	jl	0x468cbe <.text+0x67cbe>
  468cfa: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  468cfd: 8b 45 d8                     	movl	-0x28(%ebp), %eax
  468d00: 83 c7 04                     	addl	$0x4, %edi
  468d03: 81 c1 e8 6e 00 00            	addl	$0x6ee8, %ecx           # imm = 0x6EE8
  468d09: 48                           	decl	%eax
  468d0a: 89 4d 08                     	movl	%ecx, 0x8(%ebp)
  468d0d: 89 45 d8                     	movl	%eax, -0x28(%ebp)
  468d10: 75 a1                        	jne	0x468cb3 <.text+0x67cb3>
