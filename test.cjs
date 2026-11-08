// Dependency-free deterministic tests of the exact Core embedded in index.html.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script); // Full browser script syntax, without executing DOM code.
const source=script.slice(0,script.indexOf("const $="));
const core=vm.runInNewContext(source+';Core;');
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
const point=(extra={})=>({lat:38.7,lon:-9.1,accuracy:5,speed:null,time:100000,...extra});
const EXPECTED={
 i3:3,i4:4,i5:5,i6:6,v6:6,flat6:6,v8:8,v10:10,v12:12,
 gt3rs:6,gtr:6,lfa:10,r8v10:10,wrx:4,mustang:8,
 m3:6,c63:8,rs3:5,aventador:12,f458:8
};
const INSPIRATIONS=['gt3rs','gtr','lfa','r8v10','wrx','mustang','m3','c63','rs3','aventador','f458','rx7'];
const ARCHITECTURES=['i3','i4','i5','i6','v6','flat6','v8','v10','v12'];
const FIELDS=['group','unofficial','kind','cyl','rotors','fireMul','idle','max','tone','exhaustQ','intakeBase','intakeRatio','intakeQ','noiseIdle','noiseLoad','rough','pulse','harmonicDecay','evenMix','oddMix','rasp','pulseGain','pulseLoad','subGain','subDiv','flutterBase','crackle','hint'];
const synthKey=e=>[e.tone,e.exhaustQ,e.intakeBase,e.intakeRatio,e.intakeQ,e.noiseIdle,e.noiseLoad,e.rough,e.pulse,e.harmonicDecay,e.evenMix,e.oddMix,e.rasp,e.kind,e.fireMul].join('|');
const popState=(over={})=>({
 enabled:true,running:true,muted:false,volume:15,intensity:50,
 event:'decel',validMotion:true,rpm:4500,maxRpm:7000,accel:-1.2,
 profile:core.engines.c63,now:10,lastPopAt:null,activeVoices:0,
 random:()=>0,...over
});

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
test('visible version 3.0 is exposed in Core and HTML',()=>{assert.equal(core.VERSION,'3.0');assert.match(html,/data-version="3\.0"/);assert.match(html,/>v3\.0</);assert.match(html,/Impulso v3\.0/);});
test('at least 21 presets with expected keys',()=>{
 const keys=Object.keys(core.engines);
 assert(keys.length>=21,keys.length);
 assert.equal(keys.length,21);
 assert.deepEqual(keys.slice().sort(),[...Object.keys(EXPECTED),'rx7'].sort());
 for(const [k,cyl] of Object.entries(EXPECTED)){
  assert.equal(core.engines[k].kind,'piston',k);
  assert.equal(core.engines[k].cyl,cyl,k);
  assert.equal(core.engines[k].fireMul,cyl/2,k);
 }
});
test('selector groups inspirations and architectures',()=>{
 assert.match(html,/<optgroup label="Inspirações de modelos"/);
 assert.match(html,/<optgroup label="Arquiteturas de motor"/);
 for(const id of INSPIRATIONS){
  assert.equal(core.engines[id].unofficial,true,id);
  assert.equal(core.engines[id].group,'inspiration',id);
  assert.match(html,new RegExp(`value="${id}"`));
 }
 for(const id of ARCHITECTURES){
  assert.equal(core.engines[id].unofficial,false,id);
  assert.equal(core.engines[id].group,'architecture',id);
  assert.match(html,new RegExp(`value="${id}"`));
 }
 assert.match(html,/BMW M3/);
 assert.match(html,/Mercedes-AMG C63/);
 assert.match(html,/Audi RS3/);
 assert.match(html,/Lamborghini Aventador/);
 assert.match(html,/Ferrari 458/);
 assert.match(html,/Mazda RX-7 · rotativo/);
});
test('honesty is present without a disclaimer wall on every option',()=>{
 assert.match(html,/Síntese original, não oficial/);
 assert.match(html,/não é uma gravação/i);
 assert.doesNotMatch(html,/<option[^>]*>[^<]*síntese não oficial/);
 const repeats=(html.match(/não oficial/gi)||[]).length;
 assert(repeats<=4,'too many unofficial repeats: '+repeats);
});
test('every profile has complete bounded unique synthesis tuning and a short hint',()=>{
 const fingerprints=new Set(),synth=new Set(),hints=new Set();
 for(const [key,e] of Object.entries(core.engines)){
  for(const field of FIELDS) assert.notEqual(e[field],undefined,key+'.'+field);
  assert(e.idle<e.max,key+' idle/max');
  assert(e.idle>=500&&e.max<=10000,key+' rpm window');
  assert(e.pulseGain<=.22&&e.pulseLoad<=.16&&e.subGain<=.18,key+' gains');
  assert(e.noiseIdle<=.025&&e.noiseLoad<=.09,key+' noise');
  assert(e.tone>=800&&e.tone<=4000,key+' tone');
  assert(e.pulse>0&&e.harmonicDecay>0&&e.evenMix>0&&e.oddMix>0,key+' wave');
  assert(e.crackle>=0&&e.crackle<=1,key+' crackle');
  assert(e.fireMul>0,key+' fireMul');
  assert.equal(typeof e.hint,'string');
  assert(e.hint.length>12&&e.hint.length<140,key+' hint length');
  assert(!hints.has(e.hint),'duplicate hint '+key);
  hints.add(e.hint);
  const fp=core.profileFingerprint(e);
  assert(!fingerprints.has(fp),'duplicate fingerprint '+key);
  fingerprints.add(fp);
  const sk=synthKey(e);
  assert(!synth.has(sk),'duplicate synthesis key '+key);
  synth.add(sk);
 }
 assert(fingerprints.size>=21);
 assert.equal(synth.size,fingerprints.size);
});
test('related profiles differ beyond name and cylinder or rotor count',()=>{
 const pairs=[['gt3rs','flat6'],['gtr','v6'],['lfa','v10'],['r8v10','v10'],['lfa','r8v10'],['wrx','i4'],['mustang','v8'],['i6','v6'],['m3','i6'],['c63','v8'],['c63','mustang'],['rs3','i5'],['aventador','v12'],['f458','v8'],['f458','c63']];
 for(const [a,b] of pairs){
  const A=core.engines[a],B=core.engines[b];
  assert.equal(A.kind,B.kind);
  if(A.kind==='piston') assert.equal(A.cyl,B.cyl,a+' vs '+b+' cyl');
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
 assert.equal(m.gear,0);assert.equal(m.rpm,800);assert.equal(m.load,0);
});
test('mapping uses each profile idle and cap rather than a shared redline',()=>{
 const muscle=core.mapping(200,'mustang');
 const high=core.mapping(200,'lfa');
 assert.equal(muscle.rpm,core.engines.mustang.max*.94);
 assert(high.rpm>muscle.rpm);
 assert(high.rpm<=core.engines.lfa.max);
});
test('RX-7 is a rotary profile, not a piston-cylinder stand-in',()=>{
 const e=core.engines.rx7;
 assert.equal(e.kind,'rotary');
 assert.equal(e.rotors,2);
 assert.equal(e.cyl,0);
 assert.equal(e.fireMul,2);
 assert.equal(core.firingMul(e),2);
 assert.equal(core.firingHz(e,3000),100);
 assert.equal(core.firingHz(core.engines.i4,3000),100);
 assert.notEqual(synthKey(e),synthKey(core.engines.i4));
 assert.match(html,/Mazda RX-7 · rotativo/);
 assert.match(e.hint,/rotativo/i);
 assert.match(e.hint,/não é de pistões/);
 assert.doesNotMatch(html,/RX-7[^<]*(I4|quatro cilindros|4 cilindros)/i);
 const mapped=core.mapping(90,'rx7',1);
 assert(mapped.rpm>=e.idle&&mapped.rpm<=e.max);
});
test('pops stay off when disabled, muted, or stopped',()=>{
 assert.equal(core.evaluatePop(popState({enabled:false})).reason,'off');
 assert.equal(core.evaluatePop(popState({muted:true})).reason,'muted');
 assert.equal(core.evaluatePop(popState({volume:0})).reason,'muted');
 assert.equal(core.evaluatePop(popState({running:false})).reason,'stopped');
 assert.equal(core.evaluatePop(popState({intensity:0})).reason,'intensity');
});
test('pops never trigger on signal loss, mode switch, restart, hidden page or engine change',()=>{
 for(const event of ['signal-loss','mode-switch','audio-restart','hidden','engine-change','none','stale']){
  const r=core.evaluatePop(popState({event}));
  assert.equal(r.allow,false,event);
  assert.equal(r.reason,'forbidden',event);
 }
});
test('stale or invalid motion cannot create decel or upshift pops',()=>{
 assert.equal(core.evaluatePop(popState({event:'decel',validMotion:false})).reason,'invalid');
 assert.equal(core.evaluatePop(popState({event:'upshift',validMotion:false,accel:1})).reason,'invalid');
 assert.equal(core.evaluatePop(popState({event:'decel',accel:-0.1})).reason,'not-decel');
});
test('valid seeded decel, rev-release and upshift can trigger',()=>{
 const decel=core.evaluatePop(popState());
 assert.equal(decel.allow,true);
 assert.equal(decel.kind,'crackle');
 assert(decel.gain>0&&decel.gain<=core.POP_LIMITS.maxGain);
 const rev=core.evaluatePop(popState({event:'rev-release',rpm:5000,maxRpm:7000,random:()=>1}));
 assert.equal(rev.allow,true);
 assert.equal(rev.kind,'crackle');
 const lowRev=core.evaluatePop(popState({event:'rev-release',rpm:2000,maxRpm:7000}));
 assert.equal(lowRev.reason,'rpm-low');
 const up=core.evaluatePop(popState({event:'upshift',accel:1,random:()=>1}));
 assert.equal(up.allow,true);
 assert.equal(up.kind,'shift-pop');
});
test('cooldown and voice cap block a constant pop loop',()=>{
 const first=core.evaluatePop(popState({now:10,lastPopAt:null}));
 assert.equal(first.allow,true);
 const again=core.evaluatePop(popState({now:10.05,lastPopAt:10}));
 assert.equal(again.reason,'cooldown');
 const later=core.evaluatePop(popState({now:10+first.minGap+.01,lastPopAt:10}));
 assert.equal(later.allow,true);
 assert.equal(core.evaluatePop(popState({activeVoices:3})).reason,'voice-cap');
});
test('sporty profiles are more likely to crackle than refined ones with the same roll',()=>{
 const roll=()=>0.2;
 const sporty=core.evaluatePop(popState({profile:core.engines.c63,intensity:50,random:roll}));
 const refined=core.evaluatePop(popState({profile:core.engines.i6,intensity:50,random:roll}));
 assert.equal(sporty.allow,true);
 assert.equal(refined.allow,false);
 assert.equal(refined.reason,'roll');
 assert(core.engines.c63.crackle>core.engines.v8.crackle);
 assert(core.engines.f458.crackle>core.engines.lfa.crackle);
 assert(core.engines.rs3.crackle>core.engines.i5.crackle);
});
test('pop envelopes stay short and amplitude-capped',()=>{
 const dec=core.evaluatePop(popState());
 const env=core.popEnvelope(dec);
 assert(env.peak<=core.POP_LIMITS.maxGain);
 assert(env.dur<=0.1);
 assert(env.thumpPeak<env.peak);
 assert(env.nodes<=6);
 assert.equal(core.popEnvelope({allow:false}).peak,0);
});
test('pops control defaults to off and intensity is optional',()=>{
 assert.match(html,/id="popsEnable"/);
 assert.match(html,/id="popsControls" hidden/);
 assert.match(html,/id="popsIntensity"/);
 assert.doesNotMatch(html,/id="popsEnable"[^>]*checked/);
 assert.match(html,/Estalos e pops \(opcional\)/);
});
console.log(`${count} tests passed; full inline JavaScript syntax valid. These tests cover logic and syntax only, not listening.`);
