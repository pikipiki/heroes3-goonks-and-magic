import fs from'node:fs';
export function inlineBootScreen(html){return html.replace(/<body(\s[^>]*)?>/,'<body$1 data-goonk-boot>').replace('</head>','<style id="goonk-boot-style">'+fs.readFileSync(new URL('../web/boot-screen.css',import.meta.url),'utf8')+'</style></head>');}
