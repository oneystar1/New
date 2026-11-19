// Runs every headless suite against marshmallow-quest/index.html (or the path given) and fails on any reported error.
import {spawnSync} from 'child_process';import fs from 'fs';
const dir=new URL('.',import.meta.url).pathname;const game=process.argv[2];
const suites=fs.readdirSync(dir).filter(f=>/^e2e.*\.cjs$/.test(f)).sort();let failed=0;
for(const s of suites){const t0=Date.now();const r=spawnSync('node',[dir+s].concat(game?[game]:[]),{encoding:'utf8',timeout:180000});
  const out=(r.stdout||'')+(r.stderr||'');const errs=[...out.matchAll(/"errs": \[([^\]]*)\]/g)].map(m=>m[1].trim()).filter(Boolean);
  const bad=errs.length||/FAILED|ERR page\.evaluate|Error:/.test(out)||r.status!==0;if(bad)failed++;
  console.log((bad?'FAIL ':'ok   ')+s+'  '+((Date.now()-t0)/1000).toFixed(0)+'s'+(bad?'\n'+out.slice(-1200):''));}
console.log(failed?failed+' suite(s) failed':'all '+suites.length+' suites passed');process.exit(failed?1:0);
