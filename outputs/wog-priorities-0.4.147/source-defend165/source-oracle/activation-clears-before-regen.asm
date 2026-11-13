
/Users/sevenone./Documents/git/era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  446b50: 55                           	pushl	%ebp
  446b51: 8b ec                        	movl	%esp, %ebp
  446b53: 6a ff                        	pushl	$-0x1
  446b55: 68 88 88 62 00               	pushl	$0x628888               # imm = 0x628888
  446b5a: 64 a1 00 00 00 00            	movl	%fs:0x0, %eax
  446b60: 50                           	pushl	%eax
  446b61: 64 89 25 00 00 00 00         	movl	%esp, %fs:0x0
  446b68: 83 ec 24                     	subl	$0x24, %esp
  446b6b: 56                           	pushl	%esi
  446b6c: 8b f1                        	movl	%ecx, %esi
  446b6e: 57                           	pushl	%edi
  446b6f: 8a 86 f0 04 00 00            	movb	0x4f0(%esi), %al
  446b75: 84 c0                        	testb	%al, %al
  446b77: 0f 85 a4 02 00 00            	jne	0x446e21 <.text+0x45e21>
  446b7d: 8b 86 84 00 00 00            	movl	0x84(%esi), %eax
  446b83: c6 86 f0 04 00 00 01         	movb	$0x1, 0x4f0(%esi)
  446b8a: 8b c8                        	movl	%eax, %ecx
  446b8c: c1 e9 1b                     	shrl	$0x1b, %ecx
  446b8f: f6 c1 01                     	testb	$0x1, %cl
  446b92: 74 1f                        	je	0x446bb3 <.text+0x45bb3>
  446b94: 8b 96 dc 04 00 00            	movl	0x4dc(%esi), %edx
  446b9a: 8b be cc 00 00 00            	movl	0xcc(%esi), %edi
  446ba0: 2b fa                        	subl	%edx, %edi
  446ba2: 25 ff ff ff f7               	andl	$0xf7ffffff, %eax       # imm = 0xF7FFFFFF
  446ba7: 89 be cc 00 00 00            	movl	%edi, 0xcc(%esi)
  446bad: 89 86 84 00 00 00            	movl	%eax, 0x84(%esi)
  446bb3: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  446bb9: 8a 81 68 3d 01 00            	movb	0x13d68(%ecx), %al
  446bbf: 84 c0                        	testb	%al, %al
  446bc1: 0f 85 5a 02 00 00            	jne	0x446e21 <.text+0x45e21>
  446bc7: 8b 46 58                     	movl	0x58(%esi), %eax
  446bca: 53                           	pushl	%ebx
  446bcb: 85 c0                        	testl	%eax, %eax
  446bcd: 0f 8e 1e 02 00 00            	jle	0x446df1 <.text+0x45df1>
