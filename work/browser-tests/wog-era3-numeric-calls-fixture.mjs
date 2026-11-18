import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export function era3NumericCallsFixture({dialect='era3',basicOnly=false}={}){
 const source=`!?FU9410;
!!VRv951:Sx1; !!VRv952:Sx2; !!VRv953:Sx8; !!VRv956:Sx16;
!!IF&v959=1:M^CALLABI PAUSE^;
!!VRx1:+1;
!?FU9411;
!!VRx8:S88; !!VRy1:S99;
!!FU9410:P?x1;
!!VRv954:Sx8; !!VRv955:Sy1;
!!VRx1:+10;
!#VRx2:S66; !#VRx8:S77; !#VRx16:S123;
!#VRv950:S41;
!#FU9410:P?v950;
!#IF:M^CALLABI BASIC %V950/%V951/%V952/%V953/%V956 caller %X2/%X8/%X16^;
${basicOnly?'':`
!#SN:W^era3NumericCounter^/11;
!#FU9410:P?i^era3NumericCounter^;
!#SN:W^era3NumericCounter^/?v957;
!#IF:M^CALLABI NAMED %V957^;
!#VRf:S7;
!#FU9410:P?f;
!#VRv957:Sf;
!#IF:M^CALLABI FAST %V957^;
!#FU9410:P5/9;
!#IF:M^CALLABI READ %V951/%V952/%V953/%V956^;
!#VRv950:S41;
!#FU9410:P?v950/?v950;
!#IF:M^CALLABI DUPLICATE %V950/%V951/%V952/%V953/%V956^;
!#VRv950:S41; !#VRv959:S1;
!#FU9411:P?v950;
!#VRv959:S0;
!#IF:M^CALLABI NESTED %V950/%V951/%V952/%V953/%V954/%V955 caller %X2/%X8/%X16^;
`}`;
 const program=compileErm(Buffer.from(source),{source:'Private numeric FU:P call convention probe',dialect});
 program.originalMessages=['ZVSE private native companion town continuation'];return program;
}

export async function runLegacyNumericCallsControl({boot,state,wait,page,report,output}){
 const assert=(await import('node:assert/strict')).default;
 const fs=await import('node:fs'),path=await import('node:path');
 const scriptProgram=era3NumericCallsFixture({dialect:'wog358',basicOnly:true});
 fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 await boot({enabled:false,scriptTown:true,scriptProgram,expectedDialog:'source-campaign'});
 await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(line=>line.includes('CALLABI BASIC')));
 const text=(await state()).dialogPresentation.lines.join(' ');
 assert(text.includes('CALLABI BASIC 951/950/66/77/123 caller 66/77/123'),text);
 report.scenarios.push({kind:'legacy-numeric-call-control',scope:'Classic358f numeric destination-index convention retained',text,programSha256:scriptProgram.sha256});
 await page().close();
}
