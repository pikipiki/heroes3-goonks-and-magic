
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  441ade: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  441ae1: 51                           	pushl	%ecx
  441ae2: 56                           	pushl	%esi
  441ae3: 8b cf                        	movl	%edi, %ecx
  441ae5: e8 46 f8 ff ff               	calll	0x441330 <.text+0x40330>
  441aea: c7 87 90 04 00 00 00 00 00 00	movl	$0x0, 0x490(%edi)
  441af4: 8b 4e 4c                     	movl	0x4c(%esi), %ecx
  441af7: 85 c9                        	testl	%ecx, %ecx
  441af9: 0f 8e 86 00 00 00            	jle	0x441b85 <.text+0x40b85>
  441aff: 8b 97 84 00 00 00            	movl	0x84(%edi), %edx
  441b05: c1 ea 10                     	shrl	$0x10, %edx
  441b08: f6 c2 01                     	testb	$0x1, %dl
  441b0b: 75 78                        	jne	0x441b85 <.text+0x40b85>
  441b0d: 8b 8e b0 02 00 00            	movl	0x2b0(%esi), %ecx
  441b13: 85 c9                        	testl	%ecx, %ecx
  441b15: 75 6e                        	jne	0x441b85 <.text+0x40b85>
  441b17: 8b 8e 54 04 00 00            	movl	0x454(%esi), %ecx
  441b1d: 85 c9                        	testl	%ecx, %ecx
  441b1f: 7e 64                        	jle	0x441b85 <.text+0x40b85>
  441b21: 84 c0                        	testb	%al, %al
  441b23: 75 60                        	jne	0x441b85 <.text+0x40b85>
  441b25: a1 3c 88 69 00               	movl	0x69883c, %eax
  441b2a: d9 04 85 7c cf 63 00         	flds	0x63cf7c(,%eax,4)
  441b31: d8 0d a8 b8 63 00            	fmuls	0x63b8a8
  441b37: e8 58 64 1d 00               	calll	0x617f94 <.text+0x216f94>
  441b3c: 8b c8                        	movl	%eax, %ecx
  441b3e: e8 0d 6f 0b 00               	calll	0x4f8a50 <.text+0xf7a50>
  441b43: a1 20 94 69 00               	movl	0x699420, %eax
  441b48: b9 01 00 00 00               	movl	$0x1, %ecx
  441b4d: 53                           	pushl	%ebx
  441b4e: 57                           	pushl	%edi
  441b4f: 2b 88 c0 32 01 00            	subl	0x132c0(%eax), %ecx
  441b55: 89 88 c0 32 01 00            	movl	%ecx, 0x132c0(%eax)
  441b5b: 8b ce                        	movl	%esi, %ecx
  441b5d: e8 ce f7 ff ff               	calll	0x441330 <.text+0x40330>
  441b62: a1 20 94 69 00               	movl	0x699420, %eax
  441b67: ba 01 00 00 00               	movl	$0x1, %edx
  441b6c: 2b 90 c0 32 01 00            	subl	0x132c0(%eax), %edx
  441b72: 89 90 c0 32 01 00            	movl	%edx, 0x132c0(%eax)
  441b78: 8b 86 54 04 00 00            	movl	0x454(%esi), %eax
  441b7e: 48                           	decl	%eax
  441b7f: 89 86 54 04 00 00            	movl	%eax, 0x454(%esi)
