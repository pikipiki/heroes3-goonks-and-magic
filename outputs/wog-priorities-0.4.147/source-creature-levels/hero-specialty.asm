
/Users/sevenone./Documents/git/era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  4e6260: 55                           	pushl	%ebp
  4e6261: 8b ec                        	movl	%esp, %ebp
  4e6263: 83 ec 08                     	subl	$0x8, %esp
  4e6266: 8b 51 1a                     	movl	0x1a(%ecx), %edx
  4e6269: 56                           	pushl	%esi
  4e626a: 8b 35 80 9c 67 00            	movl	0x679c80, %esi
  4e6270: 33 c0                        	xorl	%eax, %eax
  4e6272: 8d 14 92                     	leal	(%edx,%edx,4), %edx
  4e6275: 8d 14 d6                     	leal	(%esi,%edx,8), %edx
  4e6278: 83 3a 03                     	cmpl	$0x3, (%edx)
  4e627b: 0f 85 b2 00 00 00            	jne	0x4e6333 <.text+0xe5333>
  4e6281: 8b 75 08                     	movl	0x8(%ebp), %esi
  4e6284: 57                           	pushl	%edi
  4e6285: 8b 7a 04                     	movl	0x4(%edx), %edi
  4e6288: 3b fe                        	cmpl	%esi, %edi
  4e628a: 5f                           	popl	%edi
  4e628b: 0f 85 a2 00 00 00            	jne	0x4e6333 <.text+0xe5333>
  4e6291: 8d 46 f3                     	leal	-0xd(%esi), %eax
  4e6294: 83 f8 2a                     	cmpl	$0x2a, %eax
  4e6297: 77 64                        	ja	0x4e62fd <.text+0xe52fd>
  4e6299: 33 d2                        	xorl	%edx, %edx
  4e629b: 8a 90 58 63 4e 00            	movb	0x4e6358(%eax), %dl
  4e62a1: ff 24 95 3c 63 4e 00         	jmpl	*0x4e633c(,%edx,4)
  4e62a8: 8b 45 0c                     	movl	0xc(%ebp), %eax
  4e62ab: 5e                           	popl	%esi
  4e62ac: 8b 04 85 a8 ea 63 00         	movl	0x63eaa8(,%eax,4), %eax
  4e62b3: 8b e5                        	movl	%ebp, %esp
  4e62b5: 5d                           	popl	%ebp
  4e62b6: c2 0c 00                     	retl	$0xc
  4e62b9: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  4e62bc: 5e                           	popl	%esi
  4e62bd: 8b 04 8d c4 ea 63 00         	movl	0x63eac4(,%ecx,4), %eax
  4e62c4: 8b e5                        	movl	%ebp, %esp
  4e62c6: 5d                           	popl	%ebp
  4e62c7: c2 0c 00                     	retl	$0xc
  4e62ca: 8b 4d 10                     	movl	0x10(%ebp), %ecx
  4e62cd: b8 03 00 00 00               	movl	$0x3, %eax
  4e62d2: 2b c1                        	subl	%ecx, %eax
  4e62d4: 5e                           	popl	%esi
  4e62d5: 8b e5                        	movl	%ebp, %esp
  4e62d7: 5d                           	popl	%ebp
  4e62d8: c2 0c 00                     	retl	$0xc
  4e62db: 8b 45 10                     	movl	0x10(%ebp), %eax
  4e62de: 5e                           	popl	%esi
  4e62df: 8b e5                        	movl	%ebp, %esp
  4e62e1: 5d                           	popl	%ebp
  4e62e2: c2 0c 00                     	retl	$0xc
  4e62e5: b8 02 00 00 00               	movl	$0x2, %eax
  4e62ea: 5e                           	popl	%esi
  4e62eb: 8b e5                        	movl	%ebp, %esp
  4e62ed: 5d                           	popl	%ebp
  4e62ee: c2 0c 00                     	retl	$0xc
  4e62f1: 8b 45 10                     	movl	0x10(%ebp), %eax
  4e62f4: 5e                           	popl	%esi
  4e62f5: d1 f8                        	sarl	%eax
  4e62f7: 8b e5                        	movl	%ebp, %esp
  4e62f9: 5d                           	popl	%ebp
  4e62fa: c2 0c 00                     	retl	$0xc
  4e62fd: 0f bf 41 55                  	movswl	0x55(%ecx), %eax
  4e6301: 8b 55 0c                     	movl	0xc(%ebp), %edx
  4e6304: 83 ec 08                     	subl	$0x8, %esp
  4e6307: 8d 4a 01                     	leal	0x1(%edx), %ecx
  4e630a: 99                           	cltd
  4e630b: f7 f9                        	idivl	%ecx
  4e630d: 0f af 45 10                  	imull	0x10(%ebp), %eax
  4e6311: 89 45 10                     	movl	%eax, 0x10(%ebp)
  4e6314: db 45 10                     	fildl	0x10(%ebp)
  4e6317: dd 5d f8                     	fstpl	-0x8(%ebp)
  4e631a: dd 45 f8                     	fldl	-0x8(%ebp)
  4e631d: dc 0d 08 ac 63 00            	fmull	0x63ac08
  4e6323: dd 1c 24                     	fstpl	(%esp)
  4e6326: e8 6c 2f 13 00               	calll	0x619297 <.text+0x218297>
  4e632b: 83 c4 08                     	addl	$0x8, %esp
  4e632e: e8 61 1c 13 00               	calll	0x617f94 <.text+0x216f94>
  4e6333: 5e                           	popl	%esi
  4e6334: 8b e5                        	movl	%ebp, %esp
  4e6336: 5d                           	popl	%ebp
  4e6337: c2 0c 00                     	retl	$0xc
  4e633a: 8b ff                        	movl	%edi, %edi
  4e633c: db 62 4e                     	<unknown>
  4e633f: 00 f1                        	addb	%dh, %cl
  4e6341: 62 4e 00                     	bound	%ecx, (%esi)
  4e6344: a8 62                        	testb	$0x62, %al
  4e6346: 4e                           	decl	%esi
  4e6347: 00 e5                        	addb	%ah, %ch
  4e6349: 62 4e 00                     	bound	%ecx, (%esi)
  4e634c: ca 62 4e                     	lretl	$0x4e62                 # imm = 0x4E62
  4e634f: 00 b9 62 4e 00 fd            	addb	%bh, -0x2ffb19e(%ecx)
  4e6355: 62 4e 00                     	bound	%ecx, (%esi)
  4e6358: 00 06                        	addb	%al, (%esi)
  4e635a: 01 06                        	addl	%eax, (%esi)
  4e635c: 06                           	pushl	%es
  4e635d: 06                           	pushl	%es
  4e635e: 06                           	pushl	%es
  4e635f: 06                           	pushl	%es
  4e6360: 06                           	pushl	%es
  4e6361: 06                           	pushl	%es
  4e6362: 06                           	pushl	%es
  4e6363: 06                           	pushl	%es
  4e6364: 06                           	pushl	%es
  4e6365: 06                           	pushl	%es
  4e6366: 06                           	pushl	%es
  4e6367: 06                           	pushl	%es
  4e6368: 06                           	pushl	%es
  4e6369: 06                           	pushl	%es
  4e636a: 06                           	pushl	%es
  4e636b: 06                           	pushl	%es
  4e636c: 06                           	pushl	%es
  4e636d: 06                           	pushl	%es
  4e636e: 06                           	pushl	%es
  4e636f: 06                           	pushl	%es
  4e6370: 06                           	pushl	%es
  4e6371: 06                           	pushl	%es
  4e6372: 06                           	pushl	%es
  4e6373: 06                           	pushl	%es
  4e6374: 06                           	pushl	%es
  4e6375: 06                           	pushl	%es
  4e6376: 02 02                        	addb	(%edx), %al
