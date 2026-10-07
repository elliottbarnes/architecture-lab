/** Original vector cutaway of the 1984 Macintosh 128K. Geometry is illustrative. */
const p = (x, z, rise = 0) => [270 + x + z * .65, 412 + x * .074 - z * .32 - rise];
const pts = points => points.map(point => point.join(',')).join(' ');
const boardRect = (x, z, w, d, rise = 0) => pts([p(x,z,rise),p(x+w,z,rise),p(x+w,z+d,rise),p(x,z+d,rise)]);
const part = (id, label, content, extra = '') => `<g class="mac-part ${extra}" data-part="${id}" role="button" tabindex="0" aria-label="${label}">${content}</g>`;

function dip(x, z, w, d, label, pinCount = 7) {
  let pins = '';
  for(let i=0;i<pinCount;i++) {
    const px=x+3+i*(w-6)/(pinCount-1);
    pins += `<path d="M${p(px,z-4).join(' ')} L${p(px,z+2,4).join(' ')} M${p(px,z+d+4).join(' ')} L${p(px,z+d-2,4).join(' ')}"/>`;
  }
  const [tx,ty]=p(x+w/2,z+d/2,6);
  return `<g class="dip-package"><g class="chip-pins">${pins}</g><polygon points="${boardRect(x,z,w,d)}" fill="#111b19"/><polygon class="part-highlight" points="${boardRect(x,z,w,d,5)}" fill="url(#chip-top)" stroke="#6a7469" stroke-width=".65"/><path d="M${p(x+2,z+3,6).join(' ')} L${p(x+w-2,z+3,6).join(' ')}" stroke="#586057" stroke-width=".7"/><circle cx="${p(x+4,z+d-4,6)[0]}" cy="${p(x+4,z+d-4,6)[1]}" r="1.25" fill="#a7b49a"/>${label?`<text x="${tx}" y="${ty+2}" text-anchor="middle" transform="rotate(4.2 ${tx} ${ty})" class="chip-lettering">${label}</text>`:''}</g>`;
}

function logicBoard() {
  let traces='';
  for(let i=0;i<12;i++) {
    traces+=`<path d="M${p(13+i*16,5).join(' ')} L${p(13+i*16,14+i%3*3).join(' ')} L${p(25+i*15,35+i%3*3).join(' ')} L${p(25+i*15,169).join(' ')}"/>`;
  }
  let memory='';
  for(let row=0;row<2;row++) for(let col=0;col<8;col++) memory+=dip(12+col*22,87+row*37,15,23,'',4);
  const screw=(x,z)=>{const [cx,cy]=p(x,z,2);return `<ellipse cx="${cx}" cy="${cy}" rx="4" ry="2.5" fill="#baa66d" stroke="#182f23"/><path d="M${cx-2} ${cy-.6} l4 1.2" stroke="#4c4b34"/>`;};
  return `<g class="mac-logic"><polygon points="${pts([p(0,0),p(236,0),p(236,185),p(0,185)])}" fill="#24553b" stroke="#71986c" stroke-width="1.3"/><path d="M${p(0,0).join(' ')} L${p(236,0).join(' ')} L${p(236,185).join(' ')} l0 5 L${p(236,0, -5).join(' ')} L${p(0,0,-5).join(' ')} Z" fill="#183c2d"/><g class="pcb-traces">${traces}<path d="M${p(8,179).join(' ')} L${p(215,179).join(' ')} L${p(215,12).join(' ')} M${p(6,176).join(' ')} L${p(6,48).join(' ')} L${p(124,48).join(' ')}"/></g>
    <text x="${p(8,166)[0]}" y="${p(8,166)[1]}" transform="rotate(4.2 ${p(8,166).join(' ')})" class="board-lettering">MACINTOSH · LOGIC BOARD</text>
    ${part('cpu','Motorola 68000 processor, the Macintosh central processing unit',dip(16,28,100,29,'MC68000',15))}
    ${part('ram','128 kilobytes of RAM, sixteen dynamic memory chips',memory)}
    ${part('rom','64 kilobytes of ROM, two chips containing system routines',dip(156,17,24,44,'ROM',5)+dip(190,17,24,44,'ROM',5))}
    ${part('iwm','IWM integrated floppy disk controller',dip(121,24,27,32,'IWM',5))}
    ${part('via','6522 VIA, versatile interface adapter',dip(194,124,30,34,'VIA',5))}
    ${part('scc','Zilog SCC, serial communication controller',dip(194,78,30,32,'SCC',5))}
    ${screw(7,7)}${screw(228,7)}${screw(228,179)}${screw(7,179)}
    <g fill="#c2b36c" stroke="#284e37" stroke-width=".7">${Array.from({length:12},(_,i)=>`<polygon points="${boardRect(10+i*8,180,4,8)}"/>`).join('')}</g>
    <g class="board-capacitors">${[24,50,78,109,146].map((x,i)=>{const [cx,cy]=p(x,69);return `<path d="M${cx-3} ${cy} v-8 a3 2 0 0 1 6 0 v8" fill="${i%2?'#b99943':'#172d3b'}" stroke="#a0ac83" stroke-width=".6"/><ellipse cx="${cx}" cy="${cy-8}" rx="3" ry="1.8" fill="#c1c3a1"/>`;}).join('')}</g>
  </g>`;
}

function keyboard() {
  const k=(x,z,h=0)=>[135+x+z*.55,580+x*.074-z*.42-h];
  const kr=(x,z,w,d,h=0)=>pts([k(x,z,h),k(x+w,z,h),k(x+w,z+d,h),k(x,z+d,h)]);
  const keys=[];
  const rows=[['Z','X','C','V','B','N','M',',','.','/'],['A','S','D','F','G','H','J','K','L',';'],['Q','W','E','R','T','Y','U','I','O','P'],['1','2','3','4','5','6','7','8','9','0','−','=']];
  function key(x,z,w,label) { const [tx,ty]=k(x+w/2,z+9,4);return `<g><polygon points="${kr(x,z,w,18)}" fill="#9e9783"/><polygon points="${kr(x,z,w,18,4)}" fill="url(#key-top)" stroke="#b6ad95" stroke-width=".65"/>${label?`<text x="${tx}" y="${ty+1.5}" transform="rotate(4.2 ${tx} ${ty})" class="key-lettering" text-anchor="middle">${label}</text>`:''}</g>`; }
  rows.forEach((row,r)=>row.forEach((letter,c)=>keys.push(key(34+c*20+(r<3?(3-r)*3:0),35+r*23,17,letter))));
  keys.push(key(18,35,25,'shift'),key(253,35,37,'shift'),key(17,58,19,'lock'),key(247,58,43,'return'),key(15,81,24,'tab'),key(250,81,40,'['),key(16,104,15,'`'),key(277,104,16,'⌫'),key(25,10,31,'⌘'),key(61,10,183,''),key(251,10,34,'enter'));
  return part('keyboard','Original Macintosh keyboard, connected by a coiled cable',`<path class="peripheral-cable" d="M352 519 C400 501 271 483 287 461 C296 449 338 459 350 449"/><path class="cable-coil" d="M350 491 c-8-3-7-11 0-11 c8 0 8 9 0 10 c-8 0-8-10 1-10 c8 0 9 10 1 11 c-8 0-8-9 0-10"/><polygon points="${pts([k(0,0),k(310,0),k(310,148),k(0,148)])}" fill="url(#keyboard-top)" stroke="#c7bea7" stroke-width="1.5"/><path d="M${k(0,0).join(' ')} L${k(310,0).join(' ')} L${k(310,148).join(' ')} l0 13 L${k(310,0,-13).join(' ')} L${k(0,0,-13).join(' ')} Z" fill="#98917d" stroke="#8b8471"/><polygon class="part-highlight" points="${kr(9,5,292,132)}" fill="none" stroke="#b2a990" stroke-width="1"/><polygon points="${kr(13,8,284,122)}" fill="#b8af97"/>${keys.join('')}<path d="M${k(6,1,-3).join(' ')} L${k(303,1,-3).join(' ')}" stroke="#d8cdb5" opacity=".6"/>`,'mac-keyboard');
}

function label(text,x,y,path,extra='') {
  const width=text.length*5.85+18;
  return `<g class="part-label ${extra}"><path d="${path}"/><rect x="${x}" y="${y-15}" width="${width}" height="24" rx="5"/><text x="${x+9}" y="${y+1}">${text}</text></g>`;
}

export function macintoshScene() {
  return `<svg class="macintosh-scene" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 690" role="group" aria-label="Interactive exploded illustration of the original 1984 Macintosh 128K, its circuit boards, CRT display, floppy drive, keyboard, and single-button mouse">
  <defs>
    <linearGradient id="case-top" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f1e6c9"/><stop offset=".5" stop-color="#d8ccb0"/><stop offset="1" stop-color="#b4aa91"/></linearGradient>
    <linearGradient id="case-side" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#b4aa91"/><stop offset=".7" stop-color="#c7bb9f"/><stop offset="1" stop-color="#aa9f85"/></linearGradient>
    <linearGradient id="case-front" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#e7dcc0"/><stop offset=".55" stop-color="#d5c9ac"/><stop offset="1" stop-color="#bdb194"/></linearGradient>
    <linearGradient id="crt-glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#647b73"/><stop offset=".4" stop-color="#344b46"/><stop offset="1" stop-color="#152923"/></linearGradient>
    <linearGradient id="crt-funnel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#555c58"/><stop offset=".5" stop-color="#293735"/><stop offset="1" stop-color="#172522"/></linearGradient>
    <linearGradient id="metal-top" x1="0" y1="0" x2=".5" y2="1"><stop stop-color="#c4c9bd"/><stop offset=".45" stop-color="#949e95"/><stop offset="1" stop-color="#646f66"/></linearGradient>
    <linearGradient id="chip-top" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#41483d"/><stop offset="1" stop-color="#222d26"/></linearGradient>
    <linearGradient id="keyboard-top" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e5d9bd"/><stop offset="1" stop-color="#bdb299"/></linearGradient>
    <linearGradient id="key-top" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f0e7d0"/><stop offset="1" stop-color="#d9ceb1"/></linearGradient>
    <radialGradient id="scene-shadow"><stop stop-color="#010b08" stop-opacity=".5"/><stop offset="1" stop-color="#010b08" stop-opacity="0"/></radialGradient>
    <pattern id="plastic-grain" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".45" fill="#7c735d" opacity=".17"/><circle cx="6" cy="6" r=".55" fill="#fff8dc" opacity=".22"/></pattern>
  </defs>
  <ellipse class="scene-ground" cx="442" cy="556" rx="365" ry="106" fill="url(#scene-shadow)"/>
  <g class="assembly-guides" aria-hidden="true"><path d="M300 210L490 135 M297 327L508 260 M300 427L616 419 M522 201L685 122"/><circle cx="508" cy="260" r="3"/><circle cx="616" cy="419" r="3"/></g>
  <g class="mac-shell" aria-hidden="true">
    <path d="M231 118L363 51Q370 48 379 50L628 70Q638 72 638 82L638 401Q638 409 629 413L505 474L497 137Z" fill="url(#case-side)" stroke="#d0c3a4" stroke-width="1.3"/>
    <path d="M231 118L364 51Q369 49 378 50L628 70L498 138Z" fill="url(#case-top)" stroke="#ded3b7" stroke-width="1.4"/>
    <path d="M505 150L629 88L629 399L505 460Z" fill="url(#plastic-grain)"/>
    <path d="M418 61L489 66L470 76L401 70Z" fill="#948b74"/><path d="M418 61L421 66L474 70L489 66" fill="none" stroke="#746c59" stroke-width="2"/>
    <g stroke="#837b66" stroke-width="2.7" opacity=".7">${Array.from({length:12},(_,i)=>`<path d="M${517+i*7.8} ${130-i*3.9} v52"/>`).join('')}</g>
    <g stroke="#877e67" stroke-width="2.3" opacity=".75">${Array.from({length:10},(_,i)=>`<path d="M${522+i*9} ${358-i*4.6} v29"/>`).join('')}</g>
    <path d="M510 451L625 394" stroke="#92866e" stroke-width="2"/>
    <circle cx="618" cy="112" r="3" fill="#8c826c"/><circle cx="617" cy="373" r="3" fill="#8c826c"/>
  </g>
  <g class="mac-analog">${part('analog','Analog and power board, supplying the CRT and computer',`
    <path class="part-highlight" d="M533 166L599 130L602 364L536 401Z" fill="#526445" stroke="#a4aa72" stroke-width="1.2"/>
    <path d="M543 168L589 144V349L545 374V231L578 214V163" fill="none" stroke="#baa16b" stroke-width="1" opacity=".65"/>
    <path d="M540 195L557 186V257L540 266Z" fill="#e4d6b5" stroke="#655e43"/>
    <g fill="#263935" stroke="#7a8972" stroke-width="1"><path d="M566 206V170q10-12 18-8v35Z"/><ellipse cx="575" cy="167" rx="9" ry="5" transform="rotate(-27 575 167)" fill="#b4b9a4"/><path d="M574 250V220q8-9 15-7v30Z"/><ellipse cx="581" cy="218" rx="8" ry="4" transform="rotate(-27 581 218)" fill="#abb099"/></g>
    <path d="M548 293L575 279L591 288L564 303Z" fill="#d99a54"/><path d="M548 293L564 303V331L548 320Z" fill="#8e5936"/><path d="M564 303L591 288V316L564 331Z" fill="#ad7540"/>
    <path d="M552 302L559 306V319L552 315M570 304L583 297V313L570 320" fill="#473c2b"/>
    <path d="M539 278L554 270L561 274L546 282Z" fill="#c6b891"/><path d="M546 282L561 274V286L546 295Z" fill="#e0d2ac"/>
    <path d="M569 290C583 268 521 242 556 206" fill="none" stroke="#c8674c" stroke-width="5"/>
    <path d="M548 380C524 399 513 389 504 377" fill="none" stroke="#d6ba71" stroke-width="3"/>
    <circle cx="541" cy="180" r="2.5" fill="#d4c093"/><circle cx="592" cy="348" r="2.5" fill="#d4c093"/>
  `)}${part('sound','Internal speaker mounted with the analog board',`<g transform="rotate(22 569 357)"><ellipse class="part-highlight" cx="569" cy="357" rx="16" ry="23" fill="#343d31" stroke="#c0b596" stroke-width="2"/><ellipse cx="569" cy="357" rx="11" ry="17" fill="#161f1a" stroke="#78816a"/><ellipse cx="569" cy="357" rx="5" ry="8" fill="#727e68"/></g><path d="M565 380L559 389L550 379" fill="none" stroke="#c3ab71" stroke-width="1.5"/>`)}</g>
  <g class="mac-crt">${part('display','Nine-inch CRT display, glass funnel and electron gun',`
    <path d="M280 166L414 132L573 197L486 181Z" fill="#68706b" stroke="#959b87"/>
    <path d="M486 181L573 197L576 249L486 313Z" fill="url(#crt-funnel)" stroke="#7b887a"/>
    <path d="M280 300L486 313L576 249L420 273Z" fill="#25332e"/>
    <path d="M563 209L605 190L620 202L620 220L575 244Z" fill="#65684e" stroke="#a2a781"/>
    <path d="M588 200L592 227M599 195L603 222M608 195L613 218" stroke="#b5824f" stroke-width="4"/>
    <path d="M613 211L642 198" stroke="#96a18c" stroke-width="5"/>
    <path class="part-highlight" d="M277 162L483 178Q491 179 491 189V305Q491 316 480 315L277 300Q267 299 267 288V173Q267 161 277 162Z" fill="url(#crt-glass)" stroke="#939b89" stroke-width="5"/>
    <g transform="matrix(1 .074 0 1 279 170)"><foreignObject x="0" y="0" width="200" height="134"><canvas xmlns="http://www.w3.org/1999/xhtml" id="mac-screen-open" class="mac-screen-canvas" width="512" height="342" aria-label="Live monochrome image on the actual CRT glass"></canvas></foreignObject></g>
    <path d="M284 174L473 188V200L285 186Z" fill="#d1dfca" opacity=".14"/>
    <path d="M307 190L316 190L316 274" fill="none" stroke="#a4bca8" opacity=".14" stroke-width="14"/>
    <path d="M284 312V325L302 327V314M465 325V338L483 340V326" fill="#838e81" stroke="#bac2b0"/>
  `)}</g>
  <g class="mac-drive">${part('floppy','400-kilobyte Sony 3.5-inch floppy drive mechanism',`
    <path d="M289 354L398 296L579 310L468 368Z" fill="url(#metal-top)" stroke="#bec6b6"/>
    <path d="M289 354L468 368V398L289 384Z" fill="#727f73" stroke="#a8b3a0"/>
    <path d="M468 368L579 310V340L468 398Z" fill="#56665b" stroke="#a9b6a1"/>
    <path class="part-highlight" d="M304 355L462 367V385L304 373Z" fill="#293c33" stroke="#a6afa0"/>
    <path d="M314 362L450 373" stroke="#111b16" stroke-width="4"/>
    <path d="M358 327L402 304L519 313L475 336Z" fill="#849188" stroke="#d1d6c4"/>
    <path d="M365 326L469 334L509 313" fill="none" stroke="#535f56" stroke-width="3"/>
    <ellipse cx="442" cy="344" rx="28" ry="11" transform="rotate(-9 442 344)" fill="#526659" stroke="#b9c5af"/>
    <ellipse cx="442" cy="344" rx="12" ry="5" fill="#a8b6a2"/>
    <path d="M479 346L541 315L550 321L492 354Z" fill="#304c3c" stroke="#8ea48a"/>
    <path d="M538 339L570 345L602 374L571 385L552 363L521 355Z" fill="#baaa83" stroke="#d2c39d"/>
    <g stroke="#817252" opacity=".6">${Array.from({length:5},(_,i)=>`<path d="M${542+i*4} ${342+i*.6}L${572+i*4} ${378-i*2}"/>`).join('')}</g>
    <g fill="#d2dac8" stroke="#65735f"><ellipse cx="315" cy="351" rx="3" ry="1.5"/><ellipse cx="464" cy="362" rx="3" ry="1.5"/><ellipse cx="561" cy="313" rx="3" ry="1.5"/></g>
  `)}</g>
  ${logicBoard()}
  <g class="mac-front"><g transform="matrix(1 .074 0 1 230 116)">
    <path d="M9 0H263Q274 0 274 12V320Q274 332 262 332H11Q0 332 0 320V12Q0 0 9 0Z M32 42H243V183H32Z" fill-rule="evenodd" fill="url(#case-front)" stroke="#eee3c6" stroke-width="1.5"/>
    <path d="M9 0H263Q274 0 274 12V320Q274 332 262 332H11Q0 332 0 320V12Q0 0 9 0Z M32 42H243V183H32Z" fill-rule="evenodd" fill="url(#plastic-grain)"/>
    <path d="M11 9H263V313Q263 322 254 322H13" fill="none" stroke="#afa387" opacity=".55"/>
    ${part('display','Macintosh display opening and front bezel',`<path class="part-highlight" d="M28 29H246Q254 29 254 39V189Q254 198 244 198H30Q20 198 20 188V40Q20 29 28 29Z M32 42H243V183H32Z" fill-rule="evenodd" fill="#a69c83" stroke="#c3b798"/><path d="M35 34H240Q250 34 250 44V182Q250 192 240 192H35Q25 192 25 182V44Q25 34 35 34Z M32 42H243V183H32Z" fill-rule="evenodd" fill="#29352f"/><g class="front-screen"><rect x="32" y="42" width="211" height="141" rx="6" fill="#b5c5af"/><foreignObject x="32" y="42" width="211" height="141"><canvas xmlns="http://www.w3.org/1999/xhtml" id="mac-screen" class="mac-screen-canvas" width="512" height="342" aria-label="Live monochrome Macintosh screen when assembled"></canvas></foreignObject><path d="M35 39H241" stroke="#eeeeda" opacity=".25"/></g>`)}
    ${part('floppy','Front slot of the 3.5-inch floppy disk drive',`<path class="part-highlight" d="M62 237H235V253H62Z" fill="#b2a68a" stroke="#e0d3b5"/><path d="M62 239H235V247H62Z" fill="#232b25"/><path d="M178 243H231" stroke="#758276" stroke-width="1.2"/><rect x="236" y="257" width="3" height="3" rx="1.5" fill="#716b58"/>`)}
    <g class="rainbow-badge" aria-hidden="true">${['#68a968','#e4ce65','#dba050','#cc7053','#b36e92','#6893aa'].map((color,i)=>`<rect x="23" y="278" width="3" height="16" fill="${color}" transform="translate(${i*3} 0)"/>`).join('')}</g>
    <text x="47" y="288" fill="#625e50" font-family="Georgia,serif" font-size="10">Macintosh</text><text x="25" y="307" fill="#897e64" font-family="monospace" font-size="5.5" letter-spacing="1.5">128K · 1984</text>
    <path d="M20 332V338H51V332M221 332V338H251V332" fill="#817964"/>
  </g></g>
  ${keyboard()}
  ${part('mouse','Original Macintosh single-button mouse',`<path class="peripheral-cable" d="M679 552C699 526 700 489 652 486C610 483 590 532 551 515C505 495 527 451 511 440"/><path d="M645 562Q644 551 655 545L679 532Q688 527 699 532L723 547Q731 552 729 566L724 600Q722 610 712 615L690 626Q680 631 670 624L649 610Q642 605 643 594Z" fill="#938b75" stroke="#c6b99a"/><path class="part-highlight" d="M645 558Q645 549 655 543L679 530Q689 525 699 531L724 546Q731 550 729 560L724 590Q722 601 713 606L688 619Q679 624 669 617L650 604Q643 600 644 589Z" fill="url(#case-front)" stroke="#e1d4b4" stroke-width="1.2"/><path d="M652 548L680 534Q687 531 694 535L718 549L712 576L678 593L650 577Z" fill="#c5b99a" stroke="#8b846d" stroke-width="1"/><path d="M653 550L680 537Q687 534 693 538L714 550" fill="none" stroke="#e9dec3"/><path d="M651 604L673 618" stroke="#afa187"/>`,'mac-mouse')}
  <g class="part-labels" aria-hidden="true">
    ${label('9-INCH CRT',323,64,'M382 75V103L451 122','internal-label')}
    ${label('ANALOG / POWER',721,171,'M716 166H700L660 230','internal-label')}
    ${label('400K FLOPPY',713,306,'M706 300H669L599 351','internal-label')}
    ${label('128K RAM',714,417,'M709 412H674L494 448','internal-label')}
    ${label('68000 CPU',208,500,'M290 485L385 458','internal-label')}
    ${label('64K ROM',539,535,'M574 515V494L549 467','internal-label')}
    ${label('KEYBOARD',169,647,'M225 629L277 602')}
    ${label('ONE-BUTTON MOUSE',655,655,'M701 634L697 621')}
  </g>
  <g class="scene-caption" aria-hidden="true"><text x="39" y="39">MACINTOSH 128K</text><text x="39" y="58">APPLE COMPUTER · 1984</text><text x="39" y="670">ILLUSTRATED CUTAWAY · COMPONENT PLACEMENT SIMPLIFIED</text></g>
  </svg>`;
}
