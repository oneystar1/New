const {chromium,devices}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(400);await pg.evaluate(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');});await pg.keyboard.press('Enter');await pg.waitForTimeout(300);await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const box=await pg.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
const r=await pg.evaluate(()=>{const out={};G.flags.sword=true;G.flags.spear=true;G.msg=null;const run=n=>{for(let i=0;i<n;i++)step();};const press=k=>{pressed[k]=1;pressedT[k]=performance.now();};
  // 1. quit to title via pause -> A -> choose Quit
  loadMap('overworld',24,52,1);G.msg=null;press('start');run(1);out.paused=G.paused;press('a');run(1);out.quitChoice=G.choice&&G.choice.opts.join('/');G.choice.idx=1;press('a');run(1);out.sceneAfterQuit=G.scene;G.scene='play';G.menu=0;
  // 2. meter growth animation
  loadMap('overworld',24,30,0);G.msg=null;G.ents=[];const c0=P.cap;giveCap(0.3);out.capAnim=!!G.capAnim;render();run(5);render();out.capAnimRunning=G.capAnim&&G.capAnim.t>0&&G.capAnim.t<70;for(let i=0;i<80;i++){step();render();}out.capAnimDone=!G.capAnim&&P.cap>c0;
  // 3. wisps at night only, flare on touch, drop coins
  G.dayT=14400*0.75;loadMap('overworld',24,30,0);G.msg=null;G.ents=[];G.t=239;run(2);out.wispSpawnedAtNight=G.ents.filter(e=>e.wisp).length;const w=G.ents.find(e=>e.wisp);if(w){w.x=P.x;w.y=P.y;P.hurt=0;run(1);out.wispFlare=w.state;run(45);out.wispCoins=G.map.objs.filter(o=>o.type==='coin'&&o.drop).length;}
  G.dayT=2600;run(300);out.wispsGoneByDay=G.ents.filter(e=>e.wisp&&!e.dead).length;
  // 4. hold B skips a speech; sign reads from the side
  say(['one','two','three','four'],null,'Elder');run(2);keys.b=1;run(30);keys.b=0;out.skippedAllPages=!G.msg&&G.msgQ.length===0;
  loadMap('overworld',15,51,2);G.msg=null;P.x=15*16+3;P.y=51*16+3;P.dir=2;out.signFacingTile=G.map.t[51][14];const ok=interact();out.signReadFromSide=ok&&G.msg&&G.msg.who==='SIGN';G.msg=null;G.msgQ=[];
  // 5. room camera: in the keep west wing the camera stays inside the room; crossing into the hall scrolls
  loadMap('castle',6,25,2);G.msg=null;run(30);out.westWingCam=Math.round(G.cam.x)+','+Math.round(G.cam.y);out.roomW=roomAt(G.map)&&roomAt(G.map).join(',');
  P.x=15*16+3;P.y=25*16+3;run(2);const c1=G.cam.x;run(40);out.hallCamMoved=Math.round(G.cam.x-c1);out.roomH=roomAt(G.map)&&roomAt(G.map).join(',');
  loadMap('cave',10,12,3);G.msg=null;out.caveNoRoom=roomAt(G.map)===null;
  return out;});
await pg.evaluate(()=>{loadMap('castle',6,25,2);G.msg=null;G.banner=null;for(let i=0;i<30;i++)step();});await pg.waitForTimeout(100);await pg.screenshot({path:os.tmpdir()+'/mq_v6_westwing.png',clip:box});
await pg.evaluate(()=>{loadMap('grotto',20,6,1);G.msg=null;G.banner=null;G.flags.trig_toad=true;for(let i=0;i<30;i++)step();});await pg.waitForTimeout(100);await pg.screenshot({path:os.tmpdir()+'/mq_v6_slimepit.png',clip:box});
console.log(JSON.stringify(r,null,1));console.log(errs);await b.close();})().catch(e=>console.log('FAILED',e.message));
