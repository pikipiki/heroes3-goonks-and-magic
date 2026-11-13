
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  5a7140: 8b 5d 08                     	movl	0x8(%ebp), %ebx
  5a7143: 8b 7d fc                     	movl	-0x4(%ebp), %edi
  5a7146: 6a 00                        	pushl	$0x0
  5a7148: 68 00 00 80 00               	pushl	$0x800000               # imm = 0x800000
  5a714d: 8b 53 4c                     	movl	0x4c(%ebx), %edx
  5a7150: 8b 43 34                     	movl	0x34(%ebx), %eax
  5a7153: 8b 8f c0 32 01 00            	movl	0x132c0(%edi), %ecx
  5a7159: 56                           	pushl	%esi
  5a715a: 52                           	pushl	%edx
  5a715b: 50                           	pushl	%eax
  5a715c: 51                           	pushl	%ecx
  5a715d: 8b cf                        	movl	%edi, %ecx
  5a715f: e8 cc 28 ed ff               	calll	0x479a30 <.text+0x78a30>
  5a7164: 8d 14 f5 00 00 00 00         	leal	(,%esi,8), %edx
  5a716b: 2b d6                        	subl	%esi, %edx
  5a716d: c1 e2 04                     	shll	$0x4, %edx
  5a7170: 8d 04 3a                     	leal	(%edx,%edi), %eax
  5a7173: 89 45 08                     	movl	%eax, 0x8(%ebp)
  5a7176: 8d 88 c4 01 00 00            	leal	0x1c4(%eax), %ecx
  5a717c: e8 af 00 f4 ff               	calll	0x4e7230 <.text+0xe6230>
  5a7181: 8b f0                        	movl	%eax, %esi
  5a7183: 8b 86 84 00 00 00            	movl	0x84(%esi), %eax
  5a7189: 0d 00 00 40 00               	orl	$0x400000, %eax         # imm = 0x400000
  5a718e: 89 86 84 00 00 00            	movl	%eax, 0x84(%esi)
  5a7194: 8b 87 c0 32 01 00            	movl	0x132c0(%edi), %eax
  5a719a: 8b 8c 87 cc 53 00 00         	movl	0x53cc(%edi,%eax,4), %ecx
  5a71a1: e8 7a de f3 ff               	calll	0x4e5020 <.text+0xe4020>
  5a71a6: 8b 8f c0 32 01 00            	movl	0x132c0(%edi), %ecx
  5a71ac: 8b 94 8f d4 53 00 00         	movl	0x53d4(%edi,%ecx,4), %edx
  5a71b3: 03 c2                        	addl	%edx, %eax
  5a71b5: 8b 96 f8 00 00 00            	movl	0xf8(%esi), %edx
  5a71bb: 89 46 2c                     	movl	%eax, 0x2c(%esi)
  5a71be: 8b 83 f8 00 00 00            	movl	0xf8(%ebx), %eax
  5a71c4: 89 53 28                     	movl	%edx, 0x28(%ebx)
  5a71c7: 89 46 24                     	movl	%eax, 0x24(%esi)
  5a71ca: 8b 46 38                     	movl	0x38(%esi), %eax
  5a71cd: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  5a71d4: 2b c8                        	subl	%eax, %ecx
  5a71d6: c1 e1 04                     	shll	$0x4, %ecx
  5a71d9: 8d 04 39                     	leal	(%ecx,%edi), %eax
  5a71dc: 8b 4b 38                     	movl	0x38(%ebx), %ecx
  5a71df: 8d 14 cd 00 00 00 00         	leal	(,%ecx,8), %edx
  5a71e6: 2b d1                        	subl	%ecx, %edx
  5a71e8: c1 e2 04                     	shll	$0x4, %edx
  5a71eb: 0f bf 9c 3a c6 01 00 00      	movswl	0x1c6(%edx,%edi), %ebx
  5a71f3: 8d 0c 3a                     	leal	(%edx,%edi), %ecx
  5a71f6: 0f bf 90 c4 01 00 00         	movswl	0x1c4(%eax), %edx
  5a71fd: 0f bf b9 c4 01 00 00         	movswl	0x1c4(%ecx), %edi
  5a7204: 0f bf 80 c6 01 00 00         	movswl	0x1c6(%eax), %eax
  5a720b: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  5a720e: 2b fa                        	subl	%edx, %edi
  5a7210: 2b d8                        	subl	%eax, %ebx
  5a7212: e8 79 c0 ee ff               	calll	0x493290 <.text+0x92290>
  5a7217: 8b 45 08                     	movl	0x8(%ebp), %eax
  5a721a: 0f be 90 dc 01 00 00         	movsbl	0x1dc(%eax), %edx
  5a7221: 0f be 88 dd 01 00 00         	movsbl	0x1dd(%eax), %ecx
  5a7228: 8d 04 d5 00 00 00 00         	leal	(,%edx,8), %eax
  5a722f: 89 4d 08                     	movl	%ecx, 0x8(%ebp)
  5a7232: 2b c2                        	subl	%edx, %eax
  5a7234: 8d 0c 41                     	leal	(%ecx,%eax,2), %ecx
  5a7237: 03 c1                        	addl	%ecx, %eax
  5a7239: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  5a7240: 2b c8                        	subl	%eax, %ecx
  5a7242: 8d 0c 49                     	leal	(%ecx,%ecx,2), %ecx
  5a7245: 8d 04 c8                     	leal	(%eax,%ecx,8), %eax
  5a7248: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  5a724b: 81 bc c1 00 55 00 00 95 00 00 00     	cmpl	$0x95, 0x5500(%ecx,%eax,8)
  5a7256: 8d 04 c1                     	leal	(%ecx,%eax,8), %eax
  5a7259: 75 10                        	jne	0x5a726b <.text+0x1a626b>
  5a725b: 05 cc 54 00 00               	addl	$0x54cc, %eax           # imm = 0x54CC
  5a7260: 50                           	pushl	%eax
  5a7261: e8 da 2d ec ff               	calll	0x46a040 <.text+0x69040>
  5a7266: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  5a7269: eb 11                        	jmp	0x5a727c <.text+0x1a627c>
  5a726b: 8b 45 08                     	movl	0x8(%ebp), %eax
  5a726e: 8d 94 92 00 50 00 00         	leal	0x5000(%edx,%edx,4), %edx
  5a7275: 8d 14 90                     	leal	(%eax,%edx,4), %edx
  5a7278: c6 04 0a 01                  	movb	$0x1, (%edx,%ecx)
  5a727c: 8b 45 e4                     	movl	-0x1c(%ebp), %eax
  5a727f: 0f be 90 dd 01 00 00         	movsbl	0x1dd(%eax), %edx
  5a7286: 89 55 08                     	movl	%edx, 0x8(%ebp)
  5a7289: 0f be 90 dc 01 00 00         	movsbl	0x1dc(%eax), %edx
  5a7290: 89 55 e4                     	movl	%edx, -0x1c(%ebp)
  5a7293: 8d 04 d5 00 00 00 00         	leal	(,%edx,8), %eax
  5a729a: 2b c2                        	subl	%edx, %eax
  5a729c: 8b 55 08                     	movl	0x8(%ebp), %edx
  5a729f: 8d 14 42                     	leal	(%edx,%eax,2), %edx
  5a72a2: 03 c2                        	addl	%edx, %eax
  5a72a4: 8d 14 c5 00 00 00 00         	leal	(,%eax,8), %edx
  5a72ab: 2b d0                        	subl	%eax, %edx
  5a72ad: 8d 14 52                     	leal	(%edx,%edx,2), %edx
  5a72b0: 8d 04 d0                     	leal	(%eax,%edx,8), %eax
  5a72b3: 8b 94 c1 00 55 00 00         	movl	0x5500(%ecx,%eax,8), %edx
  5a72ba: 81 fa 95 00 00 00            	cmpl	$0x95, %edx
  5a72c0: 8d 04 c1                     	leal	(%ecx,%eax,8), %eax
  5a72c3: 75 10                        	jne	0x5a72d5 <.text+0x1a62d5>
  5a72c5: 05 cc 54 00 00               	addl	$0x54cc, %eax           # imm = 0x54CC
  5a72ca: 50                           	pushl	%eax
  5a72cb: e8 70 2d ec ff               	calll	0x46a040 <.text+0x69040>
  5a72d0: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  5a72d3: eb 14                        	jmp	0x5a72e9 <.text+0x1a62e9>
  5a72d5: 8b 45 e4                     	movl	-0x1c(%ebp), %eax
  5a72d8: 8d 94 80 00 50 00 00         	leal	0x5000(%eax,%eax,4), %edx
  5a72df: 8b 45 08                     	movl	0x8(%ebp), %eax
  5a72e2: 8d 14 90                     	leal	(%eax,%edx,4), %edx
  5a72e5: c6 04 0a 01                  	movb	$0x1, (%edx,%ecx)
  5a72e9: e8 82 e4 ee ff               	calll	0x495770 <.text+0x94770>
  5a72ee: 8b c3                        	movl	%ebx, %eax
  5a72f0: c7 45 08 10 00 00 00         	movl	$0x10, 0x8(%ebp)
  5a72f7: f7 d8                        	negl	%eax
  5a72f9: 89 45 e8                     	movl	%eax, -0x18(%ebp)
  5a72fc: 8b c7                        	movl	%edi, %eax
  5a72fe: f7 d8                        	negl	%eax
  5a7300: c1 e3 04                     	shll	$0x4, %ebx
  5a7303: 89 45 e4                     	movl	%eax, -0x1c(%ebp)
  5a7306: c1 e7 04                     	shll	$0x4, %edi
  5a7309: 8b c7                        	movl	%edi, %eax
  5a730b: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  5a730e: 99                           	cltd
  5a730f: 83 e2 0f                     	andl	$0xf, %edx
  5a7312: 6a 01                        	pushl	$0x1
  5a7314: 03 c2                        	addl	%edx, %eax
  5a7316: 6a 01                        	pushl	$0x1
  5a7318: c1 f8 04                     	sarl	$0x4, %eax
  5a731b: 89 86 04 01 00 00            	movl	%eax, 0x104(%esi)
  5a7321: 8b c3                        	movl	%ebx, %eax
  5a7323: 99                           	cltd
  5a7324: 83 e2 0f                     	andl	$0xf, %edx
  5a7327: 6a 32                        	pushl	$0x32
  5a7329: 03 c2                        	addl	%edx, %eax
  5a732b: 6a 00                        	pushl	$0x0
  5a732d: c1 f8 04                     	sarl	$0x4, %eax
  5a7330: 6a 01                        	pushl	$0x1
  5a7332: 6a 01                        	pushl	$0x1
  5a7334: 89 86 00 01 00 00            	movl	%eax, 0x100(%esi)
  5a733a: e8 81 cc ee ff               	calll	0x493fc0 <.text+0x92fc0>
  5a733f: 8b 55 e4                     	movl	-0x1c(%ebp), %edx
  5a7342: 8b 4d e8                     	movl	-0x18(%ebp), %ecx
  5a7345: 8b 45 08                     	movl	0x8(%ebp), %eax
  5a7348: 03 fa                        	addl	%edx, %edi
  5a734a: 03 d9                        	addl	%ecx, %ebx
  5a734c: 48                           	decl	%eax
  5a734d: 89 45 08                     	movl	%eax, 0x8(%ebp)
  5a7350: 75 b7                        	jne	0x5a7309 <.text+0x1a6309>
  5a7352: 33 ff                        	xorl	%edi, %edi
  5a7354: 6a 01                        	pushl	$0x1
  5a7356: 89 be 04 01 00 00            	movl	%edi, 0x104(%esi)
  5a735c: 89 be 00 01 00 00            	movl	%edi, 0x100(%esi)
  5a7362: 8b 75 fc                     	movl	-0x4(%ebp), %esi
  5a7365: 57                           	pushl	%edi
  5a7366: 8b ce                        	movl	%esi, %ecx
  5a7368: e8 43 c1 ee ff               	calll	0x4934b0 <.text+0x924b0>
  5a736d: 57                           	pushl	%edi
  5a736e: 6a 01                        	pushl	$0x1
  5a7370: 57                           	pushl	%edi
  5a7371: 57                           	pushl	%edi
  5a7372: 57                           	pushl	%edi
  5a7373: 6a 01                        	pushl	$0x1
  5a7375: 8b ce                        	movl	%esi, %ecx
  5a7377: e8 44 cc ee ff               	calll	0x493fc0 <.text+0x92fc0>
  5a737c: 5f                           	popl	%edi
  5a737d: 5e                           	popl	%esi
  5a737e: 5b                           	popl	%ebx
  5a737f: 8b e5                        	movl	%ebp, %esp
  5a7381: 5d                           	popl	%ebp
  5a7382: c2 08 00                     	retl	$0x8
  5a7385: 90                           	nop
  5a7386: 90                           	nop
  5a7387: 90                           	nop
  5a7388: 90                           	nop
  5a7389: 90                           	nop
  5a738a: 90                           	nop
  5a738b: 90                           	nop
  5a738c: 90                           	nop
  5a738d: 90                           	nop
  5a738e: 90                           	nop
  5a738f: 90                           	nop
