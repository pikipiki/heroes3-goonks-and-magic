
/Users/sevenone./Documents/git/era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a0140: 55                           	pushl	%ebp
  5a0141: 8b ec                        	movl	%esp, %ebp
  5a0143: 6a ff                        	pushl	$-0x1
  5a0145: 68 81 42 63 00               	pushl	$0x634281               # imm = 0x634281
  5a014a: 64 a1 00 00 00 00            	movl	%fs:0x0, %eax
  5a0150: 50                           	pushl	%eax
  5a0151: 64 89 25 00 00 00 00         	movl	%esp, %fs:0x0
  5a0158: 81 ec 94 00 00 00            	subl	$0x94, %esp
  5a015e: 53                           	pushl	%ebx
  5a015f: 8b d9                        	movl	%ecx, %ebx
  5a0161: 8b 4d 10                     	movl	0x10(%ebp), %ecx
  5a0164: 56                           	pushl	%esi
  5a0165: 8b 83 c0 32 01 00            	movl	0x132c0(%ebx), %eax
  5a016b: 57                           	pushl	%edi
  5a016c: bf 01 00 00 00               	movl	$0x1, %edi
  5a0171: 2b f8                        	subl	%eax, %edi
  5a0173: 83 f9 01                     	cmpl	$0x1, %ecx
  5a0176: 89 7d 9c                     	movl	%edi, -0x64(%ebp)
  5a0179: 75 09                        	jne	0x5a0184 <.text+0x19f184>
  5a017b: c7 45 ec 00 00 00 00         	movl	$0x0, -0x14(%ebp)
  5a0182: eb 0a                        	jmp	0x5a018e <.text+0x19f18e>
  5a0184: 8b 84 83 cc 53 00 00         	movl	0x53cc(%ebx,%eax,4), %eax
  5a018b: 89 45 ec                     	movl	%eax, -0x14(%ebp)
  5a018e: 8b 94 bb cc 53 00 00         	movl	0x53cc(%ebx,%edi,4), %edx
  5a0195: 8b 45 08                     	movl	0x8(%ebp), %eax
  5a0198: 8b 35 a8 7f 68 00            	movl	0x687fa8, %esi
  5a019e: 89 55 c4                     	movl	%edx, -0x3c(%ebp)
  5a01a1: 8b d0                        	movl	%eax, %edx
  5a01a3: c1 e2 04                     	shll	$0x4, %edx
  5a01a6: 03 d0                        	addl	%eax, %edx
  5a01a8: 85 c9                        	testl	%ecx, %ecx
  5a01aa: 8d 14 d6                     	leal	(%esi,%edx,8), %edx
  5a01ad: 89 55 f0                     	movl	%edx, -0x10(%ebp)
