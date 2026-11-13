
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  4dc2e0: 55                           	pushl	%ebp
  4dc2e1: 8b ec                        	movl	%esp, %ebp
  4dc2e3: 83 ec 08                     	subl	$0x8, %esp
  4dc2e6: 8b 45 08                     	movl	0x8(%ebp), %eax
  4dc2e9: 53                           	pushl	%ebx
  4dc2ea: 8b 15 68 0b 66 00            	movl	0x660b68, %edx
  4dc2f0: 56                           	pushl	%esi
  4dc2f1: 57                           	pushl	%edi
  4dc2f2: 8b f9                        	movl	%ecx, %edi
  4dc2f4: 50                           	pushl	%eax
  4dc2f5: 8b 8c c7 2d 01 00 00         	movl	0x12d(%edi,%eax,8), %ecx
  4dc2fc: c1 e1 05                     	shll	$0x5, %ecx
  4dc2ff: 8b 74 11 14                  	movl	0x14(%ecx,%edx), %esi
  4dc303: 8b cf                        	movl	%edi, %ecx
  4dc305: e8 36 6b 00 00               	calll	0x4e2e40 <.text+0xe1e40>
  4dc30a: 8b 0d 6c 0b 66 00            	movl	0x660b6c, %ecx
  4dc310: 8d 04 76                     	leal	(%esi,%esi,2), %eax
  4dc313: 33 f6                        	xorl	%esi, %esi
  4dc315: 8d 5c c1 04                  	leal	0x4(%ecx,%eax,8), %ebx
  4dc319: 81 fe 90 00 00 00            	cmpl	$0x90, %esi
  4dc31f: 72 07                        	jb	0x4dc328 <.text+0xdb328>
  4dc321: 8b cb                        	movl	%ebx, %ecx
  4dc323: e8 78 83 f5 ff               	calll	0x4346a0 <.text+0x336a0>
  4dc328: 8b ce                        	movl	%esi, %ecx
  4dc32a: ba 01 00 00 00               	movl	$0x1, %edx
  4dc32f: 83 e1 1f                     	andl	$0x1f, %ecx
  4dc332: 8b c6                        	movl	%esi, %eax
  4dc334: d3 e2                        	shll	%cl, %edx
  4dc336: c1 e8 05                     	shrl	$0x5, %eax
  4dc339: 85 14 83                     	testl	%edx, (%ebx,%eax,4)
  4dc33c: 74 17                        	je	0x4dc355 <.text+0xdb355>
  4dc33e: 8d 4d f8                     	leal	-0x8(%ebp), %ecx
  4dc341: 6a ff                        	pushl	$-0x1
  4dc343: 51                           	pushl	%ecx
  4dc344: 8b cf                        	movl	%edi, %ecx
  4dc346: 89 75 f8                     	movl	%esi, -0x8(%ebp)
  4dc349: c7 45 fc ff ff ff ff         	movl	$0xffffffff, -0x4(%ebp) # imm = 0xFFFFFFFF
  4dc350: e8 1b 69 00 00               	calll	0x4e2c70 <.text+0xe1c70>
  4dc355: 46                           	incl	%esi
  4dc356: 81 fe 90 00 00 00            	cmpl	$0x90, %esi
  4dc35c: 7c c1                        	jl	0x4dc31f <.text+0xdb31f>
  4dc35e: 5f                           	popl	%edi
  4dc35f: 5e                           	popl	%esi
  4dc360: 5b                           	popl	%ebx
  4dc361: 8b e5                        	movl	%ebp, %esp
  4dc363: 5d                           	popl	%ebp
  4dc364: c2 04 00                     	retl	$0x4
