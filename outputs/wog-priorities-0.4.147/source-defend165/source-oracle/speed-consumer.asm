
/Users/sevenone./Documents/git/era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  4489f0: 55                           	pushl	%ebp
  4489f1: 8b ec                        	movl	%esp, %ebp
  4489f3: 51                           	pushl	%ecx
  4489f4: 8b 91 70 02 00 00            	movl	0x270(%ecx), %edx
  4489fa: 8b 81 c4 00 00 00            	movl	0xc4(%ecx), %eax
  448a00: 85 d2                        	testl	%edx, %edx
  448a02: 89 45 fc                     	movl	%eax, -0x4(%ebp)
  448a05: 74 30                        	je	0x448a37 <.text+0x47a37>
  448a07: 8b 81 84 00 00 00            	movl	0x84(%ecx), %eax
  448a0d: c1 e8 06                     	shrl	$0x6, %eax
  448a10: a8 01                        	testb	$0x1, %al
  448a12: 74 06                        	je	0x448a1a <.text+0x47a1a>
  448a14: 33 c0                        	xorl	%eax, %eax
  448a16: 8b e5                        	movl	%ebp, %esp
  448a18: 5d                           	popl	%ebp
  448a19: c3                           	retl
  448a1a: db 45 fc                     	fildl	-0x4(%ebp)
  448a1d: d9 5d fc                     	fstps	-0x4(%ebp)
  448a20: d9 45 fc                     	flds	-0x4(%ebp)
  448a23: d8 89 c8 04 00 00            	fmuls	0x4c8(%ecx)
  448a29: e8 66 f5 1c 00               	calll	0x617f94 <.text+0x216f94>
  448a2e: 85 c0                        	testl	%eax, %eax
  448a30: 7f 05                        	jg	0x448a37 <.text+0x47a37>
  448a32: b8 01 00 00 00               	movl	$0x1, %eax
  448a37: 8b e5                        	movl	%ebp, %esp
  448a39: 5d                           	popl	%ebp
