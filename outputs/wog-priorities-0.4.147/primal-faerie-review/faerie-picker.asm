
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  447230: 55                           	pushl	%ebp
  447231: 8b ec                        	movl	%esp, %ebp
  447233: 6a ff                        	pushl	$-0x1
  447235: 68 a8 88 62 00               	pushl	$0x6288a8               # imm = 0x6288A8
  44723a: 64 a1 00 00 00 00            	movl	%fs:0x0, %eax
  447240: 50                           	pushl	%eax
  447241: 64 89 25 00 00 00 00         	movl	%esp, %fs:0x0
  447248: 83 ec 10                     	subl	$0x10, %esp
  44724b: 56                           	pushl	%esi
  44724c: 57                           	pushl	%edi
  44724d: 8b f9                        	movl	%ecx, %edi
  44724f: 33 f6                        	xorl	%esi, %esi
  447251: b8 50 b8 63 00               	movl	$0x63b850, %eax         # imm = 0x63B850
  447256: 8b 8f dc 00 00 00            	movl	0xdc(%edi), %ecx
  44725c: 85 c9                        	testl	%ecx, %ecx
  44725e: 0f 84 64 01 00 00            	je	0x4473c8 <.text+0x463c8>
  447264: 8b 0d 50 b8 63 00            	movl	0x63b850, %ecx
  44726a: 85 c9                        	testl	%ecx, %ecx
  44726c: 7c 10                        	jl	0x44727e <.text+0x4627e>
  44726e: 8b 48 04                     	movl	0x4(%eax), %ecx
  447271: 83 c0 04                     	addl	$0x4, %eax
  447274: 83 c0 04                     	addl	$0x4, %eax
  447277: 03 f1                        	addl	%ecx, %esi
  447279: 83 38 00                     	cmpl	$0x0, (%eax)
  44727c: 7d f0                        	jge	0x44726e <.text+0x4626e>
  44727e: e8 a9 11 1d 00               	calll	0x61842c <.text+0x21742c>
  447283: 8b 0d 50 b8 63 00            	movl	0x63b850, %ecx
  447289: 99                           	cltd
  44728a: f7 fe                        	idivl	%esi
  44728c: 85 c9                        	testl	%ecx, %ecx
  44728e: b8 50 b8 63 00               	movl	$0x63b850, %eax         # imm = 0x63B850
  447293: 7c 19                        	jl	0x4472ae <.text+0x462ae>
  447295: 2b 50 04                     	subl	0x4(%eax), %edx
  447298: 78 0c                        	js	0x4472a6 <.text+0x462a6>
  44729a: 8b 48 08                     	movl	0x8(%eax), %ecx
  44729d: 83 c0 08                     	addl	$0x8, %eax
  4472a0: 85 c9                        	testl	%ecx, %ecx
  4472a2: 7d f1                        	jge	0x447295 <.text+0x46295>
  4472a4: eb 08                        	jmp	0x4472ae <.text+0x462ae>
  4472a6: 8b 00                        	movl	(%eax), %eax
  4472a8: 89 87 e0 04 00 00            	movl	%eax, 0x4e0(%edi)
