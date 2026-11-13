
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a3cd0: 55                           	pushl	%ebp
  5a3cd1: 8b ec                        	movl	%esp, %ebp
  5a3cd3: 51                           	pushl	%ecx
  5a3cd4: 8b 55 10                     	movl	0x10(%ebp), %edx
  5a3cd7: 53                           	pushl	%ebx
  5a3cd8: 56                           	pushl	%esi
  5a3cd9: 57                           	pushl	%edi
  5a3cda: 85 d2                        	testl	%edx, %edx
  5a3cdc: 89 4d fc                     	movl	%ecx, -0x4(%ebp)
  5a3cdf: 7c 08                        	jl	0x5a3ce9 <.text+0x1a2ce9>
  5a3ce1: 81 fa bb 00 00 00            	cmpl	$0xbb, %edx
  5a3ce7: 7c 0b                        	jl	0x5a3cf4 <.text+0x1a2cf4>
  5a3ce9: 5f                           	popl	%edi
  5a3cea: 5e                           	popl	%esi
  5a3ceb: 32 c0                        	xorb	%al, %al
  5a3ced: 5b                           	popl	%ebx
  5a3cee: 8b e5                        	movl	%ebp, %esp
  5a3cf0: 5d                           	popl	%ebp
  5a3cf1: c2 18 00                     	retl	$0x18
  5a3cf4: 8b 75 08                     	movl	0x8(%ebp), %esi
  5a3cf7: 8b 3d a8 7f 68 00            	movl	0x687fa8, %edi
  5a3cfd: 8b c6                        	movl	%esi, %eax
  5a3cff: c1 e0 04                     	shll	$0x4, %eax
  5a3d02: 03 c6                        	addl	%esi, %eax
  5a3d04: 8b 44 c7 0c                  	movl	0xc(%edi,%eax,8), %eax
  5a3d08: a9 70 00 02 00               	testl	$0x20070, %eax          # imm = 0x20070
  5a3d0d: 74 4f                        	je	0x5a3d5e <.text+0x1a2d5e>
  5a3d0f: 8b 7d 1c                     	movl	0x1c(%ebp), %edi
  5a3d12: 8b 5d 18                     	movl	0x18(%ebp), %ebx
  5a3d15: 57                           	pushl	%edi
  5a3d16: 53                           	pushl	%ebx
  5a3d17: 52                           	pushl	%edx
  5a3d18: 8b 55 14                     	movl	0x14(%ebp), %edx
  5a3d1b: 52                           	pushl	%edx
  5a3d1c: 56                           	pushl	%esi
  5a3d1d: e8 3e ff ff ff               	calll	0x5a3c60 <.text+0x1a2c60>
  5a3d22: 85 c0                        	testl	%eax, %eax
  5a3d24: 74 2d                        	je	0x5a3d53 <.text+0x1a2d53>
  5a3d26: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  5a3d29: 57                           	pushl	%edi
  5a3d2a: 53                           	pushl	%ebx
  5a3d2b: 6a 00                        	pushl	$0x0
  5a3d2d: 50                           	pushl	%eax
  5a3d2e: 8b 45 14                     	movl	0x14(%ebp), %eax
  5a3d31: 50                           	pushl	%eax
  5a3d32: 56                           	pushl	%esi
  5a3d33: e8 68 46 00 00               	calll	0x5a83a0 <.text+0x1a73a0>
  5a3d38: dc 1d 38 ac 63 00            	fcompl	0x63ac38
  5a3d3e: df e0                        	fnstsw	%ax
  5a3d40: f6 c4 41                     	testb	$0x41, %ah
  5a3d43: 75 0e                        	jne	0x5a3d53 <.text+0x1a2d53>
  5a3d45: 5f                           	popl	%edi
  5a3d46: 5e                           	popl	%esi
  5a3d47: b8 01 00 00 00               	movl	$0x1, %eax
