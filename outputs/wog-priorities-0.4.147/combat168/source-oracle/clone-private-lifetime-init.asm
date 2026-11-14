
ERA_REFERENCE_ROOT/h3era.exe:	file format coff-i386

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
