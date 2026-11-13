
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  61a9e7: 83 7c 24 04 e0               	cmpl	$-0x20, 0x4(%esp)
  61a9ec: 77 22                        	ja	0x61aa10 <.text+0x219a10>
  61a9ee: ff 74 24 04                  	pushl	0x4(%esp)
  61a9f2: e8 1c 00 00 00               	calll	0x61aa13 <.text+0x219a13>
  61a9f7: 85 c0                        	testl	%eax, %eax
  61a9f9: 59                           	popl	%ecx
  61a9fa: 75 16                        	jne	0x61aa12 <.text+0x219a12>
  61a9fc: 39 44 24 08                  	cmpl	%eax, 0x8(%esp)
  61aa00: 74 10                        	je	0x61aa12 <.text+0x219a12>
  61aa02: ff 74 24 04                  	pushl	0x4(%esp)
  61aa06: e8 f4 6a 00 00               	calll	0x6214ff <.text+0x2204ff>
  61aa0b: 85 c0                        	testl	%eax, %eax
  61aa0d: 59                           	popl	%ecx
  61aa0e: 75 de                        	jne	0x61a9ee <.text+0x2199ee>
  61aa10: 33 c0                        	xorl	%eax, %eax
  61aa12: c3                           	retl
  61aa13: 56                           	pushl	%esi
  61aa14: 8b 74 24 08                  	movl	0x8(%esp), %esi
  61aa18: 3b 35 10 04 69 00            	cmpl	0x690410, %esi
  61aa1e: 57                           	pushl	%edi
  61aa1f: 77 21                        	ja	0x61aa42 <.text+0x219a42>
  61aa21: 6a 09                        	pushl	$0x9
  61aa23: e8 39 0e 00 00               	calll	0x61b861 <.text+0x21a861>
  61aa28: 56                           	pushl	%esi
  61aa29: e8 bc 6e 00 00               	calll	0x6218ea <.text+0x2208ea>
  61aa2e: 6a 09                        	pushl	$0x9
  61aa30: 8b f8                        	movl	%eax, %edi
  61aa32: e8 8b 0e 00 00               	calll	0x61b8c2 <.text+0x21a8c2>
  61aa37: 83 c4 0c                     	addl	$0xc, %esp
  61aa3a: 85 ff                        	testl	%edi, %edi
  61aa3c: 74 04                        	je	0x61aa42 <.text+0x219a42>
  61aa3e: 8b c7                        	movl	%edi, %eax
  61aa40: eb 1c                        	jmp	0x61aa5e <.text+0x219a5e>
  61aa42: 85 f6                        	testl	%esi, %esi
  61aa44: 75 03                        	jne	0x61aa49 <.text+0x219a49>
  61aa46: 6a 01                        	pushl	$0x1
  61aa48: 5e                           	popl	%esi
  61aa49: 83 c6 0f                     	addl	$0xf, %esi
  61aa4c: 83 e6 f0                     	andl	$-0x10, %esi
  61aa4f: 56                           	pushl	%esi
  61aa50: 6a 00                        	pushl	$0x0
  61aa52: ff 35 60 bd 6a 00            	pushl	0x6abd60
  61aa58: ff 15 7c a1 63 00            	calll	*0x63a17c
  61aa5e: 5f                           	popl	%edi
  61aa5f: 5e                           	popl	%esi
  61aa60: c3                           	retl
