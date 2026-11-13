
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  620604: 55                           	pushl	%ebp
  620605: 8b ec                        	movl	%esp, %ebp
  620607: 51                           	pushl	%ecx
  620608: 9b                           	wait
  620609: d9 7d fc                     	fnstcw	-0x4(%ebp)
  62060c: 8b 45 0c                     	movl	0xc(%ebp), %eax
  62060f: 8b c8                        	movl	%eax, %ecx
  620611: 23 45 08                     	andl	0x8(%ebp), %eax
  620614: f7 d1                        	notl	%ecx
  620616: 23 4d fc                     	andl	-0x4(%ebp), %ecx
  620619: 0b c8                        	orl	%eax, %ecx
  62061b: 89 4d 0c                     	movl	%ecx, 0xc(%ebp)
  62061e: d9 6d 0c                     	fldcw	0xc(%ebp)
  620621: 0f bf 45 fc                  	movswl	-0x4(%ebp), %eax
  620625: c9                           	leave
  620626: c3                           	retl
  620627: 55                           	pushl	%ebp
  620628: 8b ec                        	movl	%esp, %ebp
  62062a: 51                           	pushl	%ecx
  62062b: 51                           	pushl	%ecx
  62062c: 8a 4d 08                     	movb	0x8(%ebp), %cl
  62062f: f6 c1 01                     	testb	$0x1, %cl
  620632: 74 0a                        	je	0x62063e <.text+0x21f63e>
  620634: db 2d d0 03 69 00            	fldt	0x6903d0
  62063a: db 5d 08                     	fistpl	0x8(%ebp)
  62063d: 9b                           	wait
  62063e: f6 c1 08                     	testb	$0x8, %cl
  620641: 74 10                        	je	0x620653 <.text+0x21f653>
  620643: 9b                           	wait
  620644: df e0                        	fnstsw	%ax
  620646: db 2d d0 03 69 00            	fldt	0x6903d0
  62064c: dd 5d f8                     	fstpl	-0x8(%ebp)
  62064f: 9b                           	wait
  620650: 9b                           	wait
  620651: df e0                        	fnstsw	%ax
  620653: f6 c1 10                     	testb	$0x10, %cl
  620656: 74 0a                        	je	0x620662 <.text+0x21f662>
  620658: db 2d dc 03 69 00            	fldt	0x6903dc
  62065e: dd 5d f8                     	fstpl	-0x8(%ebp)
  620661: 9b                           	wait
  620662: f6 c1 04                     	testb	$0x4, %cl
  620665: 74 09                        	je	0x620670 <.text+0x21f670>
  620667: d9 ee                        	fldz
  620669: d9 e8                        	fld1
  62066b: de f1                        	fdivp	%st, %st(1)
  62066d: dd d8                        	fstp	%st(0)
  62066f: 9b                           	wait
  620670: f6 c1 20                     	testb	$0x20, %cl
  620673: 74 06                        	je	0x62067b <.text+0x21f67b>
  620675: d9 eb                        	fldpi
  620677: dd 5d f8                     	fstpl	-0x8(%ebp)
  62067a: 9b                           	wait
  62067b: c9                           	leave
  62067c: c3                           	retl
  62067d: 55                           	pushl	%ebp
  62067e: 8b ec                        	movl	%esp, %ebp
  620680: 83 ec 24                     	subl	$0x24, %esp
  620683: 53                           	pushl	%ebx
  620684: 8b 5d 08                     	movl	0x8(%ebp), %ebx
  620687: 81 eb 6c 07 00 00            	subl	$0x76c, %ebx            # imm = 0x76C
  62068d: 83 fb 46                     	cmpl	$0x46, %ebx
  620690: 0f 8c a3 00 00 00            	jl	0x620739 <.text+0x21f739>
