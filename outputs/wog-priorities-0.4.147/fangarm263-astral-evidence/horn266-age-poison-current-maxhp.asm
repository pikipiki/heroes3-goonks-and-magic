
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00401000 <.text>:
  444c3e: d9 86 a4 04 00 00            	flds	0x4a4(%esi)
  444c44: d8 25 d0 b8 63 00            	fsubs	0x63b8d0
  444c4a: c7 45 f8 00 00 00 00         	movl	$0x0, -0x8(%ebp)
  444c51: c7 45 fc 00 00 e0 3f         	movl	$0x3fe00000, -0x4(%ebp) # imm = 0x3FE00000
  444c58: dd 5d f0                     	fstpl	-0x10(%ebp)
  444c5b: dd 45 f0                     	fldl	-0x10(%ebp)
  444c5e: dc 1d 70 ac 63 00            	fcompl	0x63ac70
  444c64: df e0                        	fnstsw	%ax
  444c66: f6 c4 01                     	testb	$0x1, %ah
  444c69: 8d 45 f8                     	leal	-0x8(%ebp), %eax
  444c6c: 75 03                        	jne	0x444c71 <.text+0x43c71>
  444c6e: 8d 45 f0                     	leal	-0x10(%ebp), %eax
  444c71: 8b 08                        	movl	(%eax), %ecx
  444c73: 8b 50 04                     	movl	0x4(%eax), %edx
  444c76: 89 4d e8                     	movl	%ecx, -0x18(%ebp)
  444c79: 89 55 ec                     	movl	%edx, -0x14(%ebp)
  444c7c: dd 45 e8                     	fldl	-0x18(%ebp)
  444c7f: d9 5d 14                     	fstps	0x14(%ebp)
  444c82: 8b 45 14                     	movl	0x14(%ebp), %eax
  444c85: db 46 6c                     	fildl	0x6c(%esi)
  444c88: 89 86 a4 04 00 00            	movl	%eax, 0x4a4(%esi)
  444c8e: 8b 86 c4 02 00 00            	movl	0x2c4(%esi), %eax
  444c94: 85 c0                        	testl	%eax, %eax
  444c96: 74 11                        	je	0x444ca9 <.text+0x43ca9>
  444c98: d9 5d 10                     	fstps	0x10(%ebp)
  444c9b: d9 45 10                     	flds	0x10(%ebp)
  444c9e: d8 4d 14                     	fmuls	0x14(%ebp)
  444ca1: d8 0d cc b8 63 00            	fmuls	0x63b8cc
  444ca7: eb 09                        	jmp	0x444cb2 <.text+0x43cb2>
  444ca9: d9 5d 10                     	fstps	0x10(%ebp)
  444cac: d9 45 10                     	flds	0x10(%ebp)
  444caf: d8 4d 14                     	fmuls	0x14(%ebp)
  444cb2: d8 05 c8 b8 63 00            	fadds	0x63b8c8
  444cb8: e8 d7 32 1d 00               	calll	0x617f94 <.text+0x216f94>
  444cbd: 8b 4e 58                     	movl	0x58(%esi), %ecx
  444cc0: 89 86 c0 00 00 00            	movl	%eax, 0xc0(%esi)
  444cc6: 48                           	decl	%eax
  444cc7: 89 4d 10                     	movl	%ecx, 0x10(%ebp)
  444cca: 89 45 14                     	movl	%eax, 0x14(%ebp)
  444ccd: 3b c1                        	cmpl	%ecx, %eax
  444ccf: 8d 45 14                     	leal	0x14(%ebp), %eax
  444cd2: 7c 03                        	jl	0x444cd7 <.text+0x43cd7>
  444cd4: 8d 45 10                     	leal	0x10(%ebp), %eax
  444cd7: 8b 08                        	movl	(%eax), %ecx
  444cd9: 89 4e 58                     	movl	%ecx, 0x58(%esi)
  444cdc: eb 7e                        	jmp	0x444d5c <.text+0x43d5c>
  444cde: 8b 86 c4 02 00 00            	movl	0x2c4(%esi), %eax
  444ce4: db 46 6c                     	fildl	0x6c(%esi)
  444ce7: 85 c0                        	testl	%eax, %eax
  444ce9: 74 14                        	je	0x444cff <.text+0x43cff>
  444ceb: d9 5d 14                     	fstps	0x14(%ebp)
  444cee: d9 45 14                     	flds	0x14(%ebp)
  444cf1: d8 8e a4 04 00 00            	fmuls	0x4a4(%esi)
  444cf7: d8 0d cc b8 63 00            	fmuls	0x63b8cc
  444cfd: eb 0c                        	jmp	0x444d0b <.text+0x43d0b>
  444cff: d9 5d 14                     	fstps	0x14(%ebp)
  444d02: d9 45 14                     	flds	0x14(%ebp)
  444d05: d8 8e a4 04 00 00            	fmuls	0x4a4(%esi)
  444d0b: d8 05 c8 b8 63 00            	fadds	0x63b8c8
  444d11: e8 7e 32 1d 00               	calll	0x617f94 <.text+0x216f94>
  444d16: 8b c8                        	movl	%eax, %ecx
  444d18: 89 86 c0 00 00 00            	movl	%eax, 0xc0(%esi)
  444d1e: 8b 46 58                     	movl	0x58(%esi), %eax
  444d21: 49                           	decl	%ecx
  444d22: 89 45 10                     	movl	%eax, 0x10(%ebp)
  444d25: 3b c8                        	cmpl	%eax, %ecx
  444d27: 89 4d 14                     	movl	%ecx, 0x14(%ebp)
  444d2a: 8d 45 14                     	leal	0x14(%ebp), %eax
  444d2d: 7c 03                        	jl	0x444d32 <.text+0x43d32>
  444d2f: 8d 45 10                     	leal	0x10(%ebp), %eax
  444d32: 8b 00                        	movl	(%eax), %eax
  444d34: 89 4d 14                     	movl	%ecx, 0x14(%ebp)
  444d37: 89 46 58                     	movl	%eax, 0x58(%esi)
