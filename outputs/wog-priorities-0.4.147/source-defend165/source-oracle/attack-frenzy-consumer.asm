
/Users/sevenone./Documents/git/era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  442130: 55                           	pushl	%ebp
  442131: 8b ec                        	movl	%esp, %ebp
  442133: 51                           	pushl	%ecx
  442134: 8a 45 0c                     	movb	0xc(%ebp), %al
  442137: 53                           	pushl	%ebx
  442138: 56                           	pushl	%esi
  442139: 8b f1                        	movl	%ecx, %esi
  44213b: 84 c0                        	testb	%al, %al
  44213d: 8b 9e c8 00 00 00            	movl	0xc8(%esi), %ebx
  442143: 89 5d fc                     	movl	%ebx, -0x4(%ebp)
  442146: 74 12                        	je	0x44215a <.text+0x4115a>
  442148: 8b 86 48 02 00 00            	movl	0x248(%esi), %eax
  44214e: 85 c0                        	testl	%eax, %eax
  442150: 74 1d                        	je	0x44216f <.text+0x4116f>
  442152: 8b 86 68 04 00 00            	movl	0x468(%esi), %eax
  442158: eb 10                        	jmp	0x44216a <.text+0x4116a>
  44215a: 8b 86 44 02 00 00            	movl	0x244(%esi), %eax
  442160: 85 c0                        	testl	%eax, %eax
  442162: 74 0b                        	je	0x44216f <.text+0x4116f>
  442164: 8b 86 64 04 00 00            	movl	0x464(%esi), %eax
  44216a: 03 d8                        	addl	%eax, %ebx
  44216c: 89 5d fc                     	movl	%ebx, -0x4(%ebp)
  44216f: 8b 86 74 02 00 00            	movl	0x274(%esi), %eax
  442175: 57                           	pushl	%edi
  442176: 85 c0                        	testl	%eax, %eax
  442178: 0f 84 a3 00 00 00            	je	0x442221 <.text+0x41221>
  44217e: 8b 45 08                     	movl	0x8(%ebp), %eax
  442181: 85 c0                        	testl	%eax, %eax
  442183: 0f 84 98 00 00 00            	je	0x442221 <.text+0x41221>
  442189: 8b 80 84 00 00 00            	movl	0x84(%eax), %eax
  44218f: 8b c8                        	movl	%eax, %ecx
  442191: c1 e9 07                     	shrl	$0x7, %ecx
  442194: f6 c1 01                     	testb	$0x1, %cl
  442197: 74 0a                        	je	0x4421a3 <.text+0x411a3>
  442199: 8b 8e 8c 04 00 00            	movl	0x48c(%esi), %ecx
  44219f: 85 c9                        	testl	%ecx, %ecx
  4421a1: 7d 23                        	jge	0x4421c6 <.text+0x411c6>
  4421a3: 8b d0                        	movl	%eax, %edx
  4421a5: c1 ea 08                     	shrl	$0x8, %edx
  4421a8: f6 c2 01                     	testb	$0x1, %dl
  4421ab: 74 09                        	je	0x4421b6 <.text+0x411b6>
  4421ad: 83 be 8c 04 00 00 02         	cmpl	$0x2, 0x48c(%esi)
  4421b4: 7d 10                        	jge	0x4421c6 <.text+0x411c6>
  4421b6: c1 e8 09                     	shrl	$0x9, %eax
  4421b9: a8 01                        	testb	$0x1, %al
  4421bb: 74 64                        	je	0x442221 <.text+0x41221>
  4421bd: 83 be 8c 04 00 00 03         	cmpl	$0x3, 0x48c(%esi)
  4421c4: 7c 5b                        	jl	0x442221 <.text+0x41221>
  4421c6: 8b 96 88 02 00 00            	movl	0x288(%esi), %edx
  4421cc: 8b 8e f4 00 00 00            	movl	0xf4(%esi), %ecx
  4421d2: 83 c3 08                     	addl	$0x8, %ebx
  4421d5: 85 d2                        	testl	%edx, %edx
  4421d7: 89 5d fc                     	movl	%ebx, -0x4(%ebp)
  4421da: 74 09                        	je	0x4421e5 <.text+0x411e5>
  4421dc: b8 01 00 00 00               	movl	$0x1, %eax
  4421e1: 2b c1                        	subl	%ecx, %eax
  4421e3: eb 02                        	jmp	0x4421e7 <.text+0x411e7>
  4421e5: 8b c1                        	movl	%ecx, %eax
  4421e7: 8b 3d 20 94 69 00            	movl	0x699420, %edi
  4421ed: 83 bc 87 cc 53 00 00 00      	cmpl	$0x0, 0x53cc(%edi,%eax,4)
  4421f5: 74 2a                        	je	0x442221 <.text+0x41221>
  4421f7: 85 d2                        	testl	%edx, %edx
  4421f9: 74 09                        	je	0x442204 <.text+0x41204>
  4421fb: b8 01 00 00 00               	movl	$0x1, %eax
  442200: 2b c1                        	subl	%ecx, %eax
  442202: eb 02                        	jmp	0x442206 <.text+0x41206>
  442204: 8b c1                        	movl	%ecx, %eax
  442206: 8b 4e 78                     	movl	0x78(%esi), %ecx
  442209: 8b 84 87 cc 53 00 00         	movl	0x53cc(%edi,%eax,4), %eax
  442210: 6a 08                        	pushl	$0x8
  442212: 51                           	pushl	%ecx
  442213: 6a 37                        	pushl	$0x37
  442215: 8b c8                        	movl	%eax, %ecx
  442217: e8 44 40 0a 00               	calll	0x4e6260 <.text+0xe5260>
  44221c: 03 d8                        	addl	%eax, %ebx
  44221e: 89 5d fc                     	movl	%ebx, -0x4(%ebp)
  442221: 8b 86 78 02 00 00            	movl	0x278(%esi), %eax
  442227: 5f                           	popl	%edi
  442228: 85 c0                        	testl	%eax, %eax
  44222a: 74 35                        	je	0x442261 <.text+0x41261>
  44222c: 8b 55 08                     	movl	0x8(%ebp), %edx
  44222f: 6a 00                        	pushl	$0x0
  442231: 52                           	pushl	%edx
  442232: 8b ce                        	movl	%esi, %ecx
  442234: e8 77 00 00 00               	calll	0x4422b0 <.text+0x412b0>
  442239: 89 45 0c                     	movl	%eax, 0xc(%ebp)
  44223c: db 45 0c                     	fildl	0xc(%ebp)
  44223f: d9 5d 0c                     	fstps	0xc(%ebp)
  442242: d9 45 0c                     	flds	0xc(%ebp)
  442245: d8 8e 98 04 00 00            	fmuls	0x498(%esi)
  44224b: db 45 fc                     	fildl	-0x4(%ebp)
  44224e: d9 5d 0c                     	fstps	0xc(%ebp)
  442251: d8 45 0c                     	fadds	0xc(%ebp)
  442254: e8 3b 5d 1d 00               	calll	0x617f94 <.text+0x216f94>
  442259: 5e                           	popl	%esi
  44225a: 5b                           	popl	%ebx
  44225b: 8b e5                        	movl	%ebp, %esp
  44225d: 5d                           	popl	%ebp
  44225e: c2 08 00                     	retl	$0x8
  442261: 8b c3                        	movl	%ebx, %eax
  442263: 5e                           	popl	%esi
  442264: 5b                           	popl	%ebx
  442265: 8b e5                        	movl	%ebp, %esp
  442267: 5d                           	popl	%ebp
  442268: c2 08 00                     	retl	$0x8
