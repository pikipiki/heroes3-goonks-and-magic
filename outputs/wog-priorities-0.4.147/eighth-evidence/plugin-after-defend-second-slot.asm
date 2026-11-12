
TUM_SOURCE/EraPlugins/amethyst2_4.dll:	file format coff-i386

Disassembly of section .text:

100088e0 <ChooseAnyCreatureType>:
1001bcdc: 8b 4d f8                     	movl	-0x8(%ebp), %ecx
1001bcdf: 8b 14 8d 18 6c 30 11         	movl	0x11306c18(,%ecx,4), %edx
1001bce6: 89 55 f4                     	movl	%edx, -0xc(%ebp)
1001bce9: 83 7d f4 00                  	cmpl	$0x0, -0xc(%ebp)
1001bced: 74 78                        	je	0x1001bd67 <ChooseAnyCreatureType+0x13487>
1001bcef: 8b 45 e0                     	movl	-0x20(%ebp), %eax
1001bcf2: 0f be 88 68 3d 01 00         	movsbl	0x13d68(%eax), %ecx
1001bcf9: 85 c9                        	testl	%ecx, %ecx
1001bcfb: 75 6a                        	jne	0x1001bd67 <ChooseAnyCreatureType+0x13487>
1001bcfd: 8b 55 f8                     	movl	-0x8(%ebp), %edx
1001bd00: 0f be 82 18 7d 30 11         	movsbl	0x11307d18(%edx), %eax
1001bd07: 89 45 e8                     	movl	%eax, -0x18(%ebp)
1001bd0a: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
1001bd0d: 83 79 4c 00                  	cmpl	$0x0, 0x4c(%ecx)
1001bd11: 7e 1c                        	jle	0x1001bd2f <ChooseAnyCreatureType+0x1344f>
1001bd13: 8b 55 e8                     	movl	-0x18(%ebp), %edx
1001bd16: 52                           	pushl	%edx
1001bd17: 6a 01                        	pushl	$0x1
1001bd19: 8b 45 fc                     	movl	-0x4(%ebp), %eax
1001bd1c: 8b 48 38                     	movl	0x38(%eax), %ecx
1001bd1f: 51                           	pushl	%ecx
1001bd20: 6a 01                        	pushl	$0x1
1001bd22: 8b 55 f4                     	movl	-0xc(%ebp), %edx
1001bd25: 52                           	pushl	%edx
1001bd26: ff 15 dc ca 04 10            	calll	*0x1004cadc
1001bd2c: 83 c4 14                     	addl	$0x14, %esp
1001bd2f: 8b 45 f8                     	movl	-0x8(%ebp), %eax
1001bd32: 8b 0c 85 58 b4 30 11         	movl	0x1130b458(,%eax,4), %ecx
1001bd39: 89 4d f4                     	movl	%ecx, -0xc(%ebp)
1001bd3c: 83 7d f4 00                  	cmpl	$0x0, -0xc(%ebp)
1001bd40: 74 25                        	je	0x1001bd67 <ChooseAnyCreatureType+0x13487>
1001bd42: 8b 55 fc                     	movl	-0x4(%ebp), %edx
1001bd45: 83 7a 4c 00                  	cmpl	$0x0, 0x4c(%edx)
1001bd49: 7e 1c                        	jle	0x1001bd67 <ChooseAnyCreatureType+0x13487>
1001bd4b: 8b 45 e8                     	movl	-0x18(%ebp), %eax
1001bd4e: 50                           	pushl	%eax
1001bd4f: 6a 01                        	pushl	$0x1
1001bd51: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
1001bd54: 8b 51 38                     	movl	0x38(%ecx), %edx
1001bd57: 52                           	pushl	%edx
1001bd58: 6a 01                        	pushl	$0x1
1001bd5a: 8b 45 f4                     	movl	-0xc(%ebp), %eax
1001bd5d: 50                           	pushl	%eax
1001bd5e: ff 15 dc ca 04 10            	calll	*0x1004cadc
1001bd64: 83 c4 14                     	addl	$0x14, %esp
