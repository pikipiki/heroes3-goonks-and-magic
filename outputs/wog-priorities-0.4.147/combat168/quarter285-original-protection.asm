
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a7ec0: 55                           	pushl	%ebp
  5a7ec1: 8b ec                        	movl	%esp, %ebp
  5a7ec3: 8b 45 10                     	movl	0x10(%ebp), %eax
  5a7ec6: 85 c0                        	testl	%eax, %eax
  5a7ec8: 0f 84 b0 00 00 00            	je	0x5a7f7e <.text+0x1a6f7e>
  5a7ece: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  5a7ed1: 8b d1                        	movl	%ecx, %edx
  5a7ed3: c1 e2 04                     	shll	$0x4, %edx
  5a7ed6: 03 d1                        	addl	%ecx, %edx
  5a7ed8: 8b 0d a8 7f 68 00            	movl	0x687fa8, %ecx
  5a7ede: 8b 4c d1 1c                  	movl	0x1c(%ecx,%edx,8), %ecx
  5a7ee2: f6 c1 08                     	testb	$0x8, %cl
  5a7ee5: 74 22                        	je	0x5a7f09 <.text+0x1a6f09>
  5a7ee7: 8b 90 1c 02 00 00            	movl	0x21c(%eax), %edx
  5a7eed: 85 d2                        	testl	%edx, %edx
  5a7eef: 74 18                        	je	0x5a7f09 <.text+0x1a6f09>
  5a7ef1: db 45 08                     	fildl	0x8(%ebp)
  5a7ef4: d9 5d 08                     	fstps	0x8(%ebp)
  5a7ef7: d9 45 08                     	flds	0x8(%ebp)
  5a7efa: d8 88 b4 04 00 00            	fmuls	0x4b4(%eax)
  5a7f00: e8 8f 00 07 00               	calll	0x617f94 <.text+0x216f94>
  5a7f05: 5d                           	popl	%ebp
  5a7f06: c2 0c 00                     	retl	$0xc
  5a7f09: f6 c1 01                     	testb	$0x1, %cl
  5a7f0c: 74 22                        	je	0x5a7f30 <.text+0x1a6f30>
  5a7f0e: 8b 90 10 02 00 00            	movl	0x210(%eax), %edx
  5a7f14: 85 d2                        	testl	%edx, %edx
  5a7f16: 74 18                        	je	0x5a7f30 <.text+0x1a6f30>
  5a7f18: db 45 08                     	fildl	0x8(%ebp)
  5a7f1b: d9 5d 08                     	fstps	0x8(%ebp)
  5a7f1e: d9 45 08                     	flds	0x8(%ebp)
  5a7f21: d8 88 a8 04 00 00            	fmuls	0x4a8(%eax)
  5a7f27: e8 68 00 07 00               	calll	0x617f94 <.text+0x216f94>
  5a7f2c: 5d                           	popl	%ebp
  5a7f2d: c2 0c 00                     	retl	$0xc
