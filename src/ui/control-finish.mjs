export const heroesStone=new URL('../../web/h3-theme/stone.png',import.meta.url).href;
// Shared by the catalogue and native screen adapters. Never change geometry
// to communicate interaction: only paint, shadow, colour and MUI state layers.
export const heroesControlFinish = {
 border: '1px solid #edca84', borderImage: 'none',
 boxShadow: '0 2px 6px #0007',
 backgroundColor: '#34200e',
 backgroundImage: `linear-gradient(#533716b8,#231308e8),url(${heroesStone})`,
 textShadow: '0 1px 2px #000',
 '&:hover': {backgroundColor:'#5f3c13',backgroundImage:`linear-gradient(#81571db8,#3d220aeb),url(${heroesStone})`,borderColor:'#ffe9a8',boxShadow:'0 3px 8px #0008'},
 '&:active': {boxShadow:'0 1px 3px #0007'},
 '&.Mui-disabled': {boxShadow:'0 1px 3px #0004',opacity:.48,color:'#d5c49c'}
};
export const heroesTypography = {
 fontFamily:'Georgia,"Times New Roman",serif',fontSize:14,
 h1:{fontSize:22,lineHeight:'28px',fontWeight:400},h2:{fontSize:22,lineHeight:'28px',fontWeight:400},h3:{fontSize:16,lineHeight:'24px',fontWeight:500},
 body1:{fontSize:16,lineHeight:'24px'},body2:{fontSize:14,lineHeight:'20px'},button:{fontSize:14,lineHeight:'20px',fontWeight:400,textTransform:'none',letterSpacing:0},caption:{fontSize:12,lineHeight:'16px'},resource:{fontSize:10,lineHeight:'12px'},resourceValue:{fontFamily:'Arial,Helvetica,sans-serif',fontSize:10,lineHeight:'12px',fontWeight:400},creatureCard:{fontSize:12,lineHeight:'14px',fontWeight:400},micro:{fontSize:11,lineHeight:'14px'},titleSmall:{fontSize:18,lineHeight:'24px'},statLarge:{fontSize:20,lineHeight:'24px'},icon:{fontSize:24,lineHeight:'24px'},quantity:{fontSize:28,lineHeight:'32px'}
};

export const heroesSliderStyles={
 root:{color:'#e3bd69',height:8,padding:'20px 0'},
 rail:{height:8,opacity:1,background:'linear-gradient(#110b05,#4c3417)',border:'1px solid #a18448',boxShadow:'inset 0 2px 4px #000c, 0 1px 0 #ffe7a03d'},
 track:{height:8,border:'1px solid #f4d58a',background:'linear-gradient(#fff1b8,#dca344 50%,#98601d)',boxShadow:'0 1px 3px #0008'},
 thumb:{width:26,height:26,border:'2px solid #ffedac',background:'linear-gradient(145deg,#fff0b5,#dca343 55%,#8c5416)',boxShadow:'inset 1px 1px 1px #fff4cc, inset -1px -2px 2px #71420e, 0 3px 6px #000a','&::before':{boxShadow:'none'},'&:hover, &.Mui-focusVisible':{boxShadow:'inset 1px 1px 1px #fff4cc, 0 3px 6px #000a, 0 0 0 7px #edca8429'},'&.Mui-active':{boxShadow:'inset 0 2px 4px #744510, 0 0 0 10px #edca8433'}},
 valueLabel:{background:'#35210e',border:'1px solid #edca84',color:'#fff0c2'}
};
