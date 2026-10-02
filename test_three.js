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
  const doorModel=vm.runInContext("view.pickGroups.find(g=>g.userData.kind==='door'&&g.userData.cellKey===doorKey)",context);
  assert.equal(doorModel.position.x,door.direction===3?-1:door.direction===1?room.bounds[2]:pos.x-room.bounds[0]);
  assert.equal(doorModel.position.z,door.direction===0?-1:door.direction===2?room.bounds[3]:pos.y-room.bounds[1],'Door arch belongs to the perimeter wall, never the walkable floor tile');
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
for(const cls of ['Fighter','Rogue','Mage']){
 const character=new DungeonExplorer(map,rules,cls,'Model',{bestiary,loot,fixedSpawns:true});character.appearance={body:'#224466',head:'#663399',mask:'#992233',beard:true};character.prepared=true;context.game=character;vm.runInContext('view.update();',context);
 assert.equal(vm.runInContext('view.player.userData.characterClass',context),cls);
 assert.ok(vm.runInContext('view.player.children.length>20',context),'Class models contain separate armor, cloth, limbs and head pieces');
 assert.ok(vm.runInContext('view.player.children.some(o=>o.material?.color.getHexString()===\'224466\')',context),'Body customization carries into 3D');
 assert.ok(vm.runInContext('view.player.getObjectByProperty(\'type\',\'Group\')',context));
 context.previewClass=cls;
 vm.runInContext("var previewModel=view.playerModel(0,0,{body:'#123456',head:'#654321',beard:true},{id:'starter_'+previewClass.toLowerCase()},{characterClass:previewClass,prepared:true});",context);
 assert.equal(vm.runInContext('previewModel.userData.characterClass',context),cls);
 assert.equal(vm.runInContext('previewModel.userData.cellKey',context),undefined,'Creation preview is independent of dungeon tile interactions');
 assert.ok(vm.runInContext("previewModel.children.some(o=>o.material?.color.getHexString()==='123456')",context),'Preview renders the selected appearance with the same model builder');
 for(let facing=0;facing<4;facing++){
  character.facing=facing;vm.runInContext('view.update();view.scene.updateMatrixWorld(true);var pose=view.player.getObjectByName(\'held-weapon-pose\');var aim=new THREE.Vector3(0,1,0).applyQuaternion(pose.getWorldQuaternion(new THREE.Quaternion()));',context);
  const aim=vm.runInContext('[aim.x,aim.z]',context),forward=[[0,-1],[1,0],[0,1],[-1,0]][facing];
  assert.ok(aim[0]*forward[0]+aim[1]*forward[1]>.95,'Readied weapon points forward in every facing direction');
 }
}
const trapGame=new DungeonExplorer(map,rules,'Fighter','Test',{bestiary,loot,fixedSpawns:true,random:()=>.5});trapGame.roomId='hall';const plate=trapGame.traps.find(t=>t.roomId==='hall');trapGame.position={...plate.position};context.game=trapGame;
vm.runInContext('view.update();var plateModel=view.world.children.find(o=>o.userData.kind===\'trap\');',context);
assert.ok(vm.runInContext('plateModel&&!plateModel.userData.triggered',context));
assert.ok(vm.runInContext('plateModel.children.filter(o=>o.geometry.type===\'ConeGeometry\').every(o=>o.geometry.parameters.height<=.035)',context),'Untriggered hints must remain tiny');
trapGame.triggerTrap();vm.runInContext('view.update();var openPlate=view.world.children.find(o=>o.userData.triggered);',context);
assert.equal(vm.runInContext('openPlate.children.filter(o=>o.geometry.type===\'ConeGeometry\'&&o.geometry.parameters.height===.36).length',context),9);
trapGame.position={x:plate.position.x+2,y:plate.position.y};trapGame.facing=1;trapGame.torchLit=false;assert.equal(trapGame.canSee(plate.position),false);vm.runInContext('view.update();',context);
assert.ok(vm.runInContext('view.world.children.some(o=>o.userData.triggered)',context),'Triggered spikes remain as a remembered landmark outside vision');
console.log('Passed: real Three.js rooms, raycast picking, idle animations, subtle trap tips and nine persistent triggered spikes.');
