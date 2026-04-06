import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wxfhkoqovwljacpzrqzh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4Zmhrb3FvdndsamFjcHpycXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTIxNTQsImV4cCI6MjA5MTA4ODE1NH0.nKAh--ybnTVQ_OVb_uVFBraBN40zMGB48CMyDe5Z7yc";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROUNDS = [
  { id:1,  cards:10, buys:0, objective:"2 Sets of 3" },
  { id:2,  cards:11, buys:0, objective:"1 Set of 3 + 1 Run of 4" },
  { id:3,  cards:12, buys:0, objective:"2 Runs of 4" },
  { id:4,  cards:12, buys:1, objective:"3 Sets of 3" },
  { id:5,  cards:13, buys:2, objective:"1 Set of 3 + 1 Run of 7" },
  { id:6,  cards:13, buys:2, objective:"2 Sets of 3 + 1 Run of 5" },
  { id:7,  cards:13, buys:2, objective:"3 Runs of 4" },
  { id:8,  cards:14, buys:3, objective:"1 Set of 3 + 1 Run of 10" },
  { id:9,  cards:14, buys:3, objective:"3 Sets of 3 + 1 Run of 5" },
  { id:10, cards:14, buys:3, objective:"3 Runs of 5" },
];

const MEDALS = ["🥇","🥈","🥉"];
const AVATARS = [
  "linear-gradient(135deg,#f472b6,#ec4899)",
  "linear-gradient(135deg,#60a5fa,#3b82f6)",
  "linear-gradient(135deg,#fb923c,#f97316)",
  "linear-gradient(135deg,#a78bfa,#8b5cf6)",
  "linear-gradient(135deg,#34d399,#10b981)",
  "linear-gradient(135deg,#fbbf24,#f59e0b)",
  "linear-gradient(135deg,#f87171,#ef4444)",
  "linear-gradient(135deg,#38bdf8,#0ea5e9)",
];

const total = p => p.scores.reduce((s,v)=>s+(parseInt(v)||0),0);
const gameWinner = g => [...g.players].sort((a,b)=>total(a)-total(b))[0];
const newGameObj = players => ({
  date: new Date().toLocaleDateString(),
  complete: false,
  current_round: 0,
  players: players.map(name=>({ name, scores: Array(10).fill("") })),
});

const C = {
  page:{ minHeight:"100vh", background:"linear-gradient(160deg,#0a0f1e 0%,#0d2137 40%,#0a1a0f 100%)", fontFamily:"'Inter',-apple-system,sans-serif", color:"#f0f0f0", paddingBottom:80 },
  card:{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:16, marginBottom:12 },
  gcard:{ background:"linear-gradient(135deg,rgba(74,222,128,0.12),rgba(74,222,128,0.04))", border:"1px solid rgba(74,222,128,0.25)", borderRadius:20, padding:16, marginBottom:12 },
  label:{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:1.2, marginBottom:10, display:"block" },
  btn:(bg="#4ade80",fg="#0a0f1e")=>({ background:`linear-gradient(135deg,${bg},${bg}cc)`, color:fg, border:"none", borderRadius:14, padding:"14px 20px", fontWeight:800, fontSize:15, cursor:"pointer", width:"100%", marginTop:8, boxShadow:`0 4px 15px ${bg}44` }),
  input:{ width:76, height:52, background:"rgba(255,255,255,0.08)", border:"2px solid rgba(255,255,255,0.12)", borderRadius:14, color:"#fff", fontSize:22, fontWeight:900, textAlign:"center", outline:"none", WebkitAppearance:"none" },
};

function Avatar({ name, idx, size=42, glow=false }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:AVATARS[idx%8], display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.4, fontWeight:800, color:"#fff", flexShrink:0, border:glow?"2px solid #4ade80":"2px solid transparent", boxShadow:glow?"0 0 14px rgba(74,222,128,0.5)":"none" }}>
      {name[0].toUpperCase()}
    </div>
  );
}

// ── Setup ─────────────────────────────────────────────────────────────────────
function SetupPage({ onStart }) {
  const [names, setNames] = useState(["",""]);
  const valid = names.every(n=>n.trim()) && new Set(names.map(n=>n.trim())).size===names.length;
  return (
    <div>
      <div style={{fontSize:22,fontWeight:900,marginBottom:4}}>New Game</div>
      <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginBottom:20}}>Add 2–8 players</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
        {names.map((n,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"center"}}>
            <Avatar name={n||"?"} idx={i} size={40}/>
            <input value={n} placeholder={`Player ${i+1}`}
              onChange={e=>{const c=[...names];c[i]=e.target.value;setNames(c);}}
              style={{flex:1,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:"13px 16px",color:"#fff",fontSize:15,fontWeight:600,outline:"none"}}/>
            {names.length>2&&<button onClick={()=>setNames(names.filter((_,j)=>j!==i))}
              style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#f87171",borderRadius:12,width:42,height:42,fontSize:18,cursor:"pointer",flexShrink:0}}>✕</button>}
          </div>
        ))}
      </div>
      {names.length<8&&<button onClick={()=>setNames([...names,""])}
        style={{background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.2)",color:"#4ade80",borderRadius:12,padding:"11px 16px",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:10,width:"100%"}}>
        + Add Player
      </button>}
      <button disabled={!valid} onClick={()=>onStart(names.map(n=>n.trim()))} style={{...C.btn(),opacity:valid?1:0.4}}>Start Game 🃏</button>
    </div>
  );
}

// ── Scorecard ─────────────────────────────────────────────────────────────────
function Scorecard({ game, onUpdate, onFinish }) {
  const [inputs, setInputs] = useState(game.players.map(p=>[...p.scores]));
  const [activeRound, setActiveRound] = useState(game.current_round);
  const [saving, setSaving] = useState(false);

  const pTotal = idx => inputs[idx].reduce((s,v)=>s+(parseInt(v)||0),0);
  const ranked = game.players.map((p,i)=>({...p,idx:i,t:pTotal(i)})).sort((a,b)=>a.t-b.t);
  const r = ROUNDS[activeRound];
  const allFilled = inputs.every(p=>p[activeRound]!=="");
  const allDone = inputs.every(p=>ROUNDS.every((_,i)=>p[i]!==""));

  const handleChange = async (pi,ri,val) => {
    const cp=inputs.map(r=>[...r]);
    cp[pi][ri]=val===""?"":String(parseInt(val)||0);
    setInputs(cp);
    setSaving(true);
    await onUpdate(cp, Math.max(game.current_round,ri));
    setSaving(false);
  };

  return (
    <div>
      {saving&&<div style={{textAlign:"right",fontSize:11,color:"#4ade80",marginBottom:4,opacity:0.7}}>💾 Saving…</div>}

      {/* Leaderboard strip */}
      <div style={{...C.card,display:"flex",justifyContent:"space-around",padding:"16px 8px",marginBottom:14}}>
        {ranked.map((p,i)=>(
          <div key={p.name} style={{textAlign:"center",flex:1}}>
            <div style={{fontSize:20,marginBottom:4}}>{MEDALS[i]||"🃏"}</div>
            <Avatar name={p.name} idx={p.idx} size={42} glow={i===0}/>
            <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.6)",marginTop:5}}>{p.name}</div>
            <div style={{fontSize:21,fontWeight:900,color:i===0?"#4ade80":i===1?"#94a3b8":"#fb923c"}}>{p.t}</div>
          </div>
        ))}
      </div>

      {/* Round pills */}
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {ROUNDS.map((_,i)=>{
          const done=inputs.every(p=>p[i]!=="");
          const active=i===activeRound;
          return <button key={i} onClick={()=>setActiveRound(i)} style={{width:38,height:38,borderRadius:"50%",border:active?"2px solid #4ade80":done?"2px solid rgba(74,222,128,0.4)":"2px solid rgba(255,255,255,0.1)",background:active?"#4ade80":done?"rgba(74,222,128,0.15)":"rgba(255,255,255,0.05)",color:active?"#0a0f1e":done?"#4ade80":"rgba(255,255,255,0.4)",fontWeight:800,fontSize:13,cursor:"pointer",boxShadow:active?"0 0 12px rgba(74,222,128,0.4)":"none",transition:"all 0.2s"}}>{i+1}</button>;
        })}
      </div>

      {/* Round info */}
      <div style={C.gcard}>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:"#4ade80"}}>Round {r.id}</div>
            <div style={{fontSize:15,fontWeight:700,color:"#fff",marginTop:4}}>{r.objective}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>🃏 {r.cards} cards</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:4}}>🛒 {r.buys} {r.buys===1?"buy":"buys"}</div>
          </div>
        </div>
      </div>

      {/* Score inputs */}
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
        {game.players.map((p,pi)=>(
          <div key={pi} style={{...C.card,display:"flex",alignItems:"center",gap:14,marginBottom:0}}>
            <Avatar name={p.name} idx={pi} size={46}/>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700}}>{p.name}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Total: <span style={{color:"#4ade80",fontWeight:700}}>{pTotal(pi)}</span></div>
            </div>
            <input type="number" min="0" value={inputs[pi][activeRound]} placeholder="0"
              onChange={e=>handleChange(pi,activeRound,e.target.value)} style={C.input}/>
          </div>
        ))}
      </div>

      {/* All rounds table */}
      <div style={{...C.card,overflowX:"auto"}}>
        <span style={C.label}>All Rounds</span>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:300}}>
          <thead>
            <tr>
              <th style={{textAlign:"left",padding:"4px 6px",color:"rgba(255,255,255,0.3)",fontWeight:600}}>Player</th>
              {ROUNDS.map(rnd=><th key={rnd.id} style={{padding:"4px 3px",color:rnd.id===r.id?"#4ade80":"rgba(255,255,255,0.25)",fontWeight:700,fontSize:10}}>R{rnd.id}</th>)}
              <th style={{padding:"4px 6px",color:"#4ade80",fontWeight:800}}>Tot</th>
            </tr>
          </thead>
          <tbody>
            {game.players.map((p,pi)=>(
              <tr key={pi}>
                <td style={{padding:"7px 6px",fontWeight:700,whiteSpace:"nowrap"}}>
                  <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:AVATARS[pi%8],marginRight:6}}/>
                  {p.name}
                </td>
                {inputs[pi].map((s,ri)=>(
                  <td key={ri} style={{padding:"7px 3px",textAlign:"center",background:ri===activeRound?"rgba(74,222,128,0.08)":"transparent",color:s===""?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.8)",borderRadius:6,fontWeight:s===""?400:600}}>{s===""?"·":s}</td>
                ))}
                <td style={{padding:"7px 6px",textAlign:"center",fontWeight:900,color:"#4ade80",fontSize:13}}>{pTotal(pi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {allFilled&&activeRound<9&&<button onClick={()=>setActiveRound(activeRound+1)} style={{...C.btn("#3b82f6","#fff"),boxShadow:"0 4px 15px rgba(59,130,246,0.3)"}}>Next Round →</button>}
      {allDone&&<button onClick={onFinish} style={C.btn()}>✓ Finalize Game</button>}
    </div>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function StatsPage({ games }) {
  const [tab, setTab] = useState("overall");
  const finished = games.filter(g=>g.complete);
  if (!finished.length) return (
    <div style={{textAlign:"center",padding:"60px 20px",color:"rgba(255,255,255,0.3)"}}>
      <div style={{fontSize:48,marginBottom:12}}>📊</div>
      <div style={{fontWeight:700,fontSize:16}}>No completed games yet</div>
    </div>
  );

  const allPlayers = [...new Set(finished.flatMap(g=>g.players.map(p=>p.name)))].sort();

  const pStats = allPlayers.map(name=>{
    const myG = finished.filter(g=>g.players.some(p=>p.name===name));
    const totals = myG.map(g=>{ const p=g.players.find(p=>p.name===name); return p?total(p):null; }).filter(v=>v!==null);
    const placements = myG.map(g=>{ const r=[...g.players].sort((a,b)=>total(a)-total(b)); return r.findIndex(t=>t.name===name); });
    const wins=placements.filter(p=>p===0).length, second=placements.filter(p=>p===1).length, third=placements.filter(p=>p===2).length;
    const avgGame=totals.length?(totals.reduce((a,b)=>a+b,0)/totals.length).toFixed(0):"–";
    const bestGame=totals.length?Math.min(...totals):null;

    const rScores = ROUNDS.map((_,ri)=>myG.map(g=>{ const p=g.players.find(p=>p.name===name); return p?parseInt(p.scores[ri]):NaN; }).filter(v=>!isNaN(v)));
    const rAvgs = rScores.map(v=>v.length?(v.reduce((a,b)=>a+b,0)/v.length):Infinity);
    const favRound = rAvgs.indexOf(Math.min(...rAvgs))+1;
    const validAvgs = rAvgs.filter(v=>v!==Infinity);
    const avgRound = validAvgs.length?(validAvgs.reduce((a,b)=>a+b,0)/validAvgs.length).toFixed(1):"–";
    let worstRound=null;
    myG.forEach(g=>{ const p=g.players.find(p=>p.name===name); if(!p) return; p.scores.forEach((s,ri)=>{ const v=parseInt(s); if(!isNaN(v)&&(!worstRound||v>worstRound.score)) worstRound={score:v,round:ri+1}; }); });

    return { name, wins, second, third, avgGame, bestGame, favRound, avgRound, worstRound, gamesPlayed:myG.length };
  });

  const rStats = ROUNDS.map((rnd,ri)=>{
    const vals=[];
    finished.forEach(g=>g.players.forEach(p=>{ const v=parseInt(p.scores[ri]); if(!isNaN(v)) vals.push({v,name:p.name}); }));
    const avg=vals.length?(vals.reduce((a,b)=>a+b.v,0)/vals.length).toFixed(1):"–";
    const best=vals.length?Math.min(...vals.map(x=>x.v)):null;
    const worst=vals.length?Math.max(...vals.map(x=>x.v)):null;
    return { ...rnd, avg, total2:vals.reduce((a,b)=>a+b.v,0), best, worst, bestH:vals.find(x=>x.v===best)?.name, worstH:vals.find(x=>x.v===worst)?.name };
  });
  const maxT=Math.max(...rStats.map(r=>r.total2));

  let hiR=null,loR=null,hiG=null,loG=null;
  finished.forEach(g=>{
    g.players.forEach(p=>{ p.scores.forEach((s,ri)=>{ const v=parseInt(s); if(!isNaN(v)){ if(!hiR||v>hiR.score) hiR={score:v,name:p.name,round:ri+1,date:g.date}; if(!loR||v<loR.score) loR={score:v,name:p.name,round:ri+1,date:g.date}; } }); });
    [...g.players].map(p=>({name:p.name,t:total(p)})).forEach(t=>{ if(!hiG||t.t>hiG.score) hiG={score:t.t,name:t.name,date:g.date}; if(!loG||t.t<loG.score) loG={score:t.t,name:t.name,date:g.date}; });
  });

  const subTabs = ["overall","players","rounds","history"];

  return (
    <div>
      <div style={{fontSize:22,fontWeight:900,marginBottom:14}}>Leaderboard</div>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {subTabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"9px 16px",borderRadius:20,border:"none",background:tab===t?"#4ade80":"rgba(255,255,255,0.07)",color:tab===t?"#0a0f1e":"rgba(255,255,255,0.6)",fontWeight:tab===t?800:600,fontSize:13,cursor:"pointer",boxShadow:tab===t?"0 4px 12px rgba(74,222,128,0.3)":"none"}}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab==="overall"&&<div>
        <div style={C.card}>
          <span style={C.label}>🏆 Wins Leaderboard</span>
          {[...pStats].sort((a,b)=>b.wins-a.wins).map((ps,i)=>(
            <div key={ps.name} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,marginBottom:8,background:i===0?"rgba(74,222,128,0.1)":i===1?"rgba(148,163,184,0.07)":i===2?"rgba(251,146,60,0.07)":"rgba(255,255,255,0.03)",border:`1px solid ${i===0?"rgba(74,222,128,0.2)":i===1?"rgba(148,163,184,0.1)":i===2?"rgba(251,146,60,0.1)":"rgba(255,255,255,0.05)"}`}}>
              <span style={{fontSize:24}}>{MEDALS[i]||"🃏"}</span>
              <Avatar name={ps.name} idx={allPlayers.indexOf(ps.name)} size={38}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:15}}>{ps.name}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{ps.gamesPlayed} games · 🥈{ps.second} 🥉{ps.third}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:28,fontWeight:900,color:i===0?"#4ade80":i===1?"#94a3b8":"#fb923c"}}>{ps.wins}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>wins</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {label:"Best Game 🏅",val:loG?.score,sub:`${loG?.name} · ${loG?.date}`,c:"#4ade80"},
            {label:"Worst Game 💀",val:hiG?.score,sub:`${hiG?.name} · ${hiG?.date}`,c:"#f87171"},
            {label:"Best Round 🎯",val:loR?.score,sub:`${loR?.name} · Rd ${loR?.round}`,c:"#60a5fa"},
            {label:"Worst Round 🔥",val:hiR?.score,sub:`${hiR?.name} · Rd ${hiR?.round}`,c:"#fb923c"},
          ].map((rec,i)=>(
            <div key={i} style={{background:`rgba(${rec.c==="#4ade80"?"74,222,128":rec.c==="#f87171"?"248,113,113":rec.c==="#60a5fa"?"96,165,250":"251,146,60"},0.08)`,border:`1px solid ${rec.c}33`,borderRadius:16,padding:14}}>
              <div style={{fontSize:11,color:rec.c,fontWeight:700,marginBottom:6}}>{rec.label}</div>
              <div style={{fontSize:28,fontWeight:900,color:rec.c}}>{rec.val??"–"}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:4}}>{rec.sub}</div>
            </div>
          ))}
        </div>
      </div>}

      {tab==="players"&&<div>
        {[...pStats].sort((a,b)=>b.wins-a.wins).map((ps,rank)=>(
          <div key={ps.name} style={C.card}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <Avatar name={ps.name} idx={allPlayers.indexOf(ps.name)} size={50}/>
              <div>
                <div style={{fontWeight:800,fontSize:18}}>{ps.name}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{MEDALS[rank]||"🃏"} {ps.gamesPlayed} games played</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                {l:"Wins",v:ps.wins,c:"#4ade80"},
                {l:"Best Game",v:ps.bestGame??"–",c:"#a78bfa"},
                {l:"Avg Round Score",v:ps.avgRound,c:"#60a5fa"},
                {l:"Worst Round",v:ps.worstRound?`${ps.worstRound.score} (Rd ${ps.worstRound.round})`:"–",c:"#f87171"},
                {l:"Fav Round 🎯",v:`Round ${ps.favRound}`,c:"#fbbf24"},
                {l:"Avg Game Score",v:ps.avgGame,c:"#34d399"},
              ].map((s,j)=>(
                <div key={j} style={{background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"10px 12px"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>{s.l}</div>
                  <div style={{fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>}

      {tab==="rounds"&&<div>
        <span style={C.label}>Sorted by difficulty (avg points — higher = harder to go out)</span>
        {[...rStats].sort((a,b)=>b.total2-a.total2).map((r,i)=>(
          <div key={r.id} style={{...C.card,padding:"12px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontWeight:800}}>Round {r.id} <span style={{fontSize:11,color:"rgba(255,255,255,0.3)",fontWeight:400}}>#{i+1} hardest</span></span>
              <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{r.objective}</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.06)",borderRadius:8,height:10,overflow:"hidden",marginBottom:8}}>
              <div style={{height:10,borderRadius:8,width:`${maxT?(r.total2/maxT)*100:0}%`,background:"linear-gradient(90deg,#4ade80,#3b82f6)"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              {[{l:"Avg",v:r.avg,c:"#60a5fa"},{l:`Best · ${r.bestH||"–"}`,v:r.best??"–",c:"#4ade80"},{l:`Worst · ${r.worstH||"–"}`,v:r.worst??"–",c:"#f87171"}].map((s,j)=>(
                <div key={j} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:8,textAlign:"center"}}>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",fontWeight:700,textTransform:"uppercase",marginBottom:3}}>{s.l}</div>
                  <div style={{fontSize:16,fontWeight:900,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>}

      {tab==="history"&&<div>
        {[...finished].reverse().map((g,gi)=>{
          const ranked=[...g.players].sort((a,b)=>total(a)-total(b));
          return (
            <div key={g.id} style={C.card}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>{g.date}</span>
                <span style={{fontSize:12,fontWeight:700,color:"#4ade80"}}>Game #{finished.length-gi}</span>
              </div>
              {ranked.map((p,i)=>(
                <div key={p.name} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,marginBottom:6,background:i===0?"rgba(74,222,128,0.1)":"rgba(255,255,255,0.03)",border:i===0?"1px solid rgba(74,222,128,0.2)":"1px solid rgba(255,255,255,0.05)"}}>
                  <span style={{fontSize:18}}>{MEDALS[i]||""}</span>
                  <Avatar name={p.name} idx={g.players.findIndex(x=>x.name===p.name)} size={32}/>
                  <span style={{flex:1,fontWeight:700,fontSize:14}}>{p.name}</span>
                  <span style={{fontWeight:900,fontSize:18,color:i===0?"#4ade80":"rgba(255,255,255,0.6)"}}>{total(p)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>}
    </div>
  );
}

// ── Rules ─────────────────────────────────────────────────────────────────────
function RulesPage() {
  return (
    <div>
      <div style={{fontSize:22,fontWeight:900,marginBottom:16}}>Rules</div>
      <div style={C.gcard}>
        <div style={{fontWeight:800,fontSize:15,color:"#4ade80",marginBottom:6}}>🎯 Objective</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,0.8)",lineHeight:1.6}}>Have the <strong>lowest score</strong> after all 10 rounds. Points are bad — go out fast!</div>
      </div>
      <div style={C.card}>
        <div style={{fontWeight:800,fontSize:15,color:"#60a5fa",marginBottom:10}}>🃏 Card Values</div>
        {[["2–10","5 pts"],["J, Q, K","10 pts"],["Ace","15 pts"],["Joker","25 pts (wild)"]].map(([c,v])=>(
          <div key={c} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <span style={{fontWeight:700}}>{c}</span><span style={{color:"#60a5fa",fontWeight:700}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={C.card}>
        <div style={{fontWeight:800,fontSize:15,color:"#fb923c",marginBottom:10}}>🛒 Buying</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,0.7)",lineHeight:1.6}}>When it's not your turn you may "buy" the top discard. You draw 2 extra cards as a penalty. Each round has a limited number of buys per player.</div>
      </div>
      <div style={C.card}>
        <div style={{fontWeight:800,fontSize:15,color:"#a78bfa",marginBottom:12}}>📋 The 10 Rounds</div>
        {ROUNDS.map(r=>(
          <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{width:34,height:34,borderRadius:10,background:"rgba(167,139,250,0.15)",border:"1px solid rgba(167,139,250,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#a78bfa",flexShrink:0}}>{r.id}</div>
            <div>
              <div style={{fontWeight:700,fontSize:13}}>{r.objective}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2}}>{r.cards} cards · {r.buys} {r.buys===1?"buy":"buys"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("games");
  const [games, setGames] = useState([]);
  const [activeGameId, setActiveGameId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchGames = useCallback(async () => {
    const { data } = await supabase.from("games").select("*").order("created_at",{ascending:false});
    if (data) setGames(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGames();
    const ch = supabase.channel("games-rt")
      .on("postgres_changes",{event:"*",schema:"public",table:"games"},fetchGames)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetchGames]);

  const activeGame = games.find(g=>g.id===activeGameId)||null;

  async function startGame(players) {
    const { data } = await supabase.from("games").insert([newGameObj(players)]).select().single();
    if (data) { setActiveGameId(data.id); setPage("play"); }
  }
  async function updateScores(scores, currentRound) {
    const players = activeGame.players.map((p,i)=>({...p,scores:scores[i]}));
    await supabase.from("games").update({players,current_round:currentRound}).eq("id",activeGameId);
  }
  async function finalizeGame() {
    await supabase.from("games").update({complete:true}).eq("id",activeGameId);
    setActiveGameId(null); setPage("stats");
  }
  async function deleteGame(id) {
    await supabase.from("games").delete().eq("id",id);
    if (activeGameId===id) setActiveGameId(null);
    setConfirmDelete(null);
  }

  const inProgress = games.filter(g=>!g.complete);
  const finished = games.filter(g=>g.complete);

  if (loading) return (
    <div style={{...C.page,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:52,marginBottom:12}}>🃏</div><div style={{color:"#4ade80",fontWeight:700,fontSize:18}}>Loading…</div></div>
    </div>
  );

  return (
    <div style={C.page}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0d3320,#1a5c38)",padding:"20px 16px 0",boxShadow:"0 4px 30px rgba(0,0,0,0.5)",borderBottom:"1px solid rgba(74,222,128,0.15)"}}>
        <div style={{maxWidth:500,margin:"0 auto"}}>
          <div style={{textAlign:"center",paddingBottom:16}}>
            <div style={{fontSize:26,fontWeight:900,letterSpacing:-0.5}}>🃏 Shanghai Rummy</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2,letterSpacing:1}}>SCORE TRACKER</div>
          </div>
          <div style={{display:"flex",gap:2}}>
            {["games","play","stats","rules"].map(t=>(
              <button key={t} onClick={()=>setPage(t)} style={{flex:1,padding:"11px 4px",background:page===t?"rgba(255,255,255,0.1)":"transparent",border:"none",borderBottom:page===t?"3px solid #4ade80":"3px solid transparent",color:page===t?"#fff":"rgba(255,255,255,0.45)",fontWeight:page===t?800:500,fontSize:13,cursor:"pointer",borderRadius:"6px 6px 0 0",transition:"all 0.2s"}}>
                {t==="play"?"▶ Play":t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:500,margin:"0 auto",padding:"20px 14px"}}>

        {/* ── GAMES ── */}
        {page==="games"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:22,fontWeight:900}}>Games</div>
              <button onClick={()=>{setActiveGameId(null);setPage("play");}} style={{background:"linear-gradient(135deg,#4ade80,#16a34a)",color:"#0a0f1e",border:"none",borderRadius:14,padding:"12px 20px",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 4px 15px rgba(74,222,128,0.3)"}}>+ New Game</button>
            </div>

            {inProgress.length>0&&<>
              <span style={C.label}>⏳ In Progress</span>
              {inProgress.map(g=>(
                <div key={g.id} style={{...C.card,border:"1px solid rgba(74,222,128,0.2)",position:"relative"}}>
                  <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{g.players.map(p=>p.name).join(", ")}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginBottom:12}}>{g.date} · Round {g.current_round+1} of 10</div>
                  <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                    {g.players.map((p,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"6px 10px",display:"flex",alignItems:"center",gap:6}}>
                        <Avatar name={p.name} idx={i} size={24}/><span style={{fontSize:13,fontWeight:700,color:"#4ade80"}}>{total(p)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setActiveGameId(g.id);setPage("play");}} style={{flex:1,background:"linear-gradient(135deg,#4ade80,#16a34a)",color:"#0a0f1e",border:"none",borderRadius:12,padding:12,fontWeight:800,fontSize:14,cursor:"pointer"}}>Resume →</button>
                    <button onClick={()=>setConfirmDelete(g.id)} style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#f87171",borderRadius:12,padding:"12px 16px",fontWeight:700,fontSize:16,cursor:"pointer"}}>🗑️</button>
                  </div>
                  {confirmDelete===g.id&&(
                    <div style={{position:"absolute",inset:0,borderRadius:20,background:"rgba(10,15,30,0.97)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,padding:24}}>
                      <div style={{fontSize:36}}>🗑️</div>
                      <div style={{fontWeight:800,fontSize:17,textAlign:"center"}}>Delete this game?</div>
                      <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",textAlign:"center"}}>This can't be undone</div>
                      <div style={{display:"flex",gap:10,width:"100%"}}>
                        <button onClick={()=>setConfirmDelete(null)} style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:12,padding:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
                        <button onClick={()=>deleteGame(g.id)} style={{flex:1,background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"none",color:"#fff",borderRadius:12,padding:13,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 15px rgba(239,68,68,0.3)"}}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>}

            {finished.length>0&&<>
              <span style={{...C.label,marginTop:8}}>✅ Completed</span>
              {finished.map(g=>{
                const w=gameWinner(g);
                const ranked=[...g.players].sort((a,b)=>total(a)-total(b));
                return (
                  <div key={g.id} style={C.card}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <span style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>{g.date}</span>
                      <span style={{fontSize:12,fontWeight:700,color:"#4ade80"}}>🏆 {w.name}</span>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {ranked.map((p,i)=>(
                        <div key={i} style={{background:i===0?"rgba(74,222,128,0.12)":"rgba(255,255,255,0.04)",border:i===0?"1px solid rgba(74,222,128,0.25)":"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"6px 10px",display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:14}}>{MEDALS[i]||""}</span>
                          <Avatar name={p.name} idx={g.players.findIndex(x=>x.name===p.name)} size={22}/>
                          <span style={{fontSize:13,fontWeight:700,color:i===0?"#4ade80":"rgba(255,255,255,0.7)"}}>{p.name}</span>
                          <span style={{fontSize:13,fontWeight:900,color:i===0?"#4ade80":"rgba(255,255,255,0.5)"}}>{total(p)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>}

            {games.length===0&&(
              <div style={{textAlign:"center",padding:"60px 20px",color:"rgba(255,255,255,0.3)"}}>
                <div style={{fontSize:52,marginBottom:12}}>🃏</div>
                <div style={{fontWeight:700,fontSize:16}}>No games yet</div>
                <div style={{fontSize:13,marginTop:4}}>Tap + New Game to get started</div>
              </div>
            )}
          </div>
        )}

        {/* ── PLAY ── */}
        {page==="play"&&(activeGame
          ? <Scorecard game={activeGame} onUpdate={updateScores} onFinish={finalizeGame}/>
          : <SetupPage onStart={startGame}/>
        )}

        {/* ── STATS ── */}
        {page==="stats"&&<StatsPage games={games}/>}

        {/* ── RULES ── */}
        {page==="rules"&&<RulesPage/>}
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,15,30,0.96)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",padding:"8px 0 14px",boxShadow:"0 -4px 30px rgba(0,0,0,0.4)"}}>
        {[["games","🎮","Games"],["play","▶️","Play"],["stats","📊","Stats"],["rules","📋","Rules"]].map(([p,emoji,label])=>(
          <button key={p} onClick={()=>setPage(p)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:page===p?"#4ade80":"rgba(255,255,255,0.35)",transition:"all 0.2s"}}>
            <span style={{fontSize:22}}>{emoji}</span>
            <span style={{fontSize:10,fontWeight:page===p?800:600,letterSpacing:0.5}}>{label}</span>
            {page===p&&<div style={{width:4,height:4,borderRadius:"50%",background:"#4ade80",marginTop:1}}/>}
          </button>
        ))}
      </div>
    </div>
  );
}