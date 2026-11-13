
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  44a3c7: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  44a3ca: 83 f8 46                     	cmpl	$0x46, %eax
  44a3cd: 74 05                        	je	0x44a3d4 <.text+0x493d4>
  44a3cf: 83 f8 47                     	cmpl	$0x47, %eax
  44a3d2: 75 42                        	jne	0x44a416 <.text+0x49416>
  44a3d4: d9 05 64 ac 63 00            	flds	0x63ac64
  44a3da: 5f                           	popl	%edi
  44a3db: 5e                           	popl	%esi
  44a3dc: 5b                           	popl	%ebx
  44a3dd: 8b e5                        	movl	%ebp, %esp
  44a3df: 5d                           	popl	%ebp
  44a3e0: c2 08 00                     	retl	$0x8
  44a3e3: f6 c2 10                     	testb	$0x10, %dl
  44a3e6: 75 0f                        	jne	0x44a3f7 <.text+0x493f7>
  44a3e8: d9 05 64 ac 63 00            	flds	0x63ac64
  44a3ee: 5f                           	popl	%edi
  44a3ef: 5e                           	popl	%esi
  44a3f0: 5b                           	popl	%ebx
  44a3f1: 8b e5                        	movl	%ebp, %esp
  44a3f3: 5d                           	popl	%ebp
  44a3f4: c2 08 00                     	retl	$0x8
  44a3f7: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  44a3fa: 83 f8 1e                     	cmpl	$0x1e, %eax
  44a3fd: 74 05                        	je	0x44a404 <.text+0x49404>
  44a3ff: 83 f8 1f                     	cmpl	$0x1f, %eax
  44a402: 75 12                        	jne	0x44a416 <.text+0x49416>
  44a404: d9 05 64 ac 63 00            	flds	0x63ac64
  44a40a: 5f                           	popl	%edi
  44a40b: 5e                           	popl	%esi
  44a40c: 5b                           	popl	%ebx
  44a40d: 8b e5                        	movl	%ebp, %esp
  44a40f: 5d                           	popl	%ebp
  44a410: c2 08 00                     	retl	$0x8
  44a413: 8b 55 fc                     	movl	-0x4(%ebp), %edx
  44a416: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  44a419: c7 45 0c 00 00 80 3f         	movl	$0x3f800000, 0xc(%ebp)  # imm = 0x3F800000
  44a420: 85 c9                        	testl	%ecx, %ecx
  44a422: 74 12                        	je	0x44a436 <.text+0x49436>
  44a424: 6a 5d                        	pushl	$0x5d
  44a426: e8 35 f0 08 00               	calll	0x4d9460 <.text+0xd8460>
  44a42b: 84 c0                        	testb	%al, %al
  44a42d: 0f 85 4b 01 00 00            	jne	0x44a57e <.text+0x4957e>
  44a433: 8b 55 fc                     	movl	-0x4(%ebp), %edx
  44a436: 85 db                        	testl	%ebx, %ebx
  44a438: 74 14                        	je	0x44a44e <.text+0x4944e>
  44a43a: 6a 5d                        	pushl	$0x5d
  44a43c: 8b cb                        	movl	%ebx, %ecx
  44a43e: e8 1d f0 08 00               	calll	0x4d9460 <.text+0xd8460>
  44a443: 84 c0                        	testb	%al, %al
  44a445: 0f 85 33 01 00 00            	jne	0x44a57e <.text+0x4957e>
  44a44b: 8b 55 fc                     	movl	-0x4(%ebp), %edx
