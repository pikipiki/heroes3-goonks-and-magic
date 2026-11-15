// Remove JSON whitespace without rewriting tokens, numbers, strings or duplicate keys.
export function compactAssetJson(text){
 try{JSON.parse(text);}catch{return text;}let result='',quoted=false,escaped=false;
 for(const char of text){if(quoted){result+=char;if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char==='"')quoted=false;}else if(char==='"'){quoted=true;result+=char;}else if(!' \t\r\n'.includes(char))result+=char;}
 return result;
}
