(function(root){
  class DungeonExplorer {
    constructor(map,rules,characterClass='Fighter',name='Kaşif',options={}){
      if(!rules.classes[characterClass])throw new Error('Unknown class');
      this.map=map;this.rules=rules;this.characterClass=characterClass;this.name=name;this.random=options.random||Math.random;
      this.profile=rules.classes[characterClass];this.hp=this.maxHp=this.profile.hp_base+this.mod('STR');this.ac=10+this.mod('DEX')+this.profile.armor_bonus;
      this.focus=this.profile.resource.max;this.roomId=map.start;this.entry=null;this.prepared=false;this.turn=1;this.alarm=0;
      this.opened=new Set();this.visited=new Set([map.start]);this.inspected=new Set();this.readEntries=new Set();this.interacted=new Set();
      this.sealSolved=false;this.combat=null;this.dead=false;this.completed=false;this.hasStone=false;this.potions=0;this.restUsed=false;this.finalAdvantage=false;
      this.hidden=false;this.bypassed=false;this.damageBuff=null;this.lastLoot=[];this.events=[];this.enemies=[];this.notice=null;this.resultNotice=null;this.noticedEnemies=new Set();
      this.items=new Map((options.loot?.items||[]).map(item=>[item.id,item]));this.inventory={};this.equipment={};this.collectedRooms=new Set();
      const starter={id:'starter_'+characterClass.toLowerCase(),name:({Fighter:'Uzun Kılıç',Mage:'Rün Kıvılcımı',Rogue:'Hançer'})[characterClass],type:'equipment',slot:'weapon',classes:[characterClass],description:'Başlangıç silahın / büyün.',damage_dice:this.profile.damage,damage_stat:this.profile.damage_stat};this.items.set(starter.id,starter);this.inventory[starter.id]=1;this.equipment.weapon=starter.id;
      this.torchLit=false;this.justEntered=true;this.items.set('torch',{id:'torch',name:'Meşale',type:'torch',description:'Yakınca görüşün 3 blok, sönükken 1 blok. Yanan meşaleyle gizlenemezsin. Combat sırasında yakmak veya söndürmek 1 aksiyon harcar.'});this.inventory.torch=1;
      this.groundWeapons={};this.facing=0;this.position=this.spawnPosition();
      const definitions=new Map((options.bestiary?.monsters||[]).map(m=>[m.id,m]));
      for(const room of map.rooms)for(const encounter of room.monsters||[]){const definition=definitions.get(encounter.id);if(!definition)throw Error('Missing monster: '+encounter.id);for(let i=0;i<encounter.count;i++){const p=options.fixedSpawns?(encounter.positions?.[i]||[Math.floor(room.bounds[2]/2)+i,Math.floor(room.bounds[3]/2)]):this.randomEnemyPosition(room,definition);this.enemies.push({id:room.id+':'+encounter.id+':'+i,roomId:room.id,position:{x:room.bounds[0]+p[0],y:room.bounds[1]+p[1]},definition,hp:definition.hp,maxHp:definition.hp,alert:false});}}
      const pool=map.riddles||[],candidates=pool.filter(r=>r.id!==options.previousRiddleId);this.riddle=(candidates.length?candidates:pool)[Math.floor(this.random()*(candidates.length||pool.length))];
      this.floorLoot=[];this.lootSerial=0;
      for(const room of map.rooms){const [rx,ry,w,h]=room.bounds,center={x:rx+Math.floor(w/2),y:ry+Math.floor(h/2)},cells=[];
        for(let y=ry;y<ry+h;y++)for(let x=rx;x<rx+w;x++)if(!this.isDoorPosition({x,y},room)&&!(room.pillars||[]).some(p=>p[0]+rx===x&&p[1]+ry===y)&&!this.enemies.some(e=>e.roomId===room.id&&this.enemyOccupies(e,{x,y})))cells.push({x,y});
        cells.sort((a,b)=>this.distance(a,center)-this.distance(b,center)||a.y-b.y||a.x-b.x);
        const entries=[...(room.loot||[])];

        for(const [i,entry] of entries.entries())this.floorLoot.push({uid:'loot:'+this.lootSerial++,roomId:room.id,id:entry.id,quantity:entry.quantity,position:{...(cells[i%cells.length])}});
      }
      this.traps=[];this.pendingTrapEncounter=false;this.spawnTraps();
      this.say('Soğuk bir hücrede gözlerini açıyorsun. Kilit kırılmış; Doğu Kapısı’nın alt geçidi aralık. Henüz silahını hazırlamadın.');
    }
    get room(){return this.map.rooms.find(r=>r.id===this.roomId);}
    get currentEnemies(){return this.enemies.filter(e=>e.roomId===this.roomId&&e.hp>0);}
    get sightRadius(){return this.torchLit?3:1;}
    canSee(p){
      if(this.distance(this.position,p)>this.sightRadius)return false;
      const heading=[[0,-1],[1,0],[0,1],[-1,0]][this.facing],offsetX=p.x-this.position.x,offsetY=p.y-this.position.y;
      const forward=offsetX*heading[0]+offsetY*heading[1],sideways=offsetX*heading[1]-offsetY*heading[0];
      if(forward<Math.abs(sideways))return false;
      let x=this.position.x,y=this.position.y;const dx=Math.abs(p.x-x),dy=Math.abs(p.y-y),sx=x<p.x?1:-1,sy=y<p.y?1:-1;let error=dx-dy;
      while(x!==p.x||y!==p.y){const twice=2*error;if(twice>-dy){error-=dy;x+=sx;}if(twice<dx){error+=dx;y+=sy;}if(x===p.x&&y===p.y)return true;if(!this.walkable({x,y}))return false;}
      return true;
    }
    enemyCells(enemy){const [w,h]=enemy.definition?.footprint||[1,1],cells=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)cells.push({x:enemy.position.x+x,y:enemy.position.y+y});return cells;}
    enemyOccupies(enemy,p){return this.enemyCells(enemy).some(q=>q.x===p.x&&q.y===p.y);}
    enemyDistance(enemy,p){return Math.min(...this.enemyCells(enemy).map(q=>this.distance(p,q)));}
    get visibleEnemies(){return this.currentEnemies.filter(e=>this.combat?e.alert||e.id===this.combat.target:this.torchLit&&this.enemyCells(e).some(p=>this.canSee(p)));}
    get enemyHint(){const unseen=this.currentEnemies.filter(e=>!this.visibleEnemies.includes(e));if(!unseen.length)return '';const kinds=new Set(unseen.map(e=>e.definition.kind)),hints=[];if(kinds.has('goblin'))hints.push('Tam kestiremiyorsun ama karanlığın içinden boğuk homurtular ve taşta sürüklenen metal sesleri duyuyorsun.');if(kinds.has('spider'))hints.push('Gölgelerden ince hıslamalar geliyor. Bir şey taşların üzerinde hızla sürünüyor.');if(kinds.has('troll'))hints.push('Derin, ağır bir hırıltı duyuyorsun. Çok ağır ayak sesleri zemini titretiyor.');if(kinds.has('barrow_wight'))hints.push('Taş duvarlardan soğuk, boğuk bir fısıltı geliyor. Hava birden buz kesiyor.');if(kinds.has('warg'))hints.push('Karanlıkta alçak bir hırıltı ve taşları çizen pençe sesleri duyuyorsun.');return hints.join(' ');}
    get visibleLoot(){return this.roomLoot.filter(e=>e.id==='old_map'&&this.roomId===this.map.start||this.canSee(e.position));}
    toggleTorch(){if(!this.canAct())return;this.begin();this.torchLit=!this.torchLit;this.justEntered=false;if(this.torchLit){this.hidden=false;this.bypassed=false;}this.finish(this.torchLit?'Meşaleyi yakıyorsun. Görüşün genişledi, ama ışığın içinde gizlenemezsin.':'Meşaleyi söndürüyorsun. Yalnızca hemen çevreni seçebiliyorsun; artık gölgelere karışabilirsin.');if(this.combat)this.spendAP();else this.checkEncounter();}
    get target(){return this.combat?this.currentEnemies.find(e=>e.id===this.combat.target)||this.currentEnemies[0]:null;}
    get stealth(){return this.mod('DEX')+this.profile.stealth_modifier+(this.characterClass==='Rogue'?4:0)+(this.items.get(this.equipment.cloak)?.stealth_bonus||0)+(this.items.get(this.equipment.weapon)?.stealth_bonus||0);}
    get stealthDC(){return ({Fighter:18,Mage:15,Rogue:11})[this.characterClass]+(this.room.stealth_difficulty||0);}
    get roomLoot(){return this.floorLoot.filter(e=>e.roomId===this.roomId&&e.quantity>0);}
    get nearbyLoot(){return this.roomLoot.filter(e=>this.distance(this.position,e.position)<=1);}
    get availableLoot(){return this.roomLoot.filter(e=>this.items.get(e.id)?.slot!=='weapon');}
    get weaponBonus(){const item=this.items.get(this.equipment.weapon);return item?.staff&&this.characterClass!=='Mage'?0:item?.damage_bonus||0;}
    get attackSpec(){const item=this.items.get(this.equipment.weapon);if(item?.staff){if(this.characterClass!=='Mage')return {dice:'1d4',stat:'STR',bonus:0,ap:1,name:'Sopa vuruşu'};return {dice:item.spell?.damage_dice||this.profile.damage,stat:'INT',bonus:item.damage_bonus||0,ap:item.spell?.ap_cost||1,name:item.spell?.name||'Rün darbesi',effect:item.spell?.effect,piercing:item.spell?.armor_piercing||0};}return {dice:item?.damage_dice||this.profile.damage,stat:item?.damage_stat||this.profile.damage_stat,bonus:this.weaponBonus,ap:item?.ap_cost||1,name:this.characterClass==='Mage'?'Büyü saldırısı':'Saldır'};}
    get attackCost(){return this.attackSpec.ap;}
    get availableWeapons(){return [...new Set(this.roomLoot.filter(e=>this.items.get(e.id)?.slot==='weapon').map(e=>e.id))];}
    canTakeLoot(entry){const item=this.items.get(entry.id);return this.available()&&!this.combat&&this.visibleLoot.includes(entry)&&this.distance(this.position,entry.position)<=1&&(!this.visibleEnemies.length||this.bypassed)&&(!item.classes||item.classes.includes(this.characterClass));}
    randomEnemyPosition(room,definition){
      const [rx,ry,w,h]=room.bounds,cells=[],doors=this.map.connections.filter(c=>c.from===room.id||c.to===room.id).map(c=>{const q=c.points[c.from===room.id?0:c.points.length-1];return {x:Math.max(rx,Math.min(rx+w-1,q[0])),y:Math.max(ry,Math.min(ry+h-1,q[1]))};});
      const [fw,fh]=definition?.footprint||[1,1];
      for(let y=ry+1;y<=ry+h-fh-1;y++)for(let x=rx+1;x<=rx+w-fw-1;x++){const p={x,y},area=this.enemyCells({position:p,definition});if(area.every(q=>!this.isDoorPosition(q,room)&&!(room.pillars||[]).some(v=>v[0]+rx===q.x&&v[1]+ry===q.y)&&!this.enemies.some(e=>e.roomId===room.id&&this.enemyOccupies(e,q))))cells.push(p);}
      const interior=cells.filter(p=>doors.every(d=>this.distance(p,d)>1)),pool=interior.length?interior:cells;if(!pool.length)throw Error('No interior enemy spawn block in '+room.id);const p=pool[Math.min(pool.length-1,Math.floor(this.random()*pool.length))];return [p.x-rx,p.y-ry];
    }
    spawnTraps(){
      for(const room of this.map.rooms){if(!room.traps)continue;const [rx,ry,w,h]=room.bounds,cells=[];
        for(let y=ry;y<ry+h;y++)for(let x=rx;x<rx+w;x++){const p={x,y};if(!this.isDoorPosition(p,room)&&!(room.pillars||[]).some(q=>q[0]+rx===x&&q[1]+ry===y)&&!this.floorLoot.some(e=>e.roomId===room.id&&this.distance(e.position,p)===0)&&!this.enemies.some(e=>e.roomId===room.id&&this.enemyOccupies(e,p)))cells.push(p);}
        if(cells.length<room.traps.count)throw Error('Not enough safe trap blocks: '+room.id);
        for(let i=0;i<room.traps.count;i++){const index=Math.min(cells.length-1,Math.floor(this.random()*cells.length));this.traps.push({roomId:room.id,position:cells.splice(index,1)[0],triggered:false,definition:room.traps});}
      }
    }
    triggerTrap(){
      const trap=this.traps.find(t=>t.roomId===this.roomId&&!t.triggered&&this.distance(t.position,this.position)===0);if(!trap)return false;
      trap.triggered=true;const damage=this.rollDamage(trap.definition.damage_dice);this.hp=Math.max(0,this.hp-damage);this.dead=this.hp===0;if(this.dead)this.combat=null;
      const text=trap.definition.description+' Canın '+damage+' azaldı!';this.say('Bastığın adım tuzak çıktı! '+text);this.resultNotice={title:'Bastığın adım tuzak çıktı!',text,art:trap.definition.art};this.pendingTrapEncounter=!this.dead;return true;
    }
    dismissResult(){this.resultNotice=null;if(this.pendingTrapEncounter){this.pendingTrapEncounter=false;this.checkEncounter();}}
    isDoorPosition(p,room=this.room){
      const [x,y,w,h]=room.bounds;
      return this.map.connections.filter(c=>c.from===room.id||c.to===room.id).some(c=>{const point=c.points[c.from===room.id?0:c.points.length-1];return p.x===Math.max(x,Math.min(x+w-1,point[0]))&&p.y===Math.max(y,Math.min(y+h-1,point[1]));});
    }
    safeLootPosition(preferred){
      const [rx,ry,w,h]=this.room.bounds,cells=[];
      for(let y=ry;y<ry+h;y++)for(let x=rx;x<rx+w;x++){const p={x,y};if(this.walkable(p)&&!this.isDoorPosition(p)&&!this.traps.some(t=>t.roomId===this.roomId&&this.distance(t.position,p)===0)&&!this.currentEnemies.some(e=>this.enemyOccupies(e,p)))cells.push(p);}
      cells.sort((a,b)=>this.distance(a,preferred)-this.distance(b,preferred)||a.y-b.y||a.x-b.x);
      if(!cells.length)throw new Error('No safe floor block for loot');return {...cells[0]};
    }
    spawnPosition(door){const [x,y,w,h]=this.room.bounds;if(door){const c=door.connection,p=c.points[c.from===this.roomId?0:c.points.length-1];return {x:Math.max(x,Math.min(x+w-1,p[0])),y:Math.max(y,Math.min(y+h-1,p[1]))};}return {x:x+Math.floor(w/2),y:y+h-1};}
    walkable(p){const [x,y,w,h]=this.room.bounds;return p.x>=x&&p.x<x+w&&p.y>=y&&p.y<y+h&&!(this.room.pillars||[]).some(v=>v[0]+x===p.x&&v[1]+y===p.y);}
    distance(a,b){return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));}
    nearDoor(door){return this.roomId===this.map.start||this.distance(this.position,this.spawnPosition(door))<=1;}
    navigate(direction){if(!this.available()||this.combat)return false;if(this.facing===direction)return this.move(direction);this.turnFacing((direction-this.facing+4)%4);return true;}
    turnFacing(delta){if(!this.available()||this.combat)return;this.begin();this.justEntered=false;this.facing=(this.facing+delta+4)%4;this.finish(delta>0?'Sağa dönüyorsun.':'Sola dönüyorsun.');this.checkEncounter();}
    move(direction='forward',steps=1){if(!this.available()||this.combat)return false;this.begin();this.justEntered=false;const heading=typeof direction==='number'?direction:(this.facing+(direction==='back'?2:0))%4,vector=[[0,-1],[1,0],[0,1],[-1,0]][heading];let moved=0;
      for(let i=0;i<steps;i++){const p={x:this.position.x+vector[0],y:this.position.y+vector[1]};if(!this.walkable(p))break;this.position=p;moved++;if(this.triggerTrap())break;if(this.checkEncounter(steps>1))break;}
      const encounter=this.events.join('\n');this.events=[];this.finish(moved?(moved+' adım '+(direction==='back'?'geri geliyorsun.':'ilerliyorsun.')+(steps>1?' Ayak seslerin odada yankılanıyor.':'')):'Önünde duvar veya sütun var.');if(encounter)this.say(encounter);return moved>0;}
    mod(stat){return Math.floor((this.profile.stats[stat]-10)/2);}
    roll(sides){return Math.floor(this.random()*sides)+1;}
    rollDamage(expression){const m=/^(\d+)d(\d+)([+-]\d+)?$/.exec(expression);if(!m)throw Error('Invalid dice');let total=Number(m[3]||0);for(let i=0;i<Number(m[1]);i++)total+=this.roll(Number(m[2]));return Math.max(1,total);}
    begin(){this.resultNotice=null;this.events=[];}
    reportResult(title,text){this.resultNotice={title,text};}
    say(message){this.events.push(message);this.message=this.events.join('\n');return this.message;}
    finish(message){this.say(message);this.turn++;return this.message;}
    available(){return !this.dead&&!this.completed;}
    canAct(){return this.available()&&(!this.combat||this.combat.phase==='player');}
    checkEncounter(noisy=false){if(this.combat||this.bypassed||!this.available())return false;if(noisy)this.currentEnemies.filter(e=>this.enemyDistance(e,this.position)<=3).forEach(e=>e.alert=true);const hostile=this.currentEnemies.find(e=>this.enemyDistance(e,this.position)<=1);if(hostile){this.startCombat(hostile,'Düşmanın çok yakınına girdin. '+hostile.definition.name+' seni fark ediyor ve saldırmak için üzerine dönüyor.');return true;}const enemy=this.visibleEnemies.find(e=>!this.noticedEnemies.has(e.id));if(!enemy)return false;enemy.discovered=true;this.noticedEnemies.add(enemy.id);return false;}
    doors(){return this.map.connections.filter(c=>c.from===this.roomId||c.to===this.roomId).map(c=>{const outgoing=c.from===this.roomId,p=c.points[outgoing?0:c.points.length-1],[rx,ry,w,h]=this.room.bounds;return {connection:c,id:c.from+':'+c.to,target:outgoing?c.to:c.from,direction:p[1]===ry?0:p[0]===rx+w?1:p[1]===ry+h?2:3,allowed:c.kind==='common'||c.kind===this.profile.route};});}
    doorLabel(door){const target=this.map.rooms.find(r=>r.id===door.target);return (door.connection.labels?.[this.roomId]||['Karşı kapıdan git','Sağ kapıdan git','Arka kapıdan git','Sol kapıdan git'][door.direction])+' · '+target.name;}
    passageNarrative(door){
      if(door.connection.kind!=='common'&&this.opened.has(door.id)&&door.allowed)return 'Açtığın geçit hâlâ açık. Buradan ilerleyebilirsin.';
      const kind=door.connection.kind,heavy=door.connection.label==='Ağır taş kapak',vent=door.connection.label==='Gizli menfez';
      if(kind==='fighter')return door.allowed?(heavy?'Taş kapağın kenarlarında tutunacak yerler var. Onu kaldırabilecek güce sahip olduğunu fark ediyorsun.':'Duvarın harcı çatlamış. Güçlü bir darbeyle duvarı kırabileceğini fark ediyorsun.'):(heavy?'Taş kapak çok ağır. Bütün gücünle zorluyorsun ama yerinden oynamıyor.':'Duvar çok sert. Zorlasan da taşları kıramıyorsun; geçit açılmıyor.');
      if(kind==='mage')return door.allowed?'Rünlerin içindeki büyüyü tanıyorsun. Mührü çözerek geçidi açabileceğini fark ediyorsun.':'Görünmez bir güç yolu kapatıyor. Bu büyülü mührü ancak bir büyücü çözebilir.';
      if(kind==='rogue')return door.allowed?(vent?'Menfezin ince kilidini fark ediyorsun. Kilidi sessizce açıp dar geçitten süzülebilirsin.':'Taşların arasındaki gizli çıkışı fark ediyorsun. Dikkatlice kıvrılarak dar aralıktan geçebilirsin.'):(vent?'Menfez ince bir kilitle kapalı. Kilidi bozup alarmı tetiklemeden açacak ustalığın yok.':'Çıkış çok dar ve tuzak telleriyle çevrili. Buradan güvenle süzülmek daha çevik, usta bir el ister.');
      return '';
    }
    gateReason(door){if(!door.allowed)return this.passageNarrative(door);if(!this.opened.has(door.id)&&door.connection.kind==='mage'&&this.focus<1)return 'Mührün büyüsünü tanıyorsun ama onu çözecek enerjin kalmamış. Meditasyonla gücünü toparlamalısın.';if(door.connection.gate==='seal_puzzle'&&!this.sealSolved)return 'Rünlü kapı kilitli. Önce bilmecenin cevabını seç.';if(door.connection.gate==='guardian_encounter'&&this.currentEnemies.length&&!this.bypassed)return 'Muhafızı yen veya sessizce geç.';return '';}
    goDoor(id){
      if(!this.available()||this.combat)return false;this.begin();const door=this.doors().find(d=>d.id===id);if(!door)return false;
      const reason=this.gateReason(door);if(reason){this.say(reason);return false;}
      if(!this.nearDoor(door)){this.say('Bu kapıya ulaşmak için minimap üzerinde yaklaşmalısın.');return false;}
      if(!this.opened.has(door.id)&&door.connection.kind==='mage'){if(this.focus<1){this.say('Bu rünlü yan geçit için 1 Focus gerekiyor. Meditasyon yapabilirsin.');return false;}this.focus--;}
      if(!this.opened.has(door.id)&&door.connection.kind==='fighter')this.alarm=Math.min(3,this.alarm+1);
      this.opened.add(door.id);this.entry={roomId:this.roomId,doorId:door.id};this.roomId=door.target;this.hidden=false;this.bypassed=false;this.visited.add(this.roomId);
      this.position=this.spawnPosition(door);this.facing=(this.doors().find(d=>d.id===door.id).direction+2)%4;
      this.justEntered=true;this.notice=null;this.noticedEnemies.clear();this.finish(this.room.name+' odasına giriyorsun. '+(this.torchLit?'Meşalenin ışığı duvarları aydınlatıyor.':'Karanlıkta yalnızca hemen çevreni seçebiliyorsun.')); if(this.roomId===this.map.start&&this.hasStone){this.completed=true;this.say('Mithril külçesini kurtarıp Doğu Kapısı’nın alt geçidine dönüyorsun. Gün ışığına ulaşıyorsun. Görev tamamlandı!');}else {this.checkEncounter();}return true;
    }
    prepare(){if(!this.canAct())return;this.begin();if(this.combat&&this.prepared)return this.say('Silahın zaten hazır.');this.prepared=!this.prepared;this.finish(this.characterClass==='Mage'?(this.prepared?'Avucunda soluk bir kıvılcım beliriyor. Büyün hazır.':'Büyünün ışığını söndürüyorsun.'):(this.prepared?'Silahını çekiyorsun.':'Silahını kınına koyuyorsun.'));if(this.combat)this.spendAP();}
    inspect(){if(!this.canAct()||this.combat)return;this.begin();this.inspected.add(this.roomId);this.finish(this.visibleEnemies.length?this.room.inspection:(this.room.quiet_inspection||this.room.quiet_summary||this.room.inspection));if(['archive','rubble'].includes(this.roomId)){this.finalAdvantage=true;this.say('Muhafızın savunmasındaki boşluğu öğreniyorsun. Ona karşı ilk saldırın avantajlı.');}}
    readEntry(id){if(!this.available()||this.combat)return null;const entry=(this.room.readings||[]).find(e=>e.id===id);if(!entry)return null;this.readEntries.add(this.roomId+':'+id);this.begin();this.finish(entry.title+' metnini okuyorsun.');return entry;}
    interact(id){if(!this.canAct()||this.combat)return;const interaction=(this.room.interactions||[]).find(e=>e.id===id);if(!interaction)return;this.begin();const key=this.roomId+':'+id;if(this.interacted.has(key))return this.say('Buradaki imkânı zaten kullandın.');
      if(this.visibleEnemies.length&&!this.bypassed)return this.say('Önce düşmandan sıyrılmalısın.');
      if(interaction.check&&this.roll(20)+this.mod(interaction.check.stat)<interaction.check.dc){this.finish(interaction.failure||'Mekanizma seni geri itiyor; yeniden deneyebilirsin.');return;}
      this.interacted.add(key);if(interaction.effect==='heal'){this.hp=Math.min(this.maxHp,this.hp+interaction.amount);}if(interaction.effect==='focus')this.focus=Math.min(this.profile.resource.max,this.focus+interaction.amount);if(interaction.effect==='potion')this.potions+=interaction.amount;if(interaction.effect==='advantage')this.finalAdvantage=true;
      this.finish(interaction.result);
    }
    sneak(id){if(!this.canAct()||this.combat||!this.currentEnemies.length||this.bypassed)return;this.begin();if(this.torchLit){this.say('Meşalenin ışığında gizlenemezsin. Önce meşaleyi söndürmelisin.');return;}const die=this.roll(20);if(die===20||(die!==1&&die+this.stealth>=this.stealthDC)){this.bypassed=true;this.hidden=true;this.currentEnemies.forEach(e=>e.alert=false);this.finish(this.room.sneak_success||'Gölgelerden sessizce geçiyorsun. Düşman seni fark etmedi; kapılara ulaşabilirsin.');}else {this.finish(this.room.sneak_failure||'Sessizliği bir taş gıcırtısı bozuyor. Düşman seni fark etti!');this.startCombat(this.currentEnemies.find(e=>e.id===id)||this.currentEnemies[0],this.message);}}
    engage(id){if(!this.canAct()||this.combat||!this.currentEnemies.length)return;const enemy=this.currentEnemies.find(e=>e.id===id)||this.visibleEnemies[0]||this.currentEnemies[0];this.begin();this.prepared=true;this.finish(this.characterClass==='Mage'?'Büyünü hazırlayıp düşmanın karşısına çıkıyorsun.':'Silahını çekip düşmanın karşısına çıkıyorsun.');this.startCombat(enemy);}
    startCombat(enemy,reason){if(!this.available()||!enemy||this.combat)return;const player=this.roll(20)+this.mod('DEX')+(this.prepared?2:0),hostile=this.roll(20)+Math.floor((enemy.definition.dexterity-10)/2);this.notice=null;this.hidden=false;this.bypassed=false;enemy.alert=true;enemy.hostile=true;enemy.discovered=true;this.justEntered=false;this.combat={phase:player>=hostile?'player':'enemy',ap:3,round:1,target:enemy.id,preparedAtStart:this.prepared,initiative:{player,enemy:hostile}};this.say(enemy.definition.name+' ile savaş başladı. '+(this.combat.phase==='player'?'İlk hamle senin.':'Düşman önce harekete geçiyor.'));if(reason)this.reportResult('Fark edildin!',reason+' '+(this.combat.phase==='player'?'İlk hamle senin.':'Düşman önce harekete geçiyor.'));}
    answerRiddle(index){if(!this.canAct()||this.combat||this.roomId!=='seal_room'||this.sealSolved||!this.riddle)return false;this.begin();if(!Number.isInteger(index)||index<0||index>=this.riddle.options.length)return false;if(index!==this.riddle.answer){this.alarm=Math.min(3,this.alarm+1);this.finish('Yanlış cevap. Rünler kızarıyor; uzaktan metal bir uğultu geliyor. İpucunu okuyup tekrar deneyebilirsin.');return false;}this.sealSolved=true;this.finish('Doğru cevap. Rünler sönüyor ve ağır kapı açılıyor.');return true;}
    meditate(){if(!this.canAct()||this.combat||this.characterClass!=='Mage')return;this.begin();this.focus=Math.min(this.profile.resource.max,this.focus+1);this.finish('Korunaklı bir köşede meditasyon yapıyorsun. 1 Focus yenilendi.');}
    rest(){if(!this.canAct()||this.combat||this.roomId!=='seal_room'||this.restUsed)return;this.begin();this.restUsed=true;this.hp=this.maxHp;this.focus=this.profile.resource.max;this.finish('Taş bankta dinleniyorsun. Canın ve Focus’un tamamen yenilendi.');}
    flee(direction){if(!this.combat||!this.canAct())return;this.begin();if(!Number.isInteger(direction)||direction<0||direction>3)return this.say('Kaçacağın yönü seç.');const enemy=this.target,dc=Math.max(...this.currentEnemies.map(e=>e.definition.flee_dc)),v=[[0,-1],[1,0],[0,1],[-1,0]][direction];let destination={...this.position},moved=0,path=[];
      for(let i=0;i<3;i++){const p={x:destination.x+v[0],y:destination.y+v[1]};if(!this.walkable(p))break;if(this.currentEnemies.some(e=>this.enemyOccupies(e,p))){const reason='Doğrudan düşmanın bulunduğu bloğa kaçmaya çalıştın. Yolunu kesiyor; kaçışın başarısız!';this.finish('Critical fail! '+reason);this.reportResult('Kaçışın kesildi!',reason);this.spendAP();return;}destination=p;path.push(p);moved++;}
      if(!moved){const reason='Bu yönde duvar veya sütun var. Başka bir yön seç.';this.say(reason);this.reportResult('Yol kapalı',reason);return;}
      if(this.roll(20)+this.mod('DEX')>=dc){this.combat=null;this.damageBuff=null;this.bypassed=false;this.currentEnemies.forEach(e=>e.alert=false);for(const p of path){this.position=p;if(this.triggerTrap()){this.turn++;return;}}this.finish(moved+' blok uzağa kaçıyorsun. Düşman odada kalıyor; canı korunuyor.');this.checkEncounter();}else {const reason=enemy.definition.name+' önüne geçti ve kaçışını blokladı. Geçebileceğin aralığa zamanında ulaşamadın.';this.finish(reason);this.reportResult('Kaçamadın!',reason);this.spendAP();}}
    selectTarget(id){if(this.combat&&this.currentEnemies.some(e=>e.id===id))this.combat.target=id;}
    spendAP(cost=1){if(!this.combat)return;this.combat.ap=Math.max(0,this.combat.ap-cost);if(this.combat.ap===0){this.damageBuff=null;this.combat.phase='enemy';this.say('Aksiyonların bitti. Düşman harekete geçiyor.');}}
    attack(){
      if(!this.combat||!this.canAct())return;this.begin();const enemy=this.target;if(!enemy)return;
      if(!this.prepared){this.say('Önce silahını çek veya büyünü hazırla.');return;}
      if(this.combat.ap<this.attackCost){this.say('Bu silahla saldırmak için '+this.attackCost+' aksiyon gerekiyor. Kalan hakkınla kaçabilir veya turunu bitirebilirsin.');return;}
      let die=this.roll(20);if(this.finalAdvantage&&enemy.definition.id==='skeleton_captain'){die=Math.max(die,this.roll(20));this.finalAdvantage=false;}
      const bonus=(this.characterClass==='Mage'?this.mod('INT'):this.mod('DEX'))+2;
      const attack=this.attackSpec;
      if(die+bonus>enemy.definition.defense-(attack.piercing||0)){const damage=Math.max(1,this.rollDamage(attack.dice)+this.mod(attack.stat)+attack.bonus+(this.damageBuff?.bonus||0));enemy.hp=Math.max(0,enemy.hp-damage);this.finish(attack.name+': '+enemy.definition.name+' hedefini vuruyorsun, '+damage+' hasar!');if(enemy.hp===0)this.say(enemy.definition.name+' yere yığıldı.');else if(attack.effect==='chill'){enemy.chilled=true;this.say('Buz düşmanın eklemlerini kapladı: bir sonraki saldırısı -2 isabet.');}else if(attack.effect==='burn'){enemy.burning=2;this.say('Alevler düşmana yapıştı: düşman turunun başında 2 ek hasar.');}}
      else this.finish(enemy.definition.name+' saldırından sıyrıldı; darben isabet etmedi.');
      if(this.currentEnemies.length===0){this.combat=null;this.damageBuff=null;this.say('Savaş bitti. Oda artık güvenli.');if(this.availableLoot.length)this.say('Odada toplanabilecek ganimetler var.');return;}
      if(enemy.hp===0)this.combat.target=this.currentEnemies[0].id;this.spendAP(this.attackCost);
    }
    endTurn(){if(!this.combat||!this.canAct())return;this.begin();this.damageBuff=null;this.combat.ap=0;this.combat.phase='enemy';this.finish('Turunu bitiriyorsun. Düşman harekete geçiyor.');}
    enemyTurn(){
      if(!this.combat||this.combat.phase!=='enemy'||!this.available())return;this.begin();this.damageBuff=null;
      for(const enemy of this.currentEnemies){if(enemy.burning){enemy.hp=Math.max(0,enemy.hp-enemy.burning);this.say(enemy.definition.name+' alevlerden '+enemy.burning+' hasar aldı.');enemy.burning=0;if(!enemy.hp){this.say(enemy.definition.name+' yere yığıldı.');continue;}}const penalty=enemy.chilled?2:0;enemy.chilled=false;if(this.roll(20)+enemy.definition.attack_bonus-penalty>this.ac){const damage=this.rollDamage(enemy.definition.damage_dice);this.hp=Math.max(0,this.hp-damage);this.say(enemy.definition.name+' sana vurdu, -'+damage+' hasar!');}
        else this.say(enemy.definition.name+(enemy.definition.miss_text|| (enemy.definition.kind==='spider'?' seni ısırmaya çalıştı ama zırhın karşıladı.':enemy.definition.kind==='troll'?' sopasını savurdu ama zırhın karşıladı.':' kılıcını sana savurdu ama zırhın karşıladı.')));
        if(this.hp===0){this.dead=true;this.combat=null;this.say('Yere yığılıyorsun. Maceran burada sona erdi. Yeni bir karakterle tekrar deneyebilirsin.');this.turn++;return;}
      }
      if(!this.currentEnemies.length){this.combat=null;this.turn++;this.say('Savaş bitti. Oda artık güvenli.');return;}
      if(!this.currentEnemies.some(e=>e.id===this.combat.target))this.combat.target=this.currentEnemies[0].id;
      this.combat.phase='player';this.combat.ap=3;this.combat.round++;this.turn++;this.say('Sıra sende. 3 aksiyonun var.');
    }
    drinkPotion(){if(!this.canAct()||this.potions<1||this.hp===this.maxHp)return;this.begin();this.potions--;const restored=Math.min(8,this.maxHp-this.hp);this.hp+=restored;this.finish('İksiri içiyorsun. +'+restored+' can.');if(this.combat)this.spendAP();else this.checkEncounter();}
    collectLoot(){
      this.lastLoot=[];for(const entry of this.nearbyLoot.filter(e=>this.items.get(e.id)?.slot!=='weapon'))this.takeLoot(entry.uid);return this.lastLoot;
    }
    takeLoot(uid){const entry=this.roomLoot.find(e=>e.uid===uid);if(!entry)return false;this.begin();if(!this.canTakeLoot(entry)){this.say(this.distance(this.position,entry.position)>1?'Eşyaya yaklaşmalısın.':'Önce düşmanı aş veya sınıfına uygun eşya seç.');return false;}const item=this.items.get(entry.id);if(item.slot==='weapon')return this.takeWeapon(item.id,uid);const quantity=entry.quantity;
      if(item.type==='quest'){if(this.roomId!==this.map.goal)throw Error('Quest item must be in the final room');this.hasStone=true;}else if(item.type==='healing')this.potions+=quantity;else this.inventory[item.id]=(this.inventory[item.id]||0)+quantity;
      entry.quantity=0;this.lastLoot.push({id:item.id,quantity});this.finish(item.name+(quantity>1?' ×'+quantity:'')+' alıyorsun.');if(this.hasStone&&item.type==='quest')this.say('Mithril Külçesi sende. Şimdi Doğu Kapısı’nın alt geçidine dön.');return true;
    }
    canUseItem(id){
      const item=this.items.get(id);if(!item||!this.canAct())return false;
      if(item.classes&&!item.classes.includes(this.characterClass))return false;
      if(item.type==='healing')return this.potions>0&&this.hp<this.maxHp;
      if(!this.inventory[id])return false;
      if(item.type==='torch'||item.type==='map'||item.type==='reading')return true;
      if(item.type==='equipment')return this.equipment[item.slot]!==id;
      if(item.type==='fury')return !!this.combat&&this.combat.phase==='player'&&!this.damageBuff;
      if(item.type==='focus')return this.focus<this.profile.resource.max;
      return false;
    }
    get carriedWeapons(){return Object.keys(this.inventory).filter(id=>this.inventory[id]>0&&this.items.get(id)?.slot==='weapon');}
    takeWeapon(id,uid,dropId){
      const entry=this.roomLoot.find(e=>e.id===id&&(!uid||e.uid===uid)&&this.distance(this.position,e.position)<=1);
      if(!entry||!this.canTakeLoot(entry)||this.inventory[id])return false;
      const weapons=this.carriedWeapons;if(weapons.length>=2&&!weapons.includes(dropId)){this.say('İki silah taşıyorsun. Yeni silah için hangisini bırakacağını seç.');return false;}
      this.begin();let dropped='';if(dropId){if(!weapons.includes(dropId))return false;this.floorLoot.push({uid:'loot:'+this.lootSerial++,roomId:this.roomId,id:dropId,quantity:1,position:this.safeLootPosition(this.position)});delete this.inventory[dropId];dropped=this.items.get(dropId).name+' silahını yere bırakıp ';}
      entry.quantity=0;this.inventory[id]=1;this.equipment.weapon=id;this.prepared=false;this.lastLoot=[{id,quantity:1}];this.finish(dropped+this.items.get(id).name+' alıp kuşanıyorsun. Yeni silahını hazırlamalısın.');return true;
    }

    useItem(id){
      if(!this.canUseItem(id))return;const item=this.items.get(id);if(item.type==='healing')return this.drinkPotion();if(item.type==='map')return true;if(item.type==='torch')return this.toggleTorch();this.begin();
      if(item.type==='equipment'){this.equipment[item.slot]=id;if(item.slot==='weapon')this.prepared=false;this.ac=10+this.mod('DEX')+this.profile.armor_bonus+(this.items.get(this.equipment.armor)?.armor_bonus||0);this.finish(item.name+' kuşanıldı.');}
      else {this.inventory[id]--;if(item.type==='fury'){this.damageBuff={bonus:item.damage_bonus,round:this.combat.round};this.finish('Öfke İksiri içildi. Bu oyuncu turundaki kalan isabetlerin +'+item.damage_bonus+' hasar verecek.');}
        if(item.type==='focus'){const amount=Math.min(item.amount,this.profile.resource.max-this.focus);this.focus+=amount;this.finish(item.name+' içildi. +'+amount+' Focus.');}
      }
      if(this.combat)this.spendAP();else this.checkEncounter();
    }
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={DungeonExplorer};else root.DungeonExplorer=DungeonExplorer;
})(typeof globalThis!=='undefined'?globalThis:this);
