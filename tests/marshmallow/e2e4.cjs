const {chromium,devices}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];
pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(500);
const box=await pg.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
const shot=n=>pg.screenshot({path:'v4_'+n+'.png',clip:box});const ev=f=>pg.evaluate(f);const wait=ms=>pg.waitForTimeout(ms);const key=async(k,ms=120)=>{await pg.keyboard.press(k);await wait(ms);};
const clear=()=>ev(()=>{G.msg=null;G.msgQ=[];G.choice=null;P.toast=0;P.melting=0;});
const log={};const sec=async(name,fn)=>{try{log[name]=await fn();}catch(e){log[name]='ERR '+e.message.split('\n')[0];}};
await shot('title');await key('Enter',300);await wait(600);for(let i=0;i<4;i++)await key('KeyZ',200);
await sec('start',async()=>ev(()=>G.scene+' '+G.mapName));
// elder sword
await sec('sword',async()=>{await ev(()=>{P.x=5*16+3;P.y=49*16+3;});await pg.keyboard.down('ArrowUp');await wait(700);await pg.keyboard.up('ArrowUp');await wait(600);
  const h=await ev(()=>G.mapName);await ev(()=>{P.x=6*16+3;P.y=4*16+3;P.dir=1;});for(let i=0;i<12;i++)await key('KeyZ',220);const sw=await ev(()=>G.flags.sword);await clear();return h+' '+sw;});
// shop via choice (elder sharpen) with coins
await sec('shop',async()=>{await ev(()=>{G.coins=20;G.map.objs.find(o=>o.type==='npc').talked=true;});const trace=[];for(let i=0;i<7;i++){await key('KeyZ',300);trace.push(await ev(()=>(G.msg?'M':'-')+(G.choice?'C'+G.choice.idx:'-')+G.items.swordLv+'/'+G.coins));}await clear();return trace.join(' ');});
// home interior render
await sec('home',async()=>{await ev(()=>{G.freed={fluff:1,mallo:1};G.flags.toadDead=true;loadMap('home',5,7,1);});await wait(200);await shot('home');return ev(()=>G.map.name);});
// soggy + steam
await sec('soggy',async()=>{await ev(()=>{G.flags.spear=true;G.flags.trig_toad=true;loadMap('overworld',9,41,1);P.toast=0.5;});await wait(200);await pg.keyboard.down('ArrowUp');await wait(300);await pg.keyboard.up('ArrowUp');const s=await ev(()=>({soggy:P.soggy,toast:P.toast}));
  await ev(()=>{loadMap('overworld',21,11,1);P.soggy=500;P.dir=2;});await wait(100);await ev(()=>{P.x=22*16+3;P.y=10*16+3;P.dir=2;});await pg.keyboard.down('KeyX');await wait(60);await pg.keyboard.up('KeyX');await wait(200);const st=await ev(()=>({steam:G.steam.length,torchOut:G.map.objs.find(o=>o.type==='torch'&&o.x===21).out}));await shot('steam');await clear();return JSON.stringify({s,st});});
// squeeze through crack at (6,7) from (6,8)
await sec('squeeze',async()=>{await ev(()=>{loadMap('overworld',6,8,1);});await wait(100);await pg.keyboard.down('ArrowUp');await wait(1200);await pg.keyboard.up('ArrowUp');await wait(200);const r=await ev(()=>({ty:Math.floor((P.y+5)/T),tx:Math.floor((P.x+5)/T),seal:G.seals}));
  await ev(()=>{P.x=6*16+3;P.y=4*16+3;});await pg.keyboard.down('ArrowLeft');await wait(400);await pg.keyboard.up('ArrowLeft');await wait(300);const r2=await ev(()=>({ty:Math.floor((P.y+5)/T),tx:Math.floor((P.x+5)/T),seals:G.seals,flag:G.flags.seal1}));await clear();return JSON.stringify({r,r2});});
// frost jar freezes lava, spear throw pins, charge sweep
await sec('frost',async()=>{await ev(()=>{G.items.frost=2;loadMap('cave',20,5,3);});await wait(100);await ev(()=>{P.x=20*16+3;P.y=4*16+3;P.dir=3;});await key('KeyV',500);const fz=await ev(()=>Object.keys(G.frozen));await shot('frost');
  await ev(()=>{const e=G.ents.find(x=>x.kind==='ember'&&!x.dead);if(e){e.x=P.x+40;e.y=P.y;e.state='wander';}});await key('KeyX',60);await key('KeyX',400);const pin=await ev(()=>({out:!!P.spearOut,pinned:G.ents.filter(e=>e.pinned>0).length}));
  await wait(800);await pg.keyboard.down('KeyX');await wait(900);await pg.keyboard.up('KeyX');await wait(200);const sw=await ev(()=>({sweep:P.atkType,toast:P.toast}));await clear();return JSON.stringify({fz,pin,sw});});
// toasted curtain pass + campfire + seal2
await sec('curtain',async()=>{await ev(()=>{loadMap('cave',25,5,1);P.toast=0.1;});await wait(100);await pg.keyboard.down('ArrowUp');await wait(500);await pg.keyboard.up('ArrowUp');const a=await ev(()=>Math.floor((P.y+5)/T));
  await ev(()=>{P.toast=P.cap*0.7;P.x=26*16+3;P.y=5*16+3;});await wait(50);await pg.keyboard.down('ArrowUp');await wait(1100);await pg.keyboard.up('ArrowUp');const b2=await ev(()=>({ty:Math.floor((P.y+5)/T),seals:G.seals}));await clear();return JSON.stringify({blockedAt:a,after:b2});});
// follower: fluff in village, then mallo plate
await sec('follower',async()=>{await ev(()=>{G.freed={fluff:1,mallo:1,squish:1,dot:1,bibi:1};loadMap('overworld',9,49,1);});await wait(100);for(let i=0;i<6;i++)await key('KeyZ',250);const c=await ev(()=>G.choice&&G.choice.title);await key('KeyZ',300);const f=await ev(()=>G.follower);
  await ev(()=>{G.msg=null;G.msgQ=[];G.follower='mallo';loadMap('castle',31,16,0);});await wait(100);await ev(()=>{P.x=31*16+3;P.y=16*16+3;P.dir=0;});await key('KeyV',300);const r=await ev(()=>({parked:G.F&&G.F.parked,door:G.flags.closetDoor}));await shot('mallo');await clear();return JSON.stringify({c,f,r});});
// bat carry + vault
await sec('carry',async()=>{await ev(()=>{G.follower=null;G.F=null;loadMap('overworld',24,30,3);G.msg=null;G.banner=null;const b=G.ents.find(e=>e.kind==='bat');b.x=P.x+12;b.y=P.y;b.state='wander';});await key('KeyC',250);const c=await ev(()=>!!P.carried);await wait(300);await key('KeyZ',200);const d=await ev(()=>!!P.carried);
  await ev(()=>{G.msg=null;G.flags.trig_toad=true;loadMap('cave',21,14,3);G.msg=null;G.msgQ=[];P.x=20*16+3;P.y=15*16+3;P.dir=3;});await wait(50);await key('KeyC',40);await key('KeyX',300);const h=await ev(()=>({hop:!!P.hop,tx:Math.floor((P.x+5)/T)}));await wait(400);const h2=await ev(()=>Math.floor((P.x+5)/T));await clear();return JSON.stringify({c,d,h,h2});});
// night: shop closed, tint; lamp darkness
await sec('night',async()=>{await ev(()=>{G.dayT=14400*0.75;G.items.lamp=true;loadMap('overworld',24,40,1);});await wait(200);await shot('night');const n=await ev(()=>nightAmount());await ev(()=>{loadMap('cave',6,14,3);});await wait(200);await shot('lamp');return n;});
// ash reignite
await sec('ash',async()=>{await ev(()=>{loadMap('cave',20,5,3);G.ents=G.ents.filter(e=>e.kind!=='bat');G.msg=null;G.msgQ=[];const e=G.ents.find(x=>x.kind==='ember');P.x=20*16+3;P.y=6*16+3;P.dir=3;P.hurt=200;e.x=P.x+14;e.y=P.y;e.hp=1;e.hurt=0;e.state='wander';e.st=0;});await key('KeyZ',400);const a=await ev(()=>G.ash.length);await wait(4300);const r=await ev(()=>({ash:G.ash.length,embers:G.ents.filter(e=>e.kind==='ember').length}));await clear();return JSON.stringify({a,r});});
// cleared -> gauntlet
await sec('gauntlet',async()=>{await ev(()=>{G.cleared=true;loadMap('castle',31,6,1);P.hurt=100;});await wait(100);await key('KeyZ',300);const c=await ev(()=>G.choice&&G.choice.title.slice(0,8));await key('KeyZ',300);await key('KeyZ',300);await key('KeyZ',300);await wait(1300);const g=await ev(()=>({st:G.gauntlet&&G.gauntlet.stage,toad:G.ents.some(e=>e.kind==='toad')}));await shot('gauntlet');await clear();return JSON.stringify({c,g});});
// bed sleep + NG+
await sec('bed',async()=>{await ev(()=>{G.gauntlet=null;G.dayT=12000;loadMap('home',8,3,1);P.dir=1;});await key('KeyZ',300);const c=await ev(()=>G.choice&&G.choice.title);await key('KeyZ',700);const d=await ev(()=>G.dayT);await clear();return JSON.stringify({c,d});});
await sec('ngplus',async()=>{await ev(()=>{P.cap=2;G.coins=9;newGame(true);});await wait(300);const r=await ev(()=>({ng:G.ngplus,diff:G.diff,cap:P.cap,sword:G.flags.sword,patches:G.patches.length,ents:G.ents.length}));await shot('ngplus');await clear();return JSON.stringify(r);});
await sec('titlemenu',async()=>{await ev(()=>{G.scene='title';G.savedCleared=true;G.hasSave=true;});await wait(200);await shot('title2');return ev(()=>menuItems().map(i=>i.id).join(','));});
log.errs=errs;console.log(JSON.stringify(log,null,1));await b.close();})().catch(e=>console.log('FAILED',e.message));
