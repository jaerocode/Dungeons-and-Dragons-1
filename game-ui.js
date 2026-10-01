let game=new DungeonExplorer(MAP,RULES,'Fighter','Kaşif',{bestiary:BESTIARY,loot:LOOT});
let history=[{turn:1,message:game.message}],enemyTimer=null,damageTimer=null,gameStarted=false,victoryPresentedFor=null,deathPresentedFor=null,lastHP=game.hp;
const $=id=>document.getElementById(id);
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function drawScene(){
  const artKey=game.roomId===MAP.goal&&game.hasStone?game.room.empty_art:game.visibleEnemies.length&&game.room.enemy_art?game.room.enemy_art:game.room.art;
  $('scene').innerHTML='<image data-background="'+artKey+'" href="'+ASSETS[artKey]+'" width="1000" height="500" preserveAspectRatio="xMidYMid slice"/><rect width="1000" height="500" fill="#060b08" opacity=".08"/>';
  $('scene').setAttribute('aria-label',game.room.name+' · '+game.room.mood);
  const visible=game.visibleEnemies;
  $('enemyCards').hidden=!!game.combat;
  renderEnemyDossier();
  $('enemyCards').innerHTML=visible.map(e=>'<button class="enemy-card" data-target="'+e.id+'"><strong>'+escapeHTML(e.definition.name)+'</strong><span>Can: ?</span><small>'+(game.bypassed?'Seni fark etmedi':e.hp/e.maxHp<=.35?'Ağır yaralı':e.hp<e.maxHp?'Yaralı':'Henüz yara almamış')+(e.chilled?' · Buz etkisi':e.burning?' · Yanıyor':'')+'</small></button>').join('');
  $('enemyCards').querySelectorAll('[data-target]').forEach(button=>button.addEventListener('click',()=>{game.selectTarget(button.dataset.target);render();}));
  $('doorHint').textContent=game.bypassed?'Gölgelerden geçtin · Kapıları seçebilirsin':game.visibleEnemies.length?'Düşman var · Sessizlik veya savaş':game.roomId===MAP.goal?(game.hasStone?'Taşı zindanlara götür':'Mühür Taşı kaidenin üzerinde'):'Kapılara dokunarak geç';
}
function renderEnemyDossier(){
  const enemy=game.target,panel=$('enemyDossier');
  $('gameShell').classList.toggle('in-combat',!!game.combat);
  panel.hidden=!game.combat||!enemy;
  if(panel.hidden){panel.innerHTML='';return;}
  const definition=enemy.definition,status=(enemy.hp/enemy.maxHp<=.35?'Ağır yaralı':enemy.hp<enemy.maxHp?'Yaralı':'Henüz yara almamış')+(enemy.chilled?' · Buz etkisi':enemy.burning?' · Yanıyor':'');
  panel.innerHTML='<header class="enemy-dossier-header"><span class="eyebrow">'+(definition.kind==='troll'?'Mahzenin dehşeti':'Karşındaki düşman')+'</span><h3>'+escapeHTML(definition.name)+'</h3><p>'+escapeHTML(definition.label)+'</p></header><div class="enemy-portrait enemy-portrait-'+definition.kind+'"><img src="'+ASSETS[definition.art]+'" alt="'+escapeHTML(definition.name)+'"><span class="enemy-vital">Can: <strong>?</strong></span></div><div class="enemy-condition">'+escapeHTML(status)+'</div><section class="enemy-lore"><h4>Mahzenin fısıltıları</h4><p>'+escapeHTML(definition.lore)+'</p></section>'+(game.currentEnemies.length>1?'<div class="enemy-targets" aria-label="Saldırı hedefini seç">'+game.currentEnemies.map(e=>'<button class="quiet-button" data-combat-target="'+e.id+'" aria-pressed="'+(e.id===enemy.id)+'">'+escapeHTML(e.definition.name)+'</button>').join('')+'</div>':'');
  panel.querySelectorAll('[data-combat-target]').forEach(button=>button.addEventListener('click',()=>{game.selectTarget(button.dataset.combatTarget);render();}));
}
function renderMinimap(){
  hideDoorPreview();
  const radius=3,heading=[[0,-1],[1,0],[0,1],[-1,0]][game.facing],cells=[];
  for(let y=game.position.y-radius;y<=game.position.y+radius;y++)for(let x=game.position.x-radius;x<=game.position.x+radius;x++){
    const p={x,y},seen=game.canSee(p),walk=game.walkable(p),dx=x-game.position.x,dy=y-game.position.y,lit=dx*heading[0]+dy*heading[1]>=Math.abs(dx*heading[1]-dy*heading[0]),player=dx===0&&dy===0,enemy=seen&&game.visibleEnemies.find(e=>e.position.x===x&&e.position.y===y),door=seen&&game.doors().find(d=>{const q=game.spawnPosition(d);return q.x===x&&q.y===y;}),adjacent=Math.abs(dx)+Math.abs(dy)===1;
    const drops=seen?game.roomLoot.filter(e=>e.position.x===x&&e.position.y===y):[],direction=dy<0?0:dx>0?1:dy>0?2:3,label=(!seen?'Karanlık · görünmeyen blok':player?'Sen':enemy?enemy.definition.name:door?'Kapı: '+MAP.rooms.find(r=>r.id===door.target).name:walk?'Boş blok':'Duvar / sütun')+(drops.length?' · Ganimet: '+drops.map(e=>game.items.get(e.id).name).join(', '):'');
    cells.push('<button class="map-cell '+(walk?'floor':'wall')+(lit?' lit':' dim')+(drops.length?' loot':'')+(enemy?' mob':'')+(door?' door':'')+(player?' player':'')+(!seen?' fog':'')+'" title="'+escapeHTML(label)+'" aria-label="'+escapeHTML(label)+'" '+(door?'data-preview-room="'+door.target+'" data-preview-door="'+door.id+'" ':'')+(seen&&adjacent&&walk&&!game.combat&&gameStarted?'data-move="'+direction+'"':door?'':'disabled')+'>'+(player?['↑','→','↓','←'][game.facing]:enemy?'●':drops.length?'◆':door?'▣':'')+'</button>');
  }
  $('miniGrid').innerHTML=cells.join('');$('miniGrid').querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>{game.move(Number(b.dataset.move));record();}));
  $('miniGrid').querySelectorAll('[data-preview-room]').forEach(b=>{b.addEventListener('pointerenter',()=>showDoorPreview(b));b.addEventListener('pointerleave',hideDoorPreview);b.addEventListener('focus',()=>showDoorPreview(b));b.addEventListener('blur',hideDoorPreview);});
  $('sightStatus').textContent=game.torchLit?'Meşale yanıyor · Önünde 3 blok · Gizlenemezsin':'Meşale sönük · Önünde 1 blok';
  $('miniHeading').textContent=['Kuzey ↑','Doğu →','Güney ↓','Batı ←'][game.facing];
  $('miniControls').innerHTML=[['forward','İleri git'],['back','Geri gel'],['left','Sola dön'],['right','Sağa dön'],['fast','Hızlı git · 3 adım']].map(([id,label])=>'<button data-nav="'+id+'" '+(!gameStarted||!game.available()||game.combat?'disabled':'')+'>'+label+'</button>').join('');
  $('miniControls').querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>{const n=b.dataset.nav;if(n==='left'||n==='right')game.turnFacing(n==='left'?-1:1);else game.move(n==='back'?'back':'forward',n==='fast'?3:1);record();}));
  $('miniExits').innerHTML=game.doors().filter(d=>game.nearDoor(d)&&(game.roomId===MAP.start||game.canSee(game.spawnPosition(d)))).map(d=>'<button data-mini-door="'+d.id+'" '+(game.gateReason(d)||game.combat||!gameStarted||!game.available()?'disabled':'')+' title="'+escapeHTML(game.gateReason(d)||game.passageNarrative(d))+'"><span>Odadan çık · '+escapeHTML(MAP.rooms.find(r=>r.id===d.target).name)+'</span>'+((game.gateReason(d)||game.passageNarrative(d))?'<small>'+escapeHTML(game.gateReason(d)||game.passageNarrative(d))+'</small>':'')+'</button>').join('');
  $('miniExits').querySelectorAll('[data-mini-door]').forEach(b=>b.addEventListener('click',()=>{game.goDoor(b.dataset.miniDoor);record();}));
  $('nearbyLoot').hidden=!!game.combat;
  $('nearbyLoot').innerHTML=game.nearbyLoot.filter(e=>game.canSee(e.position)).map(e=>'<button class="context-button pickup-button" data-pickup="'+e.uid+'" '+(gameStarted&&game.canTakeLoot(e)?'':'disabled')+'>Al · '+escapeHTML(game.items.get(e.id).name)+(e.quantity>1?' ×'+e.quantity:'')+'</button>').join('');
  $('nearbyLoot').querySelectorAll('[data-pickup]').forEach(b=>b.addEventListener('click',()=>{showLoot(b.dataset.pickup);record();}));
}
function actionButton(action,label){return '<button class="action" data-choice="'+action+'"><span class="action-label">'+escapeHTML(label)+'</span></button>';}
function renderChoices(){
  const fighting=!!game.combat,available=game.available()&&gameStarted;
  $('explorationActions').hidden=fighting;$('doorChoices').hidden=true;
  {
    const prepare=game.characterClass==='Mage'?(game.prepared?'Büyünü bırak':'Büyünü hazırla'):(game.prepared?'Silahını indir':'Silahını hazırla');
    $('explorationActions').innerHTML=actionButton('inspect','Odayı incele')+actionButton('prepare',prepare)+actionButton('torch',game.torchLit?'Meşaleyi söndür':'Meşaleyi yak')+(game.visibleEnemies.length&&!game.bypassed?actionButton('sneak',game.torchLit?'Gizlenmek için meşaleyi söndür':'Gizlice uzaklaş · '+({Fighter:'çok zor',Mage:'zor',Rogue:'kolay'})[game.characterClass])+actionButton('engage',game.characterClass==='Mage'?'Büyünü hazırla / combat’a gir':'Silahını çek / combat’a gir'):'');
    const doors=game.doors(),positions=(game.currentEnemies.length?game.room.enemy_door_hotspots:null)||game.room.door_hotspots||[];
    $('doorChoices').innerHTML=doors.map((d,i)=>{const reason=game.gateReason(d),blocked=reason||game.currentEnemies.length&&!game.bypassed,target=MAP.rooms.find(r=>r.id===d.target),point=positions[i]||{x:50,y:40};return '<button class="door-choice" data-door="'+d.id+'" style="--door-x:'+point.x+'%;--door-y:'+point.y+'%" title="'+escapeHTML(reason||(blocked?'Önce düşmanı aşmalısın.':game.doorLabel(d)))+'" '+(!available||blocked?'disabled':'')+'>'+escapeHTML(target.name)+(blocked?'<small>'+escapeHTML(reason||'Önce düşmanı aşmalısın.')+'</small>':'')+'</button>';}).join('');
  }
  $('explorationActions').querySelectorAll('[data-choice]').forEach(b=>{b.disabled=!available||(b.dataset.choice==='sneak'&&game.torchLit);b.addEventListener('click',()=>action(b.dataset.choice));});
  $('doorChoices').querySelectorAll('[data-door]').forEach(b=>b.addEventListener('click',()=>{game.goDoor(b.dataset.door);record();}));
  $('roomDetails').hidden=fighting||!game.inspected.has(game.roomId);$('detailsTitle').textContent=game.room.name;
  $('inspectionText').textContent=(game.visibleEnemies.length?game.room.description:game.room.quiet_summary)+'\n\n'+(game.visibleEnemies.length?game.room.inspection:game.room.quiet_inspection);
  $('roomReadings').innerHTML=(game.room.readings||[]).map(entry=>'<button class="reading-button" data-reading="'+entry.id+'">'+escapeHTML(entry.title)+(game.readEntries.has(game.roomId+':'+entry.id)?' · Okundu':' · Oku')+'</button>').join('');
  $('roomReadings').querySelectorAll('[data-reading]').forEach(b=>b.addEventListener('click',()=>{const entry=game.readEntry(b.dataset.reading);if(entry){$('readingTitle').textContent=entry.title;$('readingText').textContent=entry.text;record();$('readingDialog').showModal();}}));
  $('roomInteractions').innerHTML=(game.room.interactions||[]).map(i=>'<button class="context-button" data-interaction="'+i.id+'" '+(game.interacted.has(game.roomId+':'+i.id)?'disabled':'')+'>'+escapeHTML(i.label)+'</button>').join('');
  $('roomInteractions').querySelectorAll('[data-interaction]').forEach(b=>b.addEventListener('click',()=>{game.interact(b.dataset.interaction);record();}));
}
function scheduleEnemy(){if(gameStarted&&game.combat?.phase==='enemy'&&!enemyTimer){const current=game;enemyTimer=setTimeout(()=>{enemyTimer=null;if(game===current&&game.combat?.phase==='enemy'){game.enemyTurn();record();}},950);}else if(game.combat?.phase!=='enemy'&&enemyTimer){clearTimeout(enemyTimer);enemyTimer=null;}}
function render(){
  $('characterName').textContent=game.name;$('characterClass').textContent=game.characterClass;$('hpText').textContent=game.hp+' / '+game.maxHp;$('hpFill').style.width=game.hp/game.maxHp*100+'%';
  $('healthBar').setAttribute('aria-valuemin','0');$('healthBar').setAttribute('aria-valuemax',game.maxHp);$('healthBar').setAttribute('aria-valuenow',game.hp);
  $('ac').textContent=game.ac;$('focus').textContent=game.profile.resource.max?game.focus+' / '+game.profile.resource.max:'—';
  $('weapon').textContent=game.items.get(game.equipment.weapon)?.name||({Fighter:'Uzun kılıç',Mage:'Arkane Kıvılcım',Rogue:'Hançer'})[game.characterClass];$('armor').textContent=game.items.get(game.equipment.armor)?.name||game.profile.armor;$('prepared').textContent=game.prepared?'Hazır':'Hazırlanmamış';
  $('attributes').innerHTML=Object.entries(game.profile.stats).map(([k,v])=>'<span>'+k+'<strong>'+v+'</strong></span>').join('')+'<span>Gizlilik<strong>'+(game.torchLit?'Yok':game.stealth)+'</strong></span>';
  $('questState').textContent=game.completed?'Görev tamamlandı':game.hasStone?'Mühür Taşı sende · Zindan Hücreleri’ne dön':'Görev: Mühür Taşı’nı bul ve zindanlardan kaç';$('objectiveText').textContent=game.hasStone?'Taşı zindanların dış kapısına götür.':'Son haznedeki taşı bul.';
  $('roomName').textContent=game.room.name;$('direction').textContent='Karar '+game.turn;
  $('observation').textContent=game.visibleEnemies.length?(game.room.summary||game.room.description):(game.torchLit?'': 'Karanlıkta yalnızca hemen çevreni seçebiliyorsun. ')+game.room.quiet_summary||(game.torchLit?'Meşalenin ışığı '+game.room.name+' odasının taşlarını aydınlatıyor. Uzak köşeler hâlâ gölgede.':game.room.name+' karanlığa gömülmüş. Yalnızca hemen çevrendeki taşları seçebiliyorsun.');$('roomCounter').textContent='ODA '+game.room.number;$('lightLevel').textContent=game.room.mood;$('position').textContent=game.visited.size+' / '+MAP.rooms.length+' oda keşfedildi';$('message').textContent=game.message;
  const fighting=!!game.combat,canAct=game.canAct()&&gameStarted;
  $('combatActions').hidden=!fighting;$('combatState').textContent=fighting?(game.combat.phase==='player'?'Sıra sende':'Düşman saldırıyor…'):'';$('actionPoints').textContent=fighting?(game.combat.phase==='player'?game.combat.ap+' / 3 aksiyon':'Bekle…'):'';
  $('attackButton').disabled=!fighting||!canAct||!game.prepared||game.combat.ap<game.attackCost;$('fleeButton').disabled=!fighting||!canAct;$('endTurnButton').disabled=!fighting||!canAct;
  $('attackLabel').textContent=game.attackSpec.name+' · '+game.attackCost+' hak';$('combatPrepareButton').hidden=!fighting||game.prepared;$('combatPrepareButton').disabled=!canAct;
  $('potionButton').textContent='İksir iç ('+game.potions+')'+(fighting?' · 1 hak':'');$('potionButton').hidden=!game.potions;$('potionButton').disabled=!canAct||!game.potions||game.hp===game.maxHp;
  $('lootButton').hidden=true;$('stoneButton').hidden=true;
  $('restButton').hidden=game.roomId!=='seal_room'||game.restUsed||fighting;$('restButton').disabled=!canAct;
  $('sealButton').hidden=game.roomId!=='seal_room'||game.sealSolved||fighting;$('sealButton').disabled=!canAct;
  $('meditateButton').hidden=game.characterClass!=='Mage'||game.focus>=game.profile.resource.max||fighting;$('meditateButton').disabled=!canAct;
  $('turnBuff').hidden=!game.damageBuff;$('turnBuff').textContent=game.damageBuff?'Bu tur +'+game.damageBuff.bonus+' hasar':'';$('hiddenStatus').hidden=!game.bypassed;$('hiddenStatus').textContent='Düşmanı sessizce aştın';
  $('gameShell').classList.toggle('torch-lit',game.torchLit);$('gameShell').classList.toggle('inactive',!gameStarted);document.body.classList.toggle('dead-screen',game.dead);
  if(game.hp<lastHP){$('gameShell').classList.remove('hit');void $('gameShell').offsetWidth;$('gameShell').classList.add('hit');if(damageTimer)clearTimeout(damageTimer);damageTimer=setTimeout(()=>{$('gameShell').classList.remove('hit');damageTimer=null;},450);}lastHP=game.hp;
  portrait();renderInventoryPanel();renderChoices();drawScene();renderMinimap();scheduleEnemy();if($('inventoryDialog').open)renderInventory();
  if(game.dead&&deathPresentedFor!==game){deathPresentedFor=game;for(const id of ['mapDialog','inventoryDialog','fleeDialog','sealDialog','lootDialog','readingDialog','roomDetailsDialog'])if($(id).open)$(id).close();$('deathText').textContent=game.room.name+' son gördüğün yer oldu.';$('deathDialog').showModal();}
  if(game.completed&&victoryPresentedFor!==game){victoryPresentedFor=game;$('outcomeText').textContent=game.name+' Mühür Taşı ile zindanlardan kurtuldu. Görevin tamamlandı!';$('outcomeDialog').showModal();}
}
function record(){history.push({turn:game.turn,message:game.message});if(history.length>80)history.shift();render();}
function showFlee(){if(!game.combat||!game.canAct())return;$('fleeDirections').innerHTML=['İleri','Sağa','Geri','Sola'].map((label,i)=>'<button class="context-button" data-flee-dir="'+((game.facing+i)%4)+'">'+label+' kaç · en fazla 3 blok</button>').join('');$('fleeDirections').querySelectorAll('[data-flee-dir]').forEach(b=>b.addEventListener('click',()=>{game.flee(Number(b.dataset.fleeDir));$('fleeDialog').close();record();}));$('fleeDialog').showModal();}
function showLoot(uid){const entry=game.nearbyLoot.find(e=>uid?e.uid===uid:game.canTakeLoot(e));if(!entry||!game.canTakeLoot(entry))return;game.lastLoot=[];const weapon=game.items.get(entry.id).slot==='weapon';if(!weapon&&!game.takeLoot(entry.uid))return;$('lootReveal').innerHTML=(weapon?[]:game.lastLoot).map(e=>'<figure>'+itemArt(e.id)+'<figcaption>'+escapeHTML(game.items.get(e.id).name)+(e.quantity>1?' ×'+e.quantity:'')+'</figcaption></figure>').join('');renderWeaponChoices(weapon?entry.uid:null);$('lootDialog').showModal();}
function renderWeaponChoices(uid){const held=game.items.get(game.equipment.weapon);$('weaponChoices').innerHTML=game.nearbyLoot.filter(e=>e.uid===uid&&game.items.get(e.id).slot==='weapon').map(e=>{const item=game.items.get(e.id);return '<div class="weapon-choice">'+itemArt(e.id)+'<div><strong>'+escapeHTML(item.name)+'</strong><p>'+escapeHTML(item.description)+'</p><button class="context-button" data-take-weapon="'+e.uid+'">'+escapeHTML(held.name)+' bırak → bunu al</button></div></div>';}).join('');$('weaponChoices').querySelectorAll('[data-take-weapon]').forEach(b=>b.addEventListener('click',()=>{const entry=game.roomLoot.find(e=>e.uid===b.dataset.takeWeapon);if(entry&&game.takeWeapon(entry.id,entry.uid)){record();$('lootReveal').innerHTML='<figure>'+itemArt(entry.id)+'<figcaption>'+escapeHTML(game.items.get(entry.id).name)+' alındı</figcaption></figure>';renderWeaponChoices(null);}}));}
function action(name){if(!gameStarted)return;const calls={torch:()=>game.toggleTorch(),prepare:()=>game.prepare(),inspect:()=>{game.inspect();render();$('roomDetailsDialog').showModal();},sneak:()=>game.sneak(),engage:()=>game.engage(),attack:()=>game.attack(),flee:()=>showFlee(),endTurn:()=>game.endTurn(),potion:()=>game.drinkPotion(),rest:()=>game.rest(),meditate:()=>game.meditate(),loot:()=>showLoot()};if(calls[name]){const before=game.turn,message=game.message;calls[name]();if(before!==game.turn||message!==game.message)record();else render();}}
function previousRiddle(){try{return localStorage.getItem('lastDungeonRiddle');}catch{return null;}}
function startAdventure(name,cls){if(enemyTimer){clearTimeout(enemyTimer);enemyTimer=null;}if(damageTimer){clearTimeout(damageTimer);damageTimer=null;}$('gameShell').classList.remove('hit');game=new DungeonExplorer(MAP,RULES,cls,name,{bestiary:BESTIARY,loot:LOOT,previousRiddleId:previousRiddle()});try{localStorage.setItem('lastDungeonRiddle',game.riddle.id);}catch{}lastHP=game.hp;history=[{turn:1,message:game.message}];gameStarted=false;victoryPresentedFor=null;deathPresentedFor=null;render();$('questDialog').showModal();}
function suggestCharacterNames(fill=true){
  const previous=$('nameInput').value,choices=[];
  const pool=CHARACTER_NAMES.names.flatMap(name=>CHARACTER_NAMES.surnames.map(surname=>name+' '+surname)).filter(name=>name!==previous);
  for(let i=0;i<2&&pool.length;i++)choices.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  $('nameSuggestions').innerHTML=choices.map(name=>'<button type="button" class="quiet-button" data-suggested-name="'+escapeHTML(name)+'">'+escapeHTML(name)+'</button>').join('');
  $('nameSuggestions').querySelectorAll('[data-suggested-name]').forEach(button=>button.addEventListener('click',()=>{$('nameInput').value=button.dataset.suggestedName;$('nameInput').setCustomValidity('');}));
  if(fill&&choices.length){$('nameInput').value=choices[0];$('nameInput').setCustomValidity('');}
}
function openCharacterDialog(first=false){$('nameInput').value=first?'':game.name;suggestCharacterNames(first);$('classInput').value=game.characterClass;$('creationCancel').hidden=first;$('creationTitle').textContent=first?'Zindanlardan bir hikâye':'Yeni bir macera';$('classDescription').textContent=RULES.classes[$('classInput').value].role;$('characterDialog').showModal();}
$('rerollName').addEventListener('click',()=>suggestCharacterNames());
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action)));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
$('characterOpen').addEventListener('click',()=>openCharacterDialog(!gameStarted));$('classInput').addEventListener('change',()=>$('classDescription').textContent=RULES.classes[$('classInput').value].role);
$('characterForm').addEventListener('submit',event=>{event.preventDefault();const name=$('nameInput').value.trim();if(!name){$('nameInput').setCustomValidity('Karakterine bir ad ver.');$('nameInput').reportValidity();return;}$('characterDialog').close();startAdventure(name,$('classInput').value);});$('nameInput').addEventListener('input',()=>$('nameInput').setCustomValidity(''));
for(const id of ['questDialog','deathDialog','departureDialog'])$(id).addEventListener('cancel',e=>e.preventDefault());$('characterDialog').addEventListener('cancel',e=>{if(!gameStarted)e.preventDefault();});
$('acceptQuest').addEventListener('click',()=>{gameStarted=true;$('questDialog').close();render();});$('historyOpen').addEventListener('click',()=>{$('history').innerHTML=history.slice().reverse().map(h=>'<li><small>KARAR '+h.turn+'</small><br>'+escapeHTML(h.message)+'</li>').join('');$('historyDialog').showModal();});
$('inventoryOpen').addEventListener('click',()=>{if(gameStarted){renderInventory();$('inventoryDialog').showModal();}});
$('sealButton').addEventListener('click',()=>{const r=game.riddle;$('riddleQuestion').textContent=r.question;$('riddleHint').textContent=r.hint;$('riddleHint').hidden=true;$('sealFeedback').textContent='Yazıttaki soruyu düşün ve bir cevap seç.';$('riddleSource').innerHTML='Klasik bilmece uyarlaması · <a href="'+escapeHTML(r.source)+'" target="_blank" rel="noopener">Kaynak</a>';$('riddleOptions').innerHTML=r.options.map((o,i)=>'<button class="context-button" data-answer="'+i+'">'+String.fromCharCode(65+i)+'. '+escapeHTML(o)+'</button>').join('');$('riddleOptions').querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{const correct=game.answerRiddle(Number(b.dataset.answer));record();if(correct)$('sealDialog').close();else $('sealFeedback').textContent=game.message;}));$('sealDialog').showModal();});$('riddleHintButton').addEventListener('click',()=>$('riddleHint').hidden=false);
$('deathRestart').addEventListener('click',()=>{$('deathDialog').close();startAdventure(game.name,game.characterClass);});$('deathExit').addEventListener('click',()=>{$('deathDialog').close();gameStarted=false;render();$('departureDialog').showModal();});$('departureRestart').addEventListener('click',()=>{$('departureDialog').close();openCharacterDialog(true);});$('outcomeRestart').addEventListener('click',()=>{$('outcomeDialog').close();openCharacterDialog();});
function portrait(){
  const common='<path d="M14 126Q19 94 44 88H76Q102 94 108 126" fill="#47523b" stroke="#a79770" stroke-width="2"/><path d="M44 88L60 114L76 88" fill="#161f19"/>';
  const faces={
    Fighter:'<path d="M33 79V40Q33 13 60 12Q87 13 87 40V79L60 98Z" fill="#6a7561" stroke="#c7bb91" stroke-width="2"/><path d="M60 15V97M35 53H85" stroke="#c7bb91" stroke-width="3"/><path d="M39 48H53V57H39ZM67 48H81V57H67Z" fill="#141b16"/><path d="M45 70H54M66 70H75M44 78H54M66 78H76" stroke="#27342a" stroke-width="3"/>',
    Mage:'<path d="M26 60L57 5L80 50L97 60Z" fill="#5c5473" stroke="#bdb0d4" stroke-width="2"/><path d="M39 63Q38 91 60 100Q82 91 81 63" fill="#b59d7c"/><path d="M49 75H54M68 75H73" stroke="#2a2a37" stroke-width="3"/><path d="M41 84Q59 95 79 84L68 113H52Z" fill="#c9c8b5"/><path d="M27 60Q58 68 97 60" stroke="#d1be8b" stroke-width="4"/>',
    Rogue:'<path d="M26 79Q23 30 60 14Q97 30 94 79L78 98H42Z" fill="#303f35" stroke="#9aaf8e" stroke-width="2"/><path d="M39 57Q60 40 82 57L74 92H47Z" fill="#9a866b"/><path d="M37 74H83L74 94H47Z" fill="#212b23"/><path d="M44 64H53M66 64H75" stroke="#18231b" stroke-width="3"/>'
  };
  $('portrait').innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 135">'+common+faces[game.characterClass]+(game.prepared?(game.characterClass==='Mage'?'<circle data-prepared="magic" cx="95" cy="103" r="15" fill="#93bdda" opacity=".35"/><path d="M95 87L98 99L110 103L98 107L95 119L91 107L80 103L91 99Z" fill="#deefff"/>':'<g data-prepared="weapon"><path d="M93 116V54L98 47L103 54V116Z" fill="#cdd3bd" stroke="#e9deb3"/><path d="M87 110H109M98 112V130" stroke="#b9a367" stroke-width="4"/></g>'):'')+'</svg>';
}
function itemArt(id){
  if(id==='torch')return '<svg viewBox="0 0 100 100" role="img" aria-label="'+(game.torchLit?'Yanan':'Sönük')+' meşale"><circle cx="50" cy="50" r="47" fill="#171d1b" stroke="#746443"/><path d="M48 45L42 90H56L54 45Z" fill="#8a6844" stroke="#c09e69" stroke-width="2"/><path d="M35 28L65 28L59 51H41Z" fill="#6b624d" stroke="#bfa474" stroke-width="2"/>'+(game.torchLit?'<path d="M50 5Q70 22 61 36Q53 48 39 36Q30 25 45 16L44 29Z" fill="#df8f38"/><path d="M50 21Q60 32 50 40Q40 35 50 21Z" fill="#ffe29b"/>':'<path d="M39 24L44 15M51 24L53 9M61 24L63 18" stroke="#77786a" stroke-width="2"/>')+'</svg>';

  if(id==='old_map')return '<svg viewBox="0 0 100 100" role="img" aria-label="Eski parşömen harita"><circle cx="50" cy="50" r="47" fill="#171d1b" stroke="#746443"/><path d="M22 17L73 12L79 76L28 85Z" fill="#c5a56c" stroke="#725230" stroke-width="3"/><path d="M28 32H46V46H66V67H43V56H32Z M46 46V60 M36 23L57 21" fill="none" stroke="#735236" stroke-width="2"/><path d="M22 17Q9 14 14 29L22 28M28 85Q18 94 16 80L15 30M73 12Q86 8 87 22L79 24" fill="#dcc18d" stroke="#725230" stroke-width="3"/></svg>'; 
  const potion=id.includes('potion'),color=id==='fury_potion'?'#d95f3b':id==='focus_potion'?'#8d78e0':'#74b59b';
  if(game.items.get(id)?.staff){const hue=id==='lightning_staff'?'#bba6ff':id==='ice_staff'?'#94def5':id==='fireball_staff'?'#f79750':'#a9c3db',symbol=id==='lightning_staff'?'<path d="M55 7L38 29H51L44 43L66 19H53Z" fill="'+hue+'"/>':id==='ice_staff'?'<path d="M50 7V40M36 15L64 32M36 32L64 15" stroke="'+hue+'" stroke-width="4"/>':id==='fireball_staff'?'<path d="M51 7Q70 22 60 38Q40 46 37 29Q35 20 46 15L47 28Z" fill="'+hue+'"/>':'<circle cx="50" cy="25" r="12" fill="'+hue+'"/>';return '<svg viewBox="0 0 100 100" role="img" aria-label="Asa görseli"><circle cx="50" cy="50" r="47" fill="#171d1b" stroke="#746443"/><path d="M50 37V92" stroke="#a48354" stroke-width="7"/><circle cx="50" cy="25" r="23" fill="'+hue+'" opacity=".12"/>'+symbol+'</svg>';}
  const weaponDrawing=({
    battle_axe:'<path d="M50 12V90" stroke="#b18c53" stroke-width="9"/><path d="M48 16Q15 8 18 48L49 37L70 47Q83 12 51 16Z" fill="#9eaaac" stroke="#e1cb97" stroke-width="2"/>',
    war_hammer:'<path d="M50 28V90" stroke="#a78150" stroke-width="10"/><path d="M17 13H83V43H17Z" fill="#69777b" stroke="#dbbd84" stroke-width="3"/><path d="M27 18V38M72 18V38" stroke="#b4a078" stroke-width="4"/>',
    iron_mace:'<path d="M50 35V89" stroke="#a78150" stroke-width="9"/><path d="M50 6L60 17L76 20L68 35L63 49H36L30 35L23 20L39 17Z" fill="#8d9a9e" stroke="#d6be85" stroke-width="2"/><path d="M50 14V43" stroke="#e4d2a4" stroke-width="3"/>',
    ash_spear:'<path d="M50 35V94" stroke="#b08f5e" stroke-width="6"/><path d="M50 5L63 28L50 47L37 28Z" fill="#bcc9ca" stroke="#e5d6b2" stroke-width="2"/>'
  })[id];
  const drawing=weaponDrawing?weaponDrawing:potion?'<path d="M40 10H60V35Q82 48 80 70Q78 90 50 92Q22 90 20 70Q18 48 40 35Z" fill="#293b36" stroke="#b7c9b8" stroke-width="2"/><path d="M24 62Q50 54 76 62L74 77Q67 90 50 88Q33 90 26 77Z" fill="'+color+'"/><path d="M39 9H61V20H39Z" fill="#99734c"/><path d="M32 49L29 66" stroke="#f2f2d8" stroke-width="3"/>':id==='warded_armor'?'<path d="M25 20L40 10L50 22L60 10L75 20L91 45L75 55L71 42L68 88H32L29 42L25 55L9 45Z" fill="#526065" stroke="#cdb988" stroke-width="2"/><path d="M50 28V78M35 40L50 49L65 40M35 60L50 69L65 60" stroke="#d4b674" stroke-width="3"/>':id==='shadow_cloak'?'<path d="M50 8Q20 10 26 36L13 90Q50 73 87 90L74 36Q80 10 50 8Z" fill="#38475b" stroke="#acb3b2" stroke-width="2"/><path d="M35 35Q50 14 65 35L50 47Z" fill="#111922"/><path d="M40 50L30 80M60 50L70 80" stroke="#70848d"/>':(id==='magic'||id==='starter_mage'||id==='rune_staff')?'<path d="M50 7L60 35L88 50L60 60L50 93L39 60L12 50L39 35Z" fill="#a5cdf1" stroke="#eee3ff" stroke-width="2"/><circle cx="50" cy="50" r="12" fill="#f1ecff"/>':id==='seal_stone'?'<path d="M50 9L80 29L75 72L50 91L25 72L20 29Z" fill="#50b895" stroke="#d0e8ab" stroke-width="3"/><path d="M50 9V91M20 29L75 72M80 29L25 72" stroke="#a9e8c5"/>':'<path d="M67 10L80 12L74 29L42 68L33 61Z" fill="#c4cdcf" stroke="#eee1b7" stroke-width="2"/><path d="M25 56L49 76M36 66L21 86" stroke="#bb9357" stroke-width="7"/><circle cx="19" cy="89" r="5" fill="#b79568"/>';
  return '<svg viewBox="0 0 100 100" role="img" aria-label="Eşya görseli"><circle cx="50" cy="50" r="47" fill="#171d1b" stroke="#746443"/>'+drawing+'</svg>';
}
function inventoryEntries(){return [...Object.entries(game.inventory).filter(([id,q])=>q>0).map(([id,quantity])=>({id,quantity})),...(game.potions?[{id:'healing_potion',quantity:game.potions}]:[]),...(game.hasStone?[{id:'seal_stone',quantity:1}]:[])];}
function renderInventoryPanel(){
  $('inventorySlots').innerHTML=inventoryEntries().map(e=>'<button class="item-slot" data-inventory-item="'+e.id+'">'+itemArt(e.id)+'<span>'+escapeHTML(e.base?(game.characterClass==='Mage'?'Arkane Kıvılcım':game.characterClass==='Rogue'?'Hançer':'Uzun Kılıç'):game.items.get(e.id).name)+(e.quantity>1?' ×'+e.quantity:'')+'</span></button>').join('');
  $('inventorySlots').querySelectorAll('[data-inventory-item]').forEach(button=>button.addEventListener('click',()=>{if(gameStarted){if(button.dataset.inventoryItem==='torch'){game.toggleTorch();record();return;}if(button.dataset.inventoryItem==='old_map')return openDungeonMap();renderInventory();$('inventoryDialog').showModal();}}));
}
function renderInventory(){
  const entries=[...(game.potions?[{id:'healing_potion',quantity:game.potions}]:[]),...Object.entries(game.inventory).filter(([id,quantity])=>quantity>0).map(([id,quantity])=>({id,quantity}))];
  $('inventoryItems').innerHTML=entries.map(entry=>{const item=game.items.get(entry.id),equipped=item.slot&&game.equipment[item.slot]===item.id;
    return '<div class="inventory-item"><strong>'+escapeHTML(item.name)+' ×'+entry.quantity+(equipped?' <small>· Kuşanılmış</small>':'')+'</strong><p>'+escapeHTML(item.description)+'</p><button class="context-button" data-use-item="'+item.id+'" '+(game.canUseItem(item.id)?'':'disabled')+'>'+(equipped?'Kuşanılmış':item.type==='torch'?(game.torchLit?'Söndür':'Yak'):item.type==='map'?'Haritayı aç':item.type==='equipment'?'Kuşan':'Kullan')+'</button></div>';
  }).join('')+(game.hasStone?'<div class="inventory-item"><strong>Mühür Taşı</strong><p>Görev eşyası · Mahzen girişine götür.</p></div>':'');
  $('inventoryItems').querySelectorAll('[data-use-item]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.useItem==='old_map')return openDungeonMap();game.useItem(button.dataset.useItem);record();}));
}


function hideDoorPreview(){$('doorPreview').hidden=true;}
function showDoorPreview(button){
  if(!gameStarted)return;
  const room=MAP.rooms.find(r=>r.id===button.dataset.previewRoom),door=game.doors().find(d=>d.id===button.dataset.previewDoor);
  if(!room)return;
  const tip=$('doorPreview'),reason=door?(game.gateReason(door)||game.passageNarrative(door)):'';
  tip.innerHTML='<img src="'+ASSETS[room.art]+'" alt="'+escapeHTML(room.name)+' görünümü"><strong>'+escapeHTML(room.name)+'</strong><small>'+escapeHTML(reason||'Bu kapı '+room.name+' odasına açılır.')+'</small>';
  tip.hidden=false;button.setAttribute('aria-describedby','doorPreview');
  const rect=button.getBoundingClientRect(),width=tip.offsetWidth,height=tip.offsetHeight;
  tip.style.left=Math.max(8,Math.min(window.innerWidth-width-8,rect.left-width-12>=8?rect.left-width-12:rect.right+12))+'px';
  tip.style.top=Math.max(8,Math.min(window.innerHeight-height-8,rect.top))+'px';
}
function openDungeonMap(){
  if(!gameStarted||!game.inventory.old_map||game.dead)return;
  hideDoorPreview();
  const s=14,ox=52,oy=74;
  const paths=MAP.connections.map(c=>'<polyline points="'+c.points.map(p=>[ox+p[0]*s,oy+p[1]*s].join(',')).join(' ')+'" fill="none" stroke="#715234" stroke-width="3" '+(c.kind!=='common'?'stroke-dasharray="5 4"':'')+'/>').join('');
  const rooms=MAP.rooms.map(r=>{const [x,y,w,h]=r.bounds,cx=ox+(x+w/2)*s,cy=oy+(y+h/2)*s;return '<g><rect x="'+(ox+x*s)+'" y="'+(oy+y*s)+'" width="'+w*s+'" height="'+h*s+'" rx="2" fill="#d3b780" stroke="#61452d" stroke-width="2"/><rect x="'+(ox+x*s+2)+'" y="'+(oy+y*s+2)+'" width="'+(w*s-4)+'" height="'+(h*s-4)+'" fill="none" stroke="#715234" opacity=".35"/><text x="'+cx+'" y="'+(cy+5)+'" text-anchor="middle" font-size="18" fill="#4b3422">'+r.number+'</text>'+(r.id===game.roomId?'<circle cx="'+cx+'" cy="'+cy+'" r="18" fill="none" stroke="#963c2d" stroke-width="3"/>':'')+'</g>';}).join('');
  $('mapPaper').innerHTML='<div class="map-inscription"><span>Bir tutsağın kaydı</span><h2>Unutulmuş Mühür Mahzeni</h2><p>Demirin altında yollar, yolların sonunda mühür.</p></div><div class="parchment-layout"><svg viewBox="0 0 800 620" role="img" aria-label="Mahzenin eski haritası. Kırmızı halka bulunduğun odayı gösterir."><defs><filter id="paperGrain"><feTurbulence baseFrequency=".055" numOctaves="3" seed="8"/><feColorMatrix type="saturate" values="0"/></filter></defs><path d="M15 35Q400 8 780 30L775 594Q400 614 20 591Z" fill="none" stroke="#83633b" stroke-width="2" opacity=".5"/><path d="M393 28L400 599M21 308L778 312" stroke="#795732" opacity=".18"/>'+paths+rooms+'<g transform="translate(707 80)" fill="#62462d"><path d="M0 -34L7 -7L34 0L7 7L0 34L-7 7L-34 0L-7 -7Z"/><circle r="12" fill="#cfb17b" stroke="#62462d"/><text y="-43" text-anchor="middle" font-size="19">K</text></g><text x="48" y="607" font-size="15" fill="#62462d">Kesik çizgiler: özel geçitler</text><rect width="800" height="620" filter="url(#paperGrain)" opacity=".07" pointer-events="none"/></svg><ol class="map-room-index">'+MAP.rooms.map(r=>'<li '+(r.id===game.roomId?'class="current-map-room"':'')+'><span>'+r.number+'</span>'+escapeHTML(r.name)+(r.id===game.roomId?'<small>Buradasın</small>':'')+'</li>').join('')+'</ol></div><p class="map-footnote">Bazı yollar güç, bazıları bilgi, bazıları sessizlik ister. Kırmızı halka bulunduğun odayı gösterir.</p>';
  if($('inventoryDialog').open)$('inventoryDialog').close();
  if(!$('mapDialog').open)$('mapDialog').showModal();
}
if(typeof window!=='undefined')window.addEventListener('resize',hideDoorPreview);

render();openCharacterDialog(true);
