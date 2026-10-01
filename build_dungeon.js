// Dependency-free generator: node build_dungeon.js
const fs = require('node:fs');
const path = require('node:path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'dungeon_map.json'), 'utf8'));
const rules = JSON.parse(fs.readFileSync(path.join(__dirname, 'game_rules.json'), 'utf8'));
const bestiary = JSON.parse(fs.readFileSync(path.join(__dirname, 'bestiary.json'), 'utf8'));
const monsters = new Map(bestiary.monsters.map(m => [m.id,m]));
for (const room of data.rooms) {
  let hostileCount = 0;
  for (const encounter of room.monsters || []) {
    if(!monsters.has(encounter.id) || !Number.isInteger(encounter.count) || encounter.count < 1) throw new Error('Invalid room monster');
    if(monsters.get(encounter.id).damage > 0) hostileCount += encounter.count;
  }
  if(hostileCount > bestiary.encounter_rules.max_active_hostiles) throw new Error('Too many hostiles');
}
const colors = {common:'#9d9486', fighter:'#e7a15d', mage:'#a499eb', rogue:'#69b6a1'};
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const size = data.grid.cell_size;
const rooms = new Map(data.rooms.map(r => [r.id, r]));
if (rooms.size !== data.rooms.length) throw new Error('Duplicate room IDs');
for (const c of data.connections) {
  if (!rooms.has(c.from) || !rooms.has(c.to)) throw new Error('Unknown room in connection');
  for (let i=1;i<c.points.length;i++) if(c.points[i][0]!==c.points[i-1][0] && c.points[i][1]!==c.points[i-1][1]) throw new Error('Non-orthogonal corridor');
}
function reachable(kind) {
  const seen = new Set([data.start]);
  let changed = true;
  while(changed) {
    changed=false;
    for(const c of data.connections) {
      if(c.kind!=='common' && c.kind!==kind && kind!=='all') continue;
      if(seen.has(c.from) && !seen.has(c.to)) {seen.add(c.to);changed=true;}
      if(seen.has(c.to) && !seen.has(c.from)) {seen.add(c.from);changed=true;}
    }
  }
  return seen;
}
for(const kind of ['common','fighter','mage','rogue']) if(!reachable(kind).has(data.goal)) throw new Error('Main goal is inaccessible: '+kind);
for(const [room,owner] of [['rubble','fighter'],['archive','mage'],['cache','mage'],['cistern','rogue']]) {
  for(const kind of ['common','fighter','mage','rogue']) {
    if(reachable(kind).has(room)!==(kind===owner)) throw new Error('Unexpected class access: '+kind+' -> '+room);
  }
}
for(const room of data.rooms) {
  const [x,y,w,h]=room.bounds;
  if(x<0 || y<0 || x+w>data.grid.columns || y+h>data.grid.rows) throw new Error('Room outside grid');
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 720" role="img" aria-labelledby="mapTitle mapDesc">
<title id="mapTitle">${escape(data.name)}</title><desc id="mapDesc">On iki odalı dungeon. Güneyde giriş, kuzeyde mühür haznesi. Ortak yol gri, Fighter turuncu, Mage mor, Rogue yeşil. Kuzey yukarıdadır.</desc>
<defs><pattern id="tiles" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#252926"/><path d="M20 0H0V20" fill="none" stroke="#353b34" stroke-width="1"/></pattern></defs>
<rect width="960" height="720" fill="#141a18"/>
${data.connections.map((c,i)=>`<g class="corridor" data-kind="${c.kind}" data-from="${c.from}" data-to="${c.to}"><polyline points="${c.points.map(p=>p.map(v=>v*size).join(',')).join(' ')}" fill="none" stroke="#080e0c" stroke-width="28" stroke-linejoin="round"/><polyline points="${c.points.map(p=>p.map(v=>v*size).join(',')).join(' ')}" fill="none" stroke="${colors[c.kind]}" stroke-width="10" stroke-linejoin="round" ${c.kind!=='common'?'stroke-dasharray="9 6"':''}/></g>`).join('\n')}
${data.rooms.map(r=>{const [x,y,w,h]=r.bounds.map(v=>v*size);return `<g class="room" data-room="${r.id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#tiles)" stroke="${r.type==='goal'?'#c7d8a0':'#77816c'}" stroke-width="3"/><rect class="room-selection" x="${x+4}" y="${y+4}" width="${w-8}" height="${h-8}" fill="none" stroke="#e6d8ae" stroke-width="2" opacity="0"/><text x="${x+12}" y="${y+26}" fill="#d9bd7c" font-family="Segoe UI, sans-serif" font-size="17" font-weight="700">${String(r.number).padStart(2,'0')}</text><text x="${x+12}" y="${y+49}" fill="#eee9db" font-family="Segoe UI, sans-serif" font-size="14">${escape(r.name)}</text><text x="${x+12}" y="${y+67}" fill="#a0afa1" font-family="Segoe UI, sans-serif" font-size="11">${escape(({entry:'GİRİŞ / ÇIKIŞ',exploration:'KEŞİF',combat:'KARŞILAŞMA',treasure:'GANİMET',puzzle:'BULMACA',lore:'HİKÂYE',goal:'ANA HEDEF'})[r.type])}</text></g>`;}).join('\n')}
<text x="55" y="675" fill="#b2b9aa" font-family="Segoe UI, sans-serif" font-size="14">Kuzey ↑ · 1 kare = 5 ft</text></svg>`;
fs.writeFileSync(path.join(__dirname,'dungeon_map.svg'),svg);
const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(data.name)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#101614;color:#eee9db;font:16px/1.6 'Segoe UI',sans-serif}main{max-width:1420px;margin:auto;padding:36px}header{margin-bottom:24px}h1{font-family:Georgia,serif;font-size:clamp(28px,4vw,44px);line-height:1.15;margin:10px 0}h2{font-family:Georgia,serif;font-size:26px;line-height:1.25;margin:10px 0 16px}h3{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#bfcaaf;margin:20px 0 5px}p{margin:6px 0}small,.muted{color:#a3b19f}.eyebrow{font-size:12px;letter-spacing:3px;color:#d9bd7c}.layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:30px;align-items:start}.map{min-width:0}svg{display:block;width:100%;height:auto;border:1px solid #343d31;border-radius:8px}.controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:0 0 16px}select,button{font:inherit;color:inherit;background:#222c24;border:1px solid #65715e;border-radius:5px;padding:9px 12px}button{cursor:pointer}button:focus-visible,select:focus-visible{outline:3px solid #d9bd7c;outline-offset:3px}.legend{display:flex;flex-wrap:wrap;gap:8px 20px;font-size:13px;color:#c0c8b9;margin:12px 0}.legend span::before{content:'';display:inline-block;width:20px;height:4px;margin:0 7px 3px 0;background:var(--color)}aside{border-left:1px solid #3c4637;padding-left:24px}.room-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}.room-list button{font-size:13px;padding:5px 10px}.room-list button[aria-pressed=true]{background:#43503a;border-color:#d9bd7c}.room{cursor:pointer}.room.active .room-selection{opacity:1}.room.unreachable{opacity:.32}.corridor.unavailable{opacity:.15}#availability{color:#d9bd7c}footer{border-top:1px solid #343d31;margin-top:28px;padding-top:14px;font-size:13px;color:#a3b19f}details{margin:10px 0;padding:10px 0;border-bottom:1px solid #343d31}summary{cursor:pointer;color:#d9bd7c}details p{font-size:14px}#classInfo{margin:20px 0} @media(max-width:900px){main{padding:20px}.layout{grid-template-columns:1fr}aside{border-left:0;border-top:1px solid #3c4637;padding:20px 0 0}}@media(max-width:480px){main{padding:12px}.map svg{min-height:260px}.room-list button{min-height:44px}}
</style></head><body><main><header><div class="eyebrow">DUNGEON 01 · HARİTA TASLAĞI</div><h1>${escape(data.name)}</h1><p>${escape(data.objective)}</p></header><div class="layout"><section class="map" aria-label="Dungeon haritası"><div class="controls"><label for="class">Keşif rotası</label><select id="class"><option value="all">Tüm yollar · tasarım görünümü</option><option value="fighter">Fighter</option><option value="mage">Mage</option><option value="rogue">Rogue</option><option value="common">Ortak yol · her sınıf</option></select></div>${svg}<div class="legend"><span style="--color:#9d9486">Ortak koridor</span><span style="--color:#e7a15d">Fighter · kırılabilir duvar</span><span style="--color:#a499eb">Mage · rünlü kapı</span><span style="--color:#69b6a1">Rogue · gizli menfez</span></div><p class="muted" id="routeSummary" aria-live="polite"></p><section id="classInfo" aria-label="Sınıf özellikleri" aria-live="polite"></section><nav class="room-list" aria-label="Oda seçimi">${data.rooms.map(r=>`<button type="button" data-select="${r.id}" aria-pressed="false">${String(r.number).padStart(2,'0')} · ${escape(r.name)}</button>`).join('')}</nav></section><aside aria-label="Seçili oda" aria-live="polite"><small id="roomNumber"></small><h2 id="roomName"></h2><p id="availability"></p><p id="description"></p><h3>Karşılaşma / etkileşim</h3><p id="encounter"></p><div id="monsterInfo"></div><h3>Ödül</h3><p id="reward"></p><h3>Seçimin sonucu</h3><p id="consequence"></p></aside></div><footer>Bu sayfa harita ve karşılaşma tasarımını gösterir. Hareket ve combat için game.html dosyasını aç. Sınıf seçimi olası erişimi gösterir; bulmacaların ve kapıların açıldığı varsayılır. Soluk odalar bu rotadan erişilemez. Yollar iki yönlüdür. Tüm içerik tasarım görünümünde görülebilir. Yaratıklar D&D SRD 5.2.1’den esinlenen hafif prototip uyarlamalarıdır; can ve hasarlar resmi D&D değerleri değildir.</footer></main><script>
const dungeon=${JSON.stringify(data).replace(/</g,'\\u003c')};
const rules=${JSON.stringify(rules).replace(/</g,'\\u003c')};
const bestiary=${JSON.stringify(bestiary).replace(/</g,'\\u003c')};
function esc(value){return String(value).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function classPanel(kind){const entries=Object.entries(rules.classes).filter(function(entry){return kind==='all'||kind==='common'||entry[1].route===kind;});document.getElementById('classInfo').innerHTML='<h3>Sınıf profilleri · 3 AP / tur</h3>'+entries.map(function(entry){const name=entry[0],c=entry[1];const hp=c.hp_base+Math.floor((c.stats.STR-10)/2);const defense=10+Math.floor((c.stats.DEX-10)/2)+c.armor_bonus;return '<details'+(entries.length===1?' open':'')+'><summary>'+esc(name)+' · STR '+c.stats.STR+' / DEX '+c.stats.DEX+' / INT '+c.stats.INT+' · '+hp+' HP</summary><p>'+esc(c.role)+'</p><p class="muted">Savunma '+defense+' · Focus '+c.resource.max+' · Gizlilik '+(Math.floor((c.stats.DEX-10)/2)+c.stealth_modifier)+'</p><p>'+esc(c.tradeoff)+'</p>'+c.abilities.map(function(a){return '<p><strong>'+esc(a.name)+'</strong> · '+a.ap+' AP'+(a.resource_cost?' / '+a.resource_cost+' Focus':'')+(a.damage?' · '+esc(a.damage)+' + '+esc(a.stat)+' değiştiricisi':'')+'<br>'+esc(a.effect)+'</p>';}).join('')+'</details>';}).join('');}
function monsterPanel(room){document.getElementById('monsterInfo').innerHTML=(room.monsters||[]).map(function(e){const m=bestiary.monsters.find(function(m){return m.id===e.id;});return '<h3>'+e.count+' × '+esc(m.name)+'</h3><p>'+esc(m.label)+' · '+m.hp+' HP · Savunma '+m.defense+' · Hasar '+m.damage+'</p><details><summary>Davranış ve çözüm yolları</summary><p>'+esc(m.behavior)+'</p><p><strong>Karşı hamle:</strong> '+esc(m.counterplay)+'</p><p><strong>Savaşsız:</strong> '+esc(m.noncombat)+'</p></details>';}).join('');}
let selected=dungeon.start; let accessible=new Set();
function reach(kind){const seen=new Set([dungeon.start]);let changed=true;while(changed){changed=false;for(const c of dungeon.connections){if(c.kind!=='common'&&c.kind!==kind&&kind!=='all')continue;for(const [a,b] of [[c.from,c.to],[c.to,c.from]])if(seen.has(a)&&!seen.has(b)){seen.add(b);changed=true;}}}return seen;}
function showRoom(id){selected=id;const r=dungeon.rooms.find(r=>r.id===id);monsterPanel(r);document.getElementById('roomNumber').textContent='ODA '+String(r.number).padStart(2,'0');document.getElementById('roomName').textContent=r.name;for(const key of ['description','encounter','reward','consequence'])document.getElementById(key).textContent=r[key];document.getElementById('availability').textContent=accessible.has(id)?'Seçili rotadan erişilebilir':'Bu rota ile erişilemiyor · farklı bir sınıfla keşfedilebilir';document.querySelectorAll('.room').forEach(el=>el.classList.toggle('active',el.dataset.room===id));document.querySelectorAll('[data-select]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.select===id)));}
function update(){const kind=document.getElementById('class').value;accessible=reach(kind);classPanel(kind);document.querySelectorAll('.room').forEach(el=>el.classList.toggle('unreachable',!accessible.has(el.dataset.room)));document.querySelectorAll('.corridor').forEach(el=>el.classList.toggle('unavailable',!accessible.has(el.dataset.from)||!accessible.has(el.dataset.to)||(kind!=='all'&&el.dataset.kind!=='common'&&el.dataset.kind!==kind)));document.getElementById('routeSummary').textContent=accessible.size+' / '+dungeon.rooms.length+' oda erişilebilir. Ana hedef bütün sınıflar için ulaşılabilir.';showRoom(selected);}
document.querySelectorAll('[data-select]').forEach(el=>el.addEventListener('click',()=>showRoom(el.dataset.select)));document.querySelectorAll('.room').forEach(el=>el.addEventListener('click',()=>showRoom(el.dataset.room)));document.getElementById('class').addEventListener('change',update);update();
</script></body></html>`;
fs.writeFileSync(path.join(__dirname,'dungeon_map.html'),html);
console.log('Created dungeon_map.svg and dungeon_map.html');
for(const kind of ['all','common','fighter','mage','rogue']) console.log(kind+': '+reachable(kind).size+'/'+data.rooms.length+' rooms; goal reachable');
