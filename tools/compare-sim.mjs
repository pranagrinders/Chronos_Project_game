// Kullanım: node tools/compare-sim.mjs ESKI_PROJE [seed sayısı] [rapor.json]
// İlk görevin12karar yolu için tam oyun durumunu ve tarih kayıtlarını karşılaştırır.
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import crypto from 'node:crypto';import{fileURLToPath}from'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),previous=process.argv[2],N=Number(process.argv[3]||128),out=process.argv[4];
if(!previous||!Number.isSafeInteger(N)||N<1||N>5000)throw new Error('Eski proje yolu ve1..5000seed sayısı gerekli.');
function load(dir){const box=vm.createContext({});for(const file of ['data','content','sim','game','experience','scene-data'])vm.runInContext(fs.readFileSync(path.join(dir,'src',file+'.js'),'utf8'),box);return box.CP;}
const A=load(previous),B=load(root),digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const branches={};let worlds=0,stable=0,redundant=0,initialMatches=0;
for(let seed=0;seed<N;seed++){
 const old=A.newGame(seed),current=B.newGame(seed);
 if(digest(old)!==digest(current))throw new Error('Başlangıç durumu değişti: '+seed);initialMatches++;
 for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<3;c++){
  const indices=[a,b,c],runs=[];let selected;
  for(const[C,template]of[[A,old],[B,current]]){
   const G=structuredClone(template),p={m:C.missionById('koruma'),role:'res',region:'ana',year:430,choices:[]};
   const stages=C.stages(G,p);p.choices=stages.map((s,i)=>s.opts[indices[i]]);C.jump(G,p);runs.push(G);
   if(C===B){selected=p;const prefix={...p,choices:[]};for(const option of p.choices){if(option.hz<0){stable++;const preview=C.choicePreview(prefix,option);if(!preview.reduced)redundant++;}prefix.choices.push(option);}}
  }
  if(digest(runs[0])!==digest(runs[1]))throw new Error('Tarih/durum değişti: seed='+seed+' yol='+indices.join('-'));
  worlds++;const G=runs[1],key=indices.join('-'),s=branches[key]||={runs:0,dead:0,proto:0,water:0,unrest:0,fieldTypes:{}};
  s.runs++;s.dead+=G.tl.log.some(e=>e.kind==='legacy'&&e.iv==='d1')?1:0;s.proto+=B.proto(G);s.water+=G.tl.final.regions.ana.water-G.base.final.regions.ana.water;s.unrest+=G.tl.final.regions.ana.unrest-G.base.final.regions.ana.unrest;
  const type=selected.choices[0].t;s.fieldTypes[type]=(s.fieldTypes[type]||0)+1;
 }
 if((seed+1)%16===0)console.log('Compared seeds',seed+1,'/',N,'worlds',worlds);
}
for(const s of Object.values(branches)){s.meanProto=s.proto/s.runs;s.meanWaterDelta=s.water/s.runs;s.meanUnrestDelta=s.unrest/s.runs;s.deadRate=s.dead/s.runs;delete s.proto;delete s.water;delete s.unrest;}
const report={passed:true,seeds:N,initialMatches,matchedWorlds:worlds,comparison:'Tam G durumu: kaynaklar, ekip, müdahaleler, başlangıç ve son tarihin tüm geçmiş/kayıt/ham hedef değerleri; yeni rapor meta verisi bu karşılaştırmaya dahil değil.',stabilityChoices:stable,redundantStabilityChoices:redundant,branches,note:'Yollar indeksle gruplanmıştır; ilk saha sorusu seed ile değişebilir. Öngörü olasılığı gerçekleşecek sonucu açığa çıkarmaz.'};
if(out)fs.writeFileSync(out,JSON.stringify(report,null,2));else console.log(JSON.stringify(report,null,2));
console.log('PASS',worlds,'paired timelines unchanged; stability choices with no extra protection:',redundant,'/',stable);
