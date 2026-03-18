import { useState, useEffect, useRef, useCallback } from "react";

// ── Helpers ──────────────────────────────────────────
function formatTime(ms) {
  const min  = Math.floor(ms / 60000);
  const sec  = Math.floor((ms / 1000) % 60);
  const cent = Math.floor((ms % 1000) / 10);
  const pad  = (n) => String(n).padStart(2, "0");
  return { main: `${pad(min)}:${pad(sec)}`, ms: pad(cent), full: `${pad(min)}:${pad(sec)}:${pad(cent)}` };
}
function toMs(str) {
  const [m, s, c] = str.split(":").map(Number);
  return m * 60000 + s * 1000 + c * 10;
}

// ── Shared styles injected once ───────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; height: 100%; overflow: hidden; background: #05050a; }
  @keyframes carZoom  { from{left:-60px} to{left:calc(100% + 10px)} }
  @keyframes popIn    { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
  @keyframes popOut   { to{opacity:0;transform:scale(0.86)} }
  @keyframes slide    { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes pulse    { 0%,100%{box-shadow:0 0 6px #e50914} 50%{box-shadow:0 0 14px #e50914} }
  @keyframes blink    { 0%,100%{opacity:0.3} 50%{opacity:1} }
  @keyframes greenPop { 0%{transform:scale(0.92)} 60%{transform:scale(1.04)} 100%{transform:scale(1)} }
  .lap-anim { animation: slide 0.3s ease; }
  .pop-anim { animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1), popOut 0.35s ease 1.8s forwards; }
  button:active { transform: scale(0.96) !important; }
  button:disabled { opacity: 0.4 !important; cursor: not-allowed !important; }
  input:focus { border-color: #e50914 !important; outline: none; }
  input::placeholder { color: #1e1e2e; }
  ::-webkit-scrollbar { width: 2px; }
  ::-webkit-scrollbar-thumb { background: #141422; }
`;

// ── Reusable small components ─────────────────────────

function SectorLights({ lights, running }) {
  return (
    <div style={{ display:"flex", gap:10, marginBottom:28 }}>
      {lights.map((on, i) => (
        <div key={i} style={{
          width:44, height:10, borderRadius:2, transition:"background 0.25s",
          background: on ? (running ? "#00d26a" : "#e50914") : "#0e0e18",
          boxShadow:  on ? `0 0 12px ${running ? "#00d26a" : "#e50914"}` : "none",
        }} />
      ))}
    </div>
  );
}

function LapRow({ lap, isFirst }) {
  return (
    <div style={{
      display:"flex", justifyContent:"space-between", padding:"10px 18px",
      borderBottom:"1px solid #0a0a12", animation:"slide 0.3s ease",
      background: isFirst ? "rgba(229,9,20,0.04)" : "transparent",
      borderLeft: isFirst ? "2px solid #e50914" : "2px solid transparent"
    }}>
      <span style={{ fontFamily:"Orbitron,monospace", fontSize:9, color: isFirst?"#e50914":"#333" }}>LAP {lap.lap}</span>
      <span style={{ fontFamily:"Orbitron,monospace", fontSize:14, color: isFirst?"#fff":"#444" }}>{lap.time}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════
// SCREEN 1 — LAP TIMER
// ════════════════════════════════════════════════════
function LapTimer() {
  const [time,    setTime]    = useState(0);
  const [running, setRunning] = useState(false);
  const [laps,    setLaps]    = useState([]);
  const [lights,  setLights]  = useState([false,false,false,false,false]);
  const [popup,   setPopup]   = useState(null);
  const [driver,  setDriver]  = useState("");
  const popKey = useRef(0);

  useEffect(() => {
    let iv;
    if (running) iv = setInterval(() => setTime(p => p + 10), 10);
    return () => clearInterval(iv);
  }, [running]);

  function handleStart() {
    if (running) return;
    let i = 0;
    const seq = setInterval(() => {
      setLights(p => { const n = [...p]; n[i] = true; return n; });
      if (++i === 5) {
        clearInterval(seq);
        setTimeout(() => { setLights([false,false,false,false,false]); setRunning(true); }, 500);
      }
    }, 220);
  }

  function handleLap() {
    if (!running) return;
    const t = formatTime(time);
    popKey.current++;
    setPopup({ time: t.full, lap: laps.length + 1, key: popKey.current });
    setTimeout(() => setPopup(null), 2300);
    setLaps(prev => [{ lap: prev.length + 1, time: t.full }, ...prev]);
  }

  function handleReset() {
    setRunning(false); setTime(0); setLaps([]);
    setLights([false,false,false,false,false]);
  }

  const t     = formatTime(time);
  const best  = laps.length ? laps.reduce((b,l) => toMs(l.time) < toMs(b.time) ? l : b).time : null;
  const delta = laps.length >= 2 ? toMs(laps[0].time) - toMs(laps[1].time) : null;
  const today = new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase();

  const btn = (bg, color, border, flex) => ({
    padding:"16px 28px", border:border||"none", borderRadius:3, cursor:"pointer",
    fontFamily:"Orbitron,monospace", fontSize:11, fontWeight:700, letterSpacing:3,
    textTransform:"uppercase", background:bg, color, flex:flex||"unset", transition:"all 0.15s"
  });

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", height:"calc(100vh - 52px)", overflow:"hidden" }}>

      {/* Main */}
      <div style={{ display:"flex", flexDirection:"column", padding:"36px 48px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(229,9,20,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(229,9,20,0.03) 1px,transparent 1px)", backgroundSize:"48px 48px", pointerEvents:"none" }} />

        {/* Session row */}
        <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:32, zIndex:2, position:"relative" }}>
          <span style={{ fontSize:10, letterSpacing:4, color:"#e50914", fontWeight:700, padding:"4px 12px", border:"1px solid #e50914", borderRadius:2 }}>Race Session</span>
          <span style={{ fontSize:11, letterSpacing:2, color:"#2a2a35", textTransform:"uppercase" }}>{today}</span>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, fontSize:11, letterSpacing:3, color:"#444", textTransform:"uppercase" }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:running?"#e50914":"#1a1a28", animation:running?"pulse 1.2s ease infinite":"none" }} />
            {running ? "Live" : "Idle"}
          </div>
        </div>

        {/* Timer */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", zIndex:2, position:"relative" }}>
          <div style={{ fontSize:10, letterSpacing:5, color:"#1e1e28", textTransform:"uppercase", marginBottom:14 }}>Lap Elapsed Time</div>
          <SectorLights lights={lights} running={running} />
          <div style={{ display:"flex", alignItems:"baseline", marginBottom:36 }}>
            <span style={{ fontFamily:"Orbitron,monospace", fontSize:"clamp(72px,11vw,130px)", fontWeight:900, color:"#fff", letterSpacing:-2 }}>{t.main}</span>
            <span style={{ fontFamily:"Orbitron,monospace", fontSize:"clamp(26px,4vw,46px)", color:"#e50914", paddingLeft:6 }}>:{t.ms}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display:"flex", gap:12, zIndex:2, position:"relative" }}>
          <button style={btn("#e50914","#fff",null,1.4)}             onClick={handleStart}        disabled={running}>▶ Start</button>
          <button style={btn("#0f0f18","#fff","1px solid #1e1e2e",1)} onClick={handleLap}          disabled={!running}>⊕ Lap</button>
          <button style={btn("#130508","#e50914","1px solid #2a0a0a",1)} onClick={()=>setRunning(false)}>■ Stop</button>
          <button style={btn("transparent","#2a2a35","1px solid #141420")} onClick={handleReset}>↺</button>
        </div>

        {/* Track */}
        <div style={{ width:"100%", height:62, background:"#080810", border:"1px solid #101018", borderRadius:3, position:"relative", overflow:"hidden", marginTop:36 }}>
          <div style={{ position:"absolute", top:0,    left:0, right:0, height:3, background:"#e50914" }} />
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:"#e50914" }} />
          <div style={{ position:"absolute", top:"50%", transform:"translateY(-50%)", left:0, right:0, height:2, background:"repeating-linear-gradient(90deg,#141422 0,#141422 20px,transparent 20px,transparent 38px)" }} />
          <div style={{ position:"absolute", top:"50%", transform:"translateY(-50%)", fontSize:30,
            filter:"drop-shadow(0 0 10px rgba(229,9,20,0.9))",
            ...(running ? { animation:"carZoom 2.8s linear infinite" } : { left:14, opacity:0.12 }) }}>🏎️</div>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ background:"#07070e", borderLeft:"1px solid #0f0f1a", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"22px 22px 14px", borderBottom:"1px solid #0f0f1a", display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:10, letterSpacing:4, color:"#282832", textTransform:"uppercase", fontWeight:700 }}>Lap Times</span>
          <span style={{ fontFamily:"Orbitron,monospace", fontSize:11, color:"#e50914", fontWeight:700 }}>{laps.length>0?`${laps.length} LAPS`:"—"}</span>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, background:"#0f0f1a", borderBottom:"1px solid #0f0f1a" }}>
          {[
            { label:"Best Lap",   value:best??  "--:--:--", color:best?"#00d26a":"#2a2a38" },
            { label:"Last Delta", value:delta!=null?`${delta>=0?"+":"-"}${String(Math.floor(Math.abs(delta)/1000)).padStart(2,"0")}.${String(Math.floor((Math.abs(delta)%1000)/10)).padStart(2,"0")}`:"--",
              color:delta!=null?(delta>=0?"#e50914":"#00d26a"):"#2a2a38" }
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background:"#07070e", padding:"16px 18px" }}>
              <div style={{ fontSize:9, letterSpacing:3, color:"#1e1e28", textTransform:"uppercase", marginBottom:5 }}>{label}</div>
              <div style={{ fontFamily:"Orbitron,monospace", fontSize:13, fontWeight:700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Driver input */}
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #0f0f1a" }}>
          <label style={{ fontSize:9, letterSpacing:3, color:"#1e1e28", textTransform:"uppercase", display:"block", marginBottom:6 }}>Driver</label>
          <input value={driver} onChange={e=>setDriver(e.target.value)} placeholder="Enter driver name…" maxLength={24}
            style={{ width:"100%", background:"#0f0f18", border:"1px solid #1a1a28", borderRadius:3, color:"#fff", fontFamily:"Rajdhani,sans-serif", fontSize:13, fontWeight:600, padding:"7px 10px" }} />
          {driver && <div style={{ marginTop:5, fontSize:9, letterSpacing:2, color:"#e50914", textTransform:"uppercase" }}>Pilot: {driver.toUpperCase()}</div>}
        </div>

        {/* Lap list */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {laps.length===0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:10 }}>
              <span style={{ fontSize:32, filter:"grayscale(1) brightness(0.25)" }}>🏁</span>
              <span style={{ fontSize:10, letterSpacing:3, color:"#1a1a28", textTransform:"uppercase" }}>No laps recorded</span>
            </div>
          ) : laps.map((l,i) => <LapRow key={l.lap} lap={l} isFirst={i===0} />)}
        </div>
      </div>

      {/* Popup */}
      {popup && (
        <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, pointerEvents:"none" }}>
          <div className="pop-anim" key={popup.key} style={{ background:"#09090f", border:"1px solid #1a1a28", borderTop:"4px solid #e50914", borderRadius:6, padding:"38px 64px", textAlign:"center", boxShadow:"0 0 80px rgba(229,9,20,0.2),0 40px 80px rgba(0,0,0,0.95)" }}>
            <div style={{ fontSize:42, marginBottom:16 }}>🏁</div>
            <div style={{ fontSize:10, letterSpacing:5, color:"#e50914", textTransform:"uppercase", fontWeight:700 }}>Lap Recorded</div>
            <div style={{ fontSize:11, letterSpacing:4, color:"#444", textTransform:"uppercase", margin:"4px 0 16px" }}>LAP {popup.lap}</div>
            <div style={{ fontFamily:"Orbitron,monospace", fontSize:52, fontWeight:900, color:"#fff" }}>{popup.time}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════
// SCREEN 2 — REACTION TIME TESTER
// States: "idle" → "waiting" → "ready" → "result"
// ════════════════════════════════════════════════════
function ReactionTester() {
  // "idle" | "waiting" | "ready" | "result" | "early"
  const [phase,    setPhase]    = useState("idle");
  const [reaction, setReaction] = useState(null);   // ms of last attempt
  const [history,  setHistory]  = useState([]);      // all past results
  const startRef   = useRef(null);  // timestamp when light went green
  const timerRef   = useRef(null);  // random delay timeout

  const avg  = history.length ? Math.round(history.reduce((a,b)=>a+b,0)/history.length) : null;
  const best = history.length ? Math.min(...history) : null;

  // Rating based on reaction time
  function getRating(ms) {
    if (ms < 150) return { label:"SUPERHUMAN",  color:"#a855f7" };
    if (ms < 200) return { label:"ELITE",        color:"#00d26a" };
    if (ms < 250) return { label:"PRO",          color:"#3b82f6" };
    if (ms < 300) return { label:"GOOD",         color:"#e8c84a" };
    if (ms < 400) return { label:"AVERAGE",      color:"#e50914" };
    return                { label:"TOO SLOW",    color:"#666"    };
  }

  // Click / tap handler — depends on current phase
  const handleClick = useCallback(() => {
    if (phase === "idle" || phase === "result" || phase === "early") {
      // Start a new attempt: wait for random delay then go green
      setPhase("waiting");
      setReaction(null);
      const delay = 1500 + Math.random() * 3000; // 1.5–4.5s
      timerRef.current = setTimeout(() => setPhase("ready"), delay);
    }
    else if (phase === "waiting") {
      // Clicked too early!
      clearTimeout(timerRef.current);
      setPhase("early");
    }
    else if (phase === "ready") {
      // Measure reaction
      const ms = Date.now() - startRef.current;
      setReaction(ms);
      setHistory(h => [ms, ...h].slice(0, 20)); // keep last 20
      setPhase("result");
    }
  }, [phase]);

  // When phase turns "ready", record the start time
  useEffect(() => {
    if (phase === "ready") startRef.current = Date.now();
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Zone appearance per phase
  const zone = {
    idle:    { bg:"#0a0a10", border:"#1a1a28", icon:"🏎️",  label:"TAP TO START",      sub:"Click anywhere in this zone" },
    waiting: { bg:"#0e0508", border:"#2a0a0a", icon:"🔴",  label:"WAIT FOR GREEN…",   sub:"Don't click yet!" },
    ready:   { bg:"#051208", border:"#00d26a", icon:"🟢",  label:"GO! GO! GO!",        sub:"Click NOW!" },
    early:   { bg:"#130508", border:"#e50914", icon:"❌",  label:"TOO EARLY",          sub:"Tap to try again" },
    result:  { bg:"#0a0a10", border:"#1a1a28", icon:"🏁",  label:"",                   sub:"Tap to try again" },
  };
  const z = zone[phase];
  const rating = reaction ? getRating(reaction) : null;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", height:"calc(100vh - 52px)", overflow:"hidden" }}>

      {/* Main tap zone */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:48, userSelect:"none", cursor:"pointer", position:"relative", overflow:"hidden" }}
           onClick={handleClick}>

        {/* Background grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(229,9,20,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(229,9,20,0.03) 1px,transparent 1px)", backgroundSize:"48px 48px", pointerEvents:"none" }} />

        {/* The big tap box */}
        <div style={{
          width:"100%", maxWidth:520, aspectRatio:"4/3", borderRadius:16,
          background:z.bg, border:`2px solid ${z.border}`,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:16, transition:"all 0.2s", position:"relative", overflow:"hidden",
          boxShadow: phase==="ready" ? "0 0 60px rgba(0,210,106,0.25)" : phase==="waiting" ? "0 0 40px rgba(229,9,20,0.1)" : "none",
          animation: phase==="ready" ? "greenPop 0.3s ease" : "none",
        }}>

          {/* Pulsing light when waiting */}
          {phase==="waiting" && (
            <div style={{ position:"absolute", top:20, right:20, width:12, height:12, borderRadius:"50%", background:"#e50914", animation:"pulse 0.8s ease infinite" }} />
          )}

          <span style={{ fontSize:64, lineHeight:1 }}>{z.icon}</span>

          {phase === "result" && reaction ? (
            <>
              <div style={{ fontFamily:"Orbitron,monospace", fontSize:"clamp(48px,8vw,80px)", fontWeight:900, color:"#fff", lineHeight:1 }}>
                {reaction}<span style={{ fontSize:"0.4em", color:"#666", paddingLeft:4 }}>ms</span>
              </div>
              <div style={{ fontFamily:"Orbitron,monospace", fontSize:14, fontWeight:700, letterSpacing:3, color:rating.color, padding:"4px 16px", border:`1px solid ${rating.color}`, borderRadius:3 }}>
                {rating.label}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily:"Orbitron,monospace", fontSize:18, fontWeight:900, letterSpacing:4, color: phase==="ready"?"#00d26a": phase==="early"?"#e50914":"#555", textTransform:"uppercase" }}>
                {z.label}
              </div>
              {phase === "waiting" && (
                <div style={{ fontFamily:"Orbitron,monospace", fontSize:10, letterSpacing:3, color:"#e50914", animation:"blink 1s ease infinite" }}>● STANDBY</div>
              )}
            </>
          )}

          <div style={{ fontSize:11, letterSpacing:2, color:"#333", textTransform:"uppercase" }}>{z.sub}</div>
        </div>

        {/* Tips */}
        <div style={{ marginTop:28, display:"flex", gap:32 }}>
          {[
            { label:"F1 Average",   value:"~200ms" },
            { label:"Human Avg",    value:"~250ms" },
            { label:"World Record", value:"~100ms" },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"Orbitron,monospace", fontSize:15, fontWeight:700, color:"#e50914", marginBottom:2 }}>{value}</div>
              <div style={{ fontSize:10, letterSpacing:2, color:"#333", textTransform:"uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar — history */}
      <div style={{ background:"#07070e", borderLeft:"1px solid #0f0f1a", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"22px 22px 14px", borderBottom:"1px solid #0f0f1a" }}>
          <div style={{ fontSize:10, letterSpacing:4, color:"#282832", textTransform:"uppercase", fontWeight:700, marginBottom:2 }}>Reaction Log</div>
          <div style={{ fontFamily:"Orbitron,monospace", fontSize:10, color:"#333" }}>{history.length} attempts</div>
        </div>

        {/* Best / Avg stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, background:"#0f0f1a", borderBottom:"1px solid #0f0f1a" }}>
          {[
            { label:"Best",    value: best ? `${best}ms`          : "--", color: best ? "#00d26a" : "#2a2a38" },
            { label:"Average", value: avg  ? `${avg}ms`           : "--", color: avg  ? "#e8c84a" : "#2a2a38" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background:"#07070e", padding:"16px 18px" }}>
              <div style={{ fontSize:9, letterSpacing:3, color:"#1e1e28", textTransform:"uppercase", marginBottom:5 }}>{label}</div>
              <div style={{ fontFamily:"Orbitron,monospace", fontSize:13, fontWeight:700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Rating scale legend */}
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #0f0f1a" }}>
          <div style={{ fontSize:9, letterSpacing:3, color:"#1e1e28", textTransform:"uppercase", marginBottom:10 }}>Rating Scale</div>
          {[
            { range:"< 150ms",  label:"Superhuman", color:"#a855f7" },
            { range:"< 200ms",  label:"Elite",      color:"#00d26a" },
            { range:"< 250ms",  label:"Pro",        color:"#3b82f6" },
            { range:"< 300ms",  label:"Good",       color:"#e8c84a" },
            { range:"< 400ms",  label:"Average",    color:"#e50914" },
            { range:"> 400ms",  label:"Too Slow",   color:"#444"    },
          ].map(({ range, label, color }) => (
            <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
              <span style={{ fontSize:10, color:"#333", letterSpacing:1 }}>{range}</span>
              <span style={{ fontFamily:"Orbitron,monospace", fontSize:9, fontWeight:700, color, letterSpacing:2 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* History list */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {history.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:10 }}>
              <span style={{ fontSize:32, filter:"grayscale(1) brightness(0.25)" }}>⚡</span>
              <span style={{ fontSize:10, letterSpacing:3, color:"#1a1a28", textTransform:"uppercase" }}>No attempts yet</span>
            </div>
          ) : history.map((ms, i) => {
            const r = getRating(ms);
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 18px", borderBottom:"1px solid #0a0a12",
                background: i===0 ? "rgba(0,210,106,0.04)" : "transparent",
                borderLeft: i===0 ? "2px solid #00d26a" : "2px solid transparent" }}>
                <span style={{ fontFamily:"Orbitron,monospace", fontSize:9, color:i===0?"#00d26a":"#333" }}>#{history.length - i}</span>
                <span style={{ fontFamily:"Orbitron,monospace", fontSize:14, fontWeight:700, color:i===0?"#fff":"#444" }}>{ms}ms</span>
                <span style={{ fontFamily:"Orbitron,monospace", fontSize:8, fontWeight:700, color:r.color, letterSpacing:1 }}>{r.label}</span>
              </div>
            );
          })}
        </div>

        {/* Clear button */}
        {history.length > 0 && (
          <div style={{ padding:14, borderTop:"1px solid #0f0f1a" }}>
            <button onClick={() => { setHistory([]); setPhase("idle"); setReaction(null); }}
              style={{ width:"100%", padding:"10px", background:"transparent", border:"1px solid #1a1a28", borderRadius:3, cursor:"pointer", fontFamily:"Orbitron,monospace", fontSize:10, fontWeight:700, letterSpacing:3, color:"#333", textTransform:"uppercase", transition:"all 0.15s" }}>
              ↺ Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// ROOT — Tab switcher
// ════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("timer"); // "timer" | "reaction"

  const tabBtn = (id, label, icon) => ({
    onClick: () => setTab(id),
    style: {
      flex:1, padding:"0 20px", border:"none", cursor:"pointer", background:"none",
      fontFamily:"Orbitron,monospace", fontSize:11, fontWeight:700, letterSpacing:3,
      textTransform:"uppercase", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      color: tab===id ? "#fff" : "#333",
      borderBottom: tab===id ? "2px solid #e50914" : "2px solid transparent",
      transition:"all 0.2s",
    }
  });

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ width:"100vw", height:"100vh", display:"flex", flexDirection:"column", background:"#05050a", overflow:"hidden" }}>

        {/* Title bar with tabs */}
        <div style={{ height:52, background:"#0a0a0f", borderBottom:"1px solid #141420", display:"flex", alignItems:"center", position:"relative", flexShrink:0 }}>
          {/* Window dots */}
          <div style={{ display:"flex", gap:8, padding:"0 20px" }}>
            <div style={{ width:12, height:12, borderRadius:"50%", background:"#e50914", boxShadow:"0 0 6px #e50914", cursor:"pointer" }} />
            <div style={{ width:12, height:12, borderRadius:"50%", background:"#f5a623", boxShadow:"0 0 6px #f5a623" }} />
            <div style={{ width:12, height:12, borderRadius:"50%", background:"#00d26a", boxShadow:"0 0 6px #00d26a" }} />
          </div>

          {/* Tabs — centered */}
          <div style={{ position:"absolute", left:"50%", transform:"translateX(-50%)", display:"flex", height:"100%" }}>
            <button {...tabBtn("timer",    "Lap Timer",   "🏎️")}>🏎️ Lap Timer</button>
            <button {...tabBtn("reaction", "Reaction",    "⚡")}>⚡ Reaction Test</button>
          </div>

          <span style={{ marginLeft:"auto", marginRight:20, fontSize:10, letterSpacing:3, color:"#e50914", fontWeight:700 }}>● F1 SESSION</span>
        </div>

        {/* Screen */}
        {tab === "timer"    && <LapTimer />}
        {tab === "reaction" && <ReactionTester />}
      </div>
    </>
  );
}