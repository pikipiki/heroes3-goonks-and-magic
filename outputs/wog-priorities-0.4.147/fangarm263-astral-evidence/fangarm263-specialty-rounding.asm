
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  619297: 55                           	pushl	%ebp
  619298: 8b ec                        	movl	%esp, %ebp
  61929a: 51                           	pushl	%ecx
  61929b: 51                           	pushl	%ecx
  61929c: 53                           	pushl	%ebx
  61929d: 56                           	pushl	%esi
  61929e: be ff ff 00 00               	movl	$0xffff, %esi           # imm = 0xFFFF
  6192a3: 56                           	pushl	%esi
  6192a4: ff 35 f0 f7 68 00            	pushl	0x68f7f0
  6192aa: e8 55 73 00 00               	calll	0x620604 <.text+0x21f604>
  6192af: dd 45 08                     	fldl	0x8(%ebp)
  6192b2: 59                           	popl	%ecx
  6192b3: 8b d8                        	movl	%eax, %ebx
  6192b5: 8b 45 0e                     	movl	0xe(%ebp), %eax
  6192b8: 59                           	popl	%ecx
  6192b9: 51                           	pushl	%ecx
  6192ba: 66 25 f0 7f                  	andw	$0x7ff0, %ax            # imm = 0x7FF0
  6192be: 51                           	pushl	%ecx
  6192bf: 66 3d f0 7f                  	cmpw	$0x7ff0, %ax            # imm = 0x7FF0
  6192c3: dd 1c 24                     	fstpl	(%esp)
  6192c6: 75 55                        	jne	0x61931d <.text+0x21831d>
  6192c8: e8 ff 71 00 00               	calll	0x6204cc <.text+0x21f4cc>
  6192cd: 59                           	popl	%ecx
  6192ce: 85 c0                        	testl	%eax, %eax
