
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a1fc0: 56                           	pushl	%esi
  5a1fc1: 8b cb                        	movl	%ebx, %ecx
  5a1fc3: e8 48 47 ec ff               	calll	0x466710 <.text+0x65710>
  5a1fc8: 6a 00                        	pushl	$0x0
  5a1fca: 6a 01                        	pushl	$0x1
  5a1fcc: 6a 00                        	pushl	$0x0
  5a1fce: 6a 00                        	pushl	$0x0
  5a1fd0: 6a 00                        	pushl	$0x0
  5a1fd2: 6a 00                        	pushl	$0x0
  5a1fd4: 8b cb                        	movl	%ebx, %ecx
  5a1fd6: e8 e5 1f ef ff               	calll	0x493fc0 <.text+0x92fc0>
  5a1fdb: 8b 83 3c 3d 01 00            	movl	0x13d3c(%ebx), %eax
  5a1fe1: 8b 93 44 3d 01 00            	movl	0x13d44(%ebx), %edx
  5a1fe7: 8b 8b 38 3d 01 00            	movl	0x13d38(%ebx), %ecx
  5a1fed: 2b d0                        	subl	%eax, %edx
  5a1fef: 42                           	incl	%edx
  5a1ff0: 57                           	pushl	%edi
  5a1ff1: 52                           	pushl	%edx
  5a1ff2: 8b 93 40 3d 01 00            	movl	0x13d40(%ebx), %edx
  5a1ff8: 2b d1                        	subl	%ecx, %edx
  5a1ffa: 42                           	incl	%edx
  5a1ffb: 52                           	pushl	%edx
  5a1ffc: 50                           	pushl	%eax
  5a1ffd: 51                           	pushl	%ecx
  5a1ffe: 8b 0d d0 92 69 00            	movl	0x6992d0, %ecx
  5a2004: e8 77 13 06 00               	calll	0x603380 <.text+0x202380>
  5a2009: e9 5a 03 00 00               	jmp	0x5a2368 <.text+0x1a1368>
  5a200e: 56                           	pushl	%esi
  5a200f: 8b cb                        	movl	%ebx, %ecx
  5a2011: e8 fa 46 ec ff               	calll	0x466710 <.text+0x65710>
  5a2016: 8b 45 0c                     	movl	0xc(%ebp), %eax
  5a2019: 6a 00                        	pushl	$0x0
  5a201b: 6a 64                        	pushl	$0x64
  5a201d: 50                           	pushl	%eax
  5a201e: 57                           	pushl	%edi
  5a201f: 8b cb                        	movl	%ebx, %ecx
  5a2021: e8 6a 45 ef ff               	calll	0x496590 <.text+0x95590>
  5a2026: e9 3d 03 00 00               	jmp	0x5a2368 <.text+0x1a1368>
  5a202b: 8b 4f 38                     	movl	0x38(%edi), %ecx
  5a202e: 56                           	pushl	%esi
  5a202f: 51                           	pushl	%ecx
  5a2030: 8b cb                        	movl	%ebx, %ecx
  5a2032: e8 49 4f 00 00               	calll	0x5a6f80 <.text+0x1a5f80>
  5a2037: e9 2c 03 00 00               	jmp	0x5a2368 <.text+0x1a1368>
  5a203c: 8b 55 1c                     	movl	0x1c(%ebp), %edx
  5a203f: 56                           	pushl	%esi
  5a2040: 52                           	pushl	%edx
  5a2041: 6a 72                        	pushl	$0x72
  5a2043: 6a 42                        	pushl	$0x42
  5a2045: 8b cb                        	movl	%ebx, %ecx
  5a2047: e8 44 53 00 00               	calll	0x5a7390 <.text+0x1a6390>
  5a204c: e9 17 03 00 00               	jmp	0x5a2368 <.text+0x1a1368>
  5a2051: 8b 45 1c                     	movl	0x1c(%ebp), %eax
  5a2054: 56                           	pushl	%esi
  5a2055: 50                           	pushl	%eax
  5a2056: 6a 71                        	pushl	$0x71
  5a2058: 6a 43                        	pushl	$0x43
  5a205a: 8b cb                        	movl	%ebx, %ecx
  5a205c: e8 2f 53 00 00               	calll	0x5a7390 <.text+0x1a6390>
