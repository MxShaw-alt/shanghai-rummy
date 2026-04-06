import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ── PASTE YOUR SUPABASE CREDENTIALS HERE ─────────────────────────────────────
const SUPABASE_URL = "https://wxfhkoqovwljacpzrqzh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4Zmhrb3FvdndsamFjcHpycXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTIxNTQsImV4cCI6MjA5MTA4ODE1NH0.nKAh--ybnTVQ_OVb_uVFBraBN40zMGB48CMyDe5Z7yc";
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROUNDS = [
  { id: 1,  cards: 10, buys: 0, objective: "2 Sets of 3" },
  { id: 2,  cards: 11, buys: 0, objective: "1 Set of 3 + 1 Run of 4" },
  { id: 3,  cards: 12, buys: 0, objective: "2 Runs of 4" },
  { id: 4,  cards: 12, buys: 1, objective: "3 Sets of 3" },
  { id: 5,  cards: 13, buys: 2, objective: "1 Set of 3 + 1 Run of 7" },
  { id: 6,  cards: 13, buys: 2, objective: "2 Sets of 3 + 1 Run of 5" },
  { id: 7,  cards: 13, buys: 2, objective: "3 Runs of 4" },
  { id: 8,  cards: 14, buys: 3, objective: "1 Set of 3 + 1 Run of 10" },
  { id: 9,  cards: 14, buys: 3, objective: "3 Sets of 3 + 1 Run of 5" },
  { id: 10, cards: 14, buys: 3, objective: "3 Runs of 5" },
];

// ── helpers ───────────────────────────────────────────────────────────────────
function newGameObj(players) {
  return {
    date: new Date().toLocaleDateString(),
    complete: false,
    current_round: 0,
    players: players.map(name => ({ name, scores: Array(10).fill("") })),
  };
}
function totals(game) {
  return game.players.map(p => ({
    name: p.name,
    total: p.scores.reduce((s, v) => s + (parseInt(v) || 0), 0),
  }));
}
function winner(game) {
  const t = totals(game);
  return t.reduce((a, b) => (a.total <= b.total ? a : b));
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick}
    className={`px-4 py-2 font-semibold rounded-t-lg transition-colors text-sm ${
      active ? "bg-white text-indigo-700 border-b-2 border-indigo-700"
              : "bg-indigo-100 text-indigo-400 hover:bg-indigo-200"}`}>
    {label}
  </button>
);

// ── Setup ─────────────────────────────────────────────────────────────────────
function SetupPage({ onStart }) {
  const [names, setNames] = useState(["", ""]);
  const valid = names.every(n => n.trim()) &&
    new Set(names.map(n => n.trim())).size === names.length;

  return (
    <div className="max-w-md mx-auto mt-4">
      <h2 className="text-2xl font-bold text-indigo-700 mb-1">New Game</h2>
      <p className="text-gray-500 text-sm mb-5">Add 2–8 players to get started.</p>
      <div className="space-y-2 mb-4">
        {names.map((n, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder={`Player ${i + 1} name`}
              value={n}
              onChange={e => { const c=[...names]; c[i]=e.target.value; setNames(c); }}
            />
            {names.length > 2 && (
              <button onClick={() => setNames(names.filter((_,j)=>j!==i))}
                className="text-red-400 hover:text-red-600 text-lg px-2">✕</button>
            )}
          </div>
        ))}
      </div>
      {names.length < 8 && (
        <button onClick={() => setNames([...names,""])}
          className="text-indigo-500 text-sm hover:underline mb-4 block">+ Add player</button>
      )}
      <button disabled={!valid} onClick={() => onStart(names.map(n=>n.trim()))}
        className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-40 hover:bg-indigo-700 transition">
        Start Game
      </button>
    </div>
  );
}

// ── Scorecard ─────────────────────────────────────────────────────────────────
function Scorecard({ game, onUpdate, onFinish }) {
  const [inputs, setInputs] = useState(game.players.map(p=>[...p.scores]));
  const [activeRound, setActiveRound] = useState(game.current_round);
  const [saving, setSaving] = useState(false);

  const roundTotal = pIdx => inputs[pIdx].reduce((s,v)=>s+(parseInt(v)||0),0);

  const handleChange = async (pIdx, rIdx, val) => {
    const cp = inputs.map(r=>[...r]);
    cp[pIdx][rIdx] = val==="" ? "" : String(parseInt(val)||0);
    setInputs(cp);
    setSaving(true);
    await onUpdate(cp, Math.max(game.current_round, rIdx));
    setSaving(false);
  };

  const r = ROUNDS[activeRound];
  const allFilled = inputs.every(p => p[activeRound] !== "");
  const allDone = inputs.every(p => ROUNDS.every((_,i) => p[i] !== ""));

  return (
    <div>
      {saving && <div className="text-xs text-indigo-400 text-right mb-1 animate-pulse">Saving…</div>}

      {/* Round pills */}
      <div className="flex gap-1 flex-wrap mb-4">
        {ROUNDS.map((rnd,i) => {
          const done = inputs.every(p=>p[i]!=="");
          return (
            <button key={i} onClick={()=>setActiveRound(i)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition ${
                i===activeRound ? "bg-indigo-600 text-white"
                : done ? "bg-green-100 text-green-700 border border-green-400"
                : "bg-gray-100 text-gray-500"}`}>
              {i+1}
            </button>
          );
        })}
      </div>

      {/* Round info */}
      <div className="bg-indigo-50 rounded-xl p-3 mb-4 text-sm text-indigo-800 flex flex-wrap gap-4">
        <span><strong>Round {r.id}</strong>: {r.objective}</span>
        <span>🃏 {r.cards} cards</span>
        <span>🛒 {r.buys} {r.buys===1?"buy":"buys"}</span>
      </div>

      {/* Score inputs */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Player</th>
              <th className="px-3 py-2 font-semibold text-gray-600">Score</th>
              <th className="px-3 py-2 font-semibold text-gray-600">Running Total</th>
            </tr>
          </thead>
          <tbody>
            {game.players.map((p,pIdx)=>(
              <tr key={pIdx} className="border-t">
                <td className="px-3 py-2 font-medium">{p.name}</td>
                <td className="px-3 py-2">
                  <input type="number" min="0"
                    className="w-20 border rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={inputs[pIdx][activeRound]}
                    onChange={e=>handleChange(pIdx,activeRound,e.target.value)}
                    placeholder="0" />
                </td>
                <td className="px-3 py-2 text-center font-mono font-semibold text-indigo-700">
                  {roundTotal(pIdx)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* All rounds table */}
      <div className="mt-6">
        <h3 className="font-semibold text-gray-600 text-sm mb-2">All Rounds</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-2 py-1 font-semibold text-gray-500">Player</th>
                {ROUNDS.map(rnd=>(
                  <th key={rnd.id} className="px-2 py-1 text-gray-500">R{rnd.id}</th>
                ))}
                <th className="px-2 py-1 font-bold text-indigo-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {game.players.map((p,pIdx)=>(
                <tr key={pIdx} className="border-t">
                  <td className="px-2 py-1 font-medium truncate max-w-16">{p.name}</td>
                  {inputs[pIdx].map((s,rIdx)=>(
                    <td key={rIdx} className={`px-2 py-1 text-center ${rIdx===activeRound?"bg-indigo-50 font-bold":""}`}>
                      {s===""?"–":s}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-center font-bold text-indigo-700">{roundTotal(pIdx)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {allFilled && activeRound < 9 && (
        <button onClick={()=>setActiveRound(activeRound+1)}
          className="mt-4 w-full py-2 rounded-xl bg-indigo-100 text-indigo-700 font-semibold hover:bg-indigo-200 transition">
          Next Round →
        </button>
      )}
      {allDone && (
        <button onClick={onFinish}
          className="mt-3 w-full py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition">
          ✓ Finalize Game
        </button>
      )}
    </div>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const MEDALS = ["🥇","🥈","🥉"];
const PLACE_COLORS = ["text-yellow-500","text-gray-400","text-orange-400"];
const PLACE_BG = ["bg-yellow-50","bg-gray-50","bg-orange-50"];

function StatsPage({ games }) {
  const [activeTab, setActiveTab] = useState("overall");
  const finished = games.filter(g=>g.complete);
  if (!finished.length) return <p className="text-gray-400 mt-8 text-center">No completed games yet.</p>;

  const allPlayers = [...new Set(finished.flatMap(g=>g.players.map(p=>p.name)))].sort();

  // ── per-player aggregates ──
  const playerStats = allPlayers.map(name => {
    const myGames = finished.filter(g=>g.players.some(p=>p.name===name));
    const gameTotals = myGames.map(g=>{
      const p = g.players.find(p=>p.name===name);
      return p ? p.scores.reduce((s,v)=>s+(parseInt(v)||0),0) : null;
    }).filter(v=>v!==null);

    // placements per game
    const placements = myGames.map(g=>{
      const ranked = totals(g).sort((a,b)=>a.total-b.total);
      return ranked.findIndex(t=>t.name===name); // 0=1st
    });

    const wins   = placements.filter(p=>p===0).length;
    const second = placements.filter(p=>p===1).length;
    const third  = placements.filter(p=>p===2).length;

    const bestRoundScore = (() => {
      let best=null;
      myGames.forEach(g=>{
        const p=g.players.find(p=>p.name===name);
        if(!p) return;
        p.scores.forEach((s,rIdx)=>{
          const v=parseInt(s);
          if(!isNaN(v)&&(best===null||v<best.score)) best={score:v,round:rIdx+1,date:g.date};
        });
      });
      return best;
    })();

    const worstRoundScore = (() => {
      let worst=null;
      myGames.forEach(g=>{
        const p=g.players.find(p=>p.name===name);
        if(!p) return;
        p.scores.forEach((s,rIdx)=>{
          const v=parseInt(s);
          if(!isNaN(v)&&(worst===null||v>worst.score)) worst={score:v,round:rIdx+1,date:g.date};
        });
      });
      return worst;
    })();

    const avgGame = gameTotals.length ? (gameTotals.reduce((a,b)=>a+b,0)/gameTotals.length).toFixed(0) : "–";
    const bestGame = gameTotals.length ? Math.min(...gameTotals) : null;
    const worstGame = gameTotals.length ? Math.max(...gameTotals) : null;

    // per-round averages
    const roundAvgs = ROUNDS.map((_,rIdx)=>{
      const vals=myGames.map(g=>{
        const p=g.players.find(p=>p.name===name);
        return p ? parseInt(p.scores[rIdx]) : NaN;
      }).filter(v=>!isNaN(v));
      return vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):"–";
    });

    return { name, wins, second, third, gamesPlayed:myGames.length, avgGame, bestGame, worstGame,
             bestRoundScore, worstRoundScore, roundAvgs, gameTotals };
  });

  // ── round difficulty ──
  const roundAvgAll = ROUNDS.map((rnd,rIdx)=>{
    const vals=[];
    finished.forEach(g=>g.players.forEach(p=>{ const v=parseInt(p.scores[rIdx]); if(!isNaN(v)) vals.push(v); }));
    const avg=vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):"–";
    const best = vals.length?Math.min(...vals):null;
    const worst = vals.length?Math.max(...vals):null;
    // find who scored best/worst
    let bestHolder=null, worstHolder=null;
    finished.forEach(g=>g.players.forEach(p=>{
      const v=parseInt(p.scores[rIdx]);
      if(!isNaN(v)){
        if(v===best&&!bestHolder) bestHolder=p.name;
        if(v===worst&&!worstHolder) worstHolder=p.name;
      }
    }));
    return { ...rnd, avg, total:vals.reduce((a,b)=>a+b,0), best, worst, bestHolder, worstHolder };
  });
  const maxT = Math.max(...roundAvgAll.map(r=>r.total));

  // ── overall records ──
  let highRound=null, lowRound=null, highGame=null, lowGame=null;
  finished.forEach(g=>{
    g.players.forEach(p=>{
      p.scores.forEach((s,rIdx)=>{
        const v=parseInt(s);
        if(!isNaN(v)){
          if(!highRound||v>highRound.score) highRound={score:v,name:p.name,round:rIdx+1,date:g.date};
          if(!lowRound||v<lowRound.score) lowRound={score:v,name:p.name,round:rIdx+1,date:g.date};
        }
      });
    });
    totals(g).forEach(t=>{
      if(!highGame||t.total>highGame.score) highGame={score:t.total,name:t.name,date:g.date};
      if(!lowGame||t.total<lowGame.score) lowGame={score:t.total,name:t.name,date:g.date};
    });
  });

  const subTabs = ["overall","players","rounds","history"];

  return (
    <div className="space-y-4">
      {/* sub-tabs */}
      <div className="flex gap-1 flex-wrap">
        {subTabs.map(t=>(
          <button key={t} onClick={()=>setActiveTab(t)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              activeTab===t?"bg-indigo-600 text-white":"bg-indigo-100 text-indigo-500 hover:bg-indigo-200"}`}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── OVERALL ── */}
      {activeTab==="overall" && (
        <div className="space-y-4">
          {/* Wins leaderboard */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="font-bold text-indigo-700 text-base mb-3">🏆 Wins Leaderboard</h3>
            <div className="space-y-2">
              {[...playerStats].sort((a,b)=>b.wins-a.wins).map((ps,i)=>(
                <div key={ps.name} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${i<3?PLACE_BG[i]:"bg-gray-50"}`}>
                  <span className="text-lg w-6 text-center">{i<3?MEDALS[i]:<span className="text-gray-400 text-sm font-bold">{i+1}</span>}</span>
                  <span className="flex-1 font-semibold text-gray-700">{ps.name}</span>
                  <span className={`font-bold text-lg ${i<3?PLACE_COLORS[i]:"text-gray-500"}`}>{ps.wins}</span>
                  <span className="text-xs text-gray-400">wins / {ps.gamesPlayed} games</span>
                </div>
              ))}
            </div>
          </div>

          {/* Podium finishes */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="font-bold text-indigo-700 text-base mb-3">🎖️ Podium Finishes</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs text-gray-400">
                <th className="text-left py-1 pb-2">Player</th>
                <th className="text-center py-1 pb-2">🥇</th>
                <th className="text-center py-1 pb-2">🥈</th>
                <th className="text-center py-1 pb-2">🥉</th>
                <th className="text-right py-1 pb-2">Avg Score</th>
              </tr></thead>
              <tbody>
                {[...playerStats].sort((a,b)=>b.wins-a.wins||a.second-b.second).map(ps=>(
                  <tr key={ps.name} className="border-b last:border-0">
                    <td className="py-1.5 font-medium">{ps.name}</td>
                    <td className="py-1.5 text-center font-bold text-yellow-500">{ps.wins}</td>
                    <td className="py-1.5 text-center font-bold text-gray-400">{ps.second}</td>
                    <td className="py-1.5 text-center font-bold text-orange-400">{ps.third}</td>
                    <td className="py-1.5 text-right text-indigo-600 font-mono">{ps.avgGame}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Records */}
          <div className="grid grid-cols-2 gap-3">
            {lowGame&&<div className="bg-green-50 rounded-2xl p-3 shadow">
              <div className="text-xs text-green-500 font-semibold uppercase mb-1">Best Game Ever</div>
              <div className="text-2xl font-bold text-green-600">{lowGame.score}</div>
              <div className="text-sm text-gray-600">{lowGame.name}</div>
              <div className="text-xs text-gray-400">{lowGame.date}</div>
            </div>}
            {highGame&&<div className="bg-red-50 rounded-2xl p-3 shadow">
              <div className="text-xs text-red-400 font-semibold uppercase mb-1">Worst Game Ever</div>
              <div className="text-2xl font-bold text-red-500">{highGame.score}</div>
              <div className="text-sm text-gray-600">{highGame.name}</div>
              <div className="text-xs text-gray-400">{highGame.date}</div>
            </div>}
            {lowRound&&<div className="bg-blue-50 rounded-2xl p-3 shadow">
              <div className="text-xs text-blue-400 font-semibold uppercase mb-1">Best Single Round</div>
              <div className="text-2xl font-bold text-blue-600">{lowRound.score}</div>
              <div className="text-sm text-gray-600">{lowRound.name} · Rd {lowRound.round}</div>
              <div className="text-xs text-gray-400">{lowRound.date}</div>
            </div>}
            {highRound&&<div className="bg-orange-50 rounded-2xl p-3 shadow">
              <div className="text-xs text-orange-400 font-semibold uppercase mb-1">Worst Single Round</div>
              <div className="text-2xl font-bold text-orange-500">{highRound.score}</div>
              <div className="text-sm text-gray-600">{highRound.name} · Rd {highRound.round}</div>
              <div className="text-xs text-gray-400">{highRound.date}</div>
            </div>}
          </div>
        </div>
      )}

      {/* ── PLAYERS ── */}
      {activeTab==="players" && (
        <div className="space-y-4">
          {[...playerStats].sort((a,b)=>b.wins-a.wins).map((ps,rank)=>(
            <div key={ps.name} className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{rank<3?MEDALS[rank]:"🃏"}</span>
                <h3 className="font-bold text-indigo-700 text-base">{ps.name}</h3>
                <span className="ml-auto text-xs text-gray-400">{ps.gamesPlayed} games</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-yellow-50 rounded-xl p-2 text-center">
                  <div className="text-xs text-yellow-500 font-semibold">Wins</div>
                  <div className="text-xl font-bold text-yellow-600">{ps.wins}</div>
                </div>
                <div className="bg-green-50 rounded-xl p-2 text-center">
                  <div className="text-xs text-green-500 font-semibold">Best Game</div>
                  <div className="text-xl font-bold text-green-600">{ps.bestGame??'–'}</div>
                </div>
                <div className="bg-indigo-50 rounded-xl p-2 text-center">
                  <div className="text-xs text-indigo-400 font-semibold">Avg Game</div>
                  <div className="text-xl font-bold text-indigo-600">{ps.avgGame}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-blue-50 rounded-lg p-2">
                  <span className="text-blue-400 font-semibold">Best Round: </span>
                  <span className="font-bold text-blue-700">{ps.bestRoundScore?`${ps.bestRoundScore.score} (Rd ${ps.bestRoundScore.round})`:"–"}</span>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <span className="text-red-400 font-semibold">Worst Round: </span>
                  <span className="font-bold text-red-600">{ps.worstRoundScore?`${ps.worstRoundScore.score} (Rd ${ps.worstRoundScore.round})`:"–"}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-400 font-semibold">🥈 Seconds: </span>
                  <span className="font-bold">{ps.second}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-400 font-semibold">🥉 Thirds: </span>
                  <span className="font-bold">{ps.third}</span>
                </div>
              </div>
              {/* per-round avg bar */}
              <div className="text-xs text-gray-400 font-semibold mb-1">Avg score per round</div>
              <div className="flex gap-0.5">
                {ps.roundAvgs.map((avg,i)=>{
                  const numAvg=parseFloat(avg)||0;
                  const maxAvg=Math.max(...ps.roundAvgs.map(v=>parseFloat(v)||0));
                  const h=maxAvg?Math.round((numAvg/maxAvg)*32):0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full flex items-end justify-center" style={{height:36}}>
                        <div className="w-full rounded-t" style={{height:h||2,background:"#818cf8"}}/>
                      </div>
                      <span className="text-gray-400" style={{fontSize:9}}>{i+1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ROUNDS ── */}
      {activeTab==="rounds" && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="font-bold text-indigo-700 text-base mb-3">📊 Round Difficulty Ranking</h3>
            <p className="text-xs text-gray-400 mb-3">Sorted by average points scored — higher means harder to go out.</p>
            <div className="space-y-2">
              {[...roundAvgAll].sort((a,b)=>b.total-a.total).map((r,i)=>(
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-5 text-center font-bold ${i===0?"text-red-500":i===1?"text-orange-400":i===2?"text-yellow-500":"text-gray-400"}`}>{i+1}</span>
                  <span className="w-6 text-gray-500 shrink-0 font-bold">R{r.id}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="h-3 rounded-full bg-indigo-400 transition-all" style={{width:`${maxT?(r.total/maxT)*100:0}%`}}/>
                  </div>
                  <span className="w-8 text-right font-mono font-bold text-gray-700">{r.avg}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {roundAvgAll.map(r=>(
              <div key={r.id} className="bg-white rounded-2xl shadow p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-indigo-700 text-sm">Round {r.id}</span>
                  <span className="text-xs text-gray-400">{r.objective}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-indigo-50 rounded-lg p-1.5 text-center">
                    <div className="text-indigo-400 font-semibold">Avg</div>
                    <div className="font-bold text-indigo-700">{r.avg}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-1.5 text-center">
                    <div className="text-green-500 font-semibold">Best</div>
                    <div className="font-bold text-green-700">{r.best??'–'}</div>
                    <div className="text-gray-400 truncate">{r.bestHolder}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-1.5 text-center">
                    <div className="text-red-400 font-semibold">Worst</div>
                    <div className="font-bold text-red-600">{r.worst??'–'}</div>
                    <div className="text-gray-400 truncate">{r.worstHolder}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {activeTab==="history" && (
        <div className="space-y-3">
          {[...finished].reverse().map((g,gi)=>{
            const ranked=totals(g).sort((a,b)=>a.total-b.total);
            return (
              <div key={g.id} className="bg-white rounded-2xl shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">{g.date}</span>
                  <span className="text-xs font-bold text-indigo-500">Game #{finished.length-gi}</span>
                </div>
                <div className="space-y-1">
                  {ranked.map((p,i)=>(
                    <div key={p.name} className={`flex items-center gap-2 rounded-lg px-2 py-1 ${i<3?PLACE_BG[i]:"bg-gray-50"}`}>
                      <span className="text-base w-6 text-center">{i<3?MEDALS[i]:<span className="text-xs text-gray-400 font-bold">{i+1}</span>}</span>
                      <span className="flex-1 text-sm font-medium text-gray-700">{p.name}</span>
                      <span className={`font-bold text-sm ${i<3?PLACE_COLORS[i]:"text-gray-500"}`}>{p.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Rules ─────────────────────────────────────────────────────────────────────
function RulesPage() {
  return (
    <div className="bg-white rounded-2xl shadow p-5 space-y-4 text-sm text-gray-700">
      <h2 className="text-xl font-bold text-indigo-700">Shanghai Rummy – Rules</h2>
      <p><strong>Objective:</strong> Have the lowest score after all 10 rounds. Points are bad!</p>
      <div>
        <h3 className="font-bold text-indigo-600 mb-1">Card Values</h3>
        <ul className="list-disc list-inside space-y-0.5">
          <li>2–10: 5 pts</li>
          <li>J, Q, K: 10 pts</li>
          <li>Ace: 15 pts</li>
          <li>Joker: 25 pts</li>
        </ul>
      </div>
      <div>
        <h3 className="font-bold text-indigo-600 mb-1">Buying</h3>
        <p>When it's not your turn, you may "buy" the discard at the cost of drawing 2 extra cards. Each round has a limited number of buys per player.</p>
      </div>
      <div>
        <h3 className="font-bold text-indigo-600 mb-2">The 10 Rounds</h3>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-indigo-50">
              <th className="px-2 py-1 text-left">Rd</th>
              <th className="px-2 py-1 text-left">Cards</th>
              <th className="px-2 py-1 text-left">Buys</th>
              <th className="px-2 py-1 text-left">Objective</th>
            </tr>
          </thead>
          <tbody>
            {ROUNDS.map(r=>(
              <tr key={r.id} className="border-t">
                <td className="px-2 py-1 font-bold text-indigo-600">{r.id}</td>
                <td className="px-2 py-1">{r.cards}</td>
                <td className="px-2 py-1">{r.buys}</td>
                <td className="px-2 py-1">{r.objective}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-gray-500 text-xs">Runs must be in the same suit. Sets are matching ranks (any suit). Jokers are wild.</p>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("games");
  const [games, setGames] = useState([]);
  const [activeGameId, setActiveGameId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    const { data } = await supabase.from("games").select("*").order("created_at", { ascending: false });
    if (data) setGames(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGames();
    // Real-time subscription
    const channel = supabase
      .channel("games-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "games" }, fetchGames)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchGames]);

  const activeGame = games.find(g => g.id === activeGameId) || null;

  async function startGame(players) {
    const obj = newGameObj(players);
    const { data } = await supabase.from("games").insert([obj]).select().single();
    if (data) { setActiveGameId(data.id); setPage("play"); }
  }

  async function updateScores(scores, currentRound) {
    const players = activeGame.players.map((p, i) => ({ ...p, scores: scores[i] }));
    await supabase.from("games").update({ players, current_round: currentRound }).eq("id", activeGameId);
  }

  async function finalizeGame() {
    await supabase.from("games").update({ complete: true }).eq("id", activeGameId);
    setActiveGameId(null);
    setPage("stats");
  }

  const inProgress = games.filter(g => !g.complete);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-indigo-400 text-lg animate-pulse">Loading…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="pt-6 pb-2 text-center">
          <h1 className="text-3xl font-extrabold text-indigo-700 tracking-tight">🃏 Shanghai Rummy</h1>
          <p className="text-indigo-400 text-sm">Score Tracker</p>
        </div>

        <div className="flex gap-1 mt-4 border-b border-gray-200">
          {["games","play","stats","rules"].map(t=>(
            <Tab key={t} label={t==="play"?"▶ Play":t.charAt(0).toUpperCase()+t.slice(1)} active={page===t} onClick={()=>setPage(t)}/>
          ))}
        </div>

        <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow p-5">
          {page==="games" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg text-gray-700">Games</h2>
                <button onClick={()=>{ setActiveGameId(null); setPage("play"); }}
                  className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-xl hover:bg-indigo-700 transition font-semibold">
                  + New Game
                </button>
              </div>
              {inProgress.length>0&&(
                <div className="mb-4">
                  <h3 className="text-xs text-gray-400 font-semibold uppercase mb-2">In Progress</h3>
                  {inProgress.map(g=>(
                    <button key={g.id} onClick={()=>{ setActiveGameId(g.id); setPage("play"); }}
                      className="w-full text-left border rounded-xl p-3 mb-2 hover:bg-indigo-50 transition text-sm">
                      <div className="font-semibold text-indigo-700">{g.players.map(p=>p.name).join(", ")}</div>
                      <div className="text-gray-400 text-xs">{g.date} · Round {g.current_round+1}</div>
                    </button>
                  ))}
                </div>
              )}
              {games.filter(g=>g.complete).length>0&&(
                <div>
                  <h3 className="text-xs text-gray-400 font-semibold uppercase mb-2">Completed</h3>
                  {games.filter(g=>g.complete).map(g=>{
                    const w=winner(g);
                    return (
                      <div key={g.id} className="border rounded-xl p-3 mb-2 text-sm">
                        <div className="font-semibold text-gray-700">{g.players.map(p=>p.name).join(", ")}</div>
                        <div className="text-xs text-gray-400">{g.date} · 🏆 {w.name} ({w.total} pts)</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {games.length===0&&<p className="text-gray-400 text-sm text-center py-6">No games yet. Start one!</p>}
            </div>
          )}
          {page==="play"&&(
            activeGame
              ? <Scorecard game={activeGame} onUpdate={updateScores} onFinish={finalizeGame}/>
              : <SetupPage onStart={startGame}/>
          )}
          {page==="stats"&&<StatsPage games={games}/>}
          {page==="rules"&&<RulesPage/>}
        </div>
      </div>
    </div>
  );
}