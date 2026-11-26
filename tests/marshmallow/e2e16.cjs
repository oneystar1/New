const {chromium}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(400);await pg.evaluate(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');});await pg.keyboard.press('Enter');await pg.waitForTimeout(300);await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const log=await pg.evaluate(()=>{const out={};const run=n=>{for(let i=0;i<n;i++)step();};const press=k=>{pressed[k]=1;pressedT[k]=performance.now();};G.flags.sword=true;G.flags.spear=true;G.msg=null;
  // 1. map shape: spawn on cloud, every plank/cloud tile has a neighbour, music and notes resolve
  const m=MAPS.sky;out.mapSize=m.w===40&&m.h===30&&m.t[m.spawn.y][m.spawn.x]==='C';
  out.notes=TRACKS.sky.pat.every(p=>p.every(row=>row.every(n=>n==='-'||n==='.'||NOTE[n]>0)));
  let lonely=0;for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const ch=m.t[j][i];if(ch!=='C'&&ch!=='E')continue;const nb=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const c=m.t[j+b]?.[i+a];return c==='C'||c==='E'||c==='O';});if(!nb)lonely++;}out.connected=lonely===0;
  // 2. the updraft on the Peaks refuses Puff without the mitten and lifts him with it
  G.items.mitten=false;loadMap('peaks',22,4,1);G.msg=null;P.x=22*16+3;P.y=2*16+3;run(30);out.gated=G.mapName==='peaks'&&!!G.msg&&/MITTEN/.test(G.msg.lines.join(' ')+' '+G.msgQ.map(q=>q.t).join(' '));G.msg=null;G.msgQ=[];
  G.items.mitten=true;P.x=22*16+3;P.y=2*16+3;run(40);out.lifted=G.mapName==='sky';out.checkpoint=G.checkpoint&&G.checkpoint.map==='sky';out.music=audio.music.track==='sky';
  // 3. wind: a gust at full strength pushes Puff down the first plank; Cloud Glaze stops it
  G.msg=null;G.ents=[];const bridge=()=>{P.x=14*16+3;P.y=26*16+3;P.safe={x:P.x,y:P.y};P.falling=0;P.hurt=0;};
  G.t=Math.round(70*Math.PI/2);bridge();const y0=P.y;run(4);out.pushed=P.y>y0+2;out.gustFx=G.amb.some(a=>a.kind==='gust');
  tops().owned.cloud=true;tops().eq.glaze='cloud';G.t=Math.round(70*Math.PI/2);bridge();run(4);out.glazeHolds=P.y===y0;tops().eq.glaze=null;
  // lull: strength near zero at t = 70*pi
  G.t=Math.round(70*Math.PI);bridge();run(4);out.lull=Math.abs(P.y-y0)<=1;
  // 4. falling: open air drops Puff back to his last safe spot with a little toast
  P.x=12*16+3;P.y=24*16+3;P.safe={x:4*16+3,y:26*16+3};const t0=P.toast;run(2);out.falls=P.falling>0;render();run(40);out.backSafe=P.x===4*16+3&&P.y===26*16+3&&P.falling===0&&G.mapName==='sky';out.fallToast=P.toast>t0;out.fallCause=P.lastHurt&&P.lastHurt.cause==='a long fall';
  // 5. a crumb never leaves its cloud; a gull flies
  P.x=4*16+3;P.y=26*16+3;P.hurt=0;G.ents=[];const c=mkEnemy({kind:'crumb',x:24,y:25});c.vx=1.3;G.ents.push(c);let offCloud=false;for(let i=0;i<300;i++){step();const ci=Math.floor((c.x+c.w/2)/16),cj=Math.floor((c.y+c.h/2)/16);if(FALL.has(MAPS.sky.t[cj]?.[ci]))offCloud=true;}out.crumbStays=!offCloud&&!c.gone;
  const g=mkEnemy({kind:'gull',x:20,y:12});G.ents.push(g);const gx=g.x;run(30);out.gullMoves=g.x!==gx&&g.fly===true;G.ents=[];
  // 6. oven door talks; chest gives the Cloud Glaze
  P.x=22*16+3;P.y=4*16+3;P.dir=1;G.msg=null;interact();out.oven=!!G.msg&&G.msg.who==='OVEN';G.msg=null;G.msgQ=[];
  const ch=MAPS.sky.objs.find(o=>o.id==='topcloud');P.x=3*16+3;P.y=10*16+3;P.dir=1;delete tops().owned.cloud;interact();out.chest=!!G.opened.topcloud&&!!tops().owned.cloud&&/CLOUD GLAZE/.test(G.msg?G.msg.lines.join(' '):'');G.msg=null;G.msgQ=[];
  // 7. pause map, quest and badge wiring
  out.quest=questList().some(q=>q.id==='sky'&&q.status==='done');G.paused=true;G.pauseTab='map';render();out.pauseOk=true;G.paused=false;
  out.explorerNeedsSky=(()=>{G.visited={cave:1,castle:1,grotto:1,peaks:1,glacier:1,coast:1,wreck:1};const b=BADGES.find(x=>x.id==='explorer');const a=b.cond();G.visited.sky=1;return !a&&b.cond();})();
  // 8. way back down
  P.x=6*16+3;P.y=28*16+3;P.safe={x:P.x,y:P.y};run(40);out.backToPeaks=G.mapName==='peaks';
  return out;});
await pg.evaluate(()=>{G.msg=null;G.msgQ=[];loadMap('sky',14,26,0);G.msg=null;P.x=13*16+3;P.y=26*16+3;G.t=Math.round(70*Math.PI/2);for(let i=0;i<6;i++)step();render();});await pg.screenshot({path:'/tmp/mq_v14_sky.png'});
await pg.evaluate(()=>{P.x=22*16+3;P.y=5*16+3;P.dir=1;updateCam(true);for(let i=0;i<2;i++)step();render();});await pg.screenshot({path:'/tmp/mq_v14_oven.png'});
log.errs=errs;console.log(JSON.stringify(log,null,1));await b.close();fs.unlinkSync(TMP);const ok=Object.entries(log).every(([k,v])=>k==='errs'?v.length===0:v===true);if(!ok){console.log('FAILED');process.exit(1);}})().catch(e=>{console.log('FAILED',e.message);process.exit(1);});
