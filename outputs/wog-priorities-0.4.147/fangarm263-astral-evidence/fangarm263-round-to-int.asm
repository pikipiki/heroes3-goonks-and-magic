
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  617f94: 55                           	pushl	%ebp
  617f95: 8b ec                        	movl	%esp, %ebp
  617f97: 83 c4 f4                     	addl	$-0xc, %esp
  617f9a: 9b                           	wait
  617f9b: d9 7d fe                     	fnstcw	-0x2(%ebp)
  617f9e: 9b                           	wait
  617f9f: 66 8b 45 fe                  	movw	-0x2(%ebp), %ax
  617fa3: 80 cc 0c                     	orb	$0xc, %ah
  617fa6: 66 89 45 fc                  	movw	%ax, -0x4(%ebp)
  617faa: d9 6d fc                     	fldcw	-0x4(%ebp)
  617fad: df 7d f4                     	fistpll	-0xc(%ebp)
  617fb0: d9 6d fe                     	fldcw	-0x2(%ebp)
  617fb3: 8b 45 f4                     	movl	-0xc(%ebp), %eax
  617fb6: 8b 55 f8                     	movl	-0x8(%ebp), %edx
  617fb9: c9                           	leave
  617fba: c3                           	retl
  617fbb: 55                           	pushl	%ebp
  617fbc: 8b ec                        	movl	%esp, %ebp
  617fbe: 83 ec 20                     	subl	$0x20, %esp
  617fc1: 53                           	pushl	%ebx
  617fc2: 56                           	pushl	%esi
  617fc3: 8b 75 0c                     	movl	0xc(%ebp), %esi
