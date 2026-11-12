
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  76beea: 55                           	pushl	%ebp
  76beeb: 8b ec                        	movl	%esp, %ebp
  76beed: 83 ec 10                     	subl	$0x10, %esp
  76bef0: 53                           	pushl	%ebx
  76bef1: 56                           	pushl	%esi
  76bef2: 57                           	pushl	%edi
  76bef3: 90                           	nop
  76bef4: 90                           	nop
  76bef5: 90                           	nop
  76bef6: 90                           	nop
  76bef7: 90                           	nop
  76bef8: 90                           	nop
  76bef9: 90                           	nop
  76befa: 90                           	nop
  76befb: 90                           	nop
  76befc: 90                           	nop
  76befd: 90                           	nop
  76befe: 90                           	nop
  76beff: 90                           	nop
  76bf00: 90                           	nop
  76bf01: 90                           	nop
  76bf02: 90                           	nop
  76bf03: 90                           	nop
  76bf04: 90                           	nop
  76bf05: 90                           	nop
  76bf06: 8b 45 08                     	movl	0x8(%ebp), %eax
  76bf09: 8b 48 34                     	movl	0x34(%eax), %ecx
  76bf0c: 89 4d fc                     	movl	%ecx, -0x4(%ebp)
  76bf0f: c7 45 f4 00 00 00 00         	movl	$0x0, -0xc(%ebp)
  76bf16: 81 7d fc b6 00 00 00         	cmpl	$0xb6, -0x4(%ebp)
  76bf1d: 7e 07                        	jle	0x76bf26 <.text+0x6af26>
  76bf1f: c7 45 f4 01 00 00 00         	movl	$0x1, -0xc(%ebp)
  76bf26: 8b 55 f4                     	movl	-0xc(%ebp), %edx
  76bf29: 8b 45 08                     	movl	0x8(%ebp), %eax
  76bf2c: 3b 04 95 24 08 86 02         	cmpl	0x2860824(,%edx,4), %eax
  76bf33: 74 1b                        	je	0x76bf50 <.text+0x6af50>
  76bf35: 6a 04                        	pushl	$0x4
  76bf37: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
  76bf3a: 69 c9 28 01 00 00            	imull	$0x128, %ecx, %ecx      # imm = 0x128
  76bf40: 81 c1 70 1e 86 02            	addl	$0x2861e70, %ecx        # imm = 0x2861E70
  76bf46: e8 15 d5 ff ff               	calll	0x769460 <.text+0x68460>
  76bf4b: 89 45 f8                     	movl	%eax, -0x8(%ebp)
  76bf4e: eb 54                        	jmp	0x76bfa4 <.text+0x6afa4>
  76bf50: 8b 4d f4                     	movl	-0xc(%ebp), %ecx
  76bf53: 8b 14 8d c0 04 86 02         	movl	0x28604c0(,%ecx,4), %edx
  76bf5a: 89 55 f0                     	movl	%edx, -0x10(%ebp)
  76bf5d: 6a 04                        	pushl	$0x4
  76bf5f: 8b 4d f0                     	movl	-0x10(%ebp), %ecx
  76bf62: 69 c9 28 01 00 00            	imull	$0x128, %ecx, %ecx      # imm = 0x128
  76bf68: 81 c1 c0 20 86 02            	addl	$0x28620c0, %ecx        # imm = 0x28620C0
  76bf6e: e8 ed d4 ff ff               	calll	0x769460 <.text+0x68460>
  76bf73: 89 45 f8                     	movl	%eax, -0x8(%ebp)
  76bf76: 81 7d fc b2 00 00 00         	cmpl	$0xb2, -0x4(%ebp)
  76bf7d: 74 09                        	je	0x76bf88 <.text+0x6af88>
  76bf7f: 81 7d fc bb 00 00 00         	cmpl	$0xbb, -0x4(%ebp)
  76bf86: 75 1c                        	jne	0x76bfa4 <.text+0x6afa4>
  76bf88: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  76bf8b: 99                           	cltd
  76bf8c: 83 e2 03                     	andl	$0x3, %edx
  76bf8f: 03 c2                        	addl	%edx, %eax
  76bf91: c1 f8 02                     	sarl	$0x2, %eax
  76bf94: 89 45 f8                     	movl	%eax, -0x8(%ebp)
  76bf97: 83 7d f8 01                  	cmpl	$0x1, -0x8(%ebp)
  76bf9b: 7d 07                        	jge	0x76bfa4 <.text+0x6afa4>
  76bf9d: c7 45 f8 01 00 00 00         	movl	$0x1, -0x8(%ebp)
  76bfa4: 90                           	nop
  76bfa5: 90                           	nop
  76bfa6: 90                           	nop
  76bfa7: 90                           	nop
  76bfa8: 90                           	nop
  76bfa9: 8b 45 f8                     	movl	-0x8(%ebp), %eax
  76bfac: 5f                           	popl	%edi
  76bfad: 5e                           	popl	%esi
  76bfae: 5b                           	popl	%ebx
  76bfaf: 8b e5                        	movl	%ebp, %esp
  76bfb1: 5d                           	popl	%ebp
  76bfb2: c3                           	retl
