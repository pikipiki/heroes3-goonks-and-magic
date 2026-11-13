
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  620d85: 55                           	pushl	%ebp
  620d86: 8b ec                        	movl	%esp, %ebp
  620d88: 51                           	pushl	%ecx
  620d89: 51                           	pushl	%ecx
  620d8a: dd 45 08                     	fldl	0x8(%ebp)
  620d8d: d9 fc                        	frndint
  620d8f: dd 5d f8                     	fstpl	-0x8(%ebp)
  620d92: dd 45 f8                     	fldl	-0x8(%ebp)
  620d95: c9                           	leave
  620d96: c3                           	retl
  620d97: 55                           	pushl	%ebp
  620d98: 8b ec                        	movl	%esp, %ebp
  620d9a: 83 ec 18                     	subl	$0x18, %esp
  620d9d: 53                           	pushl	%ebx
  620d9e: 56                           	pushl	%esi
  620d9f: 33 f6                        	xorl	%esi, %esi
  620da1: 57                           	pushl	%edi
  620da2: 56                           	pushl	%esi
  620da3: 56                           	pushl	%esi
  620da4: 56                           	pushl	%esi
  620da5: 56                           	pushl	%esi
  620da6: ff 75 0c                     	pushl	0xc(%ebp)
  620da9: 8d 45 fc                     	leal	-0x4(%ebp), %eax
  620dac: 33 ff                        	xorl	%edi, %edi
  620dae: 50                           	pushl	%eax
  620daf: 8d 45 e8                     	leal	-0x18(%ebp), %eax
  620db2: 50                           	pushl	%eax
  620db3: e8 47 4b 00 00               	calll	0x6258ff <.text+0x2248ff>
  620db8: 8b d8                        	movl	%eax, %ebx
  620dba: 83 c4 1c                     	addl	$0x1c, %esp
  620dbd: f6 c3 04                     	testb	$0x4, %bl
  620dc0: 74 0d                        	je	0x620dcf <.text+0x21fdcf>
  620dc2: bf 00 02 00 00               	movl	$0x200, %edi            # imm = 0x200
  620dc7: 89 75 f4                     	movl	%esi, -0xc(%ebp)
  620dca: 89 75 f8                     	movl	%esi, -0x8(%ebp)
  620dcd: eb 2e                        	jmp	0x620dfd <.text+0x21fdfd>
  620dcf: 8d 45 f4                     	leal	-0xc(%ebp), %eax
  620dd2: 50                           	pushl	%eax
  620dd3: 8d 45 e8                     	leal	-0x18(%ebp), %eax
  620dd6: 50                           	pushl	%eax
  620dd7: e8 45 47 00 00               	calll	0x625521 <.text+0x224521>
  620ddc: 59                           	popl	%ecx
