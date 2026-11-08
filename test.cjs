// Dependency-free deterministic tests of the exact Core embedded in index.html.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script); // Full browser script syntax, without executing DOM code.
const source=script.slice(0,script.indexOf("const $="));
const core=vm.runInNewContext(source+';Core;');
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
const point=(extra={})=>({lat:38.7,lon:-9.1,accuracy:5,speed:null,time:100000,...extra});
const EXPECTED={i3:3,i4:4,i5:5,i6:6,v6:6,flat6:6,v8:8,v10:10,v12:12,gt3rs:6,gtr:6,lfa:10,r8v10:10,wrx:4,mustang:8};
const INSPIRATIONS=['gt3rs','gtr','lfa','r8v10','wrx','mustang'];
const ARCHITECTURES=['i3','i4','i5','i6','v6','flat6','v8','v10','v12'];
const FIELDS=['group','unofficial','cyl','idle','max','tone','exhaustQ','intakeBase','intakeRatio','intakeQ','noiseIdle','noiseLoad','rough','pulse','harmonicDecay','evenMix','oddMix','rasp','pulseGain','pulseLoad','subGain','subDiv','flutterBase'];
const synthKey=e=>[e.tone,e.exhaustQ,e.intakeBase,e.intakeRatio,e.intakeQ,e.noiseIdle,e.noiseLoad,e.rough,e.pulse,e.harmonicDecay,e.evenMix,e.oddMix,e.rasp].join('|');

test('m/s → km/h',()=>assert.equal(core.gpsSample(null,point({speed:10})).speed,36));
test('null speed remains unknown without baseline',()=>assert.equal(core.gpsSample(null,point()).speed,null));
test('negative speed uses unknown fallback',()=>assert.equal(core.gpsSample(null,point({speed:-1})).speed,null));
test('position fallback at known distance',()=>{const a=point({kmh:null}),b=point({lat:38.7001,time:102000});const r=core.gpsSample(a,b);assert(r.derived);assert(Math.abs(r.speed-20.015)<.05);});
test('jitter is stationary',()=>assert.equal(core.gpsSample(point({kmh:0}),point({lat:38.700001,time:102000})).speed,0));
test('large position jump rejected',()=>assert.equal(core.gpsSample(point({kmh:0}),point({lat:39,time:102000})).ok,false));
test('poor accuracy rejected',()=>assert.equal(core.gpsSample(null,point({accuracy:150})).ok,false));
test('invalid coordinates rejected',()=>assert.equal(core.gpsSample(null,point({lat:NaN})).ok,false));
test('duplicate timestamp rejected',()=>assert.equal(core.gpsSample(point(),point()).ok,false));
test('implausible acceleration rejected',()=>assert.equal(core.gpsSample(point({kmh:0}),point({speed:30,time:102000})).ok,false));
test('old baseline cannot derive a speed',()=>assert.equal(core.gpsSample(point({kmh:0}),point({time:125000})).speed,null));
test('virtual gears upshift and RPM drops',()=>{let a=core.mapping(21.9,'v8'),b=core.mapping(22,'v8');assert.equal(a.gear,1);assert.equal(b.gear,2);assert(b.rpm<a.rpm);});
test('all engines map finite bounded RPM/load over speed sweep',()=>{for(const key of Object.keys(core.engines))for(let s=-10;s<=300;s++){const m=core.mapping(s,key,4),e=core.engines[key];assert(m.rpm>=e.idle&&m.rpm<=e.max);assert(m.load>=0&&m.load<=1);assert(m.gear>=0&&m.gear<=6);}});
test('positive acceleration increases synthetic load',()=>assert(core.mapping(40,'v6',2).load>core.mapping(40,'v6',0).load));
test('visible version 2.0 is exposed in Core and HTML',()=>{assert.equal(core.VERSION,'2.0');assert.match(html,/data-version="2\.0"/);assert.match(html,/>v2\.0</);assert.match(html,/Impulso v2\.0/);});
test('exactly 15 presets with expected keys and cylinder counts',()=>{const keys=Object.keys(core.engines);assert.equal(keys.length,15);assert.deepEqual(keys.slice().sort(),Object.keys(EXPECTED).sort());for(const [k,cyl] of Object.entries(EXPECTED)) assert.equal(core.engines[k].cyl,cyl,k);});
test('selector groups unofficial inspirations and architectures',()=>{
 assert.match(html,/<optgroup label="Inspirações de modelos · síntese não oficial"/);
 assert.match(html,/<optgroup label="Arquiteturas de motor"/);
 for(const id of INSPIRATIONS){
  assert.equal(core.engines[id].unofficial,true,id);
  assert.equal(core.engines[id].group,'inspiration',id);
  assert.match(html,new RegExp(`value="${id}"`));
  assert.match(html,new RegExp(`value="${id}"[^>]*>[^<]*síntese não oficial`));
 }
 for(const id of ARCHITECTURES){
  assert.equal(core.engines[id].unofficial,false,id);
  assert.equal(core.engines[id].group,'architecture',id);
  assert.match(html,new RegExp(`value="${id}"`));
 }
});
test('unofficial synthesis disclaimer is visible and avoids authenticity claims',()=>{
 assert.match(html,/Síntese original não oficial/);
 assert.match(html,/não são gravações nem reproduções autênticas/i);
 assert.match(html,/escolhas de design sintético/i);
 assert.doesNotMatch(html,/gravação oficial|som autêntico|reprodução fiel|ficha técnica do/);
});
test('every profile has complete bounded and unique synthesis tuning',()=>{
 const fingerprints=new Set(),synth=new Set();
 for(const [key,e] of Object.entries(core.engines)){
  for(const field of FIELDS) assert.notEqual(e[field],undefined,key+'.'+field);
  assert(e.idle<e.max,key+' idle/max');
  assert(e.idle>=500&&e.max<=10000,key+' rpm window');
  assert(e.pulseGain<=.22&&e.pulseLoad<=.16&&e.subGain<=.18,key+' gains');
  assert(e.noiseIdle<=.025&&e.noiseLoad<=.09,key+' noise');
  assert(e.tone>=800&&e.tone<=4000,key+' tone');
  assert(e.pulse>0&&e.harmonicDecay>0&&e.evenMix>0&&e.oddMix>0,key+' wave');
  const fp=core.profileFingerprint(e);
  assert.equal(typeof fp,'string');
  assert(!fingerprints.has(fp),'duplicate fingerprint '+key);
  fingerprints.add(fp);
  const sk=synthKey(e);
  assert(!synth.has(sk),'duplicate synthesis key '+key);
  synth.add(sk);
 }
 assert.equal(fingerprints.size,15);
 assert.equal(synth.size,15);
});
test('same-cylinder inspirations differ from related architectures beyond cylinder count',()=>{
 const pairs=[['gt3rs','flat6'],['gtr','v6'],['lfa','v10'],['r8v10','v10'],['lfa','r8v10'],['wrx','i4'],['mustang','v8'],['i6','v6']];
 for(const [a,b] of pairs){
  const A=core.engines[a],B=core.engines[b];
  assert.equal(A.cyl,B.cyl,a+' vs '+b+' cyl');
  assert.notEqual(synthKey(A),synthKey(B),a+' vs '+b+' synth');
  let differentPartial=false;
  for(let i=1;i<=24;i++){
   const pa=core.harmonicPartial(A,i),pb=core.harmonicPartial(B,i);
   assert(Number.isFinite(pa)&&pa>=0,a+' partial '+i);
   assert(Number.isFinite(pb)&&pb>=0,b+' partial '+i);
   if(pa!==pb) differentPartial=true;
  }
  assert(differentPartial,a+' vs '+b+' harmonics');
 }
});
test('unknown engine key maps to a safe idle state',()=>{
 const m=core.mapping(80,'missing',2);
 assert.equal(m.gear,0);
 assert.equal(m.rpm,800);
 assert.equal(m.load,0);
});
test('mapping uses each profile idle and cap rather than a shared redline',()=>{
 const muscle=core.mapping(200,'mustang');
 const high=core.mapping(200,'lfa');
 assert.equal(muscle.rpm,core.engines.mustang.max*.94);
 assert(high.rpm>muscle.rpm);
 assert(high.rpm<=core.engines.lfa.max);
});
console.log(`${count} tests passed; full inline JavaScript syntax valid.`);
