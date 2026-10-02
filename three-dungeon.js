// Local Three.js scene. Authoritative collisions and actions remain in DungeonExplorer.
let dungeon3D=null;
class ThreeDungeon {
  constructor(host){
    this.host=host;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#17201e');
    this.camera=new THREE.OrthographicCamera(-6,6,6,-6,.1,100);this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    this.canvas=this.renderer.domElement;this.canvas.className='dungeon-canvas';this.canvas.setAttribute('aria-label','Three.js low-poly zindan');this.canvas.dataset.renderer='three';
    this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.materials=new Map();this.zoom=1.2;this.lastRoom=null;this.lastPosition=null;this.hover=null;
    this.scene.add(new THREE.HemisphereLight(0xd2e3d3,0x3c3020,2.1));
    this.sun=new THREE.DirectionalLight(0xffd5a0,3);this.sun.position.set(-3,12,7);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.camera.left=-18;this.sun.shadow.camera.right=18;this.sun.shadow.camera.top=18;this.sun.shadow.camera.bottom=-18;this.sun.shadow.bias=-.001;this.scene.add(this.sun);
    this.canvas.addEventListener('pointermove',e=>this.pointerMove(e));this.canvas.addEventListener('pointerleave',()=>this.clearHover());
    this.canvas.addEventListener('click',e=>{if(document.querySelector('dialog[open]'))return;const cell=this.pick(e);if(cell&&cell.getAttribute('aria-disabled')==='false')cell.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
    this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(.8,Math.min(2,this.zoom+(e.deltaY<0?.1:-.1)));this.resize();},{passive:false});
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.renderer.setAnimationLoop(time=>this.frame(time));
    this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();host.classList.remove('has-three');});this.canvas.addEventListener('webglcontextrestored',()=>{host.classList.add('has-three');this.update();});
  }
  mat(color,emissive){const key=(color.isColor?color.getHexString():color)+'|'+(emissive||'');if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.94,flatShading:true,emissive:emissive||0,emissiveIntensity:emissive?.7:0}));return this.materials.get(key);}
  mesh(geo,color,x,y,z,parent=this.world,emissive){const mesh=new THREE.Mesh(geo,this.mat(color,emissive));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  box(w,h,d,color,x,y,z,parent=this.world){return this.mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent);}
  cylinder(r1,r2,h,color,x,y,z,parent=this.world,sides=7){return this.mesh(new THREE.CylinderGeometry(r1,r2,h,sides),color,x,y,z,parent);}
  rock(size,color,x,y,z,parent=this.world){const m=this.mesh(new THREE.DodecahedronGeometry(size,0),color,x,y,z,parent);m.rotation.set(x*.7,y*.4,z*.8);m.scale.y=.6;return m;}
  ring(x,z,color,parent=this.world,r=.3){const m=this.mesh(new THREE.TorusGeometry(r,.028,4,24),color,x,.13,z,parent,color);m.rotation.x=Math.PI/2;return m;}
  wall(x,z,back){const levels=back?4:1;for(let row=0;row<levels;row++)for(let b=0;b<2;b++){const shade=['#59675e','#687368','#4d5b53'][(Math.abs(x*3+z*7+row+b))%3];this.box(.48,.28,.68,shade,x+(b-.5)*.5,.15+row*.29,z);}this.box(1.04,.11,.77,'#7c8371',x,levels*.29+.05,z);}
  pillar(x,z,seen){const c=seen?'#808879':'#404d45';this.box(.62,.16,.62,c,x,.12,z);this.cylinder(.22,.26,1.16,c,x,.77,z);this.box(.58,.2,.58,c,x,1.43,z);this.box(.69,.09,.69,seen?'#b1ad8f':'#536055',x,1.56,z);}
  torch(x,z){this.cylinder(.04,.055,.4,'#634633',x,.67,z);this.mesh(new THREE.ConeGeometry(.12,.31,5),'#ee9b3d',x,1,z,this.world,'#df7429');this.mesh(new THREE.ConeGeometry(.055,.2,5),'#ffdf8c',x,1.03,z,this.world,'#ffba51');const light=new THREE.PointLight(0xffa45b,1.6,3,2);light.position.set(x,1.2,z);this.world.add(light);}
  door(x,z,direction,seen){const g=new THREE.Group();g.position.set(x,0,z);g.userData.cellKey=(game.room.bounds[0]+x)+':'+(game.room.bounds[1]+z);this.pickGroups.push(g);g.rotation.y=direction%2?Math.PI/2:0;this.world.add(g);const c=seen?'#a59e7d':'#45544a';this.box(.18,1.18,.26,c,-.37,.64,0,g);this.box(.18,1.18,.26,c,.37,.64,0,g);for(let i=0;i<5;i++){const angle=(i+.5)/5*Math.PI;const stone=this.box(.25,.19,.28,c,Math.cos(angle)*.37,1.19+Math.sin(angle)*.22,0,g);stone.rotation.z=angle-Math.PI/2;}this.box(.55,.99,.1,seen?'#634d36':'#26382f',0,.61,0,g);for(let i=-1;i<=1;i++)this.box(.025,.86,.035,'#2a2a23',i*.17,.59,.065,g);this.box(.51,.05,.05,'#292f28',0,.5,.08,g);this.mesh(new THREE.SphereGeometry(.04,5,4),'#c3ad71',.16,.6,.11,g);}
  chest(x,z){this.box(.57,.32,.4,'#664529',x,.31,z);this.cylinder(.22,.22,.55,'#87613d',x,.47,z).rotation.z=Math.PI/2;for(const dx of [-.2,.2])this.box(.045,.4,.43,'#b49b67',x+dx,.35,z);this.box(.08,.11,.025,'#dfb05d',x,.36,z+.22);}
  barrel(x,z){this.cylinder(.21,.18,.49,'#805832',x,.34,z,undefined,8);for(const y of [.19,.47]){const m=this.mesh(new THREE.TorusGeometry(.21,.018,4,8),'#4e5148',x,y,z);m.rotation.x=Math.PI/2;}}
  table(x,z,archive){this.box(.75,.11,.47,'#79583b',x,.54,z);for(const dx of [-.28,.28])for(const dz of [-.15,.15])this.box(.07,.45,.07,'#4b3b2b',x+dx,.3,z+dz);if(archive){for(let i=0;i<3;i++)this.box(.2,.06,.27,['#b7a879','#536a64','#8d6750'][i],x-.16+i*.15,.63+i*.025,z);}else {for(let i=0;i<2;i++){this.cylinder(.06,.07,.13,['#73a993','#b69470'][i],x-.17+i*.3,.69,z);this.cylinder(.026,.026,.09,'#b5c3a5',x-.17+i*.3,.79,z);}}}
  obstacle(x,z,seen){const c=seen?'#828d80':'#46594d';this.box(.8,.32,.75,c,x,.24,z);this.rock(.24,seen?'#a39e88':'#576457',x-.15,.48,z+.13);this.rock(.18,c,x+.23,.4,z-.1);}
  trapPlate(x,z,triggered,seen){
    const g=new THREE.Group();g.position.set(x,0,z);g.userData.kind='trap';g.userData.triggered=triggered;this.world.add(g);
    // Unfired plates use tiny chips and barely exposed tips, without glow or icons.
    for(let i=0;i<5;i++)this.rock(.025+i%2*.008,seen?'#898c79':'#4b574c',-.31+i*.145,.132,(i%2?-.22:.21),g);
    if(triggered){
      this.box(.74,.018,.74,seen?'#565c50':'#374539',0,.131,0,g);
      for(let row=-1;row<=1;row++)for(let col=-1;col<=1;col++)this.mesh(new THREE.ConeGeometry(.065,.36,5),seen?'#b4b5a1':'#6e7b6a',col*.23,.32,row*.23,g);
    }else{
      for(const dx of [-.2,.2]){
        this.box(.12,.003,.015,'#777c6d',dx,.129,-.05,g);
        this.mesh(new THREE.ConeGeometry(.018,.035,4),'#858b7b',dx,.146,-.05,g);
      }
    }
  }
  decoration(x,z,seen){const id=game.roomId,n=Math.abs(x*37+z*19+game.room.number*11);
    if(id==='troll_hall'&&(x%4===1||z%5===2)){this.box(.96,.018,.14,'#5b3028',x,.103,z);this.box(.85,.025,.07,seen?'#d67b38':'#704332',x,.113,z);return;}if(!seen)return;
    if(n%5)return;if(['cache','vault','armory'].includes(id))n%2?this.chest(x,z):this.barrel(x,z);else if(['archive','rune_hall'].includes(id))this.table(x,z,id==='archive');else if(['guardian','barracks','rubble'].includes(id))this.rock(.23,'#817867',x,.2,z);else if(id==='entrance'){for(let i=0;i<4;i++)this.cylinder(.025,.025,.25,'#48554c',x-.18+i*.12,.22,z).rotation.x=Math.PI/2;}else if(id==='cistern'){this.box(.78,.015,.6,'#456e69',x,.12,z);}
  }
  limb(parent,a,b,radius,color){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),mid=start.clone().add(end).multiplyScalar(.5);const mesh=this.cylinder(radius*.85,radius,delta.length(),color,mid.x,mid.y,mid.z,parent,5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;}
  bentHat(parent,color){
    const levels=[[.3,1.31,0],[.21,1.47,0],[.135,1.66,.025],[.075,1.83,.09],[0,1.87,.2]],vertices=[],indices=[],sides=7;
    levels.forEach(([r,y,dx])=>{for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2;vertices.push(dx+Math.cos(a)*r,y,Math.sin(a)*r);}});
    for(let j=0;j<levels.length-1;j++)for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides,c=a+sides,d=b+sides;indices.push(a,c,b,b,c,d);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();this.mesh(geo,color,0,0,0,parent);
    this.cylinder(.42,.43,.035,color,0,1.32,0,parent,7);
  }
  playerModel(x,z,appearance={},weapon){
    const g=new THREE.Group(),cls=game.characterClass,body=appearance.body||'#47523b',head=appearance.head||'#68745c',skin='#c2ae8e',leather='#342a24',metal='#a3ac9c';
    g.position.set(x,0,z);g.userData.kind='player';g.userData.characterClass=cls;g.userData.cellKey=(game.room.bounds[0]+x)+':'+(game.room.bounds[1]+z);this.pickGroups.push(g);this.world.add(g);
    const mage=cls==='Mage',rogue=cls==='Rogue';
    for(const side of [-1,1]){
      this.limb(g,[side*.12,.68,0],[side*.17,.37,.025],.092,mage?body:'#706c58');
      this.limb(g,[side*.17,.38,.025],[side*.2,.15,.075],.072,rogue?'#434c3d':leather);
      this.box(.17,.18,.27,leather,side*.2,.16,.095,g);
    }
    this.cylinder(.21,mage?.32:.26,mage?.65:.42,body,0,mage?.67:.8,0,g,7);
    this.cylinder(.19,.2,.065,leather,0,.68,0,g,7);this.box(.09,.07,.045,metal,0,.69,.21,g);
    this.cylinder(.07,.075,.12,skin,0,1.07,0,g,6);
    this.mesh(new THREE.SphereGeometry(.18,6,4),skin,0,1.22,.025,g).scale.y=1.12;
    this.box(.1,.045,.025,'#292c26',0,1.25,.19,g);
    if(cls==='Fighter'){
      this.cylinder(.28,.21,.36,body,0,.89,0,g,6);
      for(const y of [.75,.83,.91])this.box(.29,.035,.06,metal,0,y,.23,g);
      for(const side of [-1,1]){const shoulder=this.mesh(new THREE.DodecahedronGeometry(.19,0),body,side*.29,1,0,g);shoulder.scale.set(1,.75,1.15);this.box(.15,.07,.18,metal,side*.2,.38,.06,g);}
      this.mesh(new THREE.SphereGeometry(.19,6,4),head,0,1.3,-.02,g).scale.set(1,1.05,1);
      this.box(.27,.045,.035,metal,0,1.25,.19,g);for(const side of [-1,1])this.box(.045,.17,.055,head,side*.15,1.17,.13,g);
    }else if(rogue){
      const hood=this.mesh(new THREE.DodecahedronGeometry(.245,0),head,0,1.28,-.055,g);hood.scale.set(1,1.2,1);
      this.box(.23,.19,.045,skin,0,1.24,.174,g);this.box(.24,.08,.05,appearance.mask||'#212b23',0,1.17,.2,g);
      const cape=this.cylinder(.21,.3,.58,head,0,.91,-.12,g,5);cape.scale.z=.65;
      this.limb(g,[-.22,1.01,.23],[.17,.71,.24],.032,leather);
      for(const y of [.78,.85])this.box(.055,.018,.05,metal,.03,y,.26,g);
    }else{
      this.bentHat(g,head);
      this.cylinder(.24,.29,.15,head,0,1.02,0,g,7);
      if(appearance.beard){const beard=this.mesh(new THREE.ConeGeometry(.14,.31,5),'#d2c9ac',0,1.04,.2,g);beard.rotation.x=Math.PI;}
    }
    for(const side of [-1,1]){
      const elbow=[side*.35,.79,.075],hand=[side*.34,.64,.19];
      this.limb(g,[side*.27,1,0],elbow,.095,body);this.limb(g,elbow,hand,.075,mage?body:leather);
      this.mesh(new THREE.DodecahedronGeometry(.065,0),skin,...hand,g);
    }
    if(game.prepared){
      const pose=new THREE.Group();pose.name='held-weapon-pose';g.add(pose);pose.position.set(.34,.64,.19);pose.rotation.x=Math.PI/2;
      const held=this.weapon(pose,weapon,mage);held.position.set(-.32,-.68,-.12);
    }
    this.ring(0,0,'#c9b96e',g,.33);return g;
  }
  wightModel(x,z){
    const g=new THREE.Group();g.position.set(x,0,z);g.userData.kind='barrow_wight';g.userData.cellKey=(game.room.bounds[0]+x)+':'+(game.room.bounds[1]+z);this.pickGroups.push(g);this.world.add(g);
    const cloth='#348d89',bone='#a5e0d0',shadow='#173e43';
    this.cylinder(.19,.3,.87,cloth,0,.72,0,g,7);
    this.cylinder(.24,.18,.26,'#4aa29b',0,1.14,0,g,6);
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const hem=this.mesh(new THREE.ConeGeometry(.12,.3+(i%3)*.045,3),i%2?'#287571':cloth,Math.cos(a)*.22,.2,Math.sin(a)*.22,g);hem.rotation.z=Math.PI;}
    this.cylinder(.06,.07,.13,bone,0,1.35,0,g,5);
    const skull=this.mesh(new THREE.SphereGeometry(.21,7,5),bone,0,1.58,0,g);skull.scale.set(.9,1,1);
    this.box(.19,.09,.16,bone,0,1.4,.075,g);
    for(const side of [-1,1]){
      const socket=this.mesh(new THREE.SphereGeometry(.057,5,3),shadow,side*.078,1.6,.168,g);socket.scale.z=.5;
      this.mesh(new THREE.SphereGeometry(.019,4,3),'#5bc9c2',side*.078,1.6,.197,g,'#459c99');
      this.limb(g,[side*.2,1.19,0],[side*.36,1.03,.18],.105,cloth);
      this.limb(g,[side*.36,1.03,.18],[side*.37,1.02,.4],.06,bone);
      this.cylinder(.12,.1,.13,cloth,side*.36,1.04,.2,g,5).rotation.x=Math.PI/2;
      this.box(.12,.065,.14,bone,side*.37,1.02,.45,g);
      for(let finger=0;finger<4;finger++){
        const fx=side*.37+(finger-1.5)*.033,len=.12+(finger%2)*.035;
        this.limb(g,[fx,1.015,.5],[fx+side*.015,.99,.5+len],.013,bone);
        this.limb(g,[fx+side*.015,.99,.5+len],[fx+side*.02,.935,.54+len],.01,bone);
      }
      this.limb(g,[side*.32,1.03,.44],[side*.27,.995,.53],.018,bone);
    }
    this.mesh(new THREE.ConeGeometry(.027,.055,3),shadow,0,1.52,.187,g).rotation.z=Math.PI;
    this.box(.15,.018,.012,shadow,0,1.435,.16,g);for(let i=0;i<5;i++)this.box(.018,.035,.016,bone,(i-2)*.029,1.44,.175,g);
    for(let i=0;i<3;i++){const stitch=this.box(.012,.06,.013,shadow,0,1.17-i*.055,.19,g);stitch.rotation.z=i%2?.65:-.65;}
    this.ring(0,0,'#c65b50',g,.35);return g;
  }
  humanoid(kind,x,z,appearance,weapon){if(kind==='player')return this.playerModel(x,z,appearance,weapon);if(kind==='barrow_wight')return this.wightModel(x,z);const g=new THREE.Group();g.position.set(x,0,z);g.userData.cellKey=(game.room.bounds[0]+x)+':'+(game.room.bounds[1]+z);this.pickGroups.push(g);this.world.add(g);const player=kind==='player',cls=game.characterClass,body=player?(appearance?.body||'#47523b'):kind==='troll'?'#667060':kind==='barrow_wight'?'#8b9988':'#819473';const skin=player?'#b5a388':body,head=player?(appearance?.head||'#68745c'):body;
    this.cylinder(.19,.26,.47,body,0,.57,0,g,6);this.mesh(new THREE.SphereGeometry(.2,6,4),skin,0,.99,0,g);this.mesh(new THREE.SphereGeometry(.21,6,4),head,0,1.06,-.015,g);this.box(.24,.12,.07,skin,0,.96,.16,g);
    this.box(.09,.12,.065,'#243a32',-.08,1.02,.18,g);this.box(.09,.12,.065,'#243a32',.08,1.02,.18,g);
    for(const side of [-1,1]){this.box(.12,.24,.13,body,side*.26,.62,0,g);this.box(.12,.1,.14,skin,side*.26,.45,0,g);this.box(.13,.28,.15,'#39473a',side*.11,.25,0,g);this.box(.15,.08,.21,'#2e3a31',side*.11,.12,.04,g);}
    if(player&&cls==='Mage'){this.mesh(new THREE.ConeGeometry(.23,.38,6),head,0,1.34,0,g);if(appearance?.beard)this.mesh(new THREE.ConeGeometry(.13,.2,5),'#c7c1a6',0,.8,.17,g).rotation.z=Math.PI;if(game.prepared)this.weapon(g,weapon,true);}
    else if(player&&cls==='Rogue')this.box(.27,.095,.08,appearance?.mask||'#273c30',0,.9,.18,g);
    else {this.box(.035,.39,.035,'#b1b79c',0,1.07,.21,g);if(!player){this.mesh(new THREE.ConeGeometry(.13,.31,4),head,-.26,1.03,0,g).rotation.z=1;this.mesh(new THREE.ConeGeometry(.13,.31,4),head,.26,1.03,0,g).rotation.z=-1;}}
    if(player&&game.prepared&&cls!=='Mage')this.weapon(g,weapon,false);if(!player){this.weapon(g,{id:kind==='troll'?'war_hammer':'iron_sword'},false);this.ring(0,0,'#c65b50',g,.35);}else this.ring(0,0,'#c9b96e',g,.33);
    if(kind==='troll'){g.scale.set(2.65,2.15,2.4);this.box(.58,.28,.4,'#657462',0,.73,0,g);}if(kind==='barrow_wight'){g.scale.y=1.2;this.mesh(new THREE.ConeGeometry(.32,.65,6),'#65776f',0,.5,0,g);this.box(.25,.23,.07,'#283a35',0,1.02,.19,g);for(const side of [-1,1])this.mesh(new THREE.SphereGeometry(.032,5,3),'#a4d4c6',side*.065,1.06,.24,g,'#72b6ac');}g.userData.kind=kind;return g;
  }
  // Animate a separate model group so its tile position and selection ring stay fixed.
  rigEnemy(g){
    const body=new THREE.Group(),parts=g.children.filter(o=>o.geometry?.type!=='TorusGeometry');
    for(const part of parts)body.add(part);g.add(body);
    const legs=parts.filter(o=>o.geometry?.type==='BoxGeometry'&&o.position.y<.3&&Math.abs(o.position.x)>.1);
    const tail=parts.find(o=>o.geometry?.type==='ConeGeometry'&&o.position.z<-.4);
    this.enemyAnimations.push({kind:g.userData.kind,body,legs:legs.map(mesh=>({mesh,rotation:mesh.rotation.clone()})),tail,phase:g.position.x*.73+g.position.z*1.17});
  }
  animateEnemies(seconds){
    for(const rig of this.enemyAnimations||[]){
      const t=seconds+rig.phase,wave=Math.sin(t*2);
      rig.body.position.y=rig.kind==='barrow_wight'?.065+.035*Math.sin(t*1.4):.008+.008*wave;
      rig.body.rotation.y=Math.sin(t*.8)*(rig.kind==='troll'?.035:.07);
      rig.body.scale.y=1+wave*(rig.kind==='troll'?.018:.012);
      rig.body.rotation.z=rig.kind==='barrow_wight'?Math.sin(t*1.2)*.035:0;
      if(rig.kind==='spider')rig.legs.forEach((leg,i)=>{leg.mesh.rotation.z=leg.rotation.z+Math.sin(t*3+i*Math.PI*.75)*.09;});
      if(rig.tail)rig.tail.rotation.z=Math.sin(t*2.6)*.22;
    }
  }
  weapon(g,item,magic){
    const id=item?.id||'',color=magic?magicColor(id):'#afb4a0',staff=magic||/staff/.test(id),dagger=/dagger|starter_rogue/.test(id);
    const held=new THREE.Group();held.userData.weaponId=id;g.add(held);
    this.box(.045,staff?1.22:.58,.045,'#73533a',.32,staff?.75:.64,.12,held);
    if(magic){this.mesh(new THREE.OctahedronGeometry(.135),color,.32,1.44,.12,held,color);this.cylinder(.06,.085,.14,'#b59a60',.32,1.28,.12,held,5);}
    else if(/hammer/.test(id)){this.box(.36,.22,.21,'#859183',.32,.96,.12,held);for(const dx of [-.2,.2])this.box(.045,.25,.235,'#afb6a4',.32+dx,.96,.12,held);}
    else if(/mace/.test(id)){this.mesh(new THREE.DodecahedronGeometry(.14,0),'#949e8d',.32,.96,.12,held);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;this.mesh(new THREE.ConeGeometry(.045,.15,4),'#adb5a0',.32+Math.cos(a)*.13,.98,.12+Math.sin(a)*.13,held);}}
    else if(/axe|cleaver/.test(id)){const blade=new THREE.Shape();blade.moveTo(0,-.1);blade.lineTo(.11,-.16);blade.lineTo(.3,-.2);blade.lineTo(.24,0);blade.lineTo(.3,.2);blade.lineTo(.11,.15);blade.lineTo(0,.08);blade.closePath();this.mesh(new THREE.ExtrudeGeometry(blade,{depth:.045,bevelEnabled:false}),color,.32,.95,.10,held);}
    else if(staff){}
    else {this.box(.21,.035,.07,'#b69f65',.32,.86,.12,held);const blade=this.mesh(new THREE.ConeGeometry(dagger?.045:.065,dagger?.26:.48,4),color,.32,dagger?.99:1.10,.12,held);blade.scale.z=.3;}
    return held;
  }
  beast(kind,x,z){const g=new THREE.Group();g.position.set(x,0,z);g.userData.cellKey=(game.room.bounds[0]+x)+':'+(game.room.bounds[1]+z);this.pickGroups.push(g);this.world.add(g);const spider=kind==='spider';this.mesh(new THREE.SphereGeometry(spider?.2:.23,6,4),spider?'#59453c':'#5d6b5a',0,.38,0,g).scale.z=1.7;if(spider){for(let i=0;i<8;i++){const side=i<4?-1:1,a=i%4;const leg=this.box(.055,.055,.5,'#4d3f36',side*.27,.22,(a-1.5)*.16,g);leg.rotation.y=side*.6;leg.rotation.z=side*.45;}}else{this.mesh(new THREE.SphereGeometry(.2,5,4),'#758271',0,.57,.36,g);this.box(.16,.13,.24,'#48594b',0,.49,.5,g);for(const side of [-1,1]){this.mesh(new THREE.ConeGeometry(.09,.22,4),'#586953',side*.13,.77,.31,g);for(const z of [-.22,.24])this.box(.1,.31,.12,'#475545',side*.14,.23,z,g);}this.mesh(new THREE.ConeGeometry(.09,.42,5),'#596653',0,.47,-.48,g).rotation.x=-1;}
    this.ring(0,0,'#c85a50',g,.35);g.userData.kind=kind;return g;}
  loot(item,x,z){const g=new THREE.Group();g.userData.kind='loot';g.userData.itemId=item.id;g.position.set(x,0,z);g.userData.cellKey=(game.room.bounds[0]+x)+':'+(game.room.bounds[1]+z);this.pickGroups.push(g);this.world.add(g);this.ring(0,0,'#50b8d3',g,.24);const id=item.id;if(item.type==='map'||item.type==='reading'){this.box(.29,.025,.36,'#cabc83',0,.17,0,g);for(let i=0;i<3;i++)this.box(.17,.005,.012,'#716440',0,.19,-.1+i*.08,g);}else if(item.slot==='weapon')this.weapon(g,item,!!item.staff);else if(item.slot==='armor'||item.slot==='cloak'){this.mesh(new THREE.ConeGeometry(.19,.33,5),item.slot==='armor'?'#899a91':'#617c8d',0,.35,0,g);}else{this.mesh(new THREE.SphereGeometry(.13,6,4),'#68a9b8',0,.29,0,g);this.cylinder(.045,.045,.11,'#bd9e72',0,.43,0,g);} }
  clearWorld(){if(!this.world)return;this.scene.remove(this.world);this.world.traverse(o=>{if(o.geometry)o.geometry.dispose();});this.world=null;}
  update(){const [rx,ry,w,h]=game.room.bounds;this.clearWorld();this.world=new THREE.Group();this.scene.add(this.world);this.pickMeshes=[];this.pickGroups=[];this.host.appendChild(this.canvas);this.host.classList.add('has-three');
    this.box(w+1.8,.23,h+1.8,'#303d32',(w-1)/2,-.2,(h-1)/2);
    for(let z=-1;z<=h;z++)for(let x=-1;x<=w;x++){
      const outside=x<0||x===w||z<0||z===h;if(outside){if((x<0||x===w)&&(z<0||z===h))continue;this.wall(x,z,x<0||z<0);if((x<0||z<0)&&(x+z)%3===0)this.torch(x,z);continue;}
      const p={x:rx+x,y:ry+z},seen=game.canSee(p),salt=Math.abs(x*13+z*7)%4;
      const trap=game.traps.find(t=>t.roomId===game.roomId&&game.distance(t.position,p)===0);
      const palette=seen?['#9e9d82','#a4a087','#989983','#a8a58a']:['#536052','#576456','#505d52','#596559'];let color=palette[salt];if(seen&&trap)color=new THREE.Color(color).multiplyScalar(.955);
      const tile=this.box(.965,.16,.965,color,x,0,z);tile.userData.cellKey=p.x+':'+p.y;this.pickMeshes.push(tile);
      // Small inset paving stones leave mortar joints and bevel-like raised edges.
      for(let i=0;i<2;i++)for(let j=0;j<2;j++)this.box(.443,.028,.443,color,x+(i-.5)*.47,.096,z+(j-.5)*.47);
      if(trap&&(seen||trap.triggered))this.trapPlate(x,z,trap.triggered,seen);
      if(!game.walkable(p)){if(game.roomId==='troll_hall')this.pillar(x,z,seen);else this.obstacle(x,z,seen);continue;}
      const door=game.doors().find(d=>game.distance(game.spawnPosition(d),p)===0),oldMap=game.roomId===MAP.start&&game.roomLoot.some(e=>e.id==='old_map'&&game.distance(e.position,p)===0),drops=seen||oldMap?game.visibleLoot.filter(e=>game.distance(e.position,p)===0):[];
      if(door)this.door(x,z,door.direction,seen);else if(!trap&&!drops.length&&game.distance(game.position,p)>0&&!game.visibleEnemies.some(e=>game.enemyOccupies(e,p)))this.decoration(x,z,seen);
      drops.forEach(e=>this.loot(game.items.get(e.id),x,z));
      if(game.roomId==='troll_hall'&&(x===0||z===0)&&(x+z)%4===0){this.box(.12,.6,.12,'#9c492b',x,.5,z);}
    }
    this.enemyAnimations=[];
    for(const enemy of game.visibleEnemies){const [fw,fh]=enemy.definition.footprint||[1,1],x=enemy.position.x-rx+(fw-1)/2,z=enemy.position.y-ry+(fh-1)/2;const model=['spider','warg'].includes(enemy.definition.kind)?this.beast(enemy.definition.kind,x,z):this.humanoid(enemy.definition.kind,x,z);model.userData.cellKey=enemy.position.x+':'+enemy.position.y;this.rigEnemy(model);}
    const target={x:game.position.x-rx,z:game.position.y-ry};this.player=this.humanoid('player',target.x,target.z,game.appearance,game.items.get(game.equipment.weapon));this.player.rotation.y=Math.PI-game.facing*Math.PI/2;
    this.targetPosition=target;if(this.lastRoom===game.roomId&&this.lastPosition){this.player.position.x=this.lastPosition.x;this.player.position.z=this.lastPosition.z;}this.lastPosition=target;this.lastRoom=game.roomId;
    if(game.torchLit){this.torchLight=new THREE.PointLight(0xffcb7d,2.4,4,2);this.torchLight.position.set(0,.9,0);this.player.add(this.torchLight);this.mesh(new THREE.ConeGeometry(.06,.18,5),'#ffc363',-.31,.7,.14,this.player,'#ff9b42');}
    this.scene.updateMatrixWorld(true);this.resize();this.renderer.render(this.scene,this.camera);
  }
  resize(){const width=this.host.clientWidth,height=this.host.clientHeight;if(!width||!height)return;this.renderer.setSize(width,height,false);const [, ,w,h]=game.room.bounds,target=new THREE.Vector3((w-1)/2,.35,(h-1)/2);this.camera.position.set(target.x,target.y+15,target.z+12);this.camera.lookAt(target);this.camera.updateMatrixWorld();const inv=this.camera.matrixWorldInverse;let maxX=0,maxY=0;for(const x of [-1.7,w+.3])for(const z of [-1.7,h+.3])for(const y of [-.3,1.7]){const p=new THREE.Vector3(x,y,z).applyMatrix4(inv);maxX=Math.max(maxX,Math.abs(p.x));maxY=Math.max(maxY,Math.abs(p.y));}const aspect=width/height,half=Math.max(maxY,maxX/aspect)*1.08/this.zoom;this.camera.left=-half*aspect;this.camera.right=half*aspect;this.camera.top=half;this.camera.bottom=-half;this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();if(this.pickMeshes)for(const tile of this.pickMeshes){const point=tile.position.clone();point.y=.13;point.project(this.camera);const [x,y]=tile.userData.cellKey.split(':');const cell=this.host.querySelector('[data-grid-x="'+x+'"][data-grid-y="'+y+'"]');if(cell){cell.setAttribute('data-canvas-x',((point.x+1)*width/2).toFixed(1));cell.setAttribute('data-canvas-y',((-point.y+1)*height/2).toFixed(1));}}}
  pick(e){const rect=this.canvas.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects([...this.pickMeshes,...this.pickGroups],true)[0];if(!hit)return null;let owner=hit.object;while(owner&&!owner.userData.cellKey)owner=owner.parent;if(!owner)return null;const [x,y]=owner.userData.cellKey.split(':');return this.host.querySelector('[data-grid-x="'+x+'"][data-grid-y="'+y+'"]');}
  clearHover(){this.hover=null;hideDoorPreview();const tip=this.host.querySelector('.three-hover');if(tip)tip.hidden=true;this.canvas.style.cursor='default';}
  pointerMove(e){const cell=this.pick(e);if(cell===this.hover)return;this.clearHover();this.hover=cell;if(!cell||cell.classList.contains('fog'))return;this.canvas.style.cursor=cell.getAttribute('aria-disabled')==='false'?'pointer':'default';const tip=this.host.querySelector('.three-hover');if(tip){tip.textContent=cell.getAttribute('aria-label');tip.hidden=false;}if(cell.dataset.previewRoom)showDoorPreview({dataset:cell.dataset,setAttribute(){},getBoundingClientRect:()=>({left:e.clientX,right:e.clientX+5,top:e.clientY})});}
  frame(time){if(document.hidden||!this.host.clientHeight||this.lastFrame&&time-this.lastFrame<32)return;this.lastFrame=time;if(this.player&&this.targetPosition){this.player.position.x+=(this.targetPosition.x-this.player.position.x)*.2;this.player.position.z+=(this.targetPosition.z-this.player.position.z)*.2;}this.animateEnemies(time/1000);this.renderer.render(this.scene,this.camera);}
}
function renderThreeDungeon(){
  if(typeof THREE==='undefined'||typeof ResizeObserver==='undefined')return;
  const host=$('miniGrid');try{if(!dungeon3D)dungeon3D=new ThreeDungeon(host);host.insertAdjacentHTML('beforeend','<div class="three-hover" role="status" hidden></div><div class="three-camera-tools"><button type="button" data-three-zoom="in" aria-label="Haritayı yakınlaştır">+</button><button type="button" data-three-zoom="out" aria-label="Haritayı uzaklaştır">−</button><button type="button" data-three-zoom="reset" aria-label="Odayı ekrana sığdır">↺</button></div>');host.querySelectorAll('[data-three-zoom]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.threeZoom;dungeon3D.zoom=v==='reset'?1.2:Math.max(.8,Math.min(2,dungeon3D.zoom+(v==='in'?.15:-.15)));dungeon3D.resize();}));dungeon3D.update();}catch(error){host.classList.remove('has-three');console.error('3D dungeon unavailable; accessible isometric view retained.',error);}
}
