
../era-project-eng/h3era.exe:	file format coff-i386

Disassembly of section .text:

00701000 <.text>:
  71df45: c7 45 b4 00 00 00 00         	movl	$0x0, -0x4c(%ebp)
  71df4c: 8b 45 0c                     	movl	0xc(%ebp), %eax
  71df4f: 0f b6 88 68 3d 01 00         	movzbl	0x13d68(%eax), %ecx
  71df56: 85 c9                        	testl	%ecx, %ecx
  71df58: 74 05                        	je	0x71df5f <.text+0x1cf5f>
  71df5a: e9 96 04 00 00               	jmp	0x71e3f5 <.text+0x1d3f5>
  71df5f: 8b 55 08                     	movl	0x8(%ebp), %edx
  71df62: 83 7a 5c ff                  	cmpl	$-0x1, 0x5c(%edx)
  71df66: 75 05                        	jne	0x71df6d <.text+0x1cf6d>
  71df68: e9 88 04 00 00               	jmp	0x71e3f5 <.text+0x1d3f5>
  71df6d: 8b 45 e8                     	movl	-0x18(%ebp), %eax
  71df70: 0f b6 48 05                  	movzbl	0x5(%eax), %ecx
  71df74: 89 4d a8                     	movl	%ecx, -0x58(%ebp)
  71df77: 8b 55 08                     	movl	0x8(%ebp), %edx
  71df7a: db 42 4c                     	fildl	0x4c(%edx)
  71df7d: d9 5d b0                     	fstps	-0x50(%ebp)
  71df80: 8b 45 b0                     	movl	-0x50(%ebp), %eax
  71df83: 89 45 ac                     	movl	%eax, -0x54(%ebp)
  71df86: 8b 4d e8                     	movl	-0x18(%ebp), %ecx
  71df89: 03 0d 94 7d 84 00            	addl	0x847d94, %ecx
  71df8f: 0f b6 51 06                  	movzbl	0x6(%ecx), %edx
  71df93: 52                           	pushl	%edx
  71df94: 6a 25                        	pushl	$0x25
  71df96: 8d 45 b0                     	leal	-0x50(%ebp), %eax
  71df99: 50                           	pushl	%eax
  71df9a: e8 0e e1 ff ff               	calll	0x71c0ad <.text+0x1b0ad>
  71df9f: 83 c4 0c                     	addl	$0xc, %esp
  71dfa2: d9 45 b0                     	flds	-0x50(%ebp)
  71dfa5: d8 65 ac                     	fsubs	-0x54(%ebp)
  71dfa8: e8 a3 ef 05 00               	calll	0x77cf50 <.text+0x7bf50>
  71dfad: 89 45 cc                     	movl	%eax, -0x34(%ebp)
  71dfb0: 83 7d cc 01                  	cmpl	$0x1, -0x34(%ebp)
  71dfb4: 7d 05                        	jge	0x71dfbb <.text+0x1cfbb>
  71dfb6: e9 3a 04 00 00               	jmp	0x71e3f5 <.text+0x1d3f5>
  71dfbb: 8b 4d 0c                     	movl	0xc(%ebp), %ecx
  71dfbe: 8b 91 6c 3d 01 00            	movl	0x13d6c(%ecx), %edx
  71dfc4: 89 55 bc                     	movl	%edx, -0x44(%ebp)
  71dfc7: 8b 45 e8                     	movl	-0x18(%ebp), %eax
  71dfca: 0f be 48 04                  	movsbl	0x4(%eax), %ecx
  71dfce: 83 f9 75                     	cmpl	$0x75, %ecx
  71dfd1: 75 0d                        	jne	0x71dfe0 <.text+0x1cfe0>
  71dfd3: 83 7d bc 01                  	cmpl	$0x1, -0x44(%ebp)
  71dfd7: 74 05                        	je	0x71dfde <.text+0x1cfde>
  71dfd9: e9 17 04 00 00               	jmp	0x71e3f5 <.text+0x1d3f5>
  71dfde: eb 3a                        	jmp	0x71e01a <.text+0x1d01a>
  71dfe0: 8b 55 e8                     	movl	-0x18(%ebp), %edx
  71dfe3: 0f be 42 04                  	movsbl	0x4(%edx), %eax
  71dfe7: 83 f8 55                     	cmpl	$0x55, %eax
  71dfea: 75 1c                        	jne	0x71e008 <.text+0x1d008>
  71dfec: 8b 4d bc                     	movl	-0x44(%ebp), %ecx
  71dfef: 81 e1 03 00 00 80            	andl	$0x80000003, %ecx       # imm = 0x80000003
  71dff5: 79 05                        	jns	0x71dffc <.text+0x1cffc>
  71dff7: 49                           	decl	%ecx
  71dff8: 83 c9 fc                     	orl	$-0x4, %ecx
  71dffb: 41                           	incl	%ecx
  71dffc: 83 f9 01                     	cmpl	$0x1, %ecx
  71dfff: 74 05                        	je	0x71e006 <.text+0x1d006>
  71e001: e9 ef 03 00 00               	jmp	0x71e3f5 <.text+0x1d3f5>
  71e006: eb 12                        	jmp	0x71e01a <.text+0x1d01a>
  71e008: 83 7d bc 01                  	cmpl	$0x1, -0x44(%ebp)
  71e00c: 7d 05                        	jge	0x71e013 <.text+0x1d013>
  71e00e: e9 e2 03 00 00               	jmp	0x71e3f5 <.text+0x1d3f5>
  71e013: c7 45 b4 00 00 c0 00         	movl	$0xc00000, -0x4c(%ebp)  # imm = 0xC00000
  71e01a: c7 45 98 00 00 00 00         	movl	$0x0, -0x68(%ebp)
  71e021: 83 7d bc 01                  	cmpl	$0x1, -0x44(%ebp)
  71e025: 7e 07                        	jle	0x71e02e <.text+0x1d02e>
  71e027: c7 45 98 01 00 00 00         	movl	$0x1, -0x68(%ebp)
  71e02e: 8b 55 08                     	movl	0x8(%ebp), %edx
  71e031: 8b 42 38                     	movl	0x38(%edx), %eax
  71e034: 89 45 9c                     	movl	%eax, -0x64(%ebp)
  71e037: 8b 4d 08                     	movl	0x8(%ebp), %ecx
  71e03a: 8b 91 f4 00 00 00            	movl	0xf4(%ecx), %edx
  71e040: 89 55 a0                     	movl	%edx, -0x60(%ebp)
  71e043: 8b 45 08                     	movl	0x8(%ebp), %eax
  71e046: 83 b8 88 02 00 00 00         	cmpl	$0x0, 0x288(%eax)
  71e04d: 74 0c                        	je	0x71e05b <.text+0x1d05b>
  71e04f: 33 c9                        	xorl	%ecx, %ecx
  71e051: 83 7d a0 00                  	cmpl	$0x0, -0x60(%ebp)
  71e055: 0f 94 c1                     	sete	%cl
  71e058: 89 4d a0                     	movl	%ecx, -0x60(%ebp)
  71e05b: c7 45 b8 00 00 00 00         	movl	$0x0, -0x48(%ebp)
  71e062: 8b 55 08                     	movl	0x8(%ebp), %edx
  71e065: 8b 82 84 00 00 00            	movl	0x84(%edx), %eax
  71e06b: 83 e0 01                     	andl	$0x1, %eax
  71e06e: 85 c0                        	testl	%eax, %eax
  71e070: 74 07                        	je	0x71e079 <.text+0x1d079>
  71e072: c7 45 b8 02 00 00 00         	movl	$0x2, -0x48(%ebp)
  71e079: 8d 4d c8                     	leal	-0x38(%ebp), %ecx
  71e07c: 51                           	pushl	%ecx
  71e07d: 8d 55 c4                     	leal	-0x3c(%ebp), %edx
  71e080: 52                           	pushl	%edx
  71e081: 8b 45 9c                     	movl	-0x64(%ebp), %eax
  71e084: 50                           	pushl	%eax
  71e085: e8 56 cf 03 00               	calll	0x75afe0 <.text+0x59fe0>
  71e08a: 83 c4 0c                     	addl	$0xc, %esp
  71e08d: 83 f8 ff                     	cmpl	$-0x1, %eax
  71e090: 75 05                        	jne	0x71e097 <.text+0x1d097>
  71e092: e9 5e 03 00 00               	jmp	0x71e3f5 <.text+0x1d3f5>
  71e097: 83 7d a0 00                  	cmpl	$0x0, -0x60(%ebp)
  71e09b: 0f 84 a6 01 00 00            	je	0x71e247 <.text+0x1d247>
  71e0a1: 8b 4d c8                     	movl	-0x38(%ebp), %ecx
  71e0a4: 51                           	pushl	%ecx
  71e0a5: 8b 55 c4                     	movl	-0x3c(%ebp), %edx
  71e0a8: 83 ea 02                     	subl	$0x2, %edx
  71e0ab: 2b 55 b8                     	subl	-0x48(%ebp), %edx
  71e0ae: 52                           	pushl	%edx
  71e0af: e8 f4 d0 03 00               	calll	0x75b1a8 <.text+0x5a1a8>
  71e0b4: 83 c4 08                     	addl	$0x8, %esp
  71e0b7: 85 c0                        	testl	%eax, %eax
  71e0b9: 75 6d                        	jne	0x71e128 <.text+0x1d128>
  71e0bb: 8b 45 c8                     	movl	-0x38(%ebp), %eax
  71e0be: 50                           	pushl	%eax
  71e0bf: 8b 4d c4                     	movl	-0x3c(%ebp), %ecx
  71e0c2: 83 e9 02                     	subl	$0x2, %ecx
  71e0c5: 2b 4d b8                     	subl	-0x48(%ebp), %ecx
  71e0c8: 51                           	pushl	%ecx
  71e0c9: e8 9f cf 03 00               	calll	0x75b06d <.text+0x5a06d>
  71e0ce: 83 c4 08                     	addl	$0x8, %esp
  71e0d1: 89 45 a4                     	movl	%eax, -0x5c(%ebp)
  71e0d4: 83 7d a4 00                  	cmpl	$0x0, -0x5c(%ebp)
  71e0d8: 74 4e                        	je	0x71e128 <.text+0x1d128>
  71e0da: 8b 55 a4                     	movl	-0x5c(%ebp), %edx
  71e0dd: 52                           	pushl	%edx
  71e0de: e8 8f 77 ff ff               	calll	0x715872 <.text+0x14872>
  71e0e3: 83 c4 04                     	addl	$0x4, %esp
  71e0e6: 89 45 c0                     	movl	%eax, -0x40(%ebp)
  71e0e9: 83 7d c0 00                  	cmpl	$0x0, -0x40(%ebp)
  71e0ed: 74 39                        	je	0x71e128 <.text+0x1d128>
  71e0ef: 8b 45 c0                     	movl	-0x40(%ebp), %eax
  71e0f2: 0f b6 48 10                  	movzbl	0x10(%eax), %ecx
  71e0f6: 83 e1 3f                     	andl	$0x3f, %ecx
  71e0f9: 85 c9                        	testl	%ecx, %ecx
  71e0fb: 75 2b                        	jne	0x71e128 <.text+0x1d128>
  71e0fd: 8b 55 b4                     	movl	-0x4c(%ebp), %edx
  71e100: 52                           	pushl	%edx
  71e101: 8b 45 98                     	movl	-0x68(%ebp), %eax
  71e104: 50                           	pushl	%eax
  71e105: 6a ff                        	pushl	$-0x1
  71e107: 8b 4d a0                     	movl	-0x60(%ebp), %ecx
  71e10a: 51                           	pushl	%ecx
  71e10b: 8b 55 a4                     	movl	-0x5c(%ebp), %edx
  71e10e: 52                           	pushl	%edx
  71e10f: 8b 45 cc                     	movl	-0x34(%ebp), %eax
  71e112: 50                           	pushl	%eax
  71e113: 8b 4d a8                     	movl	-0x58(%ebp), %ecx
  71e116: 51                           	pushl	%ecx
  71e117: e8 06 6c ff ff               	calll	0x714d22 <.text+0x13d22>
  71e11c: 83 c4 1c                     	addl	$0x1c, %esp
  71e11f: 85 c0                        	testl	%eax, %eax
  71e121: 74 05                        	je	0x71e128 <.text+0x1d128>
  71e123: e9 cd 02 00 00               	jmp	0x71e3f5 <.text+0x1d3f5>
  71e128: 8b 55 c8                     	movl	-0x38(%ebp), %edx
  71e12b: 83 ea 01                     	subl	$0x1, %edx
  71e12e: 52                           	pushl	%edx
  71e12f: 8b 45 c4                     	movl	-0x3c(%ebp), %eax
  71e132: 83 e8 01                     	subl	$0x1, %eax
  71e135: 2b 45 b8                     	subl	-0x48(%ebp), %eax
  71e138: 50                           	pushl	%eax
  71e139: e8 6a d0 03 00               	calll	0x75b1a8 <.text+0x5a1a8>
  71e13e: 83 c4 08                     	addl	$0x8, %esp
  71e141: 85 c0                        	testl	%eax, %eax
  71e143: 75 70                        	jne	0x71e1b5 <.text+0x1d1b5>
  71e145: 8b 4d c8                     	movl	-0x38(%ebp), %ecx
  71e148: 83 e9 01                     	subl	$0x1, %ecx
  71e14b: 51                           	pushl	%ecx
  71e14c: 8b 55 c4                     	movl	-0x3c(%ebp), %edx
  71e14f: 83 ea 01                     	subl	$0x1, %edx
  71e152: 2b 55 b8                     	subl	-0x48(%ebp), %edx
  71e155: 52                           	pushl	%edx
  71e156: e8 12 cf 03 00               	calll	0x75b06d <.text+0x5a06d>
  71e15b: 83 c4 08                     	addl	$0x8, %esp
  71e15e: 89 45 a4                     	movl	%eax, -0x5c(%ebp)
  71e161: 83 7d a4 00                  	cmpl	$0x0, -0x5c(%ebp)
  71e165: 74 4e                        	je	0x71e1b5 <.text+0x1d1b5>
  71e167: 8b 45 a4                     	movl	-0x5c(%ebp), %eax
  71e16a: 50                           	pushl	%eax
  71e16b: e8 02 77 ff ff               	calll	0x715872 <.text+0x14872>
  71e170: 83 c4 04                     	addl	$0x4, %esp
  71e173: 89 45 c0                     	movl	%eax, -0x40(%ebp)
  71e176: 83 7d c0 00                  	cmpl	$0x0, -0x40(%ebp)
  71e17a: 74 39                        	je	0x71e1b5 <.text+0x1d1b5>
  71e17c: 8b 4d c0                     	movl	-0x40(%ebp), %ecx
  71e17f: 0f b6 51 10                  	movzbl	0x10(%ecx), %edx
  71e183: 83 e2 3f                     	andl	$0x3f, %edx
  71e186: 85 d2                        	testl	%edx, %edx
  71e188: 75 2b                        	jne	0x71e1b5 <.text+0x1d1b5>
  71e18a: 8b 45 b4                     	movl	-0x4c(%ebp), %eax
  71e18d: 50                           	pushl	%eax
  71e18e: 8b 4d 98                     	movl	-0x68(%ebp), %ecx
  71e191: 51                           	pushl	%ecx
  71e192: 6a ff                        	pushl	$-0x1
  71e194: 8b 55 a0                     	movl	-0x60(%ebp), %edx
  71e197: 52                           	pushl	%edx
  71e198: 8b 45 a4                     	movl	-0x5c(%ebp), %eax
  71e19b: 50                           	pushl	%eax
  71e19c: 8b 4d cc                     	movl	-0x34(%ebp), %ecx
  71e19f: 51                           	pushl	%ecx
  71e1a0: 8b 55 a8                     	movl	-0x58(%ebp), %edx
  71e1a3: 52                           	pushl	%edx
  71e1a4: e8 79 6b ff ff               	calll	0x714d22 <.text+0x13d22>
  71e1a9: 83 c4 1c                     	addl	$0x1c, %esp
  71e1ac: 85 c0                        	testl	%eax, %eax
  71e1ae: 74 05                        	je	0x71e1b5 <.text+0x1d1b5>
  71e1b0: e9 40 02 00 00               	jmp	0x71e3f5 <.text+0x1d3f5>
  71e1b5: 8b 45 c8                     	movl	-0x38(%ebp), %eax
  71e1b8: 83 c0 01                     	addl	$0x1, %eax
  71e1bb: 50                           	pushl	%eax
  71e1bc: 8b 4d c4                     	movl	-0x3c(%ebp), %ecx
  71e1bf: 83 e9 01                     	subl	$0x1, %ecx
  71e1c2: 2b 4d b8                     	subl	-0x48(%ebp), %ecx
  71e1c5: 51                           	pushl	%ecx
  71e1c6: e8 dd cf 03 00               	calll	0x75b1a8 <.text+0x5a1a8>
  71e1cb: 83 c4 08                     	addl	$0x8, %esp
  71e1ce: 85 c0                        	testl	%eax, %eax
  71e1d0: 75 70                        	jne	0x71e242 <.text+0x1d242>
  71e1d2: 8b 55 c8                     	movl	-0x38(%ebp), %edx
  71e1d5: 83 c2 01                     	addl	$0x1, %edx
  71e1d8: 52                           	pushl	%edx
  71e1d9: 8b 45 c4                     	movl	-0x3c(%ebp), %eax
  71e1dc: 83 e8 01                     	subl	$0x1, %eax
  71e1df: 2b 45 b8                     	subl	-0x48(%ebp), %eax
  71e1e2: 50                           	pushl	%eax
  71e1e3: e8 85 ce 03 00               	calll	0x75b06d <.text+0x5a06d>
  71e1e8: 83 c4 08                     	addl	$0x8, %esp
  71e1eb: 89 45 a4                     	movl	%eax, -0x5c(%ebp)
  71e1ee: 83 7d a4 00                  	cmpl	$0x0, -0x5c(%ebp)
  71e1f2: 74 4e                        	je	0x71e242 <.text+0x1d242>
  71e1f4: 8b 4d a4                     	movl	-0x5c(%ebp), %ecx
  71e1f7: 51                           	pushl	%ecx
  71e1f8: e8 75 76 ff ff               	calll	0x715872 <.text+0x14872>
  71e1fd: 83 c4 04                     	addl	$0x4, %esp
  71e200: 89 45 c0                     	movl	%eax, -0x40(%ebp)
  71e203: 83 7d c0 00                  	cmpl	$0x0, -0x40(%ebp)
  71e207: 74 39                        	je	0x71e242 <.text+0x1d242>
  71e209: 8b 55 c0                     	movl	-0x40(%ebp), %edx
  71e20c: 0f b6 42 10                  	movzbl	0x10(%edx), %eax
  71e210: 83 e0 3f                     	andl	$0x3f, %eax
  71e213: 85 c0                        	testl	%eax, %eax
  71e215: 75 2b                        	jne	0x71e242 <.text+0x1d242>
  71e217: 8b 4d b4                     	movl	-0x4c(%ebp), %ecx
  71e21a: 51                           	pushl	%ecx
  71e21b: 8b 55 98                     	movl	-0x68(%ebp), %edx
  71e21e: 52                           	pushl	%edx
  71e21f: 6a ff                        	pushl	$-0x1
  71e221: 8b 45 a0                     	movl	-0x60(%ebp), %eax
  71e224: 50                           	pushl	%eax
  71e225: 8b 4d a4                     	movl	-0x5c(%ebp), %ecx
  71e228: 51                           	pushl	%ecx
  71e229: 8b 55 cc                     	movl	-0x34(%ebp), %edx
  71e22c: 52                           	pushl	%edx
  71e22d: 8b 45 a8                     	movl	-0x58(%ebp), %eax
  71e230: 50                           	pushl	%eax
  71e231: e8 ec 6a ff ff               	calll	0x714d22 <.text+0x13d22>
  71e236: 83 c4 1c                     	addl	$0x1c, %esp
  71e239: 85 c0                        	testl	%eax, %eax
  71e23b: 74 05                        	je	0x71e242 <.text+0x1d242>
  71e23d: e9 b3 01 00 00               	jmp	0x71e3f5 <.text+0x1d3f5>
  71e242: e9 a4 01 00 00               	jmp	0x71e3eb <.text+0x1d3eb>
  71e247: 8b 4d c8                     	movl	-0x38(%ebp), %ecx
  71e24a: 51                           	pushl	%ecx
  71e24b: 8b 55 b8                     	movl	-0x48(%ebp), %edx
  71e24e: 8b 45 c4                     	movl	-0x3c(%ebp), %eax
  71e251: 8d 4c 10 02                  	leal	0x2(%eax,%edx), %ecx
  71e255: 51                           	pushl	%ecx
  71e256: e8 4d cf 03 00               	calll	0x75b1a8 <.text+0x5a1a8>
  71e25b: 83 c4 08                     	addl	$0x8, %esp
  71e25e: 85 c0                        	testl	%eax, %eax
  71e260: 75 6e                        	jne	0x71e2d0 <.text+0x1d2d0>
  71e262: 8b 55 c8                     	movl	-0x38(%ebp), %edx
  71e265: 52                           	pushl	%edx
  71e266: 8b 45 b8                     	movl	-0x48(%ebp), %eax
  71e269: 8b 4d c4                     	movl	-0x3c(%ebp), %ecx
  71e26c: 8d 54 01 02                  	leal	0x2(%ecx,%eax), %edx
  71e270: 52                           	pushl	%edx
  71e271: e8 f7 cd 03 00               	calll	0x75b06d <.text+0x5a06d>
  71e276: 83 c4 08                     	addl	$0x8, %esp
  71e279: 89 45 a4                     	movl	%eax, -0x5c(%ebp)
  71e27c: 83 7d a4 00                  	cmpl	$0x0, -0x5c(%ebp)
  71e280: 74 4e                        	je	0x71e2d0 <.text+0x1d2d0>
  71e282: 8b 45 a4                     	movl	-0x5c(%ebp), %eax
  71e285: 50                           	pushl	%eax
  71e286: e8 e7 75 ff ff               	calll	0x715872 <.text+0x14872>
  71e28b: 83 c4 04                     	addl	$0x4, %esp
  71e28e: 89 45 c0                     	movl	%eax, -0x40(%ebp)
  71e291: 83 7d c0 00                  	cmpl	$0x0, -0x40(%ebp)
  71e295: 74 39                        	je	0x71e2d0 <.text+0x1d2d0>
  71e297: 8b 4d c0                     	movl	-0x40(%ebp), %ecx
  71e29a: 0f b6 51 10                  	movzbl	0x10(%ecx), %edx
  71e29e: 83 e2 3f                     	andl	$0x3f, %edx
  71e2a1: 85 d2                        	testl	%edx, %edx
  71e2a3: 75 2b                        	jne	0x71e2d0 <.text+0x1d2d0>
  71e2a5: 8b 45 b4                     	movl	-0x4c(%ebp), %eax
  71e2a8: 50                           	pushl	%eax
  71e2a9: 8b 4d 98                     	movl	-0x68(%ebp), %ecx
  71e2ac: 51                           	pushl	%ecx
  71e2ad: 6a ff                        	pushl	$-0x1
  71e2af: 8b 55 a0                     	movl	-0x60(%ebp), %edx
  71e2b2: 52                           	pushl	%edx
  71e2b3: 8b 45 a4                     	movl	-0x5c(%ebp), %eax
  71e2b6: 50                           	pushl	%eax
  71e2b7: 8b 4d cc                     	movl	-0x34(%ebp), %ecx
  71e2ba: 51                           	pushl	%ecx
  71e2bb: 8b 55 a8                     	movl	-0x58(%ebp), %edx
  71e2be: 52                           	pushl	%edx
  71e2bf: e8 5e 6a ff ff               	calll	0x714d22 <.text+0x13d22>
  71e2c4: 83 c4 1c                     	addl	$0x1c, %esp
  71e2c7: 85 c0                        	testl	%eax, %eax
  71e2c9: 74 05                        	je	0x71e2d0 <.text+0x1d2d0>
  71e2cb: e9 25 01 00 00               	jmp	0x71e3f5 <.text+0x1d3f5>
  71e2d0: 8b 45 c8                     	movl	-0x38(%ebp), %eax
  71e2d3: 83 e8 01                     	subl	$0x1, %eax
  71e2d6: 50                           	pushl	%eax
  71e2d7: 8b 4d b8                     	movl	-0x48(%ebp), %ecx
  71e2da: 8b 55 c4                     	movl	-0x3c(%ebp), %edx
  71e2dd: 8d 44 0a 01                  	leal	0x1(%edx,%ecx), %eax
  71e2e1: 50                           	pushl	%eax
  71e2e2: e8 c1 ce 03 00               	calll	0x75b1a8 <.text+0x5a1a8>
  71e2e7: 83 c4 08                     	addl	$0x8, %esp
  71e2ea: 85 c0                        	testl	%eax, %eax
  71e2ec: 75 71                        	jne	0x71e35f <.text+0x1d35f>
  71e2ee: 8b 4d c8                     	movl	-0x38(%ebp), %ecx
  71e2f1: 83 e9 01                     	subl	$0x1, %ecx
  71e2f4: 51                           	pushl	%ecx
  71e2f5: 8b 55 b8                     	movl	-0x48(%ebp), %edx
  71e2f8: 8b 45 c4                     	movl	-0x3c(%ebp), %eax
  71e2fb: 8d 4c 10 01                  	leal	0x1(%eax,%edx), %ecx
  71e2ff: 51                           	pushl	%ecx
  71e300: e8 68 cd 03 00               	calll	0x75b06d <.text+0x5a06d>
  71e305: 83 c4 08                     	addl	$0x8, %esp
  71e308: 89 45 a4                     	movl	%eax, -0x5c(%ebp)
  71e30b: 83 7d a4 00                  	cmpl	$0x0, -0x5c(%ebp)
  71e30f: 74 4e                        	je	0x71e35f <.text+0x1d35f>
  71e311: 8b 55 a4                     	movl	-0x5c(%ebp), %edx
  71e314: 52                           	pushl	%edx
  71e315: e8 58 75 ff ff               	calll	0x715872 <.text+0x14872>
  71e31a: 83 c4 04                     	addl	$0x4, %esp
  71e31d: 89 45 c0                     	movl	%eax, -0x40(%ebp)
  71e320: 83 7d c0 00                  	cmpl	$0x0, -0x40(%ebp)
  71e324: 74 39                        	je	0x71e35f <.text+0x1d35f>
  71e326: 8b 45 c0                     	movl	-0x40(%ebp), %eax
  71e329: 0f b6 48 10                  	movzbl	0x10(%eax), %ecx
  71e32d: 83 e1 3f                     	andl	$0x3f, %ecx
  71e330: 85 c9                        	testl	%ecx, %ecx
  71e332: 75 2b                        	jne	0x71e35f <.text+0x1d35f>
  71e334: 8b 55 b4                     	movl	-0x4c(%ebp), %edx
  71e337: 52                           	pushl	%edx
  71e338: 8b 45 98                     	movl	-0x68(%ebp), %eax
  71e33b: 50                           	pushl	%eax
  71e33c: 6a ff                        	pushl	$-0x1
  71e33e: 8b 4d a0                     	movl	-0x60(%ebp), %ecx
  71e341: 51                           	pushl	%ecx
  71e342: 8b 55 a4                     	movl	-0x5c(%ebp), %edx
  71e345: 52                           	pushl	%edx
  71e346: 8b 45 cc                     	movl	-0x34(%ebp), %eax
  71e349: 50                           	pushl	%eax
  71e34a: 8b 4d a8                     	movl	-0x58(%ebp), %ecx
  71e34d: 51                           	pushl	%ecx
  71e34e: e8 cf 69 ff ff               	calll	0x714d22 <.text+0x13d22>
  71e353: 83 c4 1c                     	addl	$0x1c, %esp
  71e356: 85 c0                        	testl	%eax, %eax
  71e358: 74 05                        	je	0x71e35f <.text+0x1d35f>
  71e35a: e9 96 00 00 00               	jmp	0x71e3f5 <.text+0x1d3f5>
  71e35f: 8b 55 c8                     	movl	-0x38(%ebp), %edx
  71e362: 83 c2 01                     	addl	$0x1, %edx
  71e365: 52                           	pushl	%edx
  71e366: 8b 45 b8                     	movl	-0x48(%ebp), %eax
  71e369: 8b 4d c4                     	movl	-0x3c(%ebp), %ecx
  71e36c: 8d 54 01 01                  	leal	0x1(%ecx,%eax), %edx
  71e370: 52                           	pushl	%edx
  71e371: e8 32 ce 03 00               	calll	0x75b1a8 <.text+0x5a1a8>
  71e376: 83 c4 08                     	addl	$0x8, %esp
  71e379: 85 c0                        	testl	%eax, %eax
  71e37b: 75 6e                        	jne	0x71e3eb <.text+0x1d3eb>
  71e37d: 8b 45 c8                     	movl	-0x38(%ebp), %eax
  71e380: 83 c0 01                     	addl	$0x1, %eax
  71e383: 50                           	pushl	%eax
  71e384: 8b 4d b8                     	movl	-0x48(%ebp), %ecx
  71e387: 8b 55 c4                     	movl	-0x3c(%ebp), %edx
  71e38a: 8d 44 0a 01                  	leal	0x1(%edx,%ecx), %eax
  71e38e: 50                           	pushl	%eax
  71e38f: e8 d9 cc 03 00               	calll	0x75b06d <.text+0x5a06d>
  71e394: 83 c4 08                     	addl	$0x8, %esp
  71e397: 89 45 a4                     	movl	%eax, -0x5c(%ebp)
  71e39a: 83 7d a4 00                  	cmpl	$0x0, -0x5c(%ebp)
  71e39e: 74 4b                        	je	0x71e3eb <.text+0x1d3eb>
  71e3a0: 8b 4d a4                     	movl	-0x5c(%ebp), %ecx
  71e3a3: 51                           	pushl	%ecx
  71e3a4: e8 c9 74 ff ff               	calll	0x715872 <.text+0x14872>
  71e3a9: 83 c4 04                     	addl	$0x4, %esp
  71e3ac: 89 45 c0                     	movl	%eax, -0x40(%ebp)
  71e3af: 83 7d c0 00                  	cmpl	$0x0, -0x40(%ebp)
  71e3b3: 74 36                        	je	0x71e3eb <.text+0x1d3eb>
  71e3b5: 8b 55 c0                     	movl	-0x40(%ebp), %edx
  71e3b8: 0f b6 42 10                  	movzbl	0x10(%edx), %eax
  71e3bc: 83 e0 3f                     	andl	$0x3f, %eax
  71e3bf: 85 c0                        	testl	%eax, %eax
  71e3c1: 75 28                        	jne	0x71e3eb <.text+0x1d3eb>
  71e3c3: 8b 4d b4                     	movl	-0x4c(%ebp), %ecx
  71e3c6: 51                           	pushl	%ecx
  71e3c7: 8b 55 98                     	movl	-0x68(%ebp), %edx
  71e3ca: 52                           	pushl	%edx
  71e3cb: 6a ff                        	pushl	$-0x1
  71e3cd: 8b 45 a0                     	movl	-0x60(%ebp), %eax
  71e3d0: 50                           	pushl	%eax
  71e3d1: 8b 4d a4                     	movl	-0x5c(%ebp), %ecx
  71e3d4: 51                           	pushl	%ecx
  71e3d5: 8b 55 cc                     	movl	-0x34(%ebp), %edx
  71e3d8: 52                           	pushl	%edx
  71e3d9: 8b 45 a8                     	movl	-0x58(%ebp), %eax
  71e3dc: 50                           	pushl	%eax
  71e3dd: e8 40 69 ff ff               	calll	0x714d22 <.text+0x13d22>
  71e3e2: 83 c4 1c                     	addl	$0x1c, %esp
  71e3e5: 85 c0                        	testl	%eax, %eax
  71e3e7: 74 02                        	je	0x71e3eb <.text+0x1d3eb>
  71e3e9: eb 0a                        	jmp	0x71e3f5 <.text+0x1d3f5>
  71e3eb: 33 c9                        	xorl	%ecx, %ecx
  71e3ed: 85 c9                        	testl	%ecx, %ecx
  71e3ef: 0f 85 a2 fc ff ff            	jne	0x71e097 <.text+0x1d097>
  71e3f5: e9 7f f8 ff ff               	jmp	0x71dc79 <.text+0x1cc79>
  71e3fa: 90                           	nop
  71e3fb: 90                           	nop
  71e3fc: 90                           	nop
  71e3fd: 90                           	nop
  71e3fe: 90                           	nop
  71e3ff: 5f                           	popl	%edi
  71e400: 5e                           	popl	%esi
  71e401: 5b                           	popl	%ebx
  71e402: 8b e5                        	movl	%ebp, %esp
  71e404: 5d                           	popl	%ebp
  71e405: c3                           	retl
