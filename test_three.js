const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {DungeonExplorer}=require('./game-engine'),map=require('./dungeon_map.json'),rules=require('./game_rules.json'),bestiary=require('./bestiary.json'),loot=require('./loot.json');
const context={console,Map,MAP:map,game:null,document:{},window:{},magicColor:()=> '#88bbaa'};vm.createContext(context);vm.runInContext(fs.readFileSync('vendor/three.min.js','utf8'),context);vm.runInContext(fs.readFileSync('three-dungeon.js','utf8'),context);
assert.equal(context.THREE.REVISION,'186');
vm.runInContext(`var cells=new Map();var view=Object.create(ThreeDungeon.prototype);view.scene=new THREE.Scene();view.materials=new Map();view.camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,100);view.renderer={setSize(){},render(){}};view.canvas={getBoundingClientRect:()=>({left:0,top:0,width:700,height:360})};view.ray=new THREE.Raycaster();view.pointer=new THREE.Vector2();view.zoom=1.2;view.host={clientWidth:700,clientHeight:360,appendChild(){},classList:{add(){}},querySelector(selector){return cells.get(selector)||null;}};`,context);
for(const room of map.rooms){
 const game=new DungeonExplorer(map,rules,'Fighter','Test',{bestiary,loot,fixedSpawns:true,random:()=>.5});game.roomId=room.id;game.position=game.spawnPosition();game.torchLit=false;context.game=game;vm.runInContext('view.update();',context);
 assert.equal(vm.runInContext('view.pickMeshes.length',context),room.bounds[2]*room.bounds[3]);assert.equal(vm.runInContext("view.world.children.filter(o=>['goblin','warg','troll','barrow_wight','spider'].includes(o.userData.kind)).length",context),0,'Hidden enemies must never exist in the Three scene');
 assert.ok(Number.isFinite(vm.runInContext('view.camera.top',context)));assert.ok(vm.runInContext("view.world.children.some(o=>o.userData.kind==='player')",context));
 vm.runInContext('var center=new THREE.Vector3(2,0,2).project(view.camera),north=new THREE.Vector3(2,0,1).project(view.camera),east=new THREE.Vector3(3,0,2).project(view.camera);',context);
 assert.ok(vm.runInContext('Math.abs(center.x-north.x)<1e-9&&north.y>center.y&&east.x>center.x&&Math.abs(east.y-center.y)<1e-9',context),'North must project straight up and east straight right');
 for(const door of game.doors()){
  const pos=game.spawnPosition(door),key=pos.x+':'+pos.y;
  context.doorKey=key;
  assert.ok(vm.runInContext('view.pickGroups.some(g=>g.userData.cellKey===doorKey)',context),'Every door must have a 3D arch even outside vision');
 }
 const p=game.position;vm.runInContext(`var selector='[data-grid-x="${p.x}"][data-grid-y="${p.y}"]';cells.set(selector,{key:'${p.x}:${p.y}',setAttribute(){}});var tile=view.pickMeshes.find(m=>m.userData.cellKey==='${p.x}:${p.y}');var point=tile.position.clone();point.y=.08;point.project(view.camera);`,context);
 const clicked=vm.runInContext('view.pick({clientX:(point.x+1)*350,clientY:(-point.y+1)*180})',context);assert.equal(clicked?.key,p.x+':'+p.y,'Camera projection and raycasting should pick the correct tile');
}
const g=new DungeonExplorer(map,rules,'Mage','Test',{bestiary,loot,fixedSpawns:true,random:()=>.5});g.roomId='rune_hall';const enemy=g.currentEnemies[0];g.position={x:enemy.position.x,y:enemy.position.y+2};g.facing=0;g.torchLit=true;context.game=g;vm.runInContext('view.update();',context);assert.equal(vm.runInContext("view.world.children.filter(o=>o.userData.kind==='warg').length",context),1);
// Idle motion must animate low-poly parts without moving enemies off their tiles.
for(const kind of ['goblin','troll','barrow_wight','spider','warg']){
 context.kind=kind;
 vm.runInContext(`view.enemyAnimations=[];var model=['spider','warg'].includes(kind)?view.beast(kind,2,2):view.humanoid(kind,2,2);view.rigEnemy(model);view.animateEnemies(0);var pose=view.enemyAnimations[0].body.rotation.y;view.animateEnemies(1);`,context);
 assert.notEqual(vm.runInContext('view.enemyAnimations[0].body.rotation.y',context),vm.runInContext('pose',context));
 assert.equal(vm.runInContext('model.position.x',context),2);assert.equal(vm.runInContext('model.position.z',context),2);
 if(kind==='spider')assert.equal(vm.runInContext('view.enemyAnimations[0].legs.length',context),8);
 if(kind==='warg')assert.ok(vm.runInContext('view.enemyAnimations[0].tail',context));
}
g.torchLit=false;vm.runInContext('view.update();',context);assert.equal(vm.runInContext('view.enemyAnimations.length',context),0,'Invisible enemies must have no animation rig in the scene');
console.log('Passed: real Three.js geometry in all 13 rooms, hidden enemy meshes, raycast picking, and five low-poly idle animations with fixed tile positions.');
