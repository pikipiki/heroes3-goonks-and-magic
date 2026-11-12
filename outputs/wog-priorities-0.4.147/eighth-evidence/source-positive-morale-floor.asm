
ERA_REFERENCE_ROOT/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  44aef1: 8b 45 08                     	movl	0x8(%ebp), %eax
  44aef4: 8b 3c 87                     	movl	(%edi,%eax,4), %edi
  44aef7: 83 ff 4e                     	cmpl	$0x4e, %edi
  44aefa: 74 05                        	je	0x44af01 <.text+0x49f01>
  44aefc: 83 ff 4f                     	cmpl	$0x4f, %edi
  44aeff: 75 0a                        	jne	0x44af0b <.text+0x49f0b>
  44af01: 83 fe 01                     	cmpl	$0x1, %esi
  44af04: 7d 05                        	jge	0x44af0b <.text+0x49f0b>
  44af06: be 01 00 00 00               	movl	$0x1, %esi
  44af0b: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  44af0e: 85 c9                        	testl	%ecx, %ecx
  44af10: 74 11                        	je	0x44af23 <.text+0x49f23>
  44af12: 6a 54                        	pushl	$0x54
  44af14: e8 47 e5 08 00               	calll	0x4d9460 <.text+0xd8460>
  44af19: 84 c0                        	testb	%al, %al
  44af1b: 74 06                        	je	0x44af23 <.text+0x49f23>
  44af1d: 85 f6                        	testl	%esi, %esi
  44af1f: 7e 02                        	jle	0x44af23 <.text+0x49f23>
  44af21: 33 f6                        	xorl	%esi, %esi
  44af23: 8a 45 1c                     	movb	0x1c(%ebp), %al
  44af26: 84 c0                        	testb	%al, %al
