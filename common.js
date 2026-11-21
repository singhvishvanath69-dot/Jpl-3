// ===== Mini JPL – shared module (Firebase, language, stats engine, drawing helpers) =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import * as FS from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import * as AU from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export const { collection, addDoc, getDoc, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, onSnapshot, increment, writeBatch } = FS;
export const { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } = AU;

const firebaseConfig = {
  apiKey: "AIzaSyA64kO5vHIRwGK0jwGYQhJKPYKGnbTgU9Y",
  authDomain: "mini-jpl-tournament.firebaseapp.com",
  projectId: "mini-jpl-tournament",
  storageBucket: "mini-jpl-tournament.firebasestorage.app",
  messagingSenderId: "311718972291",
  appId: "1:311718972291:web:66f5488375d044b2fd04b6"
};
const app = initializeApp(firebaseConfig);
export const db = FS.getFirestore(app);
export const auth = AU.getAuth(app);

export const ADMIN_EMAIL = "singhvishvanath69@gmail.com";
export const DEFAULT_WA = "917566062677";

// ---------- basics ----------
export const $ = id => document.getElementById(id);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const pidOf = id => "JPL-" + String(id).slice(0, 5).toUpperCase();
export const rupee = n => "₹" + (Number(n) || 0).toLocaleString("en-IN");
export const oversOf = l => `${Math.floor(l / 6)}.${l % 6}`;
export const loadImg = src => new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
export function keepSel(id, html) { const el = $(id); if (!el) return; const v = el.value; el.innerHTML = html; if (v && [...el.options].some(o => o.value === v)) el.value = v; }
export function compress(file, max, q, type = "image/jpeg") {
  return new Promise((res, rej) => {
    const img = new Image(), r = new FileReader();
    r.onload = () => { img.src = r.result; };
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = img.width * s; c.height = img.height * s;
      const x = c.getContext("2d");
      if (type === "image/jpeg") { x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); }
      x.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL(type, q));
    };
    img.onerror = rej; r.onerror = rej; r.readAsDataURL(file);
  });
}
export function downloadCanvas(cv, name) { const a = document.createElement("a"); a.download = name; a.href = cv.toDataURL("image/png"); a.click(); }
export async function shareCanvas(cv, name, text) {
  const blob = await new Promise(r => cv.toBlob(r, "image/png"));
  const file = new File([blob], name, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], text }); return; } catch (e) { if (e.name === "AbortError") return; } }
  downloadCanvas(cv, name);
  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
}

// ---------- language ----------
let lang = localStorage.getItem("jpl_lang") || "hi";
const subs = [];
export const getLang = () => lang;
export const tr = (hi, en) => lang === "hi" ? hi : en;
export function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-t]").forEach(e => { const p = e.dataset.t.split("|"); e.textContent = lang === "hi" ? p[0] : (p[1] ?? p[0]); });
  document.querySelectorAll("[data-tp]").forEach(e => { const p = e.dataset.tp.split("|"); e.placeholder = lang === "hi" ? p[0] : (p[1] ?? p[0]); });
  document.querySelectorAll(".langBtn").forEach(b => b.textContent = lang === "hi" ? "🌐 हिंदी | EN" : "🌐 EN | हिंदी");
}
export const onLang = fn => subs.push(fn);
export function toggleLang() { lang = lang === "hi" ? "en" : "hi"; localStorage.setItem("jpl_lang", lang); applyLang(); subs.forEach(f => f()); }
export const fmtDate = s => s ? new Date(s + "T00:00:00").toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";
export function fmtWhen(m) {
  if (m.whenISO) return new Date(m.whenISO).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  return m.when || "";
}

// ---------- labels ----------
const RL = { bat: ["बल्लेबाज", "Batter"], bowl: ["गेंदबाज", "Bowler"], all: ["ऑलराउंडर", "All-rounder"] };
const LEG = { "बल्लेबाज": "bat", "गेंदबाज": "bowl", "ऑलराउंडर": "all" };
export const roleKey = r => RL[r] ? r : (LEG[r] || "bat");
export const roleLabel = r => tr(...RL[roleKey(r)]);
const DIS = { bowled: ["बोल्ड", "Bowled"], caught: ["कैच आउट", "Caught"], lbw: ["एलबीडब्ल्यू", "LBW"], runout: ["रन आउट", "Run Out"], stumped: ["स्टंप्ड", "Stumped"], hitwicket: ["हिट विकेट", "Hit Wicket"] };
export const dismissalLabel = k => tr(...(DIS[k] || DIS.bowled));
export const stageLabel = s => s === "semi" ? tr("सेमी-फाइनल", "Semi-Final") : s === "final" ? tr("फाइनल", "Final") : tr("लीग", "League");

// ---------- data store ----------
export const S = { teams: [], players: [], matches: [], balls: [], grounds: [], coaches: [], polls: [], media: [], sponsors: [], news: [], owners: [], settings: {}, live: null, priv: {} };
const ts = d => d.createdAt?.seconds ?? (d.t ? d.t / 1000 : 0);
const arr = s => s.docs.map(d => ({ id: d.id, ...d.data() }));
export function startData(cb, admin = false) {
  const L = (k, fn = arr) => onSnapshot(collection(db, k), s => { S[k] = fn(s); cb(k); }, e => console.warn(k, e.message));
  L("teams", s => arr(s).sort((a, b) => ts(a) - ts(b)));
  L("players", s => arr(s).sort((a, b) => ts(b) - ts(a)));
  L("matches", s => arr(s).sort((a, b) => (a.seq ?? ts(a)) - (b.seq ?? ts(b))));
  L("balls");
  L("grounds"); L("coaches");
  L("polls", s => arr(s).sort((a, b) => ts(b) - ts(a)));
  L("media", s => arr(s).sort((a, b) => ts(b) - ts(a)));
  L("sponsors", s => arr(s).sort((a, b) => ts(a) - ts(b)));
  L("news", s => arr(s).sort((a, b) => ts(b) - ts(a)));
  onSnapshot(doc(db, "settings", "main"), s => { S.settings = s.exists() ? s.data() : {}; cb("settings"); }, e => console.warn(e.message));
  onSnapshot(doc(db, "auctions", "live"), s => { S.live = s.exists() ? s.data() : null; cb("live"); }, e => console.warn(e.message));
  if (admin) {
    onSnapshot(collection(db, "private_players"), s => { S.priv = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); cb("priv"); }, e => console.warn(e.message));
    L("owners");
  }
}
export function cfg() {
  const s = S.settings, n = (k, d) => (+s[k] > 0 ? +s[k] : d);
  return {
    entryFee: n("entryFee", 200), upiId: s.upiId || "", upiName: s.upiName || "Mini JPL", adminWa: s.adminWa || DEFAULT_WA, qrImg: s.qrImg || "",
    startDate: s.startDate || "", purse: n("purse", 10000), basePrice: n("basePrice", 500), bidStep: n("bidStep", 100),
    squadSize: n("squadSize", 8), overs: n("overs", 6), wicketsLimit: n("wicketsLimit", 10)
  };
}
export const approved = () => S.players.filter(p => p.payStatus === "paid");
export const teamOf = id => S.teams.find(t => t.id === id);
export const teamName = id => teamOf(id)?.name || "";
export const logo = (t, size = 36) => t?.logo ? `<img class="lg" style="width:${size}px;height:${size}px" src="${t.logo}" alt="">` : `<span class="lg ph" style="width:${size}px;height:${size}px;font-size:${size * .55}px">🏏</span>`;
export function teamLabel(m, side) {
  const id = m[side + "TeamId"];
  if (id) return teamName(id) || m[side + "Name"] || "";
  return tr("तय होना बाकी", "TBD") + (m[side + "Label"] ? ` (${m[side + "Label"]})` : "");
}
export const pollQ = p => tr(p.qHi || p.question || "", p.qEn || p.question || "");

// ---------- cricket engine ----------
export function innings(matchId) {
  const o = {};
  S.balls.filter(b => b.matchId === matchId).forEach(b => {
    const i = o[b.inn || 1] ||= { teamId: b.batTeamId, runs: 0, wkts: 0, legal: 0 };
    i.runs += (b.runs || 0) + (b.extraRuns || 0);
    if (b.wicket) i.wkts++;
    if (!b.extra) i.legal++;
  });
  return o;
}
export const scoreStr = i => i ? `${i.runs}/${i.wkts} (${oversOf(i.legal)})` : "";
export function liveInfo(m) {
  const c = cfg(), inn = innings(m.id), maxBalls = (m.overs || c.overs) * 6, cur = inn[2] ? 2 : 1, i = inn[cur] || null;
  const target = inn[1] ? inn[1].runs + 1 : null;
  const crr = i && i.legal ? i.runs / (i.legal / 6) : 0;
  let rrr = null, need = null, left = null;
  if (cur === 2 && target && i) { need = target - i.runs; left = maxBalls - i.legal; rrr = left > 0 ? Math.max(need, 0) / (left / 6) : null; }
  const complete = !!i && (i.legal >= maxBalls || i.wkts >= c.wicketsLimit || (cur === 2 && i.runs >= target));
  return { inn, cur, i, target, crr, rrr, need, left, maxBalls, complete };
}
export function computeResult(m) {
  const c = cfg(), inn = innings(m.id), i1 = inn[1], i2 = inn[2];
  if (!i1 || !i2) return null;
  if (i2.runs > i1.runs) return { winnerId: i2.teamId, res: { type: "wkts", n: Math.max(c.wicketsLimit - i2.wkts, 0) } };
  if (i2.runs === i1.runs) return { winnerId: "", res: { type: "tie" } };
  return { winnerId: i1.teamId, res: { type: "runs", n: i1.runs - i2.runs } };
}
export function resultText(m) {
  if (m.res) {
    const w = teamName(m.winnerId);
    if (m.res.type === "tie") return tr("मैच टाई", "Match tied");
    if (m.res.type === "wkts") return tr(`${w} ${m.res.n} विकेट से जीता`, `${w} won by ${m.res.n} wickets`);
    return tr(`${w} ${m.res.n} रन से जीता`, `${w} won by ${m.res.n} runs`);
  }
  return m.result || "";
}
const mballs = b => { const o = Math.floor(b || 0); return o * 6 + Math.round(((b || 0) - o) * 10); };
export function batStats(id) {
  const p = S.players.find(x => x.id === id) || {};
  let runs = p.runs || 0, balls = p.balls || 0, fours = 0, sixes = 0;
  S.balls.forEach(b => { if (b.batterId === id && b.extra !== "wd") { runs += b.runs || 0; balls++; if (b.runs === 4) fours++; if (b.runs === 6) sixes++; } });
  return { runs, balls, fours, sixes, sr: balls ? (runs / balls * 100).toFixed(1) : "—" };
}
export function bowlStats(id) {
  const p = S.players.find(x => x.id === id) || {};
  let legal = mballs(p.overs), runs = p.runsGiven || 0, wkts = p.wkts || 0;
  S.balls.forEach(b => { if (b.bowlerId === id) { runs += (b.runs || 0) + (b.extraRuns || 0); if (!b.extra) legal++; if (b.wicket && b.dismissal !== "runout") wkts++; } });
  return { legal, runs, wkts, overs: oversOf(legal), eco: legal ? (runs / (legal / 6)).toFixed(2) : "—" };
}
export function leaders() {
  const rows = S.players.map(p => { const b = batStats(p.id), w = bowlStats(p.id); return { p, b, w, mvp: b.runs + b.fours + b.sixes * 2 + w.wkts * 20 }; });
  const top = f => rows.filter(r => f(r) > 0).sort((a, b) => f(b) - f(a)).slice(0, 5).map(r => ({ p: r.p, v: f(r), r }));
  return { orange: top(r => r.b.runs), purple: top(r => r.w.wkts), sixes: top(r => r.b.sixes), mvp: top(r => r.mvp) };
}
export function standings() {
  const c = cfg(), T = {};
  S.teams.forEach(t => T[t.id] = { t, P: 0, W: 0, L: 0, T: 0, pts: 0, rf: 0, of: 0, ra: 0, ob: 0 });
  S.matches.filter(m => m.status === "done" && (m.stage || "league") === "league").forEach(m => {
    const a = T[m.aTeamId], b = T[m.bTeamId]; if (!a || !b) return;
    const mb = (m.overs || c.overs) * 6, inn = innings(m.id);
    [1, 2].forEach(k => {
      const i = inn[k]; if (!i) return; const bt = T[i.teamId]; if (!bt) return;
      const other = bt === a ? b : a, ov = (i.wkts >= c.wicketsLimit ? mb : i.legal) / 6;
      bt.rf += i.runs; bt.of += ov; other.ra += i.runs; other.ob += ov;
    });
    a.P++; b.P++;
    if (m.res?.type === "tie") { a.T++; b.T++; a.pts++; b.pts++; }
    else if (m.winnerId) { const w = T[m.winnerId], l = w === a ? b : a; if (w) { w.W++; w.pts += 2; } if (l) l.L++; }
  });
  return Object.values(T).map(r => ({ ...r, nrr: (r.of > 0 ? r.rf / r.of : 0) - (r.ob > 0 ? r.ra / r.ob : 0) })).sort((x, y) => y.pts - x.pts || y.nrr - x.nrr);
}

// ---------- commentary ----------
const CM = {
  "0": [["डॉट बॉल! कोई रन नहीं।", "Dot ball! No run."], ["बढ़िया गेंद, बल्लेबाज़ चूक गया।", "Beaten outside off, great delivery."], ["सीधे फील्डर के पास।", "Straight to the fielder."]],
  "1": [["1 रन! सिंगल लेकर स्ट्राइक बदली।", "1 run! Quick single, strike rotated."], ["हल्का धक्का और एक रन।", "Nudged away for a single."], ["गैप में खेलकर एक रन।", "Worked into the gap for one."]],
  "2": [["2 रन! दौड़कर दो रन बटोरे।", "2 runs! Hustled back for the second."], ["गैप में खेला, आराम से दो रन।", "Placed in the gap, comfortable two."], ["अच्छी दौड़, दो रन।", "Good running, two taken."]],
  "3": [["3 रन! फील्डर ने बाउंड्री से रोका।", "3 runs! Saved at the rope."], ["लंबा शॉट, तीन रन दौड़े।", "Deep shot, three completed."], ["तीन रन! शानदार दौड़।", "Three! Superb running."]],
  "4": [["4 रन! कवर्स के बीच से शानदार चौका!", "4 RUNS! Smashed through the covers!"], ["चौका! गेंद सीमा रेखा के पार!", "FOUR! Races away to the boundary!"], ["4 रन! क्या टाइमिंग है!", "4 RUNS! Pure timing!"]],
  "6": [["छक्का! गेंद स्टेडियम के बाहर!", "SIX! That's out of the park!"], ["छक्का! सीधे दर्शकों में!", "SIX! Into the crowd!"], ["6 रन! क्या ज़बरदस्त हिट!", "SIX! What a monstrous hit!"]],
  "wd": [["वाइड बॉल! एक अतिरिक्त रन।", "Wide ball! One extra."], ["लाइन से बाहर, वाइड।", "Too wide, extra run."], ["वाइड! दोबारा डालनी होगी।", "Wide! Has to bowl it again."]],
  "nb": [["नो बॉल! फ्री हिट का मौका।", "No ball! Free runs on offer."], ["नो बॉल, एक अतिरिक्त रन।", "No ball, one extra."], ["नो बॉल! ओवरस्टेप।", "No ball! Overstepped."]],
  "W": [["विकेट! गेंदबाज़ को सफलता मिली।", "The bowler strikes!"], ["विकेट गिरा! बल्लेबाज़ पवेलियन लौटा।", "Gone! Walks back to the pavilion."], ["क्या गेंद थी! विकेट!", "What a delivery! Wicket!"]]
};
export function commentary(b) {
  const k = b.wicket ? "W" : b.extra ? b.extra : String(b.runs || 0);
  const v = (CM[k] || CM["0"])[(b.cmi || 0) % 3];
  return (b.wicket ? tr(`आउट! (${dismissalLabel(b.dismissal)}) `, `OUT! (${dismissalLabel(b.dismissal)}) `) : "") + tr(v[0], v[1]) + (b.note ? ` — ${b.note}` : "");
}
export const randomCmi = () => Math.floor(Math.random() * 3);
export function chip(b) {
  if (b.wicket) return { t: "W", c: "w" };
  if (b.extra === "wd") return { t: "Wd", c: "x" };
  if (b.extra === "nb") return { t: "Nb", c: "x" };
  return { t: String(b.runs || 0), c: b.runs === 4 ? "r4" : b.runs === 6 ? "r6" : "" };
}
export const chipsHTML = list => list.map(b => { const c = chip(b); return `<span class="chip ${c.c}">${c.t}</span>`; }).join("");

// ---------- sponsors marquee ----------
export function sponsorsHTML() {
  if (!S.sponsors.length) return "";
  const ord = { title: 0, co: 1 };
  const list = [...S.sponsors].sort((a, b) => (ord[a.tier] ?? 2) - (ord[b.tier] ?? 2));
  const one = s => `<span class="spn ${s.tier === "title" ? "ttl" : ""}"><img src="${s.logo}" alt=""><small>${esc(s.name)}</small>${s.tier === "title" ? `<em>${tr("टाइटल स्पॉन्सर", "Title Sponsor")}</em>` : ""}</span>`;
  const base = list.map(one).join(""), h = base.repeat(list.length < 4 ? 4 : 1);
  return `<div class="mq sp"><div>${h}${h}</div></div>`;
}
export const marquee = (items, cls = "") => { const h = items.map(i => `<span>${i}</span>`).join("").repeat(3); return `<div class="mq ${cls}"><div>${h}${h}</div></div>`; };

// ---------- sound & confetti ----------
let actx = null;
export function enableSound() { try { actx ||= new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); return true; } catch (e) { return false; } }
export function gavel() {
  if (!actx) return; const t = actx.currentTime;
  [0, 0.22, 0.5].forEach(d => {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(220, t + d); o.frequency.exponentialRampToValueAtTime(45, t + d + 0.14);
    g.gain.setValueAtTime(1, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.28);
    o.connect(g); g.connect(actx.destination); o.start(t + d); o.stop(t + d + 0.3);
  });
}
export function confetti(ms = 4000) {
  const c = document.createElement("canvas"); c.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:99";
  c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
  const x = c.getContext("2d"), cols = ["#f5b700", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ffffff"];
  const P = Array.from({ length: 170 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .6, w: 6 + Math.random() * 8, h: 8 + Math.random() * 10, vy: 2 + Math.random() * 4, vx: -2 + Math.random() * 4, r: Math.random() * 6, vr: Math.random() * .3 - .15, c: cols[Math.random() * cols.length | 0] }));
  const t0 = performance.now();
  (function f(t) { x.clearRect(0, 0, c.width, c.height); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore(); }); if (t - t0 < ms) requestAnimationFrame(f); else c.remove(); })(t0);
}

// ---------- canvas: player card ----------
export async function drawPlayerCard(cv, p, url) {
  cv.width = 900; cv.height = 1400; const x = cv.getContext("2d");
  let g = x.createLinearGradient(0, 0, 900, 1400); g.addColorStop(0, "#0a1a3a"); g.addColorStop(.6, "#10285a"); g.addColorStop(1, "#050d22");
  x.fillStyle = g; x.fillRect(0, 0, 900, 1400);
  const gold = x.createLinearGradient(0, 0, 900, 0); gold.addColorStop(0, "#b8860b"); gold.addColorStop(.5, "#ffd95a"); gold.addColorStop(1, "#b8860b");
  x.strokeStyle = gold; x.lineWidth = 14; x.strokeRect(20, 20, 860, 1360); x.lineWidth = 3; x.strokeRect(46, 46, 808, 1308);
  x.textAlign = "center"; x.fillStyle = gold; x.font = "bold 96px sans-serif"; x.fillText("MINI JPL", 450, 160);
  x.fillStyle = "#fff"; x.font = "30px sans-serif"; x.fillText("PLAYER ID CARD", 450, 208);
  const img = await loadImg(p.photo);
  x.save(); x.beginPath(); x.arc(450, 470, 215, 0, Math.PI * 2); x.clip();
  if (img) { const s = Math.max(430 / img.width, 430 / img.height); x.drawImage(img, 450 - img.width * s / 2, 470 - img.height * s / 2, img.width * s, img.height * s); }
  x.restore(); x.strokeStyle = gold; x.lineWidth = 10; x.beginPath(); x.arc(450, 470, 215, 0, Math.PI * 2); x.stroke();
  let fs = 66; x.fillStyle = "#fff"; x.font = `bold ${fs}px sans-serif`;
  while (x.measureText(p.name).width > 760 && fs > 30) { fs -= 2; x.font = `bold ${fs}px sans-serif`; }
  x.fillText(p.name, 450, 790);
  const role = roleLabel(p.role); x.font = "bold 36px sans-serif"; const rw = x.measureText(role).width + 70;
  x.fillStyle = gold; x.beginPath(); x.roundRect(450 - rw / 2, 820, rw, 62, 31); x.fill();
  x.fillStyle = "#0a1a3a"; x.fillText(role, 450, 865);
  x.fillStyle = "#cfe0ff"; x.font = "34px sans-serif";
  x.fillText(`📍 ${p.village || "—"}`, 450, 940);
  if (p.teamName) x.fillText(`🏏 ${p.teamName}`, 450, 985);
  x.fillStyle = gold; x.font = "bold 46px sans-serif"; x.fillText(`ID: ${pidOf(p.id)}`, 450, 1050);
  x.fillStyle = "#fff"; x.fillRect(320, 1075, 260, 260);
  try { const tmp = document.createElement("div"); new QRCode(tmp, { text: url, width: 240, height: 240 }); const qc = tmp.querySelector("canvas"); if (qc) x.drawImage(qc, 330, 1085, 240, 240); } catch (e) { }
  x.fillStyle = "#9fb0cc"; x.font = "24px sans-serif"; x.fillText(tr("जोताई, पोरसा, मुरैना (म.प्र.)", "Jotai, Porsa, Morena (M.P.)"), 450, 1362);
}

// ---------- canvas: match poster ----------
export async function drawMatchPoster(cv, m) {
  cv.width = cv.height = 1080; const x = cv.getContext("2d");
  const g = x.createLinearGradient(0, 0, 1080, 1080); g.addColorStop(0, "#0b1d3a"); g.addColorStop(1, "#4c1d95"); x.fillStyle = g; x.fillRect(0, 0, 1080, 1080);
  x.strokeStyle = "#f5b700"; x.lineWidth = 10; x.strokeRect(24, 24, 1032, 1032);
  x.textAlign = "center"; x.fillStyle = "#f5b700"; x.font = "bold 80px sans-serif"; x.fillText("MINI JPL", 540, 125);
  const done = m.status === "done" || !!m.res, inn = innings(m.id);
  x.fillStyle = "#fff"; x.font = "bold 46px sans-serif";
  x.fillText((done ? tr("मैच रिज़ल्ट", "MATCH RESULT") : tr("आज का मैच", "TODAY'S MATCH")) + (m.stage && m.stage !== "league" ? " • " + stageLabel(m.stage) : ""), 540, 195);
  for (const [side, cx] of [["a", 250], ["b", 830]]) {
    const t = teamOf(m[side + "TeamId"]), im = await loadImg(t?.logo);
    x.save(); x.beginPath(); x.arc(cx, 420, 130, 0, Math.PI * 2); x.clip(); x.fillStyle = "#13294f"; x.fillRect(cx - 130, 290, 260, 260);
    if (im) { const s = Math.max(260 / im.width, 260 / im.height); x.drawImage(im, cx - im.width * s / 2, 420 - im.height * s / 2, im.width * s, im.height * s); }
    else { x.fillStyle = "#f5b700"; x.font = "bold 110px sans-serif"; x.fillText((teamLabel(m, side)[0] || "?"), cx, 460); }
    x.restore(); x.strokeStyle = "#f5b700"; x.lineWidth = 8; x.beginPath(); x.arc(cx, 420, 130, 0, Math.PI * 2); x.stroke();
    let fs = 46; x.fillStyle = "#fff"; x.font = `bold ${fs}px sans-serif`; const nm = teamLabel(m, side);
    while (x.measureText(nm).width > 440 && fs > 24) { fs -= 2; x.font = `bold ${fs}px sans-serif`; }
    x.fillText(nm, cx, 620);
    const i = Object.values(inn).find(v => v.teamId === m[side + "TeamId"]);
    if (i) { x.fillStyle = "#f5b700"; x.font = "bold 52px sans-serif"; x.fillText(`${i.runs}/${i.wkts}`, cx, 690); }
  }
  x.fillStyle = "#f5b700"; x.font = "bold 90px sans-serif"; x.fillText("VS", 540, 450);
  x.fillStyle = "#fff"; x.font = "36px sans-serif";
  if (done && resultText(m)) { x.fillStyle = "#f5b700"; x.font = "bold 44px sans-serif"; x.fillText(resultText(m), 540, 780); }
  else x.fillText(`📍 ${m.groundName || "—"}   ⏰ ${fmtWhen(m) || "—"}`, 540, 780);
  const sp = S.sponsors.slice(0, 6);
  if (sp.length) {
    x.fillStyle = "#9fb0cc"; x.font = "26px sans-serif"; x.fillText(tr("हमारे प्रायोजक", "OUR SPONSORS"), 540, 850);
    const ims = await Promise.all(sp.map(s => loadImg(s.logo))); const slot = 960 / sp.length;
    ims.forEach((im, k) => { if (!im) return; const s = Math.min((slot - 20) / im.width, 120 / im.height), w = im.width * s, h = im.height * s; x.fillStyle = "#fff"; x.fillRect(60 + slot * k + slot / 2 - w / 2 - 6, 900 + 60 - h / 2 - 6, w + 12, h + 12); x.drawImage(im, 60 + slot * k + slot / 2 - w / 2, 960 - h / 2, w, h); });
  }
  x.fillStyle = "#9fb0cc"; x.font = "26px sans-serif"; x.fillText(tr("जोताई, पोरसा, मुरैना (म.प्र.)", "Jotai, Porsa, Morena (M.P.)"), 540, 1030);
}
