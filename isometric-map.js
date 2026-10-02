// Room geometry stays on the game grid; projection and decoration are visual only.
function isoPoint(x,y){return {x:(x-y)*42,y:(x+y)*22};}
function isoInset(svg,x,y,w,h){return svg.replace('<svg ','<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" ');}
function isoRoomDecoration(room,x,y,seen){
  if(!seen)return '';
  const n=Math.abs(x*37+y*19+room.number*11),line='stroke="#635d48" stroke-width="1.2"';
  if(room.id==='troll_hall'&&(x%4===1||y%5===2))return '<path d="M-33 0L0 17L33 0L0 -17Z" fill="#56281c"/><path d="M-25 0L0 13L25 0" fill="none" stroke="#d36b2d" stroke-width="3"/><path d="M-18 -3L0 8L18 -3" fill="none" stroke="#edb660" stroke-width="1"/>';
  if(n%5!==0)return n%3===0?'<path d="M-20 -2L-8 3L-12 7M8 -8L15 -4L10 1" fill="none" stroke="#090d0b" opacity=".55"/>':'';
  if(['cache','vault','armory'].includes(room.id))return '<path d="M-16 -5L0 -13L18 -4V8L1 17L-16 8Z" fill="#332b21" '+line+'/><path d="M-16 -5L1 3L18 -4M1 3V17" fill="none" '+line+'/><path d="M-10 -8L7 0V14M-2 -12L13 -5V11" fill="none" stroke="#87724d" stroke-width="2"/>';
  if(['archive','rune_hall'].includes(room.id))return '<path d="M-19 -7L0 -17L20 -7L0 3Z" fill="#6b5840" '+line+'/><path d="M-15 -5V10M14 -5V10" '+line+'/><path d="M-7 -13L4 -18L13 -14L2 -8Z" fill="#a09369"/><path d="M-9 -7V-17Q-12 -22 -6 -23Q0 -22 -3 -17V-10Z" fill="#647b70" stroke="#a6af86"/>';
  if(['barracks','guardian','rubble'].includes(room.id))return '<path d="M-17 0L-6 -7L7 -2L15 5L-2 12Z" fill="#46483c" '+line+'/><path d="M-6 -7L-2 4L15 5M-2 4L-2 12" fill="none" '+line+'/>';
  if(room.id==='cistern')return '<ellipse rx="24" ry="11" fill="#28403d" opacity=".75"/><path d="M-12 1Q0 -5 13 1" fill="none" stroke="#627b6d"/>';
  if(room.id==='entrance')return '<path d="M-13 3L13 -8M-13 -2L13 -13M-9 -16V6M0 -12V2M9 -16V-3" stroke="#514e42" stroke-width="2"/>';
  return '<path d="M-12 0L-2 -5L9 0L0 6Z" fill="#50513e" opacity=".5"/>';
}
function renderIsometricRoom(){
  const [rx,ry,w,h]=game.room.bounds,parts=[],boundsW=(w+h)*42+100,boundsH=(w+h)*22+145;
  const doors=game.doors(),heading=[[0,-1],[1,0],[0,1],[-1,0]][game.facing];
  for(let row=-1;row<=h;row++)for(let col=-1;col<=w;col++){
    if((row<0||row===h)&&(col<0||col===w))continue;
    const p={x:rx+col,y:ry+row},outside=col<0||col===w||row<0||row===h,walk=!outside&&game.walkable(p),pillar=!outside&&!walk;
    const player=game.distance(game.position,p)===0,seen=!outside&&(game.canSee(p)||game.roomId===MAP.start&&game.roomLoot.some(e=>e.id==='old_map'&&game.enemyOccupies(e,p)));
    const enemy=seen&&game.visibleEnemies.find(e=>game.distance(e.position,p)===0),drops=seen?game.visibleLoot.filter(e=>game.distance(e.position,p)===0):[];
    const door=!outside&&doors.find(d=>game.distance(game.spawnPosition(d),p)===0),visibleDoor=door;
    const adjacent=Math.abs(p.x-game.position.x)+Math.abs(p.y-game.position.y)===1,direction=p.y<game.position.y?0:p.x>game.position.x?1:p.y>game.position.y?2:3;
    const pickup=drops.find(e=>game.canTakeLoot(e)),near=game.distance(game.position,p)<=1,lootHint=pickup?'Al':!near?'Yaklaşman lazım':game.visibleEnemies.length&&!game.bypassed?'Önce düşmanı aş':'Bu eşyayı kullanamazsın';
    const enterDoor=visibleDoor&&game.nearDoor(door)&&(!game.gateReason(door)||door.connection.gate==='seal_puzzle'&&!game.sealSolved)&&!game.combat&&gameStarted&&game.available();
    const move=seen&&walk&&adjacent&&!drops.length&&!door&&gameStarted&&!game.combat&&game.available();
    const active=!!(pickup&&gameStarted||enterDoor||move),trap=!outside&&game.traps.find(t=>t.roomId===game.roomId&&game.distance(t.position,p)===0),trapVisible=trap&&(seen||trap.triggered);
    const label=drops.length?drops.map(e=>game.items.get(e.id).name).join(', ')+' · '+lootHint:player?'Sen':trap?.triggered?'Tetiklenmiş dikenli tuzak':door?'Kapı: '+MAP.rooms.find(r=>r.id===door.target).name:!seen?'Karanlık · görünmeyen blok':enemy?enemy.definition.name:door?'Kapı: '+MAP.rooms.find(r=>r.id===door.target).name:walk?'Boş blok':'Taş sütun';
    const pos=isoPoint(col,row),attributes=(pickup&&gameStarted?' data-map-pickup="'+pickup.uid+'"':'')+(move?' data-move="'+direction+'"':'')+(visibleDoor?' data-preview-room="'+door.target+'" data-preview-door="'+door.id+'"':'')+(enterDoor?' data-enter-door="'+door.id+'"':'');
    const floor=seen?(game.room.id==='troll_hall'?'#635441':'#74705a'):'#353c32',top=trap?'#6e6a55':floor;
    let art='<path class="iso-tile-edge" d="M-41 0L0 22L41 0V8L0 30L-41 8Z" fill="'+(seen?'#393b2f':'#222a22')+'" stroke="#151c16"/><path class="iso-tile-top" d="M-41 0L0 -21L41 0L0 21Z" fill="'+top+'" stroke="'+(seen?'#93856a':'#515947')+'" stroke-width="1"/><path d="M-24 -4L-4 7M6 -13L25 -3M-1 14L16 5" stroke="'+(seen?'#b6a47a':'#7b8063')+'" opacity=".13"/>';
    if(outside){const high=col<0||row<0,z=high?64:18;art='<path d="M-41 0L0 22L41 0V-'+z+'L0 '+(-z+22)+'L-41 -'+z+'Z" fill="#30372e" stroke="#131b16"/><path d="M-41 -'+z+'L0 '+(-z-21)+'L41 -'+z+'L0 '+(-z+21)+'Z" fill="#4c5141" stroke="#72715b"/><path d="M0 '+(-z+21)+'V22M-39 '+(-z+18)+'L0 '+(-z+39)+'L39 '+(-z+18)+'M-20 '+(-z+10)+'V'+(-z+29)+'M20 '+(-z+10)+'V'+(-z+29)+'" stroke="#141e17" opacity=".6"/>';
      if(high&&(col+row)%3===0)art+='<path d="M0 -30V-12" stroke="#423323" stroke-width="4"/><path d="M0 -29Q-8 -34 0 -45Q8 -35 0 -29Z" fill="#b78445" opacity=".6"/>';
    }else if(pillar)art+='<ellipse cy="-6" rx="20" ry="10" fill="#272e25"/><path d="M-16 -8V-67L16 -67V-8Q0 1 -16 -8Z" fill="'+(seen?'#6b6c55':'#3b4535')+'" stroke="#1e281e"/><ellipse cy="-67" rx="19" ry="10" fill="'+(seen?'#a19878':'#545e45')+'"/><path d="M-7 -61V-13M5 -61V-13" stroke="#1e281e" opacity=".5"/>';
    else if(visibleDoor)art+='<path d="M-23 0V-34Q0 -71 23 -34V0L0 13Z" fill="#555642" stroke="#a39365" stroke-width="3"/><path d="M-16 0V-32Q0 -58 16 -32V0L0 8Z" fill="#1a211b" stroke="#727052"/><path d="M-8 -33V-3M0 -40V1M8 -33V-3" stroke="#5c5139"/><circle cx="7" cy="-13" r="2" fill="#c1a76d"/>';
    else if(walk&&!player&&!enemy&&!drops.length&&!trap)art+=isoRoomDecoration(game.room,col,row,seen);
    if(trapVisible){if(trap.triggered){art+='<path d="M-28 0L0 -14L28 0L0 14Z" fill="#444d40"/>';for(let i=0;i<9;i++){const x=(i%3-1)*14,y=(Math.floor(i/3)-1)*7;art+='<path d="M'+(x-4)+' '+y+'L'+x+' '+(y-24)+'L'+(x+4)+' '+y+'Z" fill="'+(seen?'#b3b7a0':'#73806c')+'" stroke="#485344"/>';}}else art+='<path d="M-23 -3l4 -2l2 3M12 5l4 -2l3 2M-12 4l2 -4l2 4M17 -3l2 -4l2 4" fill="#737764" stroke="#777b68" stroke-width=".6" opacity=".6"/>'; }
    if(drops.length)art+='<ellipse rx="20" ry="9" fill="#2879a2" opacity=".4"/>'+isoInset(itemArt(drops[0].id),-22,-36,44,44).replace('<svg ','<svg class="iso-loot-art" data-map-item="'+drops[0].id+'" ')+'<g class="iso-pickup-label"><rect x="-62" y="-69" width="124" height="23" rx="4" fill="#101f23" stroke="#649ba8"/><text x="0" y="-53" text-anchor="middle" fill="#d7e7da">'+escapeHTML(lootHint)+'</text></g>';
    if(enemy)art+='<ellipse rx="22" ry="10" fill="#8c302a" opacity=".55"/>'+isoInset(mapEnemyIcon(enemy.definition.kind),-24,-52,48,48);
    if(player){const v=isoPoint(heading[0],heading[1]);art+='<ellipse rx="21" ry="10" fill="#eac476" opacity=".25"/><path d="M0 1L'+v.x*.45+' '+v.y*.45+'" stroke="#eed08b" stroke-width="3"/>'+isoInset(characterPortrait(game.characterClass,game.items.get(game.equipment.weapon),game.prepared,game.appearance),-22,-62,44,66);}
    parts.push({depth:col+row,col,html:'<g class="map-cell iso-cell '+(walk?'floor':'wall')+(seen?' lit':visibleDoor?' dim':' dim fog')+(trapVisible?' pressure-plate':'')+(player?' player':'')+(drops.length?' loot':'')+(enemy?' mob':'')+(visibleDoor?' door':'')+'" transform="translate('+pos.x+' '+pos.y+')" data-grid-x="'+p.x+'" data-grid-y="'+p.y+'" '+(!outside?'role="button" tabindex="'+(active||drops.length||visibleDoor?'0':'-1')+'" aria-label="'+escapeHTML(label)+'" aria-disabled="'+!active+'"':'aria-hidden="true"')+attributes+'><title>'+escapeHTML(label)+'</title>'+art+'</g>'});
  }
  parts.sort((a,b)=>a.depth-b.depth||a.col-b.col);
  return '<svg class="iso-dungeon" data-isometric="true" viewBox="'+(-h*42-55)+' -100 '+boundsW+' '+boundsH+'" aria-label="'+escapeHTML(game.room.name)+' · İzometrik zindan" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="isoGround"><stop stop-color="#4a4531" stop-opacity=".35"/><stop offset="1" stop-color="#10150f" stop-opacity="0"/></radialGradient></defs><ellipse cx="'+((w-h)*21)+'" cy="'+((w+h)*11)+'" rx="'+boundsW/2+'" ry="'+boundsH/2+'" fill="url(#isoGround)"/>'+parts.map(p=>p.html).join('')+'</svg>';
}
