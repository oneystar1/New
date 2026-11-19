const {chromium,devices}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:600,height:520}});const errs=[];pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(400);await pg.evaluate(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');});await pg.keyboard.press('Enter');await pg.waitForTimeout(300);await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const r=await pg.evaluate(async()=>{const out={};G.flags.sword=true;G.flags.spear=true;G.msg=null;const run=n=>{for(let i=0;i<n;i++)step();};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  // 1. buffer: press during roll fires after roll (within 8 frames window ~140ms real time)
  loadMap('overworld',24,30,0);G.msg=null;G.ents=[];startRoll(1,0);run(10);pressed.a=1;pressedT.a=performance.now();run(8);out.bufferedSwingAfterRoll=P.atkType==='sword';
  P.atk=0;P.atkType=null;pressed.a=1;pressedT.a=performance.now()-400;run(1);out.stalePressIgnored=P.atkType!=='sword';
  P.atk=0;P.atkType=null;P.squeeze={t:0,dur:40,fx:P.x,fy:P.y,tx:P.x+16,ty:P.y};pressed.a=1;pressedT.a=performance.now();trySqueeze;clearActions();run(42);out.noSwingAfterSqueeze=P.atkType!=='sword';
  // 2. pips: knight maxhp and hp after a hit; flash scales
  G.ents=[mkEnemy({kind:'knight',x:26,y:30})];const k=G.ents[0];k.x=P.x+14;k.y=P.y;P.dir=3;P.atk=14;P.atkType='sword';hitThings();out.knightHp=k.hp+'/'+k.maxhp;out.flashFrames=k.flash;
  // 3. spatial audio values
  const sp=audio.spatial({x:P.x+120,y:P.y,w:10,h:10});out.spatialRight=sp&&sp.pan>0.5&&sp.gain<1;const sp2=audio.spatial({x:P.x-120,y:P.y,w:10,h:10});out.spatialLeft=sp2&&sp2.pan<-0.5;
  // 4. melt stats: get killed by a knight swing cause
  P.toast=P.cap-0.01;hurtPlayer(0.2,k,3,'knight sword');G.hitstop=0;run(2);out.meltCauseRecorded=G.lastMelt&&G.lastMelt.cause+' @ '+G.lastMelt.area;out.stats=JSON.stringify(G.stats.causes);
  run(95);G.fade=0;if(G.fadeTo){const cb=G.fadeTo;G.fadeTo=null;cb();}out.meltMsg=G.msg&&G.msg.lines.join(' ').slice(0,40);G.msg=null;G.msgQ=[];
  // 5. stats screen toggle from pause
  G.paused=true;pressed.item=1;pressedT.item=performance.now();run(1);out.statsOpen=!!G.showStats;pressed.a=1;pressedT.a=performance.now();run(1);out.statsClosed=!G.showStats;G.paused=false;
  return out;});
// touch options on a phone
const ph=await b.newPage({...devices['iPhone 13'],deviceScaleFactor:1});await ph.goto('file://'+TMP);await ph.waitForTimeout(400);await ph.tap('#c');await ph.waitForTimeout(200);
const t=await ph.evaluate(()=>{const ids=menuItems().map(i=>i.id);const t=touchOpts();t.size=2;t.left=true;applyTouchOpts();saveOpts();return {ids:ids.join(','),scale:getComputedStyle(document.documentElement).getPropertyValue('--btnscale'),lefty:document.body.classList.contains('lefty')};});
await ph.waitForTimeout(200);await ph.screenshot({path:os.tmpdir()+'/mq_lefty.png'});
// swipe to roll
const sw=await ph.evaluate(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');return 1;});await ph.tap('.mid .s');await ph.waitForTimeout(200);for(let i=0;i<4;i++){await ph.tap('.btns .a');await ph.waitForTimeout(120);}await ph.waitForTimeout(200);
const st=await ph.$('#stick');const bb=await st.boundingBox();const cx=bb.x+bb.width/2,cy=bb.y+bb.height/2;
await ph.evaluate(([cx,cy])=>{G.msg=null;G.banner=null;const st=document.getElementById('stick');st.dispatchEvent(new PointerEvent('pointerdown',{clientX:cx,clientY:cy,pointerId:9,bubbles:true}));st.dispatchEvent(new PointerEvent('pointermove',{clientX:cx+60,clientY:cy,pointerId:9,bubbles:true}));},[cx,cy]);
await ph.waitForTimeout(120);const rolled=await ph.evaluate(()=>P.roll>0||P.rollCd>0);await ph.evaluate(()=>{document.getElementById('stick').dispatchEvent(new PointerEvent('pointerup',{pointerId:9,bubbles:true}));});
console.log(JSON.stringify({r,t,rolled,errs},null,1));await b.close();})().catch(e=>console.log('FAILED',e.message));
