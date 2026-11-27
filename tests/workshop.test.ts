import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { TAXONOMY, type Question } from "../src/lib/types";
import { practiceOrder } from "../src/lib/practice-order";

const bank:Question[] = JSON.parse(readFileSync("src/data/questions.json","utf8"));
const added = bank.filter(q=>q.collection==="skill-workshop");
const surface = (q:Question) => JSON.stringify([q.passage,q.passage2,q.stem,q.table]);
const answer = (q:Question) => q.type==="spr" ? q.answer : q.choices!["ABCD".indexOf(q.answer)];
function numeric(s:string) {
  const [top,bottom="1"] = s.split("/");
  return Number(top)/Number(bottom);
}

test("all 29 skills gain 200 unique playable exercises without altering earlier attempts",()=>{
  const earlier = bank.filter(q=>q.collection!=="skill-workshop");
  assert.equal(earlier.length,3317);
  const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
  assert.equal(digest(earlier.filter(q => !q.collection)), "a77141d35d1dc2912efa70aba29257e8ab0aa7a7f89006d28aa7f8c35dc25ccd");
  assert.equal(digest(earlier.filter(q => q.collection === "november-set").map(q => [q.id, q.answer])), "53f0f1de6d4df680229204ecd10dd988a8d2937e8a2939adb9c82fb78c27b7af");
  const seen = new Set(earlier.map(surface));
  assert.equal(added.length,5800);
  for (const [section, domains] of Object.entries(TAXONOMY))
    for (const {domain,skills} of domains) for (const skill of skills)
      assert.equal(added.filter(q=>q.section===section&&q.domain===domain&&q.skill===skill).length,200,skill);
  for (const q of added) {
    assert.ok(!seen.has(surface(q)),q.id+" duplicate visible question"); seen.add(surface(q));
    assert.doesNotMatch(JSON.stringify(q),/undefined|NaN|Infinity/);
    assert.ok(q.explanation.length>35,q.id);
    if (q.type==="spr" && /^\d+$/.test(q.answer)) assert.ok(q.answer.length<=5,q.id);
    if (q.type==="mcq") {
      assert.match(q.answer,/^[A-D]$/);
      assert.equal(new Set(q.choices!.map(s=>s.toLowerCase().trim())).size,4,q.id);
    }
    if(q.skill==="Cross-Text Connections") assert.ok(q.passage && q.passage2,q.id);
  }
});

test("short reading sets exhaust distinct cases before a repeat and full sets keep every ID",()=>{
  const pool = added.filter(q=>q.skill==="Inferences");
  const ids = practiceOrder(pool,()=>0.35);
  const lookup = new Map(pool.map(q=>[q.id,q.family]));
  for(let i=0;i<200;i+=50) assert.equal(new Set(ids.slice(i,i+50).map(id=>lookup.get(id))).size,50);
  assert.deepEqual(new Set(ids),new Set(pool.map(q=>q.id)));
  const mixed=added.filter(q=>q.domain==="Problem-Solving and Data Analysis");
  const lookupSkill=new Map(mixed.map(q=>[q.id,q.skill]));
  const sample=practiceOrder(mixed,()=>0.4,10);
  assert.equal(new Set(sample.map(id=>lookupSkill.get(id))).size,7);
});

test("reconstruct every numerical math key and reject equivalent distractors",()=>{
  for (const q of added.filter(q=>q.section==="math")) {
    const [,skillCode,seq] = q.id.split("-");
    const skill = Number(skillCode)-1, j=Number(seq)-1;
    if(skill===14) {assert.equal(q.type,"mcq");continue;}
    const f=j%6, i=Math.floor(j/6);
    const a=3+i%9, b=4+Math.floor(i/9), k=i+7, n=i+12;
    const regular = [
      [n,k*2+1,n,k*a],[k,(k+5*a)+2*((k+5*a)-(k+2*a))/3,k+5*a,n+a*(b+4)],
      [n-b,n,b,n+a*b],[n,k+a*b,n,b*a],[n,n,n+1,b+1],
      [n+a,a*b-k,k,2*a*n],[n,(a+b)**2-k,k,k*k],[n*2**3,k+a,n*625*.8**2,(a+2)**2-(a+1)**2],
      [n*a,n*a/10*1000,n*a,k*a],[n*100,a,100*n*1.2*.75,n*a],
      [5*n-((n-4)+(n-2)+(n+1)+(n+2)),(n+3+n+6)/2,(b*n+2*b*(n+6))/(3*b),2*(n-b)],
      [i%11-5,3*a,n+a*b,a],[b/(n+b),n/(n+a-1),(3*n-b)/(4*n),1-(b+a)/(3*n)],
      [n+12+a,2*b,n*(a+b),n+a],[],[a*b*n,(2*a)**2*n/3,(n+2)*(a+2)-n*a,3*n],
      [n+55-a-17,(3*(n+2*b))/3,(180-a-12-b)/2,(180-n-a)/2],
      [Math.hypot(3*n,4*n),Math.sqrt((5*n)**2-(3*n)**2),n*a/b,4*n],
      [n*n,n*60*(6*b)/360,(3*n)**2+(4*n)**2,(360-2*n)/2],
    ];
    const A=3+i%7,B=2+Math.floor(i/7),K=i+4,N=i+10;
    const transfer = [
      [B,(A+6)*N],[A*60,B+8],[A*B,A*K],[(A+3)*B,B*N],[B,B],
      [N*B,A+N],[(K-A)**2+(K+A)**2,N-A],[B+A+N,3*A],
      [12*N/5,N*A*A],[4*N,20],[N+2,N+A],[A+B+1,16*K],
      [A/(2*(A+N)),N/(N+A+B)],[N+3*A,N*(N+15-B)],[],
      [A*A+4*A*N,N],[N+25,3*N-A],[N,N/A],[N/A,A*N/100],
    ];
    const expected = f<4 ? regular[skill][f] : transfer[skill][f-4];
    assert.ok(Math.abs(numeric(answer(q))-expected)<1e-7,`${q.id}: ${answer(q)} vs ${expected}`);
    if(q.choices) assert.equal(q.choices.filter(x=>Math.abs(numeric(x)-expected)<1e-7).length,1,q.id);
  }
});
test("every vocabulary-in-context stem refers to a word actually present and every evidence table agrees with its key",()=>{
  for (const q of added.filter(q=>q.section==="rw")) {
    const token=q.stem.match(/As used in the text, what does “([^”]+)”/i)?.[1];
    if(token) assert.ok(new RegExp("\\b"+token+"\\b","i").test(q.passage!),q.id);
    if(q.table) {
      const [first,second]=q.table.rows;
      assert.equal(answer(q),`Support rose by ${Number(first[2])-Number(first[1])} readers with the detail and by ${Number(second[2])-Number(second[1])} readers without it.`);
    }
  }
});
