import * as THREE from 'three';

/** Procedural architectural illustration of a 1984 Macintosh 128K.
 * Component placement and trace routing are simplified, not fabrication drawings.
 * No external model, ROM, image, or texture assets are used.
 */
export function createMacintoshModel({ screenTexture } = {}) {
  const root = new THREE.Group();
  root.name = 'Macintosh 128K — procedural cutaway';
  const parts = new Map(['cpu','ram','rom','display','floppy','analog','via','scc','iwm','keyboard','mouse','sound'].map(id => [id, []]));
  const layers = [];
  const keys = [];
  const geometries = new Map();
  const materials = {
    beige: new THREE.MeshStandardMaterial({ color: '#d8cbb0', roughness: .74 }),
    lightBeige: new THREE.MeshStandardMaterial({ color: '#e5d9bd', roughness: .68 }),
    darkBeige: new THREE.MeshStandardMaterial({ color: '#a99c80', roughness: .84 }),
    keys: new THREE.MeshStandardMaterial({ color: '#ece2cb', roughness: .66 }),
    pcb: new THREE.MeshStandardMaterial({ color: '#326e4c', roughness: .7, metalness: .08 }),
    analogPCB: new THREE.MeshStandardMaterial({ color: '#8a8350', roughness: .8 }),
    traces: new THREE.MeshStandardMaterial({ color: '#b8b976', metalness: .48, roughness: .48 }),
    chip: new THREE.MeshStandardMaterial({ color: '#303731', roughness: .77 }),
    black: new THREE.MeshStandardMaterial({ color: '#202924', roughness: .8 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#41453d', roughness: .97 }),
    metal: new THREE.MeshStandardMaterial({ color: '#afb6ad', metalness: .68, roughness: .37 }),
    metalDark: new THREE.MeshStandardMaterial({ color: '#727f74', metalness: .62, roughness: .45 }),
    gold: new THREE.MeshStandardMaterial({ color: '#c3ac69', metalness: .66, roughness: .35 }),
    copper: new THREE.MeshStandardMaterial({ color: '#b77a45', metalness: .6, roughness: .4 }),
    crt: new THREE.MeshStandardMaterial({ color: '#485850', metalness: .15, roughness: .46 }),
    glass: new THREE.MeshStandardMaterial({ color: '#7a886b', transparent: true, opacity: .57, roughness: .23, metalness: .12 }),
    blue: new THREE.MeshStandardMaterial({ color: '#467e92', roughness: .63 }),
    red: new THREE.MeshStandardMaterial({ color: '#bd5948', roughness: .66 }),
    yellow: new THREE.MeshStandardMaterial({ color: '#be9d4b', roughness: .75 }),
    ceramic: new THREE.MeshStandardMaterial({ color: '#d6bc86', roughness: .83 }),
    disk: new THREE.MeshStandardMaterial({ color: '#344958', roughness: .75 }),
  };

  const geometry = (key, make) => { if(!geometries.has(key)) geometries.set(key, make()); return geometries.get(key); };
  function box(parent, w,h,d, x,y,z, material=materials.beige, name='') {
    const mesh = new THREE.Mesh(geometry(`b:${w}:${h}:${d}`,()=>new THREE.BoxGeometry(w,h,d)), material);
    mesh.position.set(x,y,z); mesh.name=name; mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
  }
  function roundedPath(path,x,y,w,h,r) {
    path.moveTo(x+r,y); path.lineTo(x+w-r,y); path.quadraticCurveTo(x+w,y,x+w,y+r);
    path.lineTo(x+w,y+h-r); path.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    path.lineTo(x+r,y+h); path.quadraticCurveTo(x,y+h,x,y+h-r);
    path.lineTo(x,y+r); path.quadraticCurveTo(x,y,x+r,y); return path;
  }
  function bevelBox(parent,w,h,d,x,y,z,material=materials.beige,r=.025) {
    const mesh=new THREE.Mesh(geometry(`r:${w}:${h}:${d}:${r}`,()=>{
      const shape=roundedPath(new THREE.Shape(),-w/2+r,-h/2+r,w-2*r,h-2*r,r);
      const g=new THREE.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:2,steps:1,curveSegments:3});
      g.translate(0,0,-(d-2*r)/2); return g;
    }),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(parent,radius,height,x,y,z,material=materials.metal,axis='y',segments=20) {
    const mesh=new THREE.Mesh(geometry(`c:${radius}:${height}:${segments}`,()=>new THREE.CylinderGeometry(radius,radius,height,segments)),material);
    mesh.position.set(x,y,z);if(axis==='x')mesh.rotation.z=Math.PI/2;if(axis==='z')mesh.rotation.x=Math.PI/2;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function ring(parent,radius,tube,x,y,z,material=materials.copper,axis='z') {
    const mesh=new THREE.Mesh(geometry(`t:${radius}:${tube}`,()=>new THREE.TorusGeometry(radius,tube,6,28)),material);
    mesh.position.set(x,y,z);if(axis==='y')mesh.rotation.x=Math.PI/2;if(axis==='x')mesh.rotation.y=Math.PI/2;parent.add(mesh);return mesh;
  }
  function wire(parent,points,radius,material) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,32,radius,6,false),material);parent.add(mesh);return mesh;
  }
  function instances(parent,g,material,positions) {
    const mesh=new THREE.InstancedMesh(g,material,positions.length);const matrix=new THREE.Matrix4();
    positions.forEach((v,i)=>{matrix.makeTranslation(...v);mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function mark(parent,text,width,height,x,y,z,{color='#d2d3b8',orientation='front',font=46}={}) {
    if(!globalThis.document?.createElement)return null;
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext('2d');if(!ctx)return null;
    ctx.clearRect(0,0,512,128);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${font}px monospace`;
    const lines=text.split('\n');lines.forEach((line,i)=>ctx.fillText(line,256,64+(i-(lines.length-1)/2)*(font+7),492));
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);mesh.position.set(x,y,z);
    if(orientation==='top')mesh.rotation.x=-Math.PI/2;if(orientation==='back')mesh.rotation.y=Math.PI;if(orientation==='right')mesh.rotation.y=Math.PI/2;
    mesh.renderOrder=2;parent.add(mesh);return mesh;
  }
  function register(id,object,primary=false) {
    object.userData.part=id;
    object.traverse(child=>{if(!child.userData.part)child.userData.part=id;});
    primary?parts.get(id).unshift(object):parts.get(id).push(object);return object;
  }
  function layer(name,exploded) {
    const group=new THREE.Group();group.name=name;root.add(group);
    layers.push({name,object:group,assembled:group.position.clone(),exploded:new THREE.Vector3(...exploded)});return group;
  }
  function screw(parent,x,y,z,axis='y') {
    const head=cylinder(parent,.027,.018,x,y,z,materials.metal,axis,12);
    const slot=box(parent,.034,.006,.006,x,y+.011,z,materials.metalDark);
    if(axis==='z'){slot.position.set(x,y,z+.011);slot.rotation.x=Math.PI/2;}if(axis==='x'){slot.position.set(x+.011,y,z);slot.rotation.z=Math.PI/2;}return head;
  }
  function dip(parent,id,x,z,w,d,pinCount,labelText) {
    const group=new THREE.Group();group.position.set(x,.07,z);parent.add(group);
    bevelBox(group,w,.10,d,0,.04,0,materials.chip,.009);
    const count=pinCount/2,pins=[];
    for(let i=0;i<count;i++){const px=-w/2+.025+i*(w-.05)/(count-1);pins.push([px,.006,-d/2-.021],[px,.006,d/2+.021]);}
    instances(group,new THREE.BoxGeometry(.012,.035,.071),materials.gold,pins);
    cylinder(group,.017,.003,-w/2+.037,.092,-d/2+.032,materials.darkBeige,'y',10);
    // A molded end-notch, with a short black inset instead of an extra Boolean mesh.
    cylinder(group,.025,.004,-w/2+.011,.092,0,materials.black,'y',12);
    mark(group,labelText,w*.82,d*.72,0,.096,0,{orientation:'top',font:28});
    register(id,group,id!=='ram'&&id!=='rom');return group;
  }

  // Enclosure: open ventilation slots and recessed carrying handle, never a fan.
  const shell=layer('shell',[2.05,.35,-.65]);shell.userData.isShell=true;
  bevelBox(shell,2.37,3.04,.12,0,1.70,-1.10,materials.beige,.022);
  for(const side of [-1,1]) {
    const x=side*1.155;
    box(shell,.12,2.36,2.16,x,1.37,-.01,materials.beige);
    box(shell,.12,.13,2.16,x,3.185,-.01,materials.beige);
    box(shell,.12,.61,.13,x,2.87,-1.025,materials.beige);box(shell,.12,.61,.13,x,2.87,1.005,materials.beige);
    for(let i=0;i<15;i++)box(shell,.12,.61,.07,x,2.87,-.90+i*.126,materials.beige);
  }
  box(shell,2.30,.11,1.53,0,3.225,.235,materials.lightBeige);
  box(shell,2.30,.11,.22,0,3.225,-1.0,materials.lightBeige);
  box(shell,.75,.11,.34,-.775,3.225,-.72,materials.lightBeige);box(shell,.75,.11,.34,.775,3.225,-.72,materials.lightBeige);
  bevelBox(shell,.79,.045,.33,0,3.15,-.72,materials.darkBeige,.01);
  box(shell,2.3,.11,2.15,0,.20,-.01,materials.darkBeige);
  for(const x of [-.91,.91]) for(const y of [.43,2.97])screw(shell,x,y,-1.17,'z');
  for(const x of [-.84,.84])for(const z of [-.76,.73])bevelBox(shell,.22,.09,.24,x,.115,z,materials.rubber,.018);
  mark(shell,'Macintosh 128K\nAPPLE COMPUTER · 1984',1.28,.31,0,1.59,-1.17,{orientation:'back',color:'#615c4f',font:31});
  const rearPorts=new THREE.Group();shell.add(rearPorts);
  for(const [x,width,name,id] of [[-.73,.27,'MOUSE','mouse'],[-.28,.27,'MODEM','scc'],[.16,.27,'PRINTER','scc'],[.67,.40,'DISK','iwm']]) {
    const port=new THREE.Group();port.position.set(x,.64,-1.18);rearPorts.add(port);
    bevelBox(port,width,.17,.045,0,0,0,materials.metal,.012);box(port,width-.06,.095,.01,0,0,-.03,materials.black);
    const positions=[];for(let row=0;row<2;row++)for(let i=0;i<(row?4:5);i++)positions.push([-width*.28+i*width*.13+(row?.012:0),row?.023:-.023,-.04]);
    instances(port,new THREE.SphereGeometry(.008,6,4),materials.gold,positions);
    mark(port,name,width+.07,.05,0,-.155,-.032,{orientation:'back',color:'#645f50',font:39});register(id,port);
  }
  box(shell,.34,.28,.025,-.68,1.1,-1.178,materials.black);
  box(shell,.11,.20,.025,-.26,1.1,-1.18,materials.black);
  mark(shell,'POWER',.26,.05,-.26,.92,-1.20,{orientation:'back',color:'#625d4e'});

  // Front cover with an actual through-opening for both CRT and disk slot.
  const front=layer('front',[-2.16,.02,.42]);
  const frontShape=roundedPath(new THREE.Shape(),-1.15,.18,2.30,3.03,.065);
  frontShape.holes.push(roundedPath(new THREE.Path(),-.95,1.62,1.90,1.44,.06));
  frontShape.holes.push(roundedPath(new THREE.Path(),-.58,.969,1.43,.08,.018));
  const face=new THREE.Mesh(new THREE.ExtrudeGeometry(frontShape,{depth:.11,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,curveSegments:6}),materials.beige);
  face.position.z=1.055;face.castShadow=true;face.receiveShadow=true;front.add(face);
  const bezel=new THREE.Group();front.add(bezel);
  const bezelShape=roundedPath(new THREE.Shape(),-.954,1.615,1.908,1.45,.065);
  bezelShape.holes.push(roundedPath(new THREE.Path(),-.865,1.716,1.73,1.24,.048));
  const gasket=new THREE.Mesh(new THREE.ExtrudeGeometry(bezelShape,{depth:.035,bevelEnabled:false,curveSegments:6}),materials.darkBeige);gasket.position.z=1.117;bezel.add(gasket);register('display',bezel);
  const slot=new THREE.Group();front.add(slot);box(slot,1.42,.023,.035,.13,.960,1.176,materials.darkBeige);cylinder(slot,.009,.013,.89,.85,1.172,materials.black,'z',8);register('floppy',slot);
  const rainbow=['#61b64c','#f4c541','#ee853a','#df534a','#a45bb1','#3397c7'];
  rainbow.forEach((color,i)=>box(front,.024,.135,.006,-.918+i*.023,.493,1.187,new THREE.MeshStandardMaterial({color,roughness:.8})));
  mark(front,'Macintosh',.59,.115,-.43,.50,1.19,{color:'#5c594e',font:44});
  mark(front,'128K',.22,.045,-.83,.34,1.19,{color:'#8b8068',font:40});
  const keyboardJack=box(front,.12,.07,.016,-.99,.275,1.183,materials.black);register('keyboard',keyboardJack);

  // CRT: rectangular glass envelope tapering into the neck, copper yoke, mounting band.
  const crt=layer('crt',[-.18,.88,-.12]);
  const crtPart=new THREE.Group();crt.add(crtPart);
  const rings=[{z:1.04,w:.89,h:.63},{z:.81,w:.87,h:.61},{z:-.53,w:.15,h:.14}];
  const outline=[[-1,-.78],[-.78,-1],[.78,-1],[1,-.78],[1,.78],[.78,1],[-.78,1],[-1,.78]];
  const vertices=[],indices=[];
  rings.forEach(r=>outline.forEach(([x,y])=>vertices.push(x*r.w,2.33+y*r.h,r.z)));
  for(let ringIndex=0;ringIndex<rings.length-1;ringIndex++)for(let i=0;i<8;i++){const a=ringIndex*8+i,b=ringIndex*8+(i+1)%8,c=(ringIndex+1)*8+i,d=(ringIndex+1)*8+(i+1)%8;indices.push(a,c,b,b,c,d);}
  const funnelGeometry=new THREE.BufferGeometry();funnelGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));funnelGeometry.setIndex(indices);funnelGeometry.computeVertexNormals();
  const funnel=new THREE.Mesh(funnelGeometry,materials.crt);funnel.castShadow=true;crtPart.add(funnel);
  bevelBox(crtPart,1.81,1.28,.115,0,2.33,1.052,materials.black,.035);
  const screenMaterial=new THREE.MeshBasicMaterial({map:screenTexture||null,color:screenTexture?'#ffffff':'#bdc7ad',toneMapped:false});
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.70,1.136),screenMaterial);screen.name='512 × 342 monochrome framebuffer';screen.position.set(0,2.33,1.117);crtPart.add(screen);
  const shineMaterial=new THREE.MeshBasicMaterial({color:'#e6f0d9',transparent:true,opacity:.045,depthWrite:false,toneMapped:false});
  const shine=new THREE.Mesh(new THREE.PlaneGeometry(1.60,.07),shineMaterial);shine.position.set(0,2.805,1.119);crtPart.add(shine);
  for(const x of [-.923,.923])box(crtPart,.027,1.24,.15,x,2.33,1.005,materials.metal);
  for(const y of [1.68,2.98])box(crtPart,1.84,.028,.15,0,y,1.005,materials.metal);
  for(const x of [-.87,.87])for(const y of [1.63,3.025]){box(crtPart,.12,.10,.09,x,y,.99,materials.metalDark);screw(crtPart,x,y,1.042,'z');}
  cylinder(crtPart,.145,.30,0,2.33,-.60,materials.black,'z');
  for(let i=0;i<10;i++)ring(crtPart,.148,.013,0,2.33,-.465-i*.025,materials.copper);
  cylinder(crtPart,.076,.40,0,2.33,-.94,materials.glass,'z',16);
  cylinder(crtPart,.09,.07,0,2.33,-1.155,materials.black,'z',16);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;cylinder(crtPart,.008,.08,Math.cos(a)*.052,2.33+Math.sin(a)*.052,-1.217,materials.gold,'z',6);}
  register('display',crtPart,true);

  // Main logic board: sixteen 64-Kbit DRAMs, paired ROMs, 64-pin MC68000 and I/O chips.
  const logic=layer('logic',[.06,-.06,1.22]);
  const logicAssembly=new THREE.Group();logicAssembly.position.set(0,.32,-.08);logic.add(logicAssembly);
  box(logicAssembly,2.11,.045,1.85,0,0,0,materials.pcb);
  for(const x of [-.96,.96])for(const z of [-.83,.83]){cylinder(logicAssembly,.037,.08,x,-.04,z,materials.metalDark);screw(logicAssembly,x,.04,z);}
  // Repeated PCB traces use instancing rather than individual draw calls.
  const tracePositions=[],traceCross=[];
  for(let i=0;i<24;i++){tracePositions.push([-.96+i*.079,.025,0]);traceCross.push([0,.026,-.78+i*.065]);}
  instances(logicAssembly,new THREE.BoxGeometry(.005,.002,1.61),materials.traces,tracePositions);
  instances(logicAssembly,new THREE.BoxGeometry(1.95,.002,.004),materials.traces,traceCross);
  const cpu=dip(logicAssembly,'cpu',-.38,.49,1.05,.245,64,'MOTOROLA\nMC68000');cpu.name='64-pin Motorola MC68000';
  const ramBank=new THREE.Group();logicAssembly.add(ramBank);
  for(let row=0;row<2;row++)for(let col=0;col<8;col++) {
    const chip=dip(ramBank,'ram',-.82+col*.235,-.58+row*.33,.177,.205,16,'4164');chip.name=`64K × 1 DRAM ${row*8+col+1}`;
  }
  register('ram',ramBank,true);
  const romPair=new THREE.Group();logicAssembly.add(romPair);
  dip(romPair,'rom',.44,.42,.30,.205,28,'ROM HI');dip(romPair,'rom',.82,.42,.30,.205,28,'ROM LO');register('rom',romPair,true);
  dip(logicAssembly,'via',-.62,.06,.50,.22,40,'SY6522 VIA');
  dip(logicAssembly,'scc',.01,.06,.50,.22,40,'Z8530 SCC');
  dip(logicAssembly,'iwm',.65,.06,.36,.22,28,'IWM');
  mark(logicAssembly,'APPLE COMPUTER · 128K LOGIC BOARD',1.43,.065,-.09,.029,.84,{orientation:'top',color:'#dae0b8',font:29});
  const edgePads=[];for(let i=0;i<24;i++)edgePads.push([-.65+i*.055,.028,-.918]);
  instances(logicAssembly,new THREE.BoxGeometry(.034,.008,.045),materials.gold,edgePads);
  for(let i=0;i<12;i++) {
    const x=-.9+i*.164;
    box(logicAssembly,.039,.055,.023,x,.052,-.035,materials.ceramic);
    box(logicAssembly,.006,.025,.027,x-.026,.032,-.035,materials.gold);box(logicAssembly,.006,.025,.027,x+.026,.032,-.035,materials.gold);
  }
  for(const [x,z] of [[-.95,.28],[-.95,.66],[.95,-.02],[.96,.73]]){
    cylinder(logicAssembly,.038,.105,x,.074,z,materials.blue);cylinder(logicAssembly,.035,.007,x,.13,z,materials.metal);
    mark(logicAssembly,'+',.02,.023,x,.137,z,{orientation:'top',color:'#33483f',font:48});
  }
  for(const x of [-.72,-.22,.30]){
    const connector=box(logicAssembly,.27,.12,.13,x,.082,-.865,materials.black);
    instances(connector,new THREE.BoxGeometry(.012,.07,.012),materials.gold,Array.from({length:8},(_,i)=>[-.11+i*.031,.06,0]));
  }

  // Analog board and speaker, on the vertical side board. The original machine is fanless.
  const analog=layer('analog',[1.70,.20,.10]);
  const analogPart=new THREE.Group();analog.add(analogPart);
  box(analogPart,.045,2.42,1.62,.905,1.60,-.22,materials.analogPCB);
  const analogCopper=[];for(let i=0;i<12;i++)analogCopper.push([.931,.50+i*.19,-.22]);
  instances(analogPart,new THREE.BoxGeometry(.005,.009,1.41),materials.traces,analogCopper);
  for(const y of [.46,2.72])for(const z of [-.92,.47])screw(analogPart,.942,y,z,'x');
  for(const [y,z,radius] of [[2.27,-.55,.11],[2.19,-.20,.084],[1.86,-.69,.07],[1.95,.25,.068]]) {
    cylinder(analogPart,radius,.25,1.045,y,z,materials.black,'x');cylinder(analogPart,radius*.92,.014,1.177,y,z,materials.metal,'x');
    box(analogPart,.008,radius*1.2,.01,1.187,y,z,materials.metalDark);
  }
  const transformer=new THREE.Group();transformer.position.set(1.06,1.23,-.55);analogPart.add(transformer);
  bevelBox(transformer,.31,.43,.43,0,0,0,materials.yellow,.018);
  box(transformer,.33,.29,.27,0,0,0,materials.black);
  for(let i=0;i<10;i++)box(transformer,.34,.017,.33,0,-.13+i*.027,0,materials.copper);
  box(transformer,.36,.045,.45,0,-.22,0,materials.metalDark);box(transformer,.36,.045,.45,0,.22,0,materials.metalDark);
  const flyback=bevelBox(analogPart,.29,.36,.28,1.075,1.62,.25,materials.black,.02);flyback.name='High-voltage flyback transformer';
  wire(analogPart,[[1.17,1.80,.27],[1.17,2.20,.17],[.88,2.80,.01],[.40,2.86,.11],[.36,2.72,.19]],.019,materials.red);
  for(let i=0;i<5;i++) {
    cylinder(analogPart,.026,.16,1.025,.92+i*.145,-.02,materials.ceramic,'z',10);
    for(let band=0;band<3;band++)ring(analogPart,.027,.005,1.025,.92+i*.145,-.055+band*.028,band===1?materials.red:materials.black);
  }
  box(analogPart,.12,.12,.28,1.0,.54,-.64,materials.lightBeige);
  mark(analogPart,'ANALOG / POWER',.67,.085,.94,2.56,-.22,{orientation:'right',color:'#e1debc',font:36});
  register('analog',analogPart,true);
  const speaker=new THREE.Group();speaker.position.set(1.015,.69,.20);analog.add(speaker);
  cylinder(speaker,.26,.08,0,0,0,materials.metalDark,'x',32);
  cylinder(speaker,.222,.083,.01,0,0,materials.black,'x',32);
  ring(speaker,.224,.018,.057,0,0,materials.rubber,'x');
  const cone=new THREE.Mesh(new THREE.ConeGeometry(.187,.048,32,1,true),materials.rubber);cone.rotation.z=-Math.PI/2;cone.position.x=.065;speaker.add(cone);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(.07,16,10),materials.chip);dome.scale.x=.45;dome.position.x=.087;speaker.add(dome);
  wire(speaker,[[0,-.20,0],[.02,-.34,-.06],[-.06,-.38,-.12]],.009,materials.yellow);register('sound',speaker,true);

  // Sony 400K drive mechanism, with a movable disk and a spindle for read animation.
  const drive=layer('drive',[.04,.10,1.33]);
  const drivePart=new THREE.Group();drivePart.position.set(.08,.91,.34);drive.add(drivePart);
  box(drivePart,1.67,.055,1.43,0,-.02,0,materials.metal);
  for(const x of [-.815,.815])box(drivePart,.045,.24,1.42,x,.10,0,materials.metalDark);
  box(drivePart,1.65,.20,.05,0,.075,-.70,materials.metal);
  box(drivePart,1.64,.19,.07,0,.073,.73,materials.metalDark);
  box(drivePart,1.38,.045,.082,0,.12,.773,materials.black);
  const spindle=cylinder(drivePart,.27,.05,0,.035,-.02,materials.metalDark);spindle.name='Floppy spindle motor';
  cylinder(spindle,.115,.018,0,.035,0,materials.metal);box(spindle,.07,.012,.028,.12,.037,0,materials.black);
  for(const x of [-.61,.61]){cylinder(drivePart,.018,1.06,x,.17,-.02,materials.metal,'z',12);box(drivePart,.09,.07,.28,x,.17,-.37,materials.black);}
  box(drivePart,.23,.085,.18,.12,.12,-.48,materials.chip);box(drivePart,.07,.10,.12,.12,.20,-.39,materials.metal);
  const gear=cylinder(drivePart,.12,.045,.59,.043,.39,materials.lightBeige,'y',18);for(let i=0;i<6;i++){const a=i*Math.PI/3;cylinder(gear,.015,.01,Math.cos(a)*.071,.028,Math.sin(a)*.071,materials.darkBeige,'y',6);}
  for(const x of [-.73,.73])for(const z of [-.60,.59])screw(drivePart,x,.14,z);
  const ribbon=new THREE.Group();drivePart.add(ribbon);box(ribbon,.39,.015,.46,.48,-.01,-.90,materials.ceramic);
  for(let i=0;i<12;i++)box(ribbon,.008,.002,.45,.308+i*.031,.0005,-.90,i===0?materials.red:materials.darkBeige);
  register('floppy',drivePart,true);
  const disk=new THREE.Group();disk.name='Movable 3.5-inch disk';disk.position.set(0,.195,.06);drivePart.add(disk);
  bevelBox(disk,1.20,.055,1.24,0,0,0,materials.disk,.01);
  box(disk,.53,.008,.49,.03,.033,-.366,materials.metal);
  box(disk,.105,.009,.28,.025,.040,-.375,materials.black);
  box(disk,.88,.008,.41,0,.033,.19,materials.lightBeige);
  mark(disk,'MACINTOSH\n400K · SYSTEM DISK',.79,.29,0,.039,.19,{orientation:'top',color:'#4b554e',font:29});
  box(disk,.07,.012,.07,.48,.034,.51,materials.black);box(disk,.055,.012,.09,-.48,.034,.49,materials.black);
  disk.userData.homePosition=disk.position.clone();disk.userData.ejectedPosition=disk.position.clone().add(new THREE.Vector3(0,.005,1.08));register('floppy',disk);

  // Compact original keyboard: no numeric keypad, arrows, or function-key row.
  const keyboard=new THREE.Group();keyboard.position.set(-.15,.09,2.64);root.add(keyboard);
  bevelBox(keyboard,3.13,.22,1.16,0,.075,0,materials.beige,.04);
  box(keyboard,2.91,.035,.92,0,.192,0,materials.darkBeige);
  const keyMaterial=materials.keys;
  function key(x,z,w,labelText,eventKey=labelText.toLowerCase()) {
    const mesh=bevelBox(keyboard,w,.12,.19,x,.257,z,keyMaterial,.016);
    mesh.name=`Key ${labelText||'space'}`;mesh.userData.key=eventKey;mesh.userData.homeY=mesh.position.y;
    const marking=mark(mesh,labelText,w*.76,.12,0,.068,.012,{orientation:'top',color:'#675f4f',font:41});
    if(marking)marking.userData.key=eventKey;keys.push(mesh);return mesh;
  }
  const digits=['`','1','2','3','4','5','6','7','8','9','0','−','='];
  digits.forEach((s,i)=>key(-1.34+i*.199,-.343,.18,s,s==='−'?'-':s));key(1.31,-.343,.27,'⌫','Backspace');
  key(-1.29,-.115,.29,'tab','Tab');'QWERTYUIOP'.split('').forEach((s,i)=>key(-1.00+i*.209,-.115,.187,s));key(1.15,-.115,.18,'[');key(1.35,-.115,.18,']');
  key(-1.26,.112,.35,'lock','CapsLock');'ASDFGHJKL'.split('').forEach((s,i)=>key(-.98+i*.208,.112,.185,s));key(.895,.112,.18,';');key(1.225,.112,.44,'return','Enter');
  key(-1.20,.341,.47,'shift','Shift');'ZXCVBNM'.split('').forEach((s,i)=>key(-.82+i*.206,.341,.183,s));key(.62,.341,.18,',');key(.82,.341,.18,'.');key(1.02,.341,.18,'/');key(1.30,.341,.32,'shift','Shift');
  // The short front lip carries command and space; this row projects toward the viewer.
  key(-1.15,.555,.34,'⌘','Meta');key(-.07,.555,1.77,'',' ');key(1.15,.555,.35,'enter','Enter');
  // A shallow extension under the bottom row keeps every key seated on the case.
  bevelBox(keyboard,3.13,.20,.27,0,.06,.51,materials.beige,.03);
  wire(keyboard,[[-.58,.12,-.58],[-.74,.06,-.85],[-1.17,.0,-1.01],[-1.19,.11,-1.30],[-.87,.29,-1.45]],.018,materials.darkBeige);
  register('keyboard',keyboard,true);

  // One-button mouse and cable, with a separate button mesh for tactile animation.
  const mouse=new THREE.Group();mouse.position.set(2.12,.13,2.60);mouse.rotation.y=-.16;root.add(mouse);
  bevelBox(mouse,.65,.29,1.00,0,.03,0,materials.beige,.065);
  const mouseButton=bevelBox(mouse,.55,.065,.56,0,.201,-.17,materials.lightBeige,.025);mouseButton.name='Single mouse button';mouseButton.userData.homeY=mouseButton.position.y;
  box(mouse,.54,.008,.012,0,.202,.126,materials.darkBeige);
  wire(mouse,[[0,.10,-.50],[.08,-.02,-.88],[.50,-.045,-1.39],[.30,-.045,-2.48],[-.52,.03,-3.65],[-1.36,.32,-3.78]],.016,materials.darkBeige);
  register('mouse',mouse,true);

  // Stable object references are preferable to guessed world coordinates when exploding.
  const focusTargets=new Map([...parts].map(([id,objects])=>[id,objects[0]]));
  root.userData.model='Macintosh 128K';root.userData.illustrativeLayout=true;
  return {root,parts,layers,shell,shellObjects:[shell],screenMaterial,screen, disk,keys,mouseButton,spindle,focusTargets};
}
