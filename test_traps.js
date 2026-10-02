const assert=require('node:assert/strict');
const {DungeonExplorer}=require('./game-engine');
const map=require('./dungeon_map.json'),rules=require('./game_rules.json'),bestiary=require('./bestiary.json'),loot=require('./loot.json');
const make=random=>new DungeonExplorer(map,rules,'Fighter','Test',{bestiary,loot,random});
const a=make(()=>0),b=make(()=>.99);
assert.notDeepEqual(a.traps.map(t=>t.position),b.traps.map(t=>t.position));
for(let seed=1;seed<=40;seed++){
 let state=seed;const g=make(()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;});
 assert.equal(g.traps.length,7);
 for(const [roomId,count] of Object.entries({hall:3,seal_room:2,cache:2})){
  g.roomId=roomId;const traps=g.traps.filter(t=>t.roomId===roomId);assert.equal(traps.length,count);assert.equal(new Set(traps.map(t=>JSON.stringify(t.position))).size,count);
  for(const t of traps){assert.ok(g.walkable(t.position));assert.ok(!g.isDoorPosition(t.position));assert.ok(!g.roomLoot.some(e=>g.distance(t.position,e.position)===0));assert.ok(!g.currentEnemies.some(e=>g.distance(t.position,e.position)===0));}
 }
}
const g=make(()=>.5);g.roomId='hall';g.random=()=>0;
// Find an actual walkable approach and ensure a fast move stops on the first trap.
const t=g.traps.find(t=>t.roomId==='hall');const approach=[[0,-1],[1,0],[0,1],[-1,0]].map((v,d)=>({p:{x:t.position.x-v[0],y:t.position.y-v[1]},d})).find(v=>g.walkable(v.p));
g.position=approach.p;const hp=g.hp;g.move(approach.d,3);assert.deepEqual(g.position,t.position);assert.equal(g.hp,hp-3);assert.equal(g.resultNotice.art,'pressure_trap');assert.ok(t.triggered);g.dismissResult();assert.equal(g.resultNotice,null);assert.equal(g.triggerTrap(),false);
const lethal=g.traps.find(t=>t.roomId==='hall'&&!t.triggered);g.position={...lethal.position};g.hp=1;g.triggerTrap();assert.equal(g.hp,0);assert.ok(g.dead);
for(const [roomId,kind] of [['guardian','barrow_wight'],['rune_hall','warg']]){
 const x=make(()=>.5);x.roomId=roomId;const enemy=x.currentEnemies.find(e=>e.definition.kind===kind);assert.ok(enemy);assert.match(x.enemyHint,kind==='warg'?/hırıltı/:/fısıltı/);x.currentEnemies.filter(e=>e!==enemy).forEach(e=>e.hp=0);x.position={x:enemy.position.x,y:enemy.position.y+1};x.checkEncounter();assert.ok(x.combat);assert.equal(x.target.id,enemy.id);
}
const escaping=make(()=>.99);escaping.roomId='rune_hall';escaping.position={x:33,y:27};escaping.currentEnemies[0].position={x:36,y:25};escaping.engage();escaping.combat.phase='player';escaping.traps.push({roomId:'rune_hall',position:{x:34,y:27},triggered:false,definition:map.rooms.find(r=>r.id==='hall').traps});const escapeHP=escaping.hp;escaping.flee(1);assert.deepEqual(escaping.position,{x:34,y:27});assert.equal(escaping.hp,escapeHP-6);assert.equal(escaping.resultNotice.art,'pressure_trap');assert.equal(escaping.combat,null);
console.log('Passed: 7 randomized safe traps, per-step fast-move and escape interruption, single trigger, damage/modal/death, Warg and Barrow-wight encounters.');
