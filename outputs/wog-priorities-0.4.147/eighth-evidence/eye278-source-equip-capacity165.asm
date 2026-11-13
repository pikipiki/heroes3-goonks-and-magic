
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  4e27c0: 55                           	pushl	%ebp
  4e27c1: 8b ec                        	movl	%esp, %ebp
  4e27c3: 83 ec 6c                     	subl	$0x6c, %esp
  4e27c6: a1 38 95 69 00               	movl	0x699538, %eax
  4e27cb: 53                           	pushl	%ebx
  4e27cc: 56                           	pushl	%esi
  4e27cd: 57                           	pushl	%edi
  4e27ce: 8b 90 98 f6 01 00            	movl	0x1f698(%eax), %edx
  4e27d4: 89 4d f8                     	movl	%ecx, -0x8(%ebp)
  4e27d7: 83 fa 02                     	cmpl	$0x2, %edx
  4e27da: 7d 0a                        	jge	0x4e27e6 <.text+0xe17e6>
  4e27dc: 83 7d 0c 12                  	cmpl	$0x12, 0xc(%ebp)
  4e27e0: 0f 84 bb 02 00 00            	je	0x4e2aa1 <.text+0xe1aa1>
  4e27e6: 8b 45 0c                     	movl	0xc(%ebp), %eax
  4e27e9: c7 45 e4 01 00 00 00         	movl	$0x1, -0x1c(%ebp)
  4e27f0: 83 f8 ff                     	cmpl	$-0x1, %eax
  4e27f3: 75 0e                        	jne	0x4e2803 <.text+0xe1803>
  4e27f5: c7 45 0c 00 00 00 00         	movl	$0x0, 0xc(%ebp)
  4e27fc: c7 45 e4 13 00 00 00         	movl	$0x13, -0x1c(%ebp)
  4e2803: 8b 55 0c                     	movl	0xc(%ebp), %edx
  4e2806: 8d 3c d5 00 00 00 00         	leal	(,%edx,8), %edi
  4e280d: 89 7d ec                     	movl	%edi, -0x14(%ebp)
  4e2810: 8d 84 0f 2d 01 00 00         	leal	0x12d(%edi,%ecx), %eax
  4e2817: 89 45 e8                     	movl	%eax, -0x18(%ebp)
  4e281a: 8b 4d e8                     	movl	-0x18(%ebp), %ecx
  4e281d: 83 39 ff                     	cmpl	$-0x1, (%ecx)
  4e2820: 0f 85 4c 02 00 00            	jne	0x4e2a72 <.text+0xe1a72>
  4e2826: 8b 5d 08                     	movl	0x8(%ebp), %ebx
  4e2829: 8b 15 68 0b 66 00            	movl	0x660b68, %edx
  4e282f: c1 e3 05                     	shll	$0x5, %ebx
  4e2832: 81 ff 98 00 00 00            	cmpl	$0x98, %edi
  4e2838: 89 5d f0                     	movl	%ebx, -0x10(%ebp)
  4e283b: 8b 44 13 08                  	movl	0x8(%ebx,%edx), %eax
  4e283f: 8d 34 85 e8 38 69 00         	leal	0x6938e8(,%eax,4), %esi
  4e2846: 72 07                        	jb	0x4e284f <.text+0xe184f>
  4e2848: 8b ce                        	movl	%esi, %ecx
  4e284a: e8 81 a8 f6 ff               	calll	0x44d0d0 <.text+0x4c0d0>
  4e284f: 8b 45 0c                     	movl	0xc(%ebp), %eax
  4e2852: ba 01 00 00 00               	movl	$0x1, %edx
  4e2857: 8b c8                        	movl	%eax, %ecx
  4e2859: 83 e1 1f                     	andl	$0x1f, %ecx
  4e285c: d3 e2                        	shll	%cl, %edx
  4e285e: c1 e8 05                     	shrl	$0x5, %eax
  4e2861: 85 14 86                     	testl	%edx, (%esi,%eax,4)
  4e2864: 0f 84 08 02 00 00            	je	0x4e2a72 <.text+0xe1a72>
  4e286a: a1 64 0b 66 00               	movl	0x660b64, %eax
  4e286f: 8b 4d f8                     	movl	-0x8(%ebp), %ecx
  4e2872: 33 d2                        	xorl	%edx, %edx
  4e2874: 8b 44 07 04                  	movl	0x4(%edi,%eax), %eax
  4e2878: 8d b1 c5 01 00 00            	leal	0x1c5(%ecx), %esi
  4e287e: 8a 14 06                     	movb	(%esi,%eax), %dl
  4e2881: 85 d2                        	testl	%edx, %edx
  4e2883: 89 55 d8                     	movl	%edx, -0x28(%ebp)
  4e2886: 0f 86 83 00 00 00            	jbe	0x4e290f <.text+0xe190f>
  4e288c: 8b 04 85 e8 38 69 00         	movl	0x6938e8(,%eax,4), %eax
  4e2893: 33 db                        	xorl	%ebx, %ebx
  4e2895: 85 c0                        	testl	%eax, %eax
  4e2897: 89 45 e0                     	movl	%eax, -0x20(%ebp)
  4e289a: 0f 84 d2 01 00 00            	je	0x4e2a72 <.text+0xe1a72>
  4e28a0: 8b c8                        	movl	%eax, %ecx
  4e28a2: 83 e1 0f                     	andl	$0xf, %ecx
  4e28a5: 0f be 89 9c 72 67 00         	movsbl	0x67729c(%ecx), %ecx
  4e28ac: 03 d9                        	addl	%ecx, %ebx
  4e28ae: c1 e8 04                     	shrl	$0x4, %eax
  4e28b1: 75 ed                        	jne	0x4e28a0 <.text+0xe18a0>
  4e28b3: 3b d3                        	cmpl	%ebx, %edx
  4e28b5: 0f 83 b7 01 00 00            	jae	0x4e2a72 <.text+0xe1a72>
  4e28bb: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  4e28be: 33 f6                        	xorl	%esi, %esi
  4e28c0: 89 75 f4                     	movl	%esi, -0xc(%ebp)
  4e28c3: 83 fe 13                     	cmpl	$0x13, %esi
  4e28c6: 8d b8 2d 01 00 00            	leal	0x12d(%eax), %edi
  4e28cc: 72 0b                        	jb	0x4e28d9 <.text+0xe18d9>
  4e28ce: 8d 4d e0                     	leal	-0x20(%ebp), %ecx
  4e28d1: e8 fa a7 f6 ff               	calll	0x44d0d0 <.text+0x4c0d0>
  4e28d6: 8b 55 d8                     	movl	-0x28(%ebp), %edx
  4e28d9: 8b ce                        	movl	%esi, %ecx
  4e28db: b8 01 00 00 00               	movl	$0x1, %eax
  4e28e0: 83 e1 1f                     	andl	$0x1f, %ecx
  4e28e3: d3 e0                        	shll	%cl, %eax
  4e28e5: 8b ce                        	movl	%esi, %ecx
  4e28e7: c1 e9 05                     	shrl	$0x5, %ecx
  4e28ea: 85 44 8d e0                  	testl	%eax, -0x20(%ebp,%ecx,4)
  4e28ee: 74 08                        	je	0x4e28f8 <.text+0xe18f8>
  4e28f0: 83 3f ff                     	cmpl	$-0x1, (%edi)
  4e28f3: 74 03                        	je	0x4e28f8 <.text+0xe18f8>
  4e28f5: ff 45 f4                     	incl	-0xc(%ebp)
  4e28f8: 46                           	incl	%esi
  4e28f9: 83 c7 08                     	addl	$0x8, %edi
  4e28fc: 83 fe 13                     	cmpl	$0x13, %esi
  4e28ff: 7c cb                        	jl	0x4e28cc <.text+0xe18cc>
  4e2901: 2b 5d f4                     	subl	-0xc(%ebp), %ebx
  4e2904: 3b d3                        	cmpl	%ebx, %edx
  4e2906: 0f 83 63 01 00 00            	jae	0x4e2a6f <.text+0xe1a6f>
  4e290c: 8b 5d f0                     	movl	-0x10(%ebp), %ebx
  4e290f: 8b 15 68 0b 66 00            	movl	0x660b68, %edx
