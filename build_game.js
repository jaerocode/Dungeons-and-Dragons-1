const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const embed=file=>JSON.stringify(JSON.parse(read(file))).replace(/</g,'\\u003c');
const assets={};
const webAssets={};
const assetFolders=['assets1','assets2'];
const map=JSON.parse(read('dungeon_map.json'));
const bestiary=JSON.parse(read('bestiary.json'));
for(const name of new Set([...map.rooms.flatMap(r=>[r.art,r.enemy_art,r.empty_art,r.traps?.art]),...bestiary.monsters.map(m=>m.art)].filter(Boolean))) {
 const matches=assetFolders.flatMap(folder=>['png','svg'].filter(ext=>fs.existsSync(path.join(__dirname,folder,name+'.'+ext))).map(ext=>({folder,ext})));
 if(matches.length>1)throw new Error('Duplicate art asset: '+name);
 if(matches.length){const {folder,ext}=matches[0],file=path.join(__dirname,folder,name+'.'+ext);assets[name]='data:image/'+(ext==='svg'?'svg+xml':'png')+';base64,'+fs.readFileSync(file).toString('base64');webAssets[name]='/'+folder+'/'+name+'.'+ext;}
}
for(const required of [...map.rooms.flatMap(r=>[r.art,r.enemy_art,r.empty_art,r.traps?.art]),...bestiary.monsters.map(m=>m.art)].filter(Boolean))if(!assets[required])throw new Error('Missing art asset: '+required);
let template=read('game.template.html');
template=template.replace('__FAVICON__',()=> 'data:image/svg+xml;base64,'+fs.readFileSync(path.join(__dirname,'mines-of-moria.svg')).toString('base64'));
template=template.replace('__CHARACTER_NAMES__',()=>JSON.stringify(require('./character-name-data')).replace(/</g,'\\u003c'));
template=template.replace('__CSS__',()=>read('game.css')).replace('__MAP__',()=>embed('dungeon_map.json')).replace('__RULES__',()=>embed('game_rules.json')).replace('__BESTIARY__',()=>embed('bestiary.json')).replace('__LOOT__',()=>embed('loot.json')).replace('__ENGINE__',()=>read('game-engine.js')).replace('__UI__',()=>read('vendor/three.min.js')+'\n'+read('isometric-map.js')+'\n'+read('three-dungeon.js')+'\n'+read('game-ui.js'));
const html=template.replace('__ASSETS__',()=>JSON.stringify(assets));
fs.writeFileSync(path.join(__dirname,'Mines of Moria.html'),html);
fs.writeFileSync(path.join(__dirname,'game.web.html'),template.replace('__ASSETS__',()=>JSON.stringify(webAssets)));
console.log('Created standalone Mines of Moria.html and lightweight LAN game.web.html.');
