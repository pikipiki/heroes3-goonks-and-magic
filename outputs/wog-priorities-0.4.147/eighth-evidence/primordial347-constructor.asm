
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  43cf70: 55                           	pushl	%ebp
  43cf71: 8b ec                        	movl	%esp, %ebp
  43cf73: 6a ff                        	pushl	$-0x1
  43cf75: 68 ba 86 62 00               	pushl	$0x6286ba               # imm = 0x6286BA
  43cf7a: 64 a1 00 00 00 00            	movl	%fs:0x0, %eax
  43cf80: 50                           	pushl	%eax
  43cf81: 64 89 25 00 00 00 00         	movl	%esp, %fs:0x0
  43cf88: 83 ec 0c                     	subl	$0xc, %esp
  43cf8b: 53                           	pushl	%ebx
  43cf8c: 56                           	pushl	%esi
  43cf8d: 8b f1                        	movl	%ecx, %esi
  43cf8f: 33 db                        	xorl	%ebx, %ebx
  43cf91: 57                           	pushl	%edi
  43cf92: 89 75 e8                     	movl	%esi, -0x18(%ebp)
  43cf95: 89 9e 64 01 00 00            	movl	%ebx, 0x164(%esi)
  43cf9b: 89 5d fc                     	movl	%ebx, -0x4(%ebp)
  43cf9e: 89 9e 68 01 00 00            	movl	%ebx, 0x168(%esi)
  43cfa4: 68 60 c7 43 00               	pushl	$0x43c760               # imm = 0x43C760
  43cfa9: 68 90 6d 4e 00               	pushl	$0x4e6d90               # imm = 0x4E6D90
  43cfae: 8d be 70 01 00 00            	leal	0x170(%esi), %edi
  43cfb4: 6a 08                        	pushl	$0x8
  43cfb6: 6a 04                        	pushl	$0x4
  43cfb8: 57                           	pushl	%edi
  43cfb9: c6 45 fc 01                  	movb	$0x1, -0x4(%ebp)
  43cfbd: e8 38 b2 1d 00               	calll	0x6181fa <.text+0x2171fa>
  43cfc2: 8a 45 f3                     	movb	-0xd(%ebp), %al
  43cfc5: 88 86 20 04 00 00            	movb	%al, 0x420(%esi)
  43cfcb: 89 9e 24 04 00 00            	movl	%ebx, 0x424(%esi)
  43cfd1: 89 9e 28 04 00 00            	movl	%ebx, 0x428(%esi)
  43cfd7: 89 9e 2c 04 00 00            	movl	%ebx, 0x42c(%esi)
  43cfdd: 89 9e 30 04 00 00            	movl	%ebx, 0x430(%esi)
  43cfe3: 89 9e 34 04 00 00            	movl	%ebx, 0x434(%esi)
  43cfe9: 89 9e 38 04 00 00            	movl	%ebx, 0x438(%esi)
  43cfef: 89 9e 3c 04 00 00            	movl	%ebx, 0x43c(%esi)
  43cff5: 89 9e 40 04 00 00            	movl	%ebx, 0x440(%esi)
  43cffb: 89 9e 44 04 00 00            	movl	%ebx, 0x444(%esi)
  43d001: 89 9e 48 04 00 00            	movl	%ebx, 0x448(%esi)
  43d007: 89 9e 4c 04 00 00            	movl	%ebx, 0x44c(%esi)
  43d00d: 8a 4d f3                     	movb	-0xd(%ebp), %cl
  43d010: 89 9e f8 04 00 00            	movl	%ebx, 0x4f8(%esi)
  43d016: 88 8e f4 04 00 00            	movb	%cl, 0x4f4(%esi)
  43d01c: 89 9e fc 04 00 00            	movl	%ebx, 0x4fc(%esi)
  43d022: 89 9e 00 05 00 00            	movl	%ebx, 0x500(%esi)
  43d028: 8a 55 f3                     	movb	-0xd(%ebp), %dl
  43d02b: 89 9e 08 05 00 00            	movl	%ebx, 0x508(%esi)
  43d031: 88 96 04 05 00 00            	movb	%dl, 0x504(%esi)
  43d037: 89 9e 0c 05 00 00            	movl	%ebx, 0x50c(%esi)
  43d03d: 89 9e 10 05 00 00            	movl	%ebx, 0x510(%esi)
  43d043: 8a 45 f3                     	movb	-0xd(%ebp), %al
  43d046: 89 9e 18 05 00 00            	movl	%ebx, 0x518(%esi)
  43d04c: 88 86 14 05 00 00            	movb	%al, 0x514(%esi)
  43d052: 89 9e 1c 05 00 00            	movl	%ebx, 0x51c(%esi)
  43d058: 89 9e 20 05 00 00            	movl	%ebx, 0x520(%esi)
  43d05e: 8a 4d f3                     	movb	-0xd(%ebp), %cl
  43d061: 89 9e 28 05 00 00            	movl	%ebx, 0x528(%esi)
  43d067: 88 8e 24 05 00 00            	movb	%cl, 0x524(%esi)
  43d06d: 89 9e 2c 05 00 00            	movl	%ebx, 0x52c(%esi)
  43d073: 89 9e 30 05 00 00            	movl	%ebx, 0x530(%esi)
  43d079: 8b 8e 64 01 00 00            	movl	0x164(%esi), %ecx
  43d07f: c6 45 fc 07                  	movb	$0x7, -0x4(%ebp)
  43d083: 3b cb                        	cmpl	%ebx, %ecx
  43d085: 74 05                        	je	0x43d08c <.text+0x3c08c>
  43d087: 8b 11                        	movl	(%ecx), %edx
  43d089: ff 52 04                     	calll	*0x4(%edx)
  43d08c: 89 9e 64 01 00 00            	movl	%ebx, 0x164(%esi)
  43d092: 8b 8e 68 01 00 00            	movl	0x168(%esi), %ecx
  43d098: 3b cb                        	cmpl	%ebx, %ecx
  43d09a: 74 05                        	je	0x43d0a1 <.text+0x3c0a1>
  43d09c: 8b 01                        	movl	(%ecx), %eax
  43d09e: ff 50 04                     	calll	*0x4(%eax)
  43d0a1: 89 9e 68 01 00 00            	movl	%ebx, 0x168(%esi)
  43d0a7: 89 9e 6c 01 00 00            	movl	%ebx, 0x16c(%esi)
  43d0ad: 89 5e 38                     	movl	%ebx, 0x38(%esi)
  43d0b0: c7 45 ec 08 00 00 00         	movl	$0x8, -0x14(%ebp)
  43d0b7: 8b 0f                        	movl	(%edi), %ecx
  43d0b9: 3b cb                        	cmpl	%ebx, %ecx
  43d0bb: 74 05                        	je	0x43d0c2 <.text+0x3c0c2>
  43d0bd: 8b 11                        	movl	(%ecx), %edx
  43d0bf: ff 52 04                     	calll	*0x4(%edx)
  43d0c2: 8b 45 ec                     	movl	-0x14(%ebp), %eax
  43d0c5: 89 1f                        	movl	%ebx, (%edi)
  43d0c7: 83 c7 04                     	addl	$0x4, %edi
  43d0ca: 48                           	decl	%eax
  43d0cb: 89 45 ec                     	movl	%eax, -0x14(%ebp)
  43d0ce: 75 e7                        	jne	0x43d0b7 <.text+0x3c0b7>
  43d0d0: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
  43d0d3: 83 c8 ff                     	orl	$-0x1, %eax
  43d0d6: 89 46 10                     	movl	%eax, 0x10(%esi)
  43d0d9: 89 46 14                     	movl	%eax, 0x14(%esi)
  43d0dc: 89 5e 18                     	movl	%ebx, 0x18(%esi)
  43d0df: 89 5e 1c                     	movl	%ebx, 0x1c(%esi)
  43d0e2: 89 9e 0c 01 00 00            	movl	%ebx, 0x10c(%esi)
  43d0e8: c6 46 0c 01                  	movb	$0x1, 0xc(%esi)
  43d0ec: 89 9e 00 01 00 00            	movl	%ebx, 0x100(%esi)
  43d0f2: 89 9e 04 01 00 00            	movl	%ebx, 0x104(%esi)
  43d0f8: c7 86 54 04 00 00 01 00 00 00	movl	$0x1, 0x454(%esi)
  43d102: 88 5e 30                     	movb	%bl, 0x30(%esi)
  43d105: 88 5e 31                     	movb	%bl, 0x31(%esi)
  43d108: 8b c6                        	movl	%esi, %eax
  43d10a: 5f                           	popl	%edi
  43d10b: 5e                           	popl	%esi
  43d10c: 5b                           	popl	%ebx
  43d10d: 64 89 0d 00 00 00 00         	movl	%ecx, %fs:0x0
  43d114: 8b e5                        	movl	%ebp, %esp
  43d116: 5d                           	popl	%ebp
  43d117: c3                           	retl
