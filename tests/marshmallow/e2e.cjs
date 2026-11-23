const {chromium,devices}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];
pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(500);
const box=await pg.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
const shot=n=>pg.screenshot({path:os.tmpdir()+'/mq_v3_'+n+'.png',clip:box});const ev=f=>pg.evaluate(f);const wait=ms=>pg.waitForTimeout(ms);const key=async(k,ms=120)=>{await pg.keyboard.press(k);await wait(ms);};
const log={};
await shot('title');await key('Enter',300);await wait(600);await shot('intro');for(let i=0;i<4;i++)await key('KeyZ',200);
log.scene=await ev(()=>G.scene);
// elder: walk to door
await ev(()=>{P.x=5*16+3;P.y=49*16+3;});await pg.keyboard.down('ArrowUp');await wait(700);await pg.keyboard.up('ArrowUp');await wait(600);
log.house=await ev(()=>G.mapName);await ev(()=>{P.x=6*16+3;P.y=4*16+3;P.dir=1;});await key('KeyZ',300);await shot('elder');
for(let i=0;i<12;i++){await key('KeyZ',250);}log.sword=await ev(()=>G.flags.sword);await ev(()=>{G.msg=null;G.msgQ=[];});
// exit house via warp
await ev(()=>{P.x=5*16+3;P.y=8*16+3;});await pg.keyboard.down('ArrowDown');await wait(600);await pg.keyboard.up('ArrowDown');await wait(600);log.back=await ev(()=>G.mapName+' '+!!G.trans);
// bushes and sprinkle quest
await ev(()=>{G.q.sprinkle=1;loadMap('overworld',18,39,1);});await wait(200);await key('KeyZ',200);await key('KeyZ',200);log.bushCut=await ev(()=>G.map.objs.filter(o=>o.type==='bush'&&o.cut).length);
await ev(()=>{P.x=18*16+3;P.y=38*16+3;P.dir=1;});await key('KeyZ',300);await ev(()=>{P.x=18*16+3;P.y=37*16+3;});await wait(300);log.sprinkle=await ev(()=>G.q.sprinkle);for(let i=0;i<3;i++)await key('KeyZ',200);
// woods combat: let AI run near enemies, roll
await ev(()=>{loadMap('overworld',30,20,0);});await wait(100);await shot('woods');await pg.keyboard.down('ArrowRight');await wait(800);await pg.keyboard.up('ArrowRight');await key('KeyC',400);await key('KeyZ',200);await wait(1500);
log.woodsToast=await ev(()=>({toast:P.toast,ents:G.ents.map(e=>e.kind+':'+e.state).slice(0,6),amb:G.amb.length}));await shot('woods2');
// cave: toad
await ev(()=>{P.toast=0;P.melting=0;loadMap('cave',20,13,3);});await wait(1200);await shot('cave');
log.toad=await ev(()=>{const t=G.ents.find(e=>e.kind==='toad');return t&&{state:t.state,hp:t.hp};});
await ev(()=>{G.msg=null;G.msgQ=[];const t=G.ents.find(e=>e.kind==='toad');t.hp=1;t.x=P.x+14;t.y=P.y-3;t.state='wander';t.st=0;t.hurt=0;P.dir=3;P.atk=0;P.hurt=90;});await key('KeyZ',200);await wait(600);for(let i=0;i<3;i++)await key('KeyZ',300);
log.toadDead=await ev(()=>G.flags.toadDead);await ev(()=>{G.msg=null;G.msgQ=[];});await ev(()=>{P.x=26*16+3;P.y=13*16+3;P.dir=1;});await key('KeyZ',300);for(let i=0;i<6;i++)await key('KeyZ',200);log.spear=await ev(()=>G.flags.spear);await ev(()=>{G.msg=null;G.msgQ=[];});
// castle: east wing block puzzle
await ev(()=>{P.toast=0;P.melting=0;G.flags.gate=true;loadMap('castle',29,25,3);});await wait(200);await pg.keyboard.down('ArrowRight');await wait(1400);await pg.keyboard.up('ArrowRight');await wait(200);
log.block=await ev(()=>{const bl=G.map.objs.find(o=>o.type==='block');return {bx:bl.x,by:bl.y,px:P.x};});
await ev(()=>{const bl=G.map.objs.find(o=>o.type==='block');bl.x=33;bl.y=26;refreshSolids();P.x=32*16+3;P.y=26*16+3;P.dir=3;});await pg.keyboard.down('ArrowRight');await wait(600);await pg.keyboard.up('ArrowRight');await wait(300);
log.eastDoor=await ev(()=>G.flags.eastDoor);for(let i=0;i<3;i++)await key('KeyZ',200);await shot('east');
// west wing vents and brazier
await ev(()=>{P.toast=0;P.melting=0;loadMap('castle',8,25,2);});await wait(900);await shot('vents');
await ev(()=>{P.toast=0;P.melting=0;loadMap('castle',9,17,1);P.dir=1;});await key('KeyX',300);log.westDoor=await ev(()=>G.flags.westDoor);for(let i=0;i<3;i++)await key('KeyZ',200);
// boss: taunt, phases, kill
await ev(()=>{P.toast=0;P.melting=0;P.cap=3;G.freed={fluff:1,mallo:1,squish:1,dot:1,bibi:1};loadMap('castle',19,14,1);});await pg.keyboard.down('ArrowUp');await wait(900);await pg.keyboard.up('ArrowUp');await wait(300);
log.cut=await ev(()=>!!G.cut&&G.cut.card.name);await key('KeyZ',250);await wait(200);log.taunt=await ev(()=>({msg:G.msg&&G.msg.who,trig:G.flags.trig_taunt}));for(let i=0;i<5;i++)await key('KeyZ',250);
log.bossFight=await ev(()=>({fight:G.flags.bossFight,boss:G.ents.some(e=>e.boss),music:audio.music.track}));await wait(1500);
await ev(()=>{const bo=G.ents.find(e=>e.boss);bo.hp=4;});await wait(1500);await shot('boss2');
log.phase2=await ev(()=>({phase:G.bossPhase,shots:G.shots.length}));
await ev(()=>{const bo=G.ents.find(e=>e.boss);bo.hp=1;bo.hurt=0;bo.x=P.x+16;bo.y=P.y-6;P.dir=3;P.atk=0;P.hurt=60;});await key('KeyX',300);await wait(1500);
log.bossDead=await ev(()=>G.flags.bossDead);await ev(()=>{P.x=19*16+3;P.y=6*16+3;P.dir=1;P.atk=0;});await key('KeyX',400);for(let i=0;i<3;i++)await key('KeyZ',300);
log.ending=await ev(()=>G.scene);await wait(1500);await shot('ending');await ev(()=>{G.endT=700;});await wait(600);await shot('credits');
// save/continue
await ev(()=>{G.scene='title';checkSave();G.flags={sword:true,spear:true};G.freed={fluff:1};G.lastHome={map:'house1',x:5,y:7};G.map=MAPS.house1;G.mapName='house1';saveGame();checkSave();});
log.hasSave=await ev(()=>G.hasSave);await ev(()=>{G.menu=0;});await key('KeyZ',400);log.cont=await ev(()=>({scene:G.scene,map:G.mapName,sword:G.flags.sword,fluff:G.freed.fluff}));
await key('Enter',200);await shot('pause');await key('Enter',200);
log.errs=errs;console.log(JSON.stringify(log,null,1));await b.close();})().catch(e=>{console.log('FAILED',e.message);});
