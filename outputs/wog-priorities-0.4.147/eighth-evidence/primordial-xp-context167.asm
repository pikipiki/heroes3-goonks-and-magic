
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a83a0: 55                           	pushl	%ebp
  5a83a1: 8b ec                        	movl	%esp, %ebp
  5a83a3: 83 ec 0c                     	subl	$0xc, %esp
  5a83a6: 8b 45 0c                     	movl	0xc(%ebp), %eax
  5a83a9: 53                           	pushl	%ebx
  5a83aa: 56                           	pushl	%esi
  5a83ab: 8b f1                        	movl	%ecx, %esi
  5a83ad: 57                           	pushl	%edi
  5a83ae: 8b 7d 10                     	movl	0x10(%ebp), %edi
  5a83b1: 8b 8c 86 cc 53 00 00         	movl	0x53cc(%esi,%eax,4), %ecx
  5a83b8: 89 4d fc                     	movl	%ecx, -0x4(%ebp)
  5a83bb: 8b cf                        	movl	%edi, %ecx
  5a83bd: e8 ee 9f e9 ff               	calll	0x4423b0 <.text+0x413b0>
  5a83c2: 8b 57 34                     	movl	0x34(%edi), %edx
  5a83c5: 8b 5d 08                     	movl	0x8(%ebp), %ebx
  5a83c8: 89 55 f4                     	movl	%edx, -0xc(%ebp)
  5a83cb: 8b 55 08                     	movl	0x8(%ebp), %edx
  5a83ce: c1 e3 04                     	shll	$0x4, %ebx
  5a83d1: 03 da                        	addl	%edx, %ebx
  5a83d3: 89 45 10                     	movl	%eax, 0x10(%ebp)
  5a83d6: a1 a8 7f 68 00               	movl	0x687fa8, %eax
  5a83db: c1 e3 03                     	shll	$0x3, %ebx
  5a83de: 8d 0c 03                     	leal	(%ebx,%eax), %ecx
  5a83e1: 8b 86 c0 53 00 00            	movl	0x53c0(%esi), %eax
  5a83e7: 83 f8 02                     	cmpl	$0x2, %eax
  5a83ea: 89 4d f8                     	movl	%ecx, -0x8(%ebp)
  5a83ed: 75 17                        	jne	0x5a8406 <.text+0x1a7406>
  5a83ef: 8b d1                        	movl	%ecx, %edx
  5a83f1: 83 7a 18 01                  	cmpl	$0x1, 0x18(%edx)
  5a83f5: 7e 0f                        	jle	0x5a8406 <.text+0x1a7406>
  5a83f7: d9 05 64 ac 63 00            	flds	0x63ac64
  5a83fd: 5f                           	popl	%edi
  5a83fe: 5e                           	popl	%esi
  5a83ff: 5b                           	popl	%ebx
  5a8400: 8b e5                        	movl	%ebp, %esp
  5a8402: 5d                           	popl	%ebp
  5a8403: c2 18 00                     	retl	$0x18
  5a8406: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  5a8409: 83 78 18 02                  	cmpl	$0x2, 0x18(%eax)
  5a840d: 7e 39                        	jle	0x5a8448 <.text+0x1a7448>
  5a840f: 8b 8e cc 53 00 00            	movl	0x53cc(%esi), %ecx
  5a8415: 85 c9                        	testl	%ecx, %ecx
  5a8417: 74 0b                        	je	0x5a8424 <.text+0x1a7424>
  5a8419: 6a 53                        	pushl	$0x53
  5a841b: e8 40 10 f3 ff               	calll	0x4d9460 <.text+0xd8460>
  5a8420: 84 c0                        	testb	%al, %al
  5a8422: 75 15                        	jne	0x5a8439 <.text+0x1a7439>
  5a8424: 8b 8e d0 53 00 00            	movl	0x53d0(%esi), %ecx
  5a842a: 85 c9                        	testl	%ecx, %ecx
  5a842c: 74 1a                        	je	0x5a8448 <.text+0x1a7448>
  5a842e: 6a 53                        	pushl	$0x53
  5a8430: e8 2b 10 f3 ff               	calll	0x4d9460 <.text+0xd8460>
  5a8435: 84 c0                        	testb	%al, %al
  5a8437: 74 0f                        	je	0x5a8448 <.text+0x1a7448>
  5a8439: d9 05 64 ac 63 00            	flds	0x63ac64
  5a843f: 5f                           	popl	%edi
  5a8440: 5e                           	popl	%esi
  5a8441: 5b                           	popl	%ebx
  5a8442: 8b e5                        	movl	%ebp, %esp
  5a8444: 5d                           	popl	%ebp
  5a8445: c2 18 00                     	retl	$0x18
