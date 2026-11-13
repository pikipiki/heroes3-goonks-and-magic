
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  4225c0: 55                           	pushl	%ebp
  4225c1: 8b ec                        	movl	%esp, %ebp
  4225c3: 51                           	pushl	%ecx
  4225c4: 53                           	pushl	%ebx
  4225c5: 56                           	pushl	%esi
  4225c6: 8b 75 10                     	movl	0x10(%ebp), %esi
  4225c9: 89 4d fc                     	movl	%ecx, -0x4(%ebp)
  4225cc: 8b 86 0c 02 00 00            	movl	0x20c(%esi), %eax
  4225d2: 85 c0                        	testl	%eax, %eax
  4225d4: 75 10                        	jne	0x4225e6 <.text+0x215e6>
  4225d6: 83 7e 34 35                  	cmpl	$0x35, 0x34(%esi)
  4225da: 74 0a                        	je	0x4225e6 <.text+0x215e6>
  4225dc: 5e                           	popl	%esi
  4225dd: 33 c0                        	xorl	%eax, %eax
  4225df: 5b                           	popl	%ebx
  4225e0: 8b e5                        	movl	%ebp, %esp
  4225e2: 5d                           	popl	%ebp
  4225e3: c2 10 00                     	retl	$0x10
  4225e6: 8b 5d 0c                     	movl	0xc(%ebp), %ebx
  4225e9: 8b 83 84 00 00 00            	movl	0x84(%ebx), %eax
  4225ef: c1 e8 0e                     	shrl	$0xe, %eax
  4225f2: a8 01                        	testb	$0x1, %al
  4225f4: 74 0a                        	je	0x422600 <.text+0x21600>
  4225f6: 5e                           	popl	%esi
  4225f7: 33 c0                        	xorl	%eax, %eax
  4225f9: 5b                           	popl	%ebx
  4225fa: 8b e5                        	movl	%ebp, %esp
  4225fc: 5d                           	popl	%ebp
  4225fd: c2 10 00                     	retl	$0x10
  422600: 8b 45 14                     	movl	0x14(%ebp), %eax
  422603: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  422606: 57                           	pushl	%edi
  422607: 3b c1                        	cmpl	%ecx, %eax
  422609: 89 45 10                     	movl	%eax, 0x10(%ebp)
  42260c: 89 4d 14                     	movl	%ecx, 0x14(%ebp)
  42260f: 8d 7d 10                     	leal	0x10(%ebp), %edi
  422612: 7c 03                        	jl	0x422617 <.text+0x21617>
  422614: 8d 7d 14                     	leal	0x14(%ebp), %edi
  422617: 8b ce                        	movl	%esi, %ecx
  422619: e8 32 08 02 00               	calll	0x442e50 <.text+0x41e50>
  42261e: db 07                        	fildl	(%edi)
  422620: d9 5d 10                     	fstps	0x10(%ebp)
  422623: d8 4d 10                     	fmuls	0x10(%ebp)
  422626: e8 69 59 1f 00               	calll	0x617f94 <.text+0x216f94>
  42262b: 8b cb                        	movl	%ebx, %ecx
  42262d: 8b f8                        	movl	%eax, %edi
  42262f: e8 7c fd 01 00               	calll	0x4423b0 <.text+0x413b0>
  422634: 8b ce                        	movl	%esi, %ecx
  422636: 8b d8                        	movl	%eax, %ebx
  422638: e8 73 fd 01 00               	calll	0x4423b0 <.text+0x413b0>
  42263d: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  422640: 6a 00                        	pushl	$0x0
  422642: 51                           	pushl	%ecx
  422643: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  422646: 53                           	pushl	%ebx
  422647: 50                           	pushl	%eax
  422648: 6a 1d                        	pushl	$0x1d
  42264a: 57                           	pushl	%edi
  42264b: e8 a0 55 18 00               	calll	0x5a7bf0 <.text+0x1a6bf0>
  422650: 5f                           	popl	%edi
  422651: 5e                           	popl	%esi
  422652: 5b                           	popl	%ebx
  422653: 8b e5                        	movl	%ebp, %esp
  422655: 5d                           	popl	%ebp
  422656: c2 10 00                     	retl	$0x10
  422659: 90                           	nop
  42265a: 90                           	nop
  42265b: 90                           	nop
  42265c: 90                           	nop
  42265d: 90                           	nop
  42265e: 90                           	nop
  42265f: 90                           	nop
