
ERA_REFERENCE_ROOT/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  446ec0: 89 be 54 04 00 00            	movl	%edi, 0x454(%esi)
  446ec6: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  446ecc: 8a 81 68 3d 01 00            	movb	0x13d68(%ecx), %al
  446ed2: 84 c0                        	testb	%al, %al
  446ed4: 0f 85 69 01 00 00            	jne	0x447043 <.text+0x46043>
  446eda: 8d 9e 98 01 00 00            	leal	0x198(%esi), %ebx
  446ee0: 8b 03                        	movl	(%ebx), %eax
  446ee2: 85 c0                        	testl	%eax, %eax
  446ee4: 7e 17                        	jle	0x446efd <.text+0x45efd>
  446ee6: 83 ff 38                     	cmpl	$0x38, %edi
  446ee9: 74 12                        	je	0x446efd <.text+0x45efd>
  446eeb: 83 f8 01                     	cmpl	$0x1, %eax
  446eee: 75 0a                        	jne	0x446efa <.text+0x45efa>
  446ef0: 57                           	pushl	%edi
  446ef1: 8b ce                        	movl	%esi, %ecx
  446ef3: e8 38 d3 ff ff               	calll	0x444230 <.text+0x43230>
  446ef8: eb 03                        	jmp	0x446efd <.text+0x45efd>
  446efa: 48                           	decl	%eax
  446efb: 89 03                        	movl	%eax, (%ebx)
  446efd: 47                           	incl	%edi
  446efe: 83 c3 04                     	addl	$0x4, %ebx
  446f01: 83 ff 51                     	cmpl	$0x51, %edi
  446f04: 7c da                        	jl	0x446ee0 <.text+0x45ee0>
  446f06: 8b 46 2c                     	movl	0x2c(%esi), %eax
  446f09: 85 c0                        	testl	%eax, %eax
  446f0b: 7e 04                        	jle	0x446f11 <.text+0x45f11>
  446f0d: 48                           	decl	%eax
  446f0e: 89 46 2c                     	movl	%eax, 0x2c(%esi)
  446f11: 8b 86 b4 02 00 00            	movl	0x2b4(%esi), %eax
  446f17: 85 c0                        	testl	%eax, %eax
  446f19: 0f 8e 14 01 00 00            	jle	0x447033 <.text+0x46033>
  446f1f: d9 86 a4 04 00 00            	flds	0x4a4(%esi)
  446f25: d8 25 d0 b8 63 00            	fsubs	0x63b8d0
  446f2b: 8b be c0 00 00 00            	movl	0xc0(%esi), %edi
  446f31: c7 45 f0 00 00 00 00         	movl	$0x0, -0x10(%ebp)
  446f38: c7 45 f4 00 00 e0 3f         	movl	$0x3fe00000, -0xc(%ebp) # imm = 0x3FE00000
  446f3f: dd 5d f8                     	fstpl	-0x8(%ebp)
  446f42: dd 45 f8                     	fldl	-0x8(%ebp)
  446f45: dc 1d 70 ac 63 00            	fcompl	0x63ac70
  446f4b: df e0                        	fnstsw	%ax
  446f4d: f6 c4 01                     	testb	$0x1, %ah
  446f50: 8d 45 f0                     	leal	-0x10(%ebp), %eax
  446f53: 75 03                        	jne	0x446f58 <.text+0x45f58>
  446f55: 8d 45 f8                     	leal	-0x8(%ebp), %eax
  446f58: 8b 10                        	movl	(%eax), %edx
  446f5a: 8b 40 04                     	movl	0x4(%eax), %eax
  446f5d: 89 55 e8                     	movl	%edx, -0x18(%ebp)
  446f60: 89 45 ec                     	movl	%eax, -0x14(%ebp)
  446f63: dd 45 e8                     	fldl	-0x18(%ebp)
  446f66: 8b 86 c4 02 00 00            	movl	0x2c4(%esi), %eax
  446f6c: d9 5d fc                     	fstps	-0x4(%ebp)
  446f6f: 8b 4d fc                     	movl	-0x4(%ebp), %ecx
  446f72: db 46 6c                     	fildl	0x6c(%esi)
  446f75: 85 c0                        	testl	%eax, %eax
  446f77: 89 8e a4 04 00 00            	movl	%ecx, 0x4a4(%esi)
  446f7d: 74 11                        	je	0x446f90 <.text+0x45f90>
  446f7f: d9 5d f4                     	fstps	-0xc(%ebp)
  446f82: d9 45 f4                     	flds	-0xc(%ebp)
  446f85: d8 4d fc                     	fmuls	-0x4(%ebp)
  446f88: d8 0d cc b8 63 00            	fmuls	0x63b8cc
  446f8e: eb 09                        	jmp	0x446f99 <.text+0x45f99>
  446f90: d9 5d f4                     	fstps	-0xc(%ebp)
  446f93: d9 45 f4                     	flds	-0xc(%ebp)
  446f96: d8 4d fc                     	fmuls	-0x4(%ebp)
  446f99: d8 05 c8 b8 63 00            	fadds	0x63b8c8
  446f9f: e8 f0 0f 1d 00               	calll	0x617f94 <.text+0x216f94>
  446fa4: 8b 56 58                     	movl	0x58(%esi), %edx
  446fa7: 8d 48 ff                     	leal	-0x1(%eax), %ecx
  446faa: 89 4d f4                     	movl	%ecx, -0xc(%ebp)
  446fad: 3b ca                        	cmpl	%edx, %ecx
  446faf: 89 86 c0 00 00 00            	movl	%eax, 0xc0(%esi)
  446fb5: 89 55 fc                     	movl	%edx, -0x4(%ebp)
  446fb8: 8d 4d f4                     	leal	-0xc(%ebp), %ecx
  446fbb: 7c 03                        	jl	0x446fc0 <.text+0x45fc0>
  446fbd: 8d 4d fc                     	leal	-0x4(%ebp), %ecx
  446fc0: 8b 11                        	movl	(%ecx), %edx
  446fc2: 2b f8                        	subl	%eax, %edi
  446fc4: 85 ff                        	testl	%edi, %edi
  446fc6: 89 56 58                     	movl	%edx, 0x58(%esi)
  446fc9: 7e 68                        	jle	0x447033 <.text+0x46033>
  446fcb: c6 46 20 01                  	movb	$0x1, 0x20(%esi)
  446fcf: c6 86 e9 00 00 00 01         	movb	$0x1, 0xe9(%esi)
  446fd6: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  446fdc: e8 9f 30 02 00               	calll	0x46a080 <.text+0x69080>
  446fe1: 84 c0                        	testb	%al, %al
  446fe3: 75 20                        	jne	0x447005 <.text+0x46005>
  446fe5: b9 a0 0a 66 00               	movl	$0x660aa0, %ecx         # imm = 0x660AA0
  446fea: e8 81 37 15 00               	calll	0x59a770 <.text+0x199770>
  446fef: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  446ff5: 56                           	pushl	%esi
  446ff6: 6a 47                        	pushl	$0x47
  446ff8: 6a 01                        	pushl	$0x1
  446ffa: 8b d8                        	movl	%eax, %ebx
  446ffc: 8b fa                        	movl	%edx, %edi
  446ffe: e8 5d 1c 16 00               	calll	0x5a8c60 <.text+0x1a7c60>
  447003: eb 06                        	jmp	0x44700b <.text+0x4600b>
  447005: 8b 7d ec                     	movl	-0x14(%ebp), %edi
  447008: 8b 5d e8                     	movl	-0x18(%ebp), %ebx
  44700b: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  447011: 6a 01                        	pushl	$0x1
  447013: 6a 43                        	pushl	$0x43
  447015: e8 56 15 02 00               	calll	0x468570 <.text+0x67570>
  44701a: 8b 0d 20 94 69 00            	movl	0x699420, %ecx
  447020: e8 5b 30 02 00               	calll	0x46a080 <.text+0x69080>
  447025: 84 c0                        	testb	%al, %al
  447027: 75 0a                        	jne	0x447033 <.text+0x46033>
  447029: 57                           	pushl	%edi
  44702a: 83 c9 ff                     	orl	$-0x1, %ecx
  44702d: 53                           	pushl	%ebx
  44702e: e8 8d 37 15 00               	calll	0x59a7c0 <.text+0x1997c0>
  447033: 8b 46 2c                     	movl	0x2c(%esi), %eax
  447036: 85 c0                        	testl	%eax, %eax
  447038: 75 09                        	jne	0x447043 <.text+0x46043>
  44703a: 6a 01                        	pushl	$0x1
  44703c: 8b ce                        	movl	%esi, %ecx
  44703e: e8 fd cd ff ff               	calll	0x443e40 <.text+0x42e40>
  447043: 5f                           	popl	%edi
  447044: 5e                           	popl	%esi
  447045: 5b                           	popl	%ebx
  447046: 8b e5                        	movl	%ebp, %esp
  447048: 5d                           	popl	%ebp
  447049: c3                           	retl
