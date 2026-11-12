
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  440fd0: 74 1d                        	je	0x440fef <.text+0x3ffef>
  440fd2: 8d 48 ff                     	leal	-0x1(%eax), %ecx
  440fd5: 8a 40 ff                     	movb	-0x1(%eax), %al
  440fd8: 84 c0                        	testb	%al, %al
  440fda: 74 0a                        	je	0x440fe6 <.text+0x3ffe6>
  440fdc: 3c ff                        	cmpb	$-0x1, %al
  440fde: 74 06                        	je	0x440fe6 <.text+0x3ffe6>
  440fe0: fe c8                        	decb	%al
  440fe2: 88 01                        	movb	%al, (%ecx)
  440fe4: eb 09                        	jmp	0x440fef <.text+0x3ffef>
  440fe6: 51                           	pushl	%ecx
  440fe7: e8 04 a1 1c 00               	calll	0x60b0f0 <.text+0x20a0f0>
  440fec: 83 c4 04                     	addl	$0x4, %esp
  440fef: 8b 45 e8                     	movl	-0x18(%ebp), %eax
  440ff2: 89 75 c4                     	movl	%esi, -0x3c(%ebp)
  440ff5: 3b c6                        	cmpl	%esi, %eax
  440ff7: 89 75 c8                     	movl	%esi, -0x38(%ebp)
  440ffa: 89 75 cc                     	movl	%esi, -0x34(%ebp)
  440ffd: 75 05                        	jne	0x441004 <.text+0x40004>
  440fff: b8 08 a6 63 00               	movl	$0x63a608, %eax         # imm = 0x63A608
  441004: 8b 15 20 94 69 00            	movl	0x699420, %edx
  44100a: 6a 00                        	pushl	$0x0
  44100c: 6a 01                        	pushl	$0x1
  44100e: 50                           	pushl	%eax
  44100f: 8b 8a fc 32 01 00            	movl	0x132fc(%edx), %ecx
  441015: e8 b6 19 03 00               	calll	0x4729d0 <.text+0x719d0>
  44101a: b9 30 0a 66 00               	movl	$0x660a30, %ecx         # imm = 0x660A30
  44101f: e8 4c 97 15 00               	calll	0x59a770 <.text+0x199770>
  441024: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  44102a: 6a 00                        	pushl	$0x0
  44102c: 6a 0a                        	pushl	$0xa
  44102e: 57                           	pushl	%edi
  44102f: 6a 01                        	pushl	$0x1
  441031: 8b d8                        	movl	%eax, %ebx
  441033: 8b f2                        	movl	%edx, %esi
  441035: e8 86 53 05 00               	calll	0x4963c0 <.text+0x953c0>
  44103a: eb 06                        	jmp	0x441042 <.text+0x40042>
  44103c: 8b 75 f0                     	movl	-0x10(%ebp), %esi
  44103f: 8b 5d ec                     	movl	-0x14(%ebp), %ebx
  441042: 8b 45 08                     	movl	0x8(%ebp), %eax
  441045: 8b cf                        	movl	%edi, %ecx
  441047: 50                           	pushl	%eax
  441048: e8 63 2d 00 00               	calll	0x443db0 <.text+0x42db0>
  44104d: 8b 15 a8 7f 68 00            	movl	0x687fa8, %edx
  441053: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  441056: 50                           	pushl	%eax
  441057: 57                           	pushl	%edi
  441058: 8b 82 18 09 00 00            	movl	0x918(%edx), %eax
  44105e: 51                           	pushl	%ecx
  44105f: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  441065: 6a 01                        	pushl	$0x1
  441067: 50                           	pushl	%eax
  441068: e8 03 86 02 00               	calll	0x469670 <.text+0x68670>
  44106d: c6 47 20 01                  	movb	$0x1, 0x20(%edi)
  441071: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
