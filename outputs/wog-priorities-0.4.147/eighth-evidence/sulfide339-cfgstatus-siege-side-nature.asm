
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a8550: 8b 8f 20 02 00 00            	movl	0x220(%edi), %ecx
  5a8556: 85 c9                        	testl	%ecx, %ecx
  5a8558: 74 23                        	je	0x5a857d <.text+0x1a757d>
  5a855a: 8b 4d f8                     	movl	-0x8(%ebp), %ecx
  5a855d: 8b 51 18                     	movl	0x18(%ecx), %edx
  5a8560: 3b 97 60 04 00 00            	cmpl	0x460(%edi), %edx
  5a8566: 7d 15                        	jge	0x5a857d <.text+0x1a757d>
  5a8568: f6 41 0c 08                  	testb	$0x8, 0xc(%ecx)
  5a856c: 75 0f                        	jne	0x5a857d <.text+0x1a757d>
  5a856e: d9 05 64 ac 63 00            	flds	0x63ac64
  5a8574: 5f                           	popl	%edi
  5a8575: 5e                           	popl	%esi
  5a8576: 5b                           	popl	%ebx
  5a8577: 8b e5                        	movl	%ebp, %esp
  5a8579: 5d                           	popl	%ebp
  5a857a: c2 18 00                     	retl	$0x18
  5a857d: 8b 97 84 00 00 00            	movl	0x84(%edi), %edx
  5a8583: 8b ca                        	movl	%edx, %ecx
  5a8585: c1 e9 15                     	shrl	$0x15, %ecx
  5a8588: f6 c1 01                     	testb	$0x1, %cl
  5a858b: 74 1e                        	je	0x5a85ab <.text+0x1a75ab>
  5a858d: 83 f8 26                     	cmpl	$0x26, %eax
  5a8590: 74 19                        	je	0x5a85ab <.text+0x1a75ab>
  5a8592: 83 f8 27                     	cmpl	$0x27, %eax
  5a8595: 74 14                        	je	0x5a85ab <.text+0x1a75ab>
  5a8597: 83 f8 28                     	cmpl	$0x28, %eax
  5a859a: 74 0f                        	je	0x5a85ab <.text+0x1a75ab>
  5a859c: d9 05 64 ac 63 00            	flds	0x63ac64
  5a85a2: 5f                           	popl	%edi
  5a85a3: 5e                           	popl	%esi
  5a85a4: 5b                           	popl	%ebx
  5a85a5: 8b e5                        	movl	%ebp, %esp
  5a85a7: 5d                           	popl	%ebp
  5a85a8: c2 18 00                     	retl	$0x18
  5a85ab: 8a 8f ea 00 00 00            	movb	0xea(%edi), %cl
  5a85b1: 84 c9                        	testb	%cl, %cl
  5a85b3: 74 0f                        	je	0x5a85c4 <.text+0x1a75c4>
  5a85b5: d9 05 64 ac 63 00            	flds	0x63ac64
  5a85bb: 5f                           	popl	%edi
  5a85bc: 5e                           	popl	%esi
  5a85bd: 5b                           	popl	%ebx
  5a85be: 8b e5                        	movl	%ebp, %esp
  5a85c0: 5d                           	popl	%ebp
  5a85c1: c2 18 00                     	retl	$0x18
  5a85c4: 83 f8 28                     	cmpl	$0x28, %eax
  5a85c7: 75 3c                        	jne	0x5a8605 <.text+0x1a7605>
  5a85c9: 8a 45 18                     	movb	0x18(%ebp), %al
  5a85cc: 84 c0                        	testb	%al, %al
  5a85ce: 75 35                        	jne	0x5a8605 <.text+0x1a7605>
  5a85d0: 8b 87 88 02 00 00            	movl	0x288(%edi), %eax
  5a85d6: 85 c0                        	testl	%eax, %eax
  5a85d8: 74 0f                        	je	0x5a85e9 <.text+0x1a75e9>
  5a85da: 8b 8f f4 00 00 00            	movl	0xf4(%edi), %ecx
  5a85e0: b8 01 00 00 00               	movl	$0x1, %eax
  5a85e5: 2b c1                        	subl	%ecx, %eax
  5a85e7: eb 06                        	jmp	0x5a85ef <.text+0x1a75ef>
  5a85e9: 8b 87 f4 00 00 00            	movl	0xf4(%edi), %eax
  5a85ef: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  5a85f2: 3b c1                        	cmpl	%ecx, %eax
  5a85f4: 74 12                        	je	0x5a8608 <.text+0x1a7608>
  5a85f6: d9 05 64 ac 63 00            	flds	0x63ac64
  5a85fc: 5f                           	popl	%edi
  5a85fd: 5e                           	popl	%esi
  5a85fe: 5b                           	popl	%ebx
  5a85ff: 8b e5                        	movl	%ebp, %esp
  5a8601: 5d                           	popl	%ebp
  5a8602: c2 18 00                     	retl	$0x18
  5a8605: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  5a8608: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  5a860b: 80 7d 14 00                  	cmpb	$0x0, 0x14(%ebp)
  5a860f: 8b 00                        	movl	(%eax), %eax
  5a8611: 89 45 f8                     	movl	%eax, -0x8(%ebp)
  5a8614: 75 3f                        	jne	0x5a8655 <.text+0x1a7655>
  5a8616: 85 c0                        	testl	%eax, %eax
  5a8618: 7d 22                        	jge	0x5a863c <.text+0x1a763c>
  5a861a: 39 8f f4 00 00 00            	cmpl	%ecx, 0xf4(%edi)
  5a8620: 75 18                        	jne	0x5a863a <.text+0x1a763a>
  5a8622: 83 7d 08 3b                  	cmpl	$0x3b, 0x8(%ebp)
  5a8626: 74 0f                        	je	0x5a8637 <.text+0x1a7637>
  5a8628: d9 05 64 ac 63 00            	flds	0x63ac64
  5a862e: 5f                           	popl	%edi
  5a862f: 5e                           	popl	%esi
  5a8630: 5b                           	popl	%ebx
  5a8631: 8b e5                        	movl	%ebp, %esp
  5a8633: 5d                           	popl	%ebp
  5a8634: c2 18 00                     	retl	$0x18
  5a8637: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  5a863a: 85 c0                        	testl	%eax, %eax
  5a863c: 7e 17                        	jle	0x5a8655 <.text+0x1a7655>
  5a863e: 39 8f f4 00 00 00            	cmpl	%ecx, 0xf4(%edi)
  5a8644: 74 0f                        	je	0x5a8655 <.text+0x1a7655>
  5a8646: d9 05 64 ac 63 00            	flds	0x63ac64
  5a864c: 5f                           	popl	%edi
  5a864d: 5e                           	popl	%esi
  5a864e: 5b                           	popl	%ebx
  5a864f: 8b e5                        	movl	%ebp, %esp
  5a8651: 5d                           	popl	%ebp
  5a8652: c2 18 00                     	retl	$0x18
  5a8655: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  5a8658: 8d 41 e6                     	leal	-0x1a(%ecx), %eax
  5a865b: 83 f8 27                     	cmpl	$0x27, %eax
  5a865e: 0f 87 3e 02 00 00            	ja	0x5a88a2 <.text+0x1a78a2>
  5a8664: 33 c9                        	xorl	%ecx, %ecx
  5a8666: 8a 88 1c 89 5a 00            	movb	0x5a891c(%eax), %cl
  5a866c: ff 24 8d 00 89 5a 00         	jmpl	*0x5a8900(,%ecx,4)
