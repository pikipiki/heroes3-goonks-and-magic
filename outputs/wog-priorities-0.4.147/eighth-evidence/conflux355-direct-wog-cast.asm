
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  7157f6: 55                           	pushl	%ebp
  7157f7: 8b ec                        	movl	%esp, %ebp
  7157f9: 53                           	pushl	%ebx
  7157fa: 56                           	pushl	%esi
  7157fb: 57                           	pushl	%edi
  7157fc: 90                           	nop
  7157fd: 90                           	nop
  7157fe: 90                           	nop
  7157ff: 90                           	nop
  715800: 90                           	nop
  715801: 90                           	nop
  715802: 90                           	nop
  715803: 90                           	nop
  715804: 90                           	nop
  715805: 90                           	nop
  715806: 90                           	nop
  715807: 90                           	nop
  715808: 90                           	nop
  715809: 90                           	nop
  71580a: 90                           	nop
  71580b: 90                           	nop
  71580c: 90                           	nop
  71580d: 90                           	nop
  71580e: 90                           	nop
  71580f: 8b 45 08                     	movl	0x8(%ebp), %eax
  715812: a3 04 f3 83 00               	movl	%eax, 0x83f304
  715817: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  71581a: 89 0d b4 0d 84 00            	movl	%ecx, 0x840db4
  715820: 8b 55 10                     	movl	0x10(%ebp), %edx
  715823: 89 15 b4 ee 83 00            	movl	%edx, 0x83eeb4
  715829: 8b 45 14                     	movl	0x14(%ebp), %eax
  71582c: a3 10 ef 83 00               	movl	%eax, 0x83ef10
  715831: 8b 4d 18                     	movl	0x18(%ebp), %ecx
  715834: 89 0d 0c f3 83 00            	movl	%ecx, 0x83f30c
  71583a: ff 35 10 ef 83 00            	pushl	0x83ef10
  715840: ff 35 0c f3 83 00            	pushl	0x83f30c
  715846: 6a ff                        	pushl	$-0x1
  715848: ff 35 b4 0d 84 00            	pushl	0x840db4
  71584e: ff 35 b4 ee 83 00            	pushl	0x83eeb4
  715854: ff 35 04 f3 83 00            	pushl	0x83f304
  71585a: b9 20 94 69 00               	movl	$0x699420, %ecx         # imm = 0x699420
  71585f: 8b 09                        	movl	(%ecx), %ecx
  715861: b8 40 01 5a 00               	movl	$0x5a0140, %eax         # imm = 0x5A0140
  715866: ff d0                        	calll	*%eax
  715868: 90                           	nop
  715869: 90                           	nop
  71586a: 90                           	nop
  71586b: 90                           	nop
  71586c: 90                           	nop
  71586d: 5f                           	popl	%edi
  71586e: 5e                           	popl	%esi
  71586f: 5b                           	popl	%ebx
  715870: 5d                           	popl	%ebp
  715871: c3                           	retl
