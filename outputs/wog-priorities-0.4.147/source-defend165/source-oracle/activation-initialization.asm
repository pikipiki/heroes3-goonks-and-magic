
/Users/sevenone./Documents/git/era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  4788a7: 8b 8e b8 32 01 00            	movl	0x132b8(%esi), %ecx
  4788ad: 8b 9e bc 32 01 00            	movl	0x132bc(%esi), %ebx
  4788b3: 33 ff                        	xorl	%edi, %edi
  4788b5: 8d 04 cd 00 00 00 00         	leal	(,%ecx,8), %eax
  4788bc: 89 7d e0                     	movl	%edi, -0x20(%ebp)
  4788bf: 2b c1                        	subl	%ecx, %eax
  4788c1: 8d 04 40                     	leal	(%eax,%eax,2), %eax
  4788c4: 03 c3                        	addl	%ebx, %eax
  4788c6: 8d 0c c5 00 00 00 00         	leal	(,%eax,8), %ecx
  4788cd: 2b c8                        	subl	%eax, %ecx
  4788cf: 8d 0c 49                     	leal	(%ecx,%ecx,2), %ecx
  4788d2: 8d 14 c8                     	leal	(%eax,%ecx,8), %edx
  4788d5: 8b 45 08                     	movl	0x8(%ebp), %eax
  4788d8: 50                           	pushl	%eax
  4788d9: 8b ce                        	movl	%esi, %ecx
  4788db: 8d 9c d6 cc 54 00 00         	leal	0x54cc(%esi,%edx,8), %ebx
  4788e2: e8 39 d3 ff ff               	calll	0x475c20 <.text+0x74c20>
