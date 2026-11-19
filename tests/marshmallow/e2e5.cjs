const {chromium,devices}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];
pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(500);
const box=await pg.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
const shot=n=>pg.screenshot({path:'v5_'+n+'.png',clip:box});const ev=f=>pg.evaluate(f);const wait=ms=>pg.waitForTimeout(ms);const key=async(k,ms=120)=>{await pg.keyboard.press(k);await wait(ms);};
const clear=()=>ev(()=>{G.msg=null;G.msgQ=[];G.choice=null;P.toast=0;P.melting=0;});const log={};const sec=async(n,f)=>{try{log[n]=await f();}catch(e){log[n]='ERR '+e.message.split('\n')[0];}};
// help from title
await sec('help',async()=>{await ev(()=>{G.menu=menuItems().findIndex(i=>i.id==='help');});await key('KeyZ',200);await shot('help');const h=await ev(()=>G.help);await key('KeyZ',200);return h+' '+await ev(()=>G.help);});
await ev(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');});await key('Enter',300);await wait(500);for(let i=0;i<4;i++)await key('KeyZ',200);log.scene=await ev(()=>G.scene);
// cooling probes (deterministic stepping)
await sec('cooling',async()=>ev(()=>{G.flags.sword=true;G.flags.spear=true;G.msg=null;const out={};
  loadMap('overworld',24,52,1);G.msg=null;G.ents=[];P.toast=P.cap;P.hurt=1e9;let f=0;while(P.toast>0&&f<60000){step();f++;}out.coolNoFireSec=(f/60).toFixed(0);
  loadMap('overworld',24,30,0);G.msg=null;G.ents=[mkEnemy({kind:'ember',x:30,y:30})];G.ents[0].baseSpeed=0;P.toast=0.5;P.hurt=1e9;f=0;while(f<600){step();f++;}out.toastAfter10sWithFireOnScreen=P.toast.toFixed(2);out.fireNear=G.fireNear;
  loadMap('castle',19,8,1);G.msg=null;G.flags.taunt=true;G.ents=[mkEnemy({kind:'boss',x:19,y:8})];const bo=G.ents[0];bo.baseSpeed=0;P.toast=0;P.hurt=1e9;P.dir=3;bo.x=P.x+16;bo.y=P.y-6;P.atk=16;P.atkType='spear';hitThings();out.bossCool=P.bossCool;out.steam=G.steam.length;
  f=0;while(P.toast<P.cap&&f<6000){bo.x=P.x+24;bo.y=P.y-6;bo.phase=1;bo.hurt=0;step();f++;if(f%150===0){P.atk=16;P.atkType='spear';hitThings();}}out.meltNearBossWithHitsEvery2_5s=(f/60).toFixed(1);
  return out;}));
// grotto: gate, enter, rooms
await sec('grotto',async()=>{await clear();await ev(()=>{loadMap('overworld',18,42,1);G.msg=null;G.banner=null;});await wait(100);await key('KeyX',400);const gate=await ev(()=>G.flags.grotto);for(let i=0;i<3;i++)await key('KeyZ',200);
  await pg.keyboard.down('ArrowUp');await wait(900);await pg.keyboard.up('ArrowUp');await wait(700);const map=await ev(()=>G.mapName+' '+Math.floor((P.x+5)/T)+','+Math.floor((P.y+5)/T));await shot('grotto_entry');
  // block room: push block from (18,17) right to (22,17)? plate at (22,15): push block up from below instead: block (19,17) -> push right to (22,17) then up to (22,15)
  await ev(()=>{G.msg=null;G.banner=null;loadMap('grotto',18,17,3);G.msg=null;});await wait(100);await pg.keyboard.down('ArrowRight');await wait(1500);await pg.keyboard.up('ArrowRight');
  await ev(()=>{P.x=22*16+3;P.y=18*16+3;P.dir=1;});await pg.keyboard.down('ArrowUp');await wait(1300);await pg.keyboard.up('ArrowUp');await wait(200);const bl=await ev(()=>{const b=G.map.objs.find(o=>o.type==='block');return b.x+','+b.y+' door:'+!!G.flags.grottoEastDoor;});await shot('grotto_block');
  // crack
  await ev(()=>{G.msg=null;loadMap('grotto',14,6,2);G.msg=null;});await wait(100);await pg.keyboard.down('ArrowLeft');await wait(1200);await pg.keyboard.up('ArrowLeft');const cr=await ev(()=>Math.floor((P.x+5)/T)+','+Math.floor((P.y+5)/T));
  // mallo plate
  await ev(()=>{G.msg=null;G.follower='mallo';loadMap('grotto',24,8,1);G.msg=null;});await wait(100);await key('KeyV',300);const mp=await ev(()=>!!G.flags.grottoNorthDoor);
  // frost from corridor (4,15) facing up
  await ev(()=>{G.msg=null;G.follower=null;G.F=null;G.items.frost=3;loadMap('grotto',4,15,1);G.msg=null;});await wait(100);await key('KeyV',600);const fz=await ev(()=>Object.keys(G.frozen).join(' '));
  await pg.keyboard.down('ArrowUp');await wait(1400);await pg.keyboard.up('ArrowUp');const pos=await ev(()=>Math.floor((P.x+5)/T)+','+Math.floor((P.y+5)/T));await key('KeyZ',300);const boots=await ev(()=>!!G.items.boots);await shot('grotto_lava');
  await clear();return JSON.stringify({gate,map,bl,cr,mp,fz,pos,boots});});
// tips appear
await sec('tips',async()=>{await ev(()=>{G.flags.spear=true;loadMap('overworld',24,30,0);G.msg=null;G.banner=null;});await wait(100);await key('KeyC',200);const t1=await ev(()=>G.banner&&G.banner.title+':'+G.banner.text.slice(0,20));await ev(()=>{G.banner=null;});await pg.keyboard.down('KeyX');await wait(500);await pg.keyboard.up('KeyX');const t2=await ev(()=>G.banner&&G.banner.text.slice(0,20));return t1+' | '+t2;});
// pause help
await sec('pausehelp',async()=>{await clear();await key('Enter',200);await shot('pause');await key('KeyX',200);const h=await ev(()=>G.help);await key('KeyZ',200);await key('Enter',200);return h;});
log.errs=errs;console.log(JSON.stringify(log,null,1));await b.close();})().catch(e=>console.log('FAILED',e.message));
