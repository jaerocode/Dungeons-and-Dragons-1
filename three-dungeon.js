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
  door(x,z,direction,seen){
    const g=new THREE.Group(),[, ,w,h]=game.room.bounds;
    g.position.set(direction===3?-1:direction===1?w:x,0,direction===0?-1:direction===2?h:z);
    g.userData.kind='door';g.userData.direction=direction;g.userData.cellKey=(game.room.bounds[0]+x)+':'+(game.room.bounds[1]+z);this.pickGroups.push(g);g.rotation.y=-direction*Math.PI/2;this.world.add(g);
    const stone='#788273';this.box(.2,1.2,.68,stone,-.4,.65,0,g);this.box(.2,1.2,.68,stone,.4,.65,0,g);
    for(let i=0;i<7;i++){const a=(i+.5)/7*Math.PI,m=this.box(.21,.2,.68,i%2?'#89907b':stone,Math.cos(a)*.39,1.17+Math.sin(a)*.28,0,g);m.rotation.z=a-Math.PI/2;}
    this.box(.58,1.05,.12,'#5c4934',0,.63,.25,g);for(let i=-2;i<=2;i++)this.box(.014,.99,.012,'#342f26',i*.115,.63,.318,g);
    for(const y of [.35,.94])this.box(.56,.045,.025,'#303832',0,y,.33,g);
    this.mesh(new THREE.TorusGeometry(.047,.012,4,8),'#bd9d61',.17,.65,.35,g);
    this.box(.8,.035,.8,'#8b8c75',0,.105,.12,g);return g;
  }
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
  playerModel(x,z,appearance={},weapon,preview){
    const g=new THREE.Group(),cls=preview?.characterClass||game.characterClass,body=appearance.body||'#47523b',head=appearance.head||'#68745c',skin='#c2ae8e',leather='#342a24',metal='#a3ac9c';
    g.position.set(x,0,z);g.userData.kind='player';g.userData.characterClass=cls;if(!preview)g.userData.cellKey=(game.room.bounds[0]+x)+':'+(game.room.bounds[1]+z);this.pickGroups.push(g);this.world.add(g);
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
    if(preview?.prepared??game.prepared){
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
  humanoid(kind,x,z,appearance,weapon){
    if(kind==='player')return this.playerModel(x,z,appearance,weapon);
    if(kind==='barrow_wight')return this.wightModel(x,z);
    const g=new THREE.Group();g.position.set(x,0,z);g.userData.kind=kind;g.userData.cellKey=(game.room.bounds[0]+x)+':'+(game.room.bounds[1]+z);this.pickGroups.push(g);this.world.add(g);
    const troll=kind==='troll',skin=troll?'#737b73':'#91a67a',dark=troll?'#434c48':'#334433',armor='#4c5552';
    this.cylinder(troll?.35:.2,troll?.27:.15,troll?.48:.48,skin,0,.86,0,g,6);
    const chest=this.mesh(new THREE.IcosahedronGeometry(troll?.38:.23,0),skin,0,1.01,0,g);chest.scale.set(1.2,1,.7);
    this.cylinder(.2,.26,.24,troll?armor:'#3f4435',0,.6,0,g,6);
    const head=this.mesh(new THREE.IcosahedronGeometry(troll?.235:.23,0),skin,0,1.39,.08,g);head.scale.set(troll?1.15:.85,1.2,.85);
    this.box(troll?.28:.14,.08,.1,dark,0,1.28,.25,g);
    for(const side of [-1,1]){
      this.box(.055,.024,.02,'#1e2c26',side*.085,1.43,.25,g);
      this.mesh(new THREE.ConeGeometry(.03,.07,4),'#c4c1a4',side*.085,1.28,.31,g);
      const knee=[side*.2,.33,.06];this.limb(g,[side*.17,.62,0],knee,troll?.14:.07,troll?skin:'#4b5140');this.limb(g,knee,[side*.22,.12,.12],troll?.105:.045,skin);this.box(troll?.24:.13,.11,troll?.33:.23,skin,side*.23,.13,.17,g);
      const elbow=[side*(troll?.48:.36),.87,.07],hand=[side*(troll?.58:.39),troll?.52:.69,.22];this.limb(g,[side*(troll?.34:.21),1.12,0],elbow,troll?.18:.065,skin);this.limb(g,elbow,hand,troll?.15:.047,skin);this.mesh(new THREE.IcosahedronGeometry(troll?.15:.065,0),skin,...hand,g);
      if(troll){
        const shoulder=this.mesh(new THREE.IcosahedronGeometry(.25,0),armor,side*.38,1.1,0,g);shoulder.scale.y=.65;
        this.limb(g,elbow,hand,.17,armor);for(let i=0;i<3;i++)this.mesh(new THREE.ConeGeometry(.055,.21,4),'#95998a',side*(.38+i*.055),1.28-i*.14,.04,g).rotation.z=-side*.65;
        this.box(.22,.16,.22,armor,side*.2,.34,.09,g);
      }else{
        const ear=this.mesh(new THREE.ConeGeometry(.105,.37,3),skin,side*.29,1.49,0,g);ear.rotation.z=-side*1.12;ear.scale.z=.35;
      }
    }
    if(troll){for(let i=0;i<4;i++)this.box(.43,.04,.075,armor,0,.79+i*.075,.24,g);g.scale.set(2.2,1.85,2.05);}
    else {this.limb(g,[-.39,.7,.22],[-.42,1.12,.3],.045,'#513b29');this.mesh(new THREE.IcosahedronGeometry(.09,0),'#604531',-.42,1.12,.3,g);}
    this.ring(0,0,'#c65b50',g,troll?.4:.35);return g;
  }
  // Animate a separate model group so its tile position and selection ring stay fixed.
  rigEnemy(g){
    const body=new THREE.Group(),parts=g.children.filter(o=>o.geometry?.type!=='TorusGeometry');
    for(const part of parts)body.add(part);g.add(body);
    const legs=parts.filter(o=>o.userData.spiderLeg);
    const tail=parts.find(o=>o.userData.tail);
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
  beast(kind,x,z){
    const g=new THREE.Group();g.position.set(x,0,z);g.userData.kind=kind;g.userData.cellKey=(game.room.bounds[0]+x)+':'+(game.room.bounds[1]+z);this.pickGroups.push(g);this.world.add(g);
    if(kind==='spider'){
      const shell=this.mesh(new THREE.IcosahedronGeometry(.28,1),'#725132',0,.42,-.16,g);shell.scale.set(1,1,1.25);
      const head=this.mesh(new THREE.IcosahedronGeometry(.18,0),'#805b35',0,.35,.19,g);head.scale.set(1.2,.7,1);
      for(const side of [-1,1]){
        this.mesh(new THREE.SphereGeometry(.024,4,3),'#211e19',side*.065,.4,.33,g);
        this.limb(g,[side*.065,.32,.29],[side*.09,.23,.39],.025,'#503c28');
        for(let i=0;i<4;i++){
          const leg=new THREE.Group();leg.position.set(side*.13,.34,(i-1.5)*.11);leg.userData.spiderLeg=true;g.add(leg);
          const knee=[side*(.34+Math.sin(i)*.055),.23,(i-1.5)*.16];this.limb(leg,[0,0,0],knee,.034,'#705032');this.limb(leg,knee,[side*.5,-.25,(i-1.5)*.23],.021,'#553f29');
        }
      }
    }else{
      const fur='#758185',shadow='#4e5e64';const torso=this.mesh(new THREE.IcosahedronGeometry(.32,1),fur,0,.55,-.05,g);torso.scale.set(.85,1,1.65);
      this.mesh(new THREE.IcosahedronGeometry(.31,0),'#879398',0,.69,.25,g);this.mesh(new THREE.IcosahedronGeometry(.22,0),fur,0,.79,.49,g);this.box(.19,.12,.27,shadow,0,.69,.64,g);this.box(.12,.07,.06,'#263338',0,.73,.8,g);
      for(const side of [-1,1]){
        const ear=this.mesh(new THREE.ConeGeometry(.095,.28,4),fur,side*.14,1.02,.41,g);ear.rotation.z=-side*.25;
        this.mesh(new THREE.SphereGeometry(.025,4,3),'#78d2df',side*.155,.83,.64,g,'#2e7d96');
        for(const z of [-.35,.28]){this.limb(g,[side*.21,.53,z],[side*.27,.29,z+.08],.1,fur);this.limb(g,[side*.27,.29,z+.08],[side*.28,.13,z+.14],.06,shadow);this.box(.18,.1,.22,fur,side*.28,.13,z+.18,g);for(let i=0;i<3;i++)this.mesh(new THREE.ConeGeometry(.02,.09,4),'#b9b9a4',side*.28+(i-1)*.045,.11,z+.29,g).rotation.x=Math.PI/2;}
      }
      for(let i=0;i<7;i++){const spike=this.mesh(new THREE.ConeGeometry(.085,.22+(i%2)*.09,4),'#a0aaab',0,.86,-.48+i*.12,g);spike.rotation.x=-.55;}
      const tail=new THREE.Group();tail.position.set(0,.57,-.48);tail.userData.tail=true;g.add(tail);this.limb(tail,[0,0,0],[0,.08,-.28],.085,fur);this.limb(tail,[0,.08,-.28],[0,.32,-.45],.045,shadow);
      g.scale.set(1.15,1.15,1.15);
    }
    this.ring(0,0,'#c85a50',g,.35);return g;
  }
  loot(item,x,z){const g=new THREE.Group();g.userData.kind='loot';g.userData.itemId=item.id;g.position.set(x,0,z);g.userData.cellKey=(game.room.bounds[0]+x)+':'+(game.room.bounds[1]+z);this.pickGroups.push(g);this.world.add(g);this.ring(0,0,'#50b8d3',g,.24);const id=item.id;if(item.type==='map'||item.type==='reading'){this.box(.29,.025,.36,'#cabc83',0,.17,0,g);for(let i=0;i<3;i++)this.box(.17,.005,.012,'#716440',0,.19,-.1+i*.08,g);}else if(item.slot==='weapon')this.weapon(g,item,!!item.staff);else if(item.slot==='armor'||item.slot==='cloak'){this.mesh(new THREE.ConeGeometry(.19,.33,5),item.slot==='armor'?'#899a91':'#617c8d',0,.35,0,g);}else{this.mesh(new THREE.SphereGeometry(.13,6,4),'#68a9b8',0,.29,0,g);this.cylinder(.045,.045,.11,'#bd9e72',0,.43,0,g);} }
  clearWorld(){if(!this.world)return;this.scene.remove(this.world);this.world.traverse(o=>{if(o.geometry)o.geometry.dispose();});this.world=null;}
  update(){const [rx,ry,w,h]=game.room.bounds;this.clearWorld();this.world=new THREE.Group();this.scene.add(this.world);this.pickMeshes=[];this.pickGroups=[];this.host.appendChild(this.canvas);this.host.classList.add('has-three');
    this.box(w+1.8,.23,h+1.8,'#303d32',(w-1)/2,-.2,(h-1)/2);
    for(let z=-1;z<=h;z++)for(let x=-1;x<=w;x++){
      const outside=x<0||x===w||z<0||z===h;if(outside){if((x<0||x===w)&&(z<0||z===h))continue;const opening=game.doors().some(d=>{const p=game.spawnPosition(d),dx=p.x-rx,dz=p.y-ry;return d.direction===0&&z===-1&&x===dx||d.direction===2&&z===h&&x===dx||d.direction===1&&x===w&&z===dz||d.direction===3&&x===-1&&z===dz;});if(opening)continue;this.wall(x,z,x<0||z<0);if((x<0||z<0)&&(x+z)%3===0)this.torch(x,z);continue;}
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
let characterModelPreview=null;
class CharacterModelPreview {
  constructor(host){
    this.host=host;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#202a25');
    this.camera=new THREE.OrthographicCamera(-1.4,1.4,1.8,-1.8,.1,30);this.camera.position.set(3,2.8,4);this.camera.lookAt(0,.9,0);
    this.renderer=new THREE.WebGLRenderer({antialias:true});this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.scene.add(new THREE.HemisphereLight(0xdde6e0,0x303128,2.5));const key=new THREE.DirectionalLight(0xffdeb5,3);key.position.set(-3,6,4);key.castShadow=true;key.shadow.mapSize.set(512,512);this.scene.add(key);
    this.builder=Object.create(ThreeDungeon.prototype);this.builder.scene=this.scene;this.builder.materials=new Map();this.builder.pickGroups=[];
    const floor=new THREE.Mesh(new THREE.CylinderGeometry(.78,.85,.1,8),new THREE.MeshStandardMaterial({color:'#4c574b',roughness:1,flatShading:true}));floor.receiveShadow=true;floor.position.y=.02;this.scene.add(floor);
    this.canvas=this.renderer.domElement;this.canvas.setAttribute('aria-label','İzometrik low-poly karakter önizlemesi');this.canvas.dataset.renderer='three';
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);
    this.renderer.setAnimationLoop(time=>{if(document.hidden||!host.closest('dialog')?.open||time-(this.lastFrame||0)<40)return;this.lastFrame=time;if(this.model)this.model.position.y=Math.sin(time*.002)*.008;this.renderer.render(this.scene,this.camera);});
  }
  update(cls,appearance){
    this.builder.clearWorld();this.builder.world=new THREE.Group();this.scene.add(this.builder.world);this.builder.pickGroups=[];
    this.model=this.builder.playerModel(0,0,appearance,{id:'starter_'+cls.toLowerCase()},{characterClass:cls,prepared:true});
    this.host.replaceChildren(this.canvas);this.canvas.dataset.class=cls;this.resize();
  }
  resize(){const width=this.host.clientWidth,height=this.host.clientHeight;if(!width||!height)return;this.renderer.setSize(width,height,false);const half=1.15,aspect=width/height;this.camera.left=-half*aspect;this.camera.right=half*aspect;this.camera.top=half;this.camera.bottom=-half;this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera);}
}
function renderThreeCharacterPreview(host,cls,appearance){
  if(typeof THREE==='undefined'||typeof ResizeObserver==='undefined')return false;
  try{if(!characterModelPreview)characterModelPreview=new CharacterModelPreview(host);characterModelPreview.update(cls,appearance);return true;}catch(error){console.error('Character 3D preview unavailable.',error);return false;}
}
function renderThreeDungeon(){
  if(typeof THREE==='undefined'||typeof ResizeObserver==='undefined')return;
  const host=$('miniGrid');try{if(!dungeon3D)dungeon3D=new ThreeDungeon(host);host.insertAdjacentHTML('beforeend','<div class="three-hover" role="status" hidden></div><div class="three-camera-tools"><button type="button" data-three-zoom="in" aria-label="Haritayı yakınlaştır">+</button><button type="button" data-three-zoom="out" aria-label="Haritayı uzaklaştır">−</button><button type="button" data-three-zoom="reset" aria-label="Odayı ekrana sığdır">↺</button></div>');host.querySelectorAll('[data-three-zoom]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.threeZoom;dungeon3D.zoom=v==='reset'?1.2:Math.max(.8,Math.min(2,dungeon3D.zoom+(v==='in'?.15:-.15)));dungeon3D.resize();}));dungeon3D.update();}catch(error){host.classList.remove('has-three');console.error('3D dungeon unavailable; accessible isometric view retained.',error);}
}
