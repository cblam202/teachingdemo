const assert=require("node:assert/strict");
const tests=require("./ttests.js");
const fixtures=require("./stata-reference.json");
const fuel=[[20,24],[23,25],[21,21],[25,22],[18,23],[17,18],[18,17],[24,28],[20,24],[24,27],[23,21],[19,23]];
const missing=[[1,2],[null,9],[4,3],[7,null],[6,8]];
let comparisons=0;
function near(actual,expected,label) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual-expected)<=1e-9*Math.max(1,Math.abs(expected)),label+": "+actual+" differs from Stata "+expected);
  comparisons++;
}
function values(result) {
  const r={level:result.level,t:result.t,df_t:result.df,se:result.se,p:result.p.two,p_l:result.p.left,p_u:result.p.right};
  const first=result.rows[0];
  Object.assign(r,{N_1:first.n,mu_1:first.mean,sd_1:first.sd,lb_1:first.ci[0],ub_1:first.ci[1]});
  if(result.kind!=="one") {
    const second=result.rows[1];
    Object.assign(r,{N_2:second.n,mu_2:second.mean,sd_2:second.sd,se_1:first.se,se_2:second.se,lb_2:second.ci[0],ub_2:second.ci[1],mu_diff:result.estimate,lb_diff:result.ci[0],ub_diff:result.ci[1]});
    if(result.kind==="paired") r.sd_diff=result.rows[2].sd;
    else {
      const combined=result.rows[2];
      Object.assign(r,{N_combined:combined.n,mu_combined:combined.mean,sd:combined.sd,se_combined:combined.se,lb_combined:combined.ci[0],ub_combined:combined.ci[1]});
    }
  }
  return r;
}
for(const fixture of fixtures) {
  const [command,options=""]=fixture.command.split(","),level=Number(options.match(/level\(([\d.]+)\)/)?.[1]||95);
  const method=options.includes("welch")?"welch":options.includes("unequal")?"unequal":"pooled";
  let result;
  if(command.startsWith("ttesti")) {
    const nums=command.split(/\s+/).slice(1).map(Number);
    const first={n:nums[0],mean:nums[1],sd:nums[2]};
    result=nums.length===4?tests.one(first,nums[3],level):tests.independent(first,{n:nums[3],mean:nums[4],sd:nums[5]},method,level);
  } else {
    const pairs=fixture.dataset==="missing"?missing:fuel;
    result=options.includes("unpaired")?tests.independent(tests.summarize(pairs.map(x=>x[0])),tests.summarize(pairs.map(x=>x[1])),method,level):tests.paired(pairs,level);
  }
  const actual=values(result);
  for(const [key,expected] of Object.entries(fixture.r)) near(actual[key],expected,fixture.command+" r("+key+")");
}
// Reversing pairs flips the t statistic and swaps one-sided probabilities.
const forward=tests.paired(fuel),reverse=tests.paired(fuel.map(([x,y])=>[y,x]));
near(reverse.t,-forward.t,"reversed t");near(reverse.p.left,forward.p.right,"reversed tail");near(reverse.p.two,forward.p.two,"reversed two-sided p");
assert.deepEqual(tests.parse("1, 2\n. 3\n4 .a",2),[[1,2],[null,3],[4,null]]);
assert.throws(()=>tests.parse("1,,2",2),/Row/);
assert.throws(()=>tests.parse("1 x",2),/Row/);
assert.throws(()=>tests.independent({n:2.5,mean:0,sd:1},{n:5,mean:0,sd:1}),/observations/);
assert.throws(()=>tests.paired([[1,null],[null,2]]),/two nonmissing/);
console.log(fixtures.length+" Stata reference cases passed; "+comparisons+" numerical comparisons within relative/absolute tolerance 1e-9.");
