
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  469f30: 55                           	pushl	%ebp
  469f31: 8b ec                        	movl	%esp, %ebp
  469f33: 83 ec 08                     	subl	$0x8, %esp
  469f36: 53                           	pushl	%ebx
  469f37: 8b 5d 08                     	movl	0x8(%ebp), %ebx
  469f3a: ba 01 00 00 00               	movl	$0x1, %edx
  469f3f: 56                           	pushl	%esi
  469f40: 2b d3                        	subl	%ebx, %edx
  469f42: 33 db                        	xorl	%ebx, %ebx
  469f44: 57                           	pushl	%edi
  469f45: 89 4d f8                     	movl	%ecx, -0x8(%ebp)
  469f48: 8d 04 d2                     	leal	(%edx,%edx,8), %eax
  469f4b: c7 45 fc 14 00 00 00         	movl	$0x14, -0x4(%ebp)
  469f52: 8d 04 82                     	leal	(%edx,%eax,4), %eax
  469f55: c1 e0 05                     	shll	$0x5, %eax
  469f58: 2b c2                        	subl	%edx, %eax
  469f5a: 8d 04 40                     	leal	(%eax,%eax,2), %eax
  469f5d: 8d 84 c1 50 55 00 00         	leal	0x5550(%ecx,%eax,8), %eax
  469f64: 8b 70 b0                     	movl	-0x50(%eax), %esi
  469f67: 83 fe ff                     	cmpl	$-0x1, %esi
  469f6a: 74 37                        	je	0x469fa3 <.text+0x68fa3>
  469f6c: 8b 38                        	movl	(%eax), %edi
  469f6e: 8b cf                        	movl	%edi, %ecx
  469f70: c1 e9 16                     	shrl	$0x16, %ecx
  469f73: f6 c1 01                     	testb	$0x1, %cl
  469f76: 75 2b                        	jne	0x469fa3 <.text+0x68fa3>
  469f78: 8b cf                        	movl	%edi, %ecx
  469f7a: c1 e9 06                     	shrl	$0x6, %ecx
  469f7d: f6 c1 01                     	testb	$0x1, %cl
  469f80: 75 21                        	jne	0x469fa3 <.text+0x68fa3>
  469f82: 8b 48 dc                     	movl	-0x24(%eax), %ecx
  469f85: 8b 78 c8                     	movl	-0x38(%eax), %edi
  469f88: 2b cf                        	subl	%edi, %ecx
  469f8a: 8d 3c f5 00 00 00 00         	leal	(,%esi,8), %edi
  469f91: 2b fe                        	subl	%esi, %edi
  469f93: 8d 34 be                     	leal	(%esi,%edi,4), %esi
  469f96: 8b 3d b0 47 67 00            	movl	0x6747b0, %edi
  469f9c: 0f af 4c b7 4c               	imull	0x4c(%edi,%esi,4), %ecx
  469fa1: 03 d9                        	addl	%ecx, %ebx
  469fa3: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  469fa6: 05 48 05 00 00               	addl	$0x548, %eax            # imm = 0x548
  469fab: 49                           	decl	%ecx
  469fac: 89 4d fc                     	movl	%ecx, -0x4(%ebp)
  469faf: 75 b3                        	jne	0x469f64 <.text+0x68f64>
