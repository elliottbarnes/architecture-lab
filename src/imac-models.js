import * as THREE from 'three';

/** Original procedural iMac illustrations. Component locations and visible package
 * details explain architecture; they are not service or manufacturing drawings. */
export function createIMacModel({ screenTexture, generation = 'imac-g3' } = {}) {
  if(!['imac-g3','imac-m4'].includes(generation)) throw new RangeError(`Unsupported iMac generation: ${generation}`);
  const modern=generation==='imac-m4';
  const root=new THREE.Group();root.name=modern?'iMac M4 · 2024':'iMac G3 Bondi · 1998';
  const ids=modern?['cpu','ram','gpu','storage','io','analog','display','sound','camera','keyboard','mouse']:['cpu','ram','gpu','storage','optical','io','analog','display','sound','keyboard','mouse'];
  const parts=new Map(ids.map(id=>[id,[]])),layers=[],keys=[],cache=new Map();
  const material=(color,roughness=.64,metalness=0,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
  const mat={
    cream:material('#e6e3cf',.63),white:material('#f0efdf',.57),key:material('#f3f0e1',.65),
    gray:material('#777f76',.71),black:material('#242f2e',.75),rubber:material('#414b43',.9),
    bondi:material('#168c94',.23,.06,{transparent:true,opacity:.78,side:THREE.DoubleSide,depthWrite:false}),
    teal:material('#167e86',.43,.06),tealLight:material('#66b9b7',.45,.02),
    blue:material('#70a4bd',.41,.54),blueDark:material('#497f9d',.48,.50),silver:material('#c8ceca',.35,.73),
    steel:material('#909e96',.43,.66),pcb:material('#307a59',.7,.03),gold:material('#c1a75c',.36,.63),
    copper:material('#ad7045',.37,.65),chip:material('#2c3836',.67),ceramic:material('#c6b07d',.79),
    crt:material('#3c534d',.47,.14),glass:material('#739179',.28,.06,{transparent:true,opacity:.52}),
    red:material('#b3544c',.73),memory:material('#334e59',.60),gpu:material('#397b92',.45,.1),
  };
  function geom(key,create){if(!cache.has(key))cache.set(key,create());return cache.get(key);}
  function mesh(parent,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(parent,w,h,d,x=0,y=0,z=0,material=mat.cream){return mesh(parent,geom(`b${w},${h},${d}`,()=>new THREE.BoxGeometry(w,h,d)),material,x,y,z);}
  function rect(path,x,y,w,h,r){path.moveTo(x+r,y);path.lineTo(x+w-r,y);path.quadraticCurveTo(x+w,y,x+w,y+r);path.lineTo(x+w,y+h-r);path.quadraticCurveTo(x+w,y+h,x+w-r,y+h);path.lineTo(x+r,y+h);path.quadraticCurveTo(x,y+h,x,y+h-r);path.lineTo(x,y+r);path.quadraticCurveTo(x,y,x+r,y);return path;}
  function round(parent,w,h,d,x,y,z,material=mat.cream,r=.025){
    return mesh(parent,geom(`r${w},${h},${d},${r}`,()=>{
      const shape=rect(new THREE.Shape(),-w/2+r,-h/2+r,w-2*r,h-2*r,r);
      const g=new THREE.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:2,steps:1,curveSegments:4});g.translate(0,0,-(d-2*r)/2);return g;
    }),material,x,y,z);
  }
  function cyl(parent,r,h,x,y,z,material=mat.steel,axis='y',segments=24){const m=mesh(parent,geom(`c${r},${h},${segments}`,()=>new THREE.CylinderGeometry(r,r,h,segments)),material,x,y,z);if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;return m;}
  function torus(parent,r,t,x,y,z,material=mat.copper,axis='z'){const m=mesh(parent,geom(`t${r},${t}`,()=>new THREE.TorusGeometry(r,t,6,32)),material,x,y,z);if(axis==='y')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.y=Math.PI/2;return m;}
  function line(parent,points,r,material){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(parent,new THREE.TubeGeometry(curve,32,r,6,false),material);}
  function repeated(parent,geometry,material,positions){const m=new THREE.InstancedMesh(geometry,material,positions.length),matrix=new THREE.Matrix4();positions.forEach((p,i)=>{matrix.makeTranslation(...p);m.setMatrixAt(i,matrix);});m.instanceMatrix.needsUpdate=true;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function part(id,object,primary=false){object.userData.part=id;object.traverse(c=>{if(!c.userData.part)c.userData.part=id;});primary?parts.get(id).unshift(object):parts.get(id).push(object);return object;}
  function layer(name,position){const object=new THREE.Group();object.name=name;root.add(object);layers.push({name,object,assembled:object.position.clone(),exploded:new THREE.Vector3(...position)});return object;}
  function group(parent,name,x=0,y=0,z=0){const g=new THREE.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;}
  function text(parent,value,w,h,x,y,z,{orientation='front',color='#d8dec6',font=39}={}){
    if(!globalThis.document?.createElement)return null;const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');if(!ctx)return null;
    ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${font}px monospace`;const lines=value.split('\n');lines.forEach((v,i)=>ctx.fillText(v,256,64+(i-(lines.length-1)/2)*(font+7),493));
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const m=mesh(parent,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}),x,y,z);
    if(orientation==='top')m.rotation.x=-Math.PI/2;if(orientation==='back')m.rotation.y=Math.PI;if(orientation==='right')m.rotation.y=Math.PI/2;m.castShadow=false;m.renderOrder=2;return m;
  }
  function screw(parent,x,y,z,axis='y'){cyl(parent,.025,.013,x,y,z,mat.steel,axis,12);const m=box(parent,.030,.004,.004,x,y+.009,z,mat.black);if(axis==='z'){m.position.set(x,y,z+.009);m.rotation.x=Math.PI/2;}return m;}
  function packageChip(parent,x,y,z,w,d,legend,{id=null,pins=0,orientation='top'}={}){
    const g=group(parent,legend,x,y,z);round(g,w,.067,d,0,.02,0,mat.chip,.009);
    if(pins){const pos=[];for(let i=0;i<pins/2;i++){const px=-w/2+.018+i*(w-.036)/(pins/2-1);pos.push([px,-.002,-d/2-.018],[px,-.002,d/2+.018]);}repeated(g,new THREE.BoxGeometry(.010,.023,.046),mat.gold,pos);}
    cyl(g,.012,.003,-w*.36,.055,-d*.25,mat.gray,'y',8);text(g,legend,w*.85,d*.8,0,.056,0,{orientation,font:34});if(id)part(id,g);return g;
  }
  function traces(parent,w,d,y){const a=[],b=[];for(let i=0;i<20;i++){a.push([-w*.46+i*w*.048,y,0]);b.push([0,y,-d*.45+i*d*.047]);}repeated(parent,new THREE.BoxGeometry(.004,.002,d*.94),mat.gold,a);repeated(parent,new THREE.BoxGeometry(w*.94,.002,.004),mat.gold,b);}
  function screenAt(parent,w,h,x,y,z){const material=new THREE.MeshBasicMaterial({map:screenTexture||null,color:screenTexture?'#ffffff':'#adc8c2',toneMapped:false});const screen=mesh(parent,new THREE.PlaneGeometry(w,h),material,x,y,z);screen.name='Live display texture';screen.castShadow=false;return {screen,screenMaterial:material};}
  function keyboardAt({bondi=false,x=0,z=2.7}={}){
    const keyboard=group(root,bondi?'Bondi USB keyboard':'Magic-style keyboard',x,.09,z);
    const width=bondi?3.55:3.24,depth=bondi?1.21:1.03;
    round(keyboard,width,bondi?.19:.09,depth,0,bondi?.07:.025,0,bondi?mat.tealLight:mat.silver,bondi?.035:.018);
    round(keyboard,width-.10,.035,depth-.11,0,bondi?.177:.079,0,bondi?mat.cream:mat.white,.009);
    const homeY=bondi?.245:.123;
    function key(px,pz,w,label,value=label.toLowerCase(),d=.16){const m=round(keyboard,w,bondi?.088:.043,d,px,homeY,pz,mat.key,bondi?.013:.008);m.name=`Key ${label||'Space'}`;m.userData.key=value;m.userData.homeY=homeY;const t=text(m,label,w*.8,.095,0,bondi?.048:.026,.004,{orientation:'top',color:'#61675f',font:42});if(t)t.userData.key=value;keys.push(m);return m;}
    const step=bondi?.196:.183,start=bondi?-1.46:-1.35;
    for(let i=0;i<12;i++)key(start+i*step,-.40,step-.015,i===0?'esc':`F${i}`,i===0?'Escape':`F${i}`,.105);
    const numbers=['`','1','2','3','4','5','6','7','8','9','0','−','='];numbers.forEach((s,i)=>key(start+i*step,-.24,step-.015,s,s==='−'?'-':s));key(start+13*step,-.24,step+.05,'⌫','Backspace');
    key(start,-.04,step+.09,'tab','Tab');'QWERTYUIOP'.split('').forEach((s,i)=>key(start+step*1.35+i*step,-.04,step-.015,s));key(start+11.35*step,-.04,step-.015,'[');key(start+12.35*step,-.04,step-.015,']');
    key(start+.03,.16,step+.14,'caps','CapsLock');'ASDFGHJKL'.split('').forEach((s,i)=>key(start+step*1.55+i*step,.16,step-.015,s));key(start+10.55*step,.16,step-.015,';');key(start+12.0*step,.16,step*1.75,'return','Enter');
    key(start+.055,.36,step+.19,'shift','Shift');'ZXCVBNM'.split('').forEach((s,i)=>key(start+step*1.75+i*step,.36,step-.015,s));key(start+8.75*step,.36,step-.015,',');key(start+9.75*step,.36,step-.015,'.');key(start+11.35*step,.36,step*2.1,'shift','Shift');
    // The short space row is in front of the alphanumeric field, within its own lip.
    round(keyboard,width,bondi?.18:.075,.23,0,bondi?.06:.020,.565,bondi?mat.tealLight:mat.silver,bondi?.025:.015);
    key(start+.06,.57,.23,'ctrl','Control');key(start+.37,.57,.25,'⌘','Meta');key(-.19,.57,bondi?1.44:1.25,'',' ',.15);key(.68,.57,.22,'⌘','Meta');key(1.09,.57,.16,'←','ArrowLeft');key(1.29,.57,.16,'↓','ArrowDown');key(1.49,.57,.16,'→','ArrowRight');
    if(bondi){line(keyboard,[[-.25,.13,-.63],[-.36,.055,-.87],[-1.43,-.015,-1.18],[-1.55,.12,-1.96]],.017,mat.teal);box(keyboard,.11,.055,.12,1.79,.11,-.16,mat.gray);}
    part('keyboard',keyboard,true);return keyboard;
  }

  let shell,screen,screenMaterial,mouseButton,opticalTray,spindle;
  if(!modern){
    // The translucent Bondi hemisphere is open at its front, revealing a real CRT volume.
    shell=layer('shell',[1.97,.44,-.84]);shell.userData.isShell=true;
    const dome=mesh(shell,new THREE.SphereGeometry(1,40,26,Math.PI,Math.PI),mat.bondi,0,1.78,.83);dome.scale.set(1.61,1.47,2.07);dome.name='Translucent Bondi rear enclosure';
    const base=cyl(shell,1.25,.13,0,.31,.06,mat.teal,'y',48);base.scale.set(1.12,1,.90);
    const rearBand=torus(shell,1,.027,0,1.77,.78,mat.tealLight);rearBand.scale.set(1.54,1.38,1);
    line(shell,[[-.47,2.99,-.48],[-.42,3.23,-.69],[0,3.34,-.76],[.42,3.23,-.69],[.47,2.99,-.48]],.075,mat.tealLight);
    for(const side of [-1,1])for(let i=0;i<11;i++){const vent=box(shell,.015,.26,.025,side*1.46,1.62+i*.055,-.03,mat.teal);vent.rotation.x=.08;}
    text(shell,'iMac',.57,.19,0,1.91,-1.253,{orientation:'back',color:'#c5ece3',font:57});
    for(const x of [-.87,.87])round(shell,.39,.10,.51,x,.22,.31,mat.rubber,.025);

    const front=layer('front',[-2.03,.06,.35]);
    const frontShape=rect(new THREE.Shape(),-1.49,.40,2.98,2.79,.23);frontShape.holes.push(rect(new THREE.Path(),-1.12,1.18,2.24,1.72,.09));
    const fascia=mesh(front,new THREE.ExtrudeGeometry(frontShape,{depth:.11,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:3,curveSegments:8}),mat.cream,0,0,1.035);fascia.name='Off-white front bezel with CRT aperture';
    const frame=group(front,'Display bezel');const gasketShape=rect(new THREE.Shape(),-1.14,1.17,2.28,1.74,.10);gasketShape.holes.push(rect(new THREE.Path(),-1.076,1.229,2.152,1.617,.045));
    mesh(frame,new THREE.ExtrudeGeometry(gasketShape,{depth:.025,bevelEnabled:false,curveSegments:8}),mat.gray,0,0,1.052);part('display',frame);
    const trayMouth=group(front,'Tray-loading optical opening');round(trayMouth,1.57,.19,.02,0,.895,1.175,mat.gray,.004);round(trayMouth,1.45,.145,.02,0,.900,1.192,mat.cream,.004);box(trayMouth,.20,.035,.024,.54,.898,1.211,mat.gray);part('optical',trayMouth);
    const speakers=group(front,'Stereo front speakers');for(const x of [-1.17,1.17]){cyl(speakers,.205,.045,x,.79,1.175,mat.gray,'z',32);cyl(speakers,.17,.048,x,.79,1.187,mat.black,'z',32);const holes=[];for(let row=-3;row<=3;row++)for(let col=-3;col<=3;col++)if(col*col+row*row<11)holes.push([x+col*.039,.79+row*.039,1.216]);repeated(speakers,new THREE.SphereGeometry(.012,5,4),mat.steel,holes);}part('sound',speakers,true);
    text(front,'iMac',.47,.095,0,.550,1.184,{color:'#6e8d86',font:56});cyl(front,.037,.02,.90,.49,1.188,mat.teal,'z',20);

    const display=layer('display',[-.05,.76,-.08]),crt=group(display,'15-inch CRT assembly');
    const sections=[{z:1.0,w:1.10,h:.825},{z:.72,w:1.02,h:.76},{z:-.69,w:.17,h:.15}],outline=[[-1,-.75],[-.75,-1],[.75,-1],[1,-.75],[1,.75],[.75,1],[-.75,1],[-1,.75]],v=[],index=[];
    sections.forEach(s=>outline.forEach(([x,y])=>v.push(x*s.w,2.035+y*s.h,s.z)));for(let a=0;a<2;a++)for(let i=0;i<8;i++){const x=a*8+i,n=a*8+(i+1)%8;index.push(x,x+8,n,n,x+8,n+8);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(index);g.computeVertexNormals();mesh(crt,g,mat.crt);
    round(crt,2.20,1.67,.12,0,2.035,1.01,mat.black,.038);
    ({screen,screenMaterial}=screenAt(crt,2.12,1.59,0,2.035,1.078));
    for(const x of [-1.12,1.12])box(crt,.029,1.65,.16,x,2.035,.98,mat.steel);for(const y of [1.195,2.875])box(crt,2.24,.03,.16,0,y,.98,mat.steel);
    for(let i=0;i<10;i++)torus(crt,.166,.012,0,2.035,-.64-i*.025,mat.copper);cyl(crt,.080,.41,0,2.035,-1.045,mat.glass,'z',16);cyl(crt,.103,.067,0,2.035,-1.254,mat.black,'z',16);
    for(const x of [-1.09,1.09])for(const y of [1.17,2.89])screw(crt,x,y,1.04,'z');part('display',crt,true);

    const logic=layer('logic',[-.20,.05,1.56]),board=group(logic,'PowerPC logic board',0,.47,-.12);box(board,2.37,.044,1.80,0,0,0,mat.pcb);traces(board,2.31,1.75,.025);
    for(const x of [-1.07,1.07])for(const z of [-.76,.76])screw(board,x,.029,z);
    const processor=group(board,'PowerPC G3 processor daughtercard',-.40,.085,-.34);box(processor,.93,.035,.68,0,0,0,mat.pcb);packageChip(processor,0,.034,0,.43,.38,'PowerPC\nG3');
    box(processor,.54,.055,.51,0,.134,0,mat.steel);for(let i=0;i<12;i++)box(processor,.021,.18,.51,-.253+i*.046,.246,0,mat.silver);text(processor,'POWERPC G3',.64,.062,0,.028,.275,{orientation:'top',font:35});part('cpu',processor,true);
    const memory=group(board,'Two SDRAM memory modules');for(let row=0;row<2;row++){const stick=group(memory,'SDRAM module',-.09,.175,.30+row*.25);box(stick,1.70,.27,.025,0,0,0,mat.pcb);for(let c=0;c<8;c++)round(stick,.17,.14,.031,-.70+c*.20,.009,.029,mat.chip,.004);const pads=[];for(let i=0;i<50;i++)pads.push([-.81+i*.033,-.115,.020]);repeated(stick,new THREE.BoxGeometry(.016,.042,.003),mat.gold,pads);box(stick,1.84,.045,.085,0,-.137,0,mat.gray);}part('ram',memory,true);
    const graphics=group(board,'Discrete ATI graphics and video memory',.67,.025,-.32);packageChip(graphics,0,.026,0,.32,.32,'ATI\nRAGE');for(const [x,z] of [[-.25,-.24],[.20,-.24],[-.25,.25],[.20,.25]])packageChip(graphics,x,.018,z,.21,.13,'VRAM',{pins:16});part('gpu',graphics,true);
    for(let i=0;i<9;i++){const x=-1.01+i*.25;cyl(board,.031,.081,x,.072,-.81,mat.gray);cyl(board,.030,.006,x,.116,-.81,mat.silver);}text(board,'iMac G3 · LOGIC BOARD',1.16,.075,-.26,.027,.827,{orientation:'top',font:32});
    const io=group(board,'USB and Ethernet I/O',1.02,.08,.25);for(let i=0;i<2;i++){box(io,.15,.09,.21,0,i*.16,0,mat.steel);box(io,.156,.044,.13,.003,i*.16,.004,mat.black);}box(io,.17,.20,.20,0,.01,-.36,mat.steel);box(io,.178,.11,.13,.006,.01,-.355,mat.black);part('io',io,true);

    const storageLayer=layer('storage',[.89,.24,1.56]),hdd=group(storageLayer,'Illustrated hard disk with cover removed',.57,.39,-.32);round(hdd,.87,.17,1.24,0,.03,0,mat.steel,.025);box(hdd,.79,.014,1.15,0,.124,0,mat.black);cyl(hdd,.335,.015,0,.141,.06,mat.silver,'y',48);cyl(hdd,.101,.030,0,.158,.06,mat.steel);cyl(hdd,.05,.021,-.29,.163,-.38,mat.steel);const arm=box(hdd,.058,.018,.48,-.17,.173,-.23,mat.silver);arm.rotation.y=-.56;for(const x of [-.34,.34])for(const z of [-.50,.50])screw(hdd,x,.13,z);part('storage',hdd,true);
    const optical=group(storageLayer,'Tray-loading CD-ROM',-.21,.86,.52);round(optical,1.76,.22,1.36,0,0,0,mat.steel,.016);box(optical,1.56,.016,1.20,0,.12,0,mat.gray);opticalTray=group(optical,'Movable CD tray',0,.072,-.23);round(opticalTray,1.44,.040,1.30,0,0,.20,mat.black,.01);const disc=cyl(opticalTray,.53,.010,0,.026,.20,mat.silver,'y',64);torus(opticalTray,.49,.004,0,.034,.20,mat.tealLight,'y');cyl(opticalTray,.074,.012,0,.035,.20,mat.black);round(opticalTray,1.50,.145,.08,0,-.039,.88,mat.cream,.01);opticalTray.userData.homePosition=opticalTray.position.clone();opticalTray.userData.ejectedPosition=opticalTray.position.clone().add(new THREE.Vector3(0,0,.90));spindle=disc;part('optical',optical,true);

    const analog=layer('analog',[1.56,.34,-.13]),power=group(analog,'CRT analog and power board',1.10,1.50,-.48);box(power,.047,1.44,1.13,0,0,0,mat.pcb);for(const [y,z,r] of [[.39,-.30,.11],[.34,.03,.080],[-.30,-.22,.075]]){cyl(power,r,.25,.14,y,z,mat.black,'x');cyl(power,r*.91,.010,.27,y,z,mat.silver,'x');}round(power,.30,.34,.35,.17,-.20,.25,mat.ceramic,.02);box(power,.31,.22,.19,.18,-.20,.25,mat.black);for(let i=0;i<8;i++)box(power,.33,.019,.27,.18,-.29+i*.027,.25,mat.copper);round(power,.24,.31,.28,.15,.29,.34,mat.black,.016);line(power,[[.23,.47,.34],[.21,.90,.29],[-.24,1.15,.23],[-.63,1.12,.11]],.02,mat.red);part('analog',power,true);

    keyboardAt({bondi:true,x:-.14,z:2.74});
    const mouse=group(root,'Bondi one-button puck mouse',2.16,.18,2.66);cyl(mouse,.355,.15,0,0,0,mat.tealLight,'y',48);const top=cyl(mouse,.309,.07,0,.10,0,mat.cream,'y',48);mouseButton=round(mouse,.39,.045,.32,0,.162,-.082,mat.white,.018);mouseButton.userData.homeY=mouseButton.position.y;line(mouse,[[0,.032,-.36],[.10,-.10,-.84],[.48,-.13,-1.35],[.17,-.12,-2.34],[-.58,.02,-2.85]],.015,mat.teal);cyl(mouse,.098,.016,0,-.087,.02,mat.rubber,'y',24);part('mouse',mouse,true);
  } else {
    // Thin 24-inch architecture: the computing system lives in the lower chin.
    shell=layer('shell',[1.43,.15,-.70]);shell.userData.isShell=true;
    round(shell,4.55,2.90,.105,0,2.17,-.055,mat.blue,.025);
    const rearLip=box(shell,4.40,.018,.020,0,.773,-.115,mat.blueDark);text(shell,'iMac',.62,.19,0,2.39,-.117,{orientation:'back',color:'#c4e1ed',font:59});
    cyl(shell,.068,.018,0,1.15,-.12,mat.black,'z',28);
    const stand=group(root,'Blue aluminum stand');round(stand,1.62,.065,.91,0,.15,-.20,mat.blue,.022);const stem=round(stand,.82,1.38,.16,0,.844,-.36,mat.blue,.021);stem.rotation.x=-.17;const hinge=cyl(stand,.108,.81,0,1.49,-.17,mat.blueDark,'x',28);box(stand,1.38,.012,.61,0,.110,-.20,mat.rubber);

    const front=layer('front',[-2.15,.05,.42]);
    const shape=rect(new THREE.Shape(),-2.275,.72,4.55,2.90,.045);shape.holes.push(rect(new THREE.Path(),-2.12,1.113,4.24,2.411,.012));
    mesh(front,new THREE.ExtrudeGeometry(shape,{depth:.034,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:2,curveSegments:6}),mat.white,0,0,.067);
    round(front,4.52,.361,.035,0,.904,.107,mat.blue,.009);
    const frontFrame=group(front,'White display bezel');for(const x of [-2.19,2.19])box(frontFrame,.062,2.41,.004,x,2.32,.112,mat.white);part('display',frontFrame);
    const camera=group(front,'Center Stage camera',0,3.566,.123);cyl(camera,.022,.007,0,0,0,mat.black,'z',20);cyl(camera,.013,.008,0,0,.004,mat.gpu,'z',20);cyl(camera,.004,.007,.044,0,.003,mat.gray,'z',8);part('camera',camera,true);

    const display=layer('display',[0,.51,.16]),panel=group(display,'24-inch LCD panel');round(panel,4.30,2.45,.049,0,2.32,.037,mat.black,.012);({screen,screenMaterial}=screenAt(panel,4.20,2.3625,0,2.32,.068));
    box(panel,3.90,.18,.018,0,1.05,.027,mat.steel);for(let i=0;i<4;i++)box(panel,.15,.21,.007,-1.4+i*.93,1.074,.045,mat.ceramic);part('display',panel,true);

    const logic=layer('logic',[-.18,-.045,1.11]),board=group(logic,'Chin logic board',0,.913,-.003);box(board,3.90,.292,.029,0,0,0,mat.pcb);
    // Front-facing board traces: sparse enough to read at the real model's small scale.
    const horizontal=[],vertical=[];for(let i=0;i<13;i++)horizontal.push([0,-.13+i*.021,.017]);for(let i=0;i<34;i++)vertical.push([-1.84+i*.111,0,.018]);repeated(board,new THREE.BoxGeometry(3.78,.003,.002),mat.gold,horizontal);repeated(board,new THREE.BoxGeometry(.003,.254,.002),mat.gold,vertical);
    const packageGroup=group(board,'M4 package substrate',-.44,0,.036);box(packageGroup,1.21,.258,.021,0,0,0,mat.memory);
    const cpu=group(packageGroup,'M4 system on a chip');round(cpu,.46,.219,.031,0,0,.021,mat.chip,.006);text(cpu,'M4',.15,.082,-.07,.026,.040,{color:'#d1ddd4',font:62});part('cpu',cpu,true);
    const gpu=group(packageGroup,'Integrated GPU region, schematic',.13,-.023,.043);round(gpu,.123,.121,.010,0,0,0,mat.gpu,.003);text(gpu,'GPU',.102,.045,0,0,.008,{color:'#d6edf1',font:43});gpu.userData.illustrativeDieRegion=true;part('gpu',gpu,true);
    const memory=group(packageGroup,'Unified memory on the package');for(const x of [-.43,.43])for(const y of [-.064,.064]){round(memory,.235,.105,.021,x,y,.020,mat.chip,.004);text(memory,'MEM',.16,.036,x,y,.035,{color:'#becfc3',font:33});}memory.userData.description='Package memory; not replaceable memory sticks';part('ram',memory,true);
    for(let i=0;i<13;i++){const x=-1.83+i*.127;box(board,.042,.034,.045,x,-.082,.036,mat.ceramic);}for(const x of [-1.88,1.88])screw(board,x,0,.033,'z');text(board,'M4 · INTEGRATED LOGIC',.71,.044,.91,-.113,.021,{color:'#d0dfc2',font:31});

    const storageLayer=layer('storage',[.66,.20,1.46]),storage=group(storageLayer,'SSD NAND flash packages',1.055,.925,.041);for(const x of [-.20,.20]){round(storage,.28,.199,.028,x,0,0,mat.chip,.006);text(storage,'NAND',.21,.054,x,0,.019,{color:'#c5d3c7',font:40});}part('storage',storage,true);
    const io=group(logic,'USB-C input and output',-1.22,.91,-.12);for(const x of [-.16,.16]){round(io,.183,.067,.073,x,0,0,mat.steel,.009);round(io,.137,.033,.010,x,0,-.044,mat.black,.006);}part('io',io,true);
    const jack=group(shell,'Side audio connection',-2.29,1.10,-.051);cyl(jack,.031,.018,0,0,0,mat.gray,'x',16);cyl(jack,.018,.019,-.008,0,0,mat.black,'x',16);part('io',jack);

    const analog=layer('analog',[1.05,.23,-.49]),thermal=group(analog,'Power delivery and thermal spreaders');
    box(thermal,3.59,.184,.036,0,1.104,-.054,mat.steel);for(const x of [-1.39,1.39])for(let i=0;i<13;i++)box(thermal,.016,.142,.062,x-.18+i*.03,1.104,-.08,mat.gray);
    line(thermal,[[-1.44,1.11,-.11],[-.82,1.175,-.11],[.02,1.155,-.11],[.70,1.11,-.11],[1.42,1.11,-.11]],.019,mat.copper);
    const power=group(thermal,'Power regulation',-.93,.90,-.06);box(power,.45,.22,.025,0,0,0,mat.pcb);for(let i=0;i<5;i++)round(power,.055,.10,.061,-.155+i*.077,0,-.045,mat.gray,.006);part('analog',thermal,true);
    const sound=group(analog,'Stereo speaker modules');for(const x of [-2.0,2.0]){round(sound,.34,.256,.080,x,.912,-.007,mat.black,.018);for(const y of [.855,.967]){cyl(sound,.064,.088,x,y,.003,mat.gray,'z',20);cyl(sound,.043,.091,x,y,.009,mat.black,'z',20);}}part('sound',sound,true);

    keyboardAt({x:-.10,z:1.86});
    const mouse=group(root,'Magic-style multitouch mouse',2.08,.16,1.88);round(mouse,.59,.061,.98,0,-.055,0,mat.silver,.018);mouseButton=mesh(mouse,new THREE.SphereGeometry(1,32,18),mat.white,0,.020,0);mouseButton.scale.set(.305,.122,.515);mouseButton.userData.homeY=mouseButton.position.y;mouseButton.name='Curved multitouch surface';for(const x of [-.18,.18])round(mouse,.04,.015,.70,x,-.097,0,mat.rubber,.004);part('mouse',mouse,true);
  }
  root.userData.generation=generation;root.userData.illustrativeLayout=true;
  root.updateMatrixWorld(true);
  const focusTargets=new Map([...parts].map(([id,objects])=>[id,objects[0]]));
  return {root,parts,layers,shell,shellObjects:[shell],screenMaterial,screen,keys,mouseButton,focusTargets,...(opticalTray?{opticalTray,spindle}:{})};
}
