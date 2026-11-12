
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  769ab4: 55                           	pushl	%ebp
  769ab5: 8b ec                        	movl	%esp, %ebp
  769ab7: 83 ec 10                     	subl	$0x10, %esp
  769aba: 53                           	pushl	%ebx
  769abb: 56                           	pushl	%esi
  769abc: 57                           	pushl	%edi
  769abd: 89 4d f0                     	movl	%ecx, -0x10(%ebp)
  769ac0: 90                           	nop
  769ac1: 90                           	nop
  769ac2: 90                           	nop
  769ac3: 90                           	nop
  769ac4: 90                           	nop
  769ac5: 90                           	nop
  769ac6: 90                           	nop
  769ac7: 90                           	nop
  769ac8: 90                           	nop
  769ac9: 90                           	nop
  769aca: 90                           	nop
  769acb: 90                           	nop
  769acc: 90                           	nop
  769acd: 90                           	nop
  769ace: 90                           	nop
  769acf: 90                           	nop
  769ad0: 90                           	nop
  769ad1: 90                           	nop
  769ad2: 90                           	nop
  769ad3: c7 45 fc 00 00 00 00         	movl	$0x0, -0x4(%ebp)
  769ada: eb 09                        	jmp	0x769ae5 <.text+0x68ae5>
  769adc: 8b 45 fc                     	movl	-0x4(%ebp), %eax
  769adf: 83 c0 01                     	addl	$0x1, %eax
  769ae2: 89 45 fc                     	movl	%eax, -0x4(%ebp)
  769ae5: 83 7d fc 07                  	cmpl	$0x7, -0x4(%ebp)
  769ae9: 7d 10                        	jge	0x769afb <.text+0x68afb>
  769aeb: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  769aee: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  769af1: c7 44 8a 38 00 00 00 00      	movl	$0x0, 0x38(%edx,%ecx,4)
  769af9: eb e1                        	jmp	0x769adc <.text+0x68adc>
  769afb: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  769afe: c7 40 1c 05 00 00 00         	movl	$0x5, 0x1c(%eax)
  769b05: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  769b08: c7 41 20 05 00 00 00         	movl	$0x5, 0x20(%ecx)
  769b0f: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  769b12: c7 42 30 04 00 00 00         	movl	$0x4, 0x30(%edx)
  769b19: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  769b1c: c7 40 28 0c 00 00 00         	movl	$0xc, 0x28(%eax)
  769b23: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  769b26: c7 41 2c 01 00 00 00         	movl	$0x1, 0x2c(%ecx)
  769b2d: 8b 55 f0                     	movl	-0x10(%ebp), %edx
  769b30: c7 42 24 28 00 00 00         	movl	$0x28, 0x24(%edx)
  769b37: 8b 45 f0                     	movl	-0x10(%ebp), %eax
  769b3a: c7 40 34 05 00 00 00         	movl	$0x5, 0x34(%eax)
