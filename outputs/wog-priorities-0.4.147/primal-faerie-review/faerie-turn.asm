
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  4650ce: 43                           	incl	%ebx
  4650cf: 34 83                        	xorb	$-0x7d, %al
  4650d1: e8 3d 74 53 83               	calll	0x8399c513
  4650d6: e8 49 74 42 83               	calll	0x8388c524
  4650db: e8 02 0f 85 ff               	calll	0xffcb5fe2
  4650e0: 02 00                        	addb	(%eax), %al
  4650e2: 00 8b 8e c0 32 01            	addb	%cl, 0x132c08e(%ebx)
  4650e8: 00 83 bc 8e a0 32            	addb	%al, 0x32a08ebc(%ebx)
  4650ee: 01 00                        	addl	%eax, (%eax)
  4650f0: 02 0f                        	addb	(%edi), %cl
  4650f2: 8e eb                        	movl	%ebx, %gs
  4650f4: 02 00                        	addb	(%eax), %al
  4650f6: 00 8b cb e8 02 2c            	addb	%cl, 0x2c02e8cb(%ebx)
  4650fc: fe ff                        	<unknown>
  4650fe: 84 c0                        	testb	%al, %al
  465100: 0f 84 dc 02 00 00            	je	0x4653e2 <.text+0x643e2>
  465106: 8b 96 c0 32 01 00            	movl	0x132c0(%esi), %edx
  46510c: c7 84 96 a0 32 01 00 00 00 00 00     	movl	$0x0, 0x132a0(%esi,%edx,4)
  465117: e9 c6 02 00 00               	jmp	0x4653e2 <.text+0x643e2>
  46511c: 8b cb                        	movl	%ebx, %ecx
  46511e: e8 0d 21 fe ff               	calll	0x447230 <.text+0x46230>
  465123: e9 ba 02 00 00               	jmp	0x4653e2 <.text+0x643e2>
