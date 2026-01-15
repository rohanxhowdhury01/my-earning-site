/* Top earning – Full local system (static site) */

const LS = {
  loggedIn: "logged_in",
  user: "user_phone",

  // user scoped keys
  points: (u)=> `points:${u}`,
  workers: (u)=> `workers:${u}`,              // JSON array [{id,income,price,ts}]
  workerLimit: (u)=> `wlimit:${u}`,           // number
  dailyCap: (u)=> `cap:${u}`,                 // number
  capLevel: (u)=> `capLevel:${u}`,            // index for cap upgrade
  accrued: (u)=> `accrued:${u}`,              // number
  lastAccrualTs: (u)=> `lastAccTs:${u}`,      // ms
  lastCollectTs: (u)=> `lastCollectTs:${u}`,  // ms

  history: (u)=> `history:${u}`,              // JSON array
  tokenAddr: (u, t)=> `addr:${u}:${t}`,       // string

  // referral
  refTemp: "ref_code_temp",
  refDone: (u)=> `refDone:${u}`,

  // free video
  freeDay: (u)=> `freeDay:${u}`,              // YYYY-MM-DD
  freeCount: (u)=> `freeCount:${u}`,          // number watched today
  freeEarned: (u)=> `freeEarned:${u}`         // points today
};

const TOKENS = [
  { key:"TRX", label:"TRX" },
  { key:"BNB_BEP20", label:"Binance BEP20" },
  { key:"DOGE", label:"Dogecoin" },
  { key:"LTC", label:"Litecoin" },
  { key:"BCH", label:"Bitcoin Cash" },
  { key:"USDT_TRC20", label:"Tether TRC20" },
  { key:"USDT_BEP20", label:"Tether BEP20" },
  { key:"USDT_POLYGON", label:"Tether Polygon" },
  { key:"USDT_SOL", label:"Tether Solana" },
  { key:"BTC", label:"Bitcoin" },
  { key:"TON", label:"TON" },
  { key:"SOL", label:"Solana" },
  { key:"MATIC", label:"MATIC" },
  { key:"ETH", label:"Ethereum" }
];

// Worker shop packages (income/day, price points)
const WORKER_PACKS = [
  { name:"Worker S", income: 10, price: 250 },
  { name:"Worker M", income: 20, price: 480 },
  { name:"Worker Pro", income: 50, price: 1100 },
  { name:"Worker Ultra", income: 100, price: 2000 },   // user fixed
  { name:"Worker 200", income: 200, price: 3600 },
  { name:"Worker 500", income: 500, price: 8000 },
  { name:"Worker 1K", income: 1000, price: 14000 },
  { name:"Worker 2K", income: 2000, price: 24000 },
  { name:"Worker 5K", income: 5000, price: 50000 },
  { name:"Worker 10K", income: 10000, price: 85000 },
  { name:"Worker 20K", income: 20000, price: 140000 },
  { name:"Worker 50K", income: 50000, price: 280000 },
  { name:"Worker 100K", income: 100000, price: 480000 }
];

// Daily cap upgrade levels (index-based)
const CAP_LEVELS = [
  { from: 500, to: 1000, cost: 300 },
  { from: 1000, to: 2000, cost: 700 },
  { from: 2000, to: 5000, cost: 1500 },
  { from: 5000, to: 10000, cost: 2800 },
  { from: 10000, to: 20000, cost: 4500 },
  { from: 20000, to: 50000, cost: 9000 },
  { from: 50000, to: 100000, cost: 15000 }
];

// Worker limit upgrade (user fixed: 500 -> 1000 cost 300)
const LIMIT_UPGRADE = { from: 500, to: 1000, cost: 300 };

// Free video settings
const FREE_PER_VIDEO = 40;
const FREE_DAILY_LIMIT = 10;

// ------------- helpers -------------
function $(id){ return document.getElementById(id); }
function now(){ return Date.now(); }
function toInt(x){ return parseInt(x,10) || 0; }
function fmt(n){ return (n||0).toLocaleString("en-US"); }

function getUser(){ return localStorage.getItem(LS.user) || ""; }
function isLoggedIn(){ return localStorage.getItem(LS.loggedIn) === "true"; }

function getJSON(key, fallback){
  try{
    const v = localStorage.getItem(key);
    if(!v) return fallback;
    return JSON.parse(v);
  }catch(e){ return fallback; }
}
function setJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function getPoints(u){ return toInt(localStorage.getItem(LS.points(u))); }
function setPoints(u, v){ localStorage.setItem(LS.points(u), String(Math.max(0, toInt(v)))); }

function getWorkers(u){ return getJSON(LS.workers(u), []); }
function setWorkers(u, arr){ setJSON(LS.workers(u), arr); }

function getWorkerLimit(u){
  const v = localStorage.getItem(LS.workerLimit(u));
  return v ? toInt(v) : 500;
}
function setWorkerLimit(u, v){ localStorage.setItem(LS.workerLimit(u), String(toInt(v))); }

function getDailyCap(u){
  const v = localStorage.getItem(LS.dailyCap(u));
  return v ? toInt(v) : 500;
}
function setDailyCap(u, v){ localStorage.setItem(LS.dailyCap(u), String(toInt(v))); }

function getCapLevel(u){
  const v = localStorage.getItem(LS.capLevel(u));
  return v ? toInt(v) : 0;
}
function setCapLevel(u, idx){ localStorage.setItem(LS.capLevel(u), String(toInt(idx))); }

function getAccrued(u){ return toInt(localStorage.getItem(LS.accrued(u))); }
function setAccrued(u, v){ localStorage.setItem(LS.accrued(u), String(Math.max(0, toInt(v)))); }

function getLastAccTs(u){
  const v = localStorage.getItem(LS.lastAccrualTs(u));
  return v ? toInt(v) : now();
}
function setLastAccTs(u, ts){ localStorage.setItem(LS.lastAccrualTs(u), String(toInt(ts))); }

function getLastCollectTs(u){
  const v = localStorage.getItem(LS.lastCollectTs(u));
  return v ? toInt(v) : 0;
}
function setLastCollectTs(u, ts){ localStorage.setItem(LS.lastCollectTs(u), String(toInt(ts))); }

function getHistory(u){ return getJSON(LS.history(u), []); }
function setHistory(u, arr){ setJSON(LS.history(u), arr); }

function pushHistory(u, item){
  const hist = getHistory(u);
  hist.unshift(item);
  if(hist.length > 300) hist.pop();
  setHistory(u, hist);
}

function formatTime(ts){
  if(!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString();
}

function todayKey(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const da = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}

// ------------- referral capture from url (index page) -------------
(function captureReferral(){
  try{
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if(ref) localStorage.setItem(LS.refTemp, ref);
  }catch(e){}
})();

// ------------- index page logic -------------
(function initIndex(){
  // already logged in => go dashboard
  if(document.title === "Top earning"){
    // random chips
    const on = Math.floor(Math.random()*500)+120;
    const wk = Math.floor(Math.random()*200)+60;
    const co = $("chipOnline");
    const cw = $("chipWorkers");
    if(co) co.textContent = `Online: ${on}`;
    if(cw) cw.textContent = `Workers: ${wk}`;

    if(isLoggedIn()){
      window.location.href = "dashboard.html";
      return;
    }

    const btn = $("btnLogin");
    if(btn){
      btn.addEventListener("click", login);
    }
  }
})();

function login(){
  const phone = ($("phone")?.value || "").trim();
  const password = ($("password")?.value || "").trim();

  if(!phone || !password){
    alert("Username এবং Password দিন!");
    return;
  }

  localStorage.setItem(LS.user, phone);
  localStorage.setItem(LS.loggedIn, "true");

  // init user data
  if(!localStorage.getItem(LS.points(phone))){
    setPoints(phone, 5000);
    pushHistory(phone, {
      type: "income",
      title: "New account bonus",
      amount: 5000,
      balance: getPoints(phone),
      ts: now()
    });
  }

  // referral bonus once
  const ref = localStorage.getItem(LS.refTemp);
  if(ref && ref !== phone && localStorage.getItem(LS.refDone(phone)) !== "1"){
    setPoints(phone, getPoints(phone) + 500);
    localStorage.setItem(LS.refDone(phone), "1");
    localStorage.removeItem(LS.refTemp);

    pushHistory(phone, {
      type: "income",
      title: "Referral bonus",
      amount: 500,
      balance: getPoints(phone),
      ts: now()
    });
  }

  // init defaults if missing
  if(!localStorage.getItem(LS.workerLimit(phone))) setWorkerLimit(phone, 500);
  if(!localStorage.getItem(LS.dailyCap(phone))) setDailyCap(phone, 500);
  if(!localStorage.getItem(LS.capLevel(phone))) setCapLevel(phone, 0);
  if(!localStorage.getItem(LS.lastAccrualTs(phone))) setLastAccTs(phone, now());
  if(!localStorage.getItem(LS.accrued(phone))) setAccrued(phone, 0);

  window.location.href = "dashboard.html";
}

// ------------- dashboard init -------------
(function initDashboard(){
  if(!document.title.includes("Dashboard")) return;

  if(!isLoggedIn()){
    window.location.href = "index.html";
    return;
  }

  const u = getUser();

  // header chips
  const on = Math.floor(Math.random()*800)+180;
  const wk = Math.floor(Math.random()*250)+80;
  $("chipOnline").textContent = `Online: ${on}`;
  $("chipWorkers").textContent = `Workers: ${wk}`;

  // logout
  $("btnLogout").addEventListener("click", ()=>{
    localStorage.removeItem(LS.loggedIn);
    // keep user for remember? user wanted direct login next time, so keep loggedIn only.
    // But logout should force login.
    window.location.href = "index.html";
  });

  // tabs
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".tab").forEach(b=> b.classList.remove("active"));
      btn.classList.add("active");

      const tab = btn.getAttribute("data-tab");
      document.querySelectorAll(".tabPane").forEach(p=> p.classList.add("hidden"));
      $(`tab-${tab}`).classList.remove("hidden");

      // refresh visible tab data
      refreshAll();
    });
  });

  // buttons
  $("btnCollect").addEventListener("click", collectNow);
  $("btnLimitUp").addEventListener("click", upgradeLimit);
  $("btnCapUp").addEventListener("click", upgradeCap);
  $("btnWatch").addEventListener("click", watchVideoEarn);
  $("btnWithdraw").addEventListener("click", doWithdraw);

  // topup copy
  document.querySelectorAll("[data-copy]").forEach(b=>{
    b.addEventListener("click", async ()=>{
      const id = b.getAttribute("data-copy");
      const txt = ($(id)?.textContent || "").trim();
      try{
        await navigator.clipboard.writeText(txt);
        b.textContent = "Copied";
        setTimeout(()=> b.textContent="Copy", 900);
      }catch(e){
        alert("Copy failed");
      }
    });
  });

  // render shop
  renderShop();

  // render token list + select
  renderTokens();

  // initial refresh + start accrual tick
  refreshAll();
  setInterval(()=>{
    accruePointsTick();
    // update small fields
    updateAccruedUI();
  }, 1000);
})();

function effectiveIncomePerDay(u){
  const workers = getWorkers(u);
  const sum = workers.reduce((a,w)=> a + toInt(w.income), 0);
  const cap = getDailyCap(u);
  return Math.min(sum, cap);
}

function accruePointsTick(){
  const u = getUser();
  if(!u) return;

  // accrue based on elapsed time since last accrual
  const eff = effectiveIncomePerDay(u);
  const ratePerSec = eff / 86400; // 24h
  const lastTs = getLastAccTs(u);
  const t = now();
  const dtSec = Math.max(0, (t - lastTs) / 1000);

  if(dtSec <= 0 || eff <= 0){
    setLastAccTs(u, t);
    return;
  }

  let accrued = getAccrued(u);
  accrued += Math.floor(ratePerSec * dtSec);
  // cap to 24h max = eff
  accrued = Math.min(accrued, eff);

  setAccrued(u, accrued);
  setLastAccTs(u, t);
}

function collectNow(){
  const u = getUser();
  const accrued = getAccrued(u);
  if(accrued <= 0){
    alert("Collect করার মতো points নেই");
    return;
  }

  const before = getPoints(u);
  const after = before + accrued;
  setPoints(u, after);

  setAccrued(u, 0);
  setLastCollectTs(u, now());
  setLastAccTs(u, now());

  pushHistory(u, {
    type: "income",
    title: "Collect",
    amount: accrued,
    balance: after,
    ts: now()
  });

  refreshAll();
}

function renderShop(){
  const box = $("shopList");
  if(!box) return;
  box.innerHTML = "";

  WORKER_PACKS.forEach((p)=>{
    const div = document.createElement("div");
    div.className = "shopItem";
    div.innerHTML = `
      <div class="shopTop">
        <div>
          <div class="shopName">${p.name}</div>
          <div class="shopMeta">Income/day: <b>${fmt(p.income)}</b></div>
        </div>
        <div class="right">
          <div class="price">${fmt(p.price)}</div>
          <div class="shopMeta">points</div>
        </div>
      </div>
      <button class="btn primary shopBtn">Buy</button>
    `;
    div.querySelector("button").addEventListener("click", ()=> buyWorkerPack(p));
    box.appendChild(div);
  });
}

function buyWorkerPack(pack){
  const u = getUser();
  const points = getPoints(u);

  const limit = getWorkerLimit(u);
  const workers = getWorkers(u);
  if(workers.length >= limit){
    alert(`Worker limit full (${workers.length}/${limit}). Limit বাড়াতে হবে।`);
    return;
  }

  if(points < pack.price){
    alert("Points যথেষ্ট নেই");
    return;
  }

  const after = points - pack.price;
  setPoints(u, after);

  workers.push({
    id: `W-${Math.random().toString(16).slice(2,8).toUpperCase()}`,
    income: pack.income,
    price: pack.price,
    ts: now()
  });
  setWorkers(u, workers);

  pushHistory(u, {
    type: "expense",
    title: `Buy worker (${pack.name})`,
    amount: -pack.price,
    balance: after,
    ts: now()
  });

  refreshAll();
}

function upgradeLimit(){
  const u = getUser();
  const cur = getWorkerLimit(u);

  if(cur >= LIMIT_UPGRADE.to){
    alert(`Limit already ${cur}`);
    return;
  }
  if(cur !== LIMIT_UPGRADE.from){
    alert("Limit upgrade বর্তমানে শুধু 500 → 1000");
    return;
  }

  const p = getPoints(u);
  if(p < LIMIT_UPGRADE.cost){
    alert("Points যথেষ্ট নেই");
    return;
  }

  const after = p - LIMIT_UPGRADE.cost;
  setPoints(u, after);
  setWorkerLimit(u, LIMIT_UPGRADE.to);

  pushHistory(u, {
    type: "expense",
    title: `Increase worker limit (${LIMIT_UPGRADE.from} → ${LIMIT_UPGRADE.to})`,
    amount: -LIMIT_UPGRADE.cost,
    balance: after,
    ts: now()
  });

  refreshAll();
}

function upgradeCap(){
  const u = getUser();
  let idx = getCapLevel(u);
  if(idx >= CAP_LEVELS.length){
    alert("Cap already max");
    return;
  }

  const step = CAP_LEVELS[idx];
  const cur = getDailyCap(u);
  // keep in sync
  if(cur !== step.from){
    // try to find correct step by current cap
    const found = CAP_LEVELS.findIndex(s=> s.from === cur);
    idx = found >= 0 ? found : idx;
  }

  const st = CAP_LEVELS[idx];
  if(!st){
    alert("Cap upgrade not available");
    return;
  }

  const p = getPoints(u);
  if(p < st.cost){
    alert("Points যথেষ্ট নেই");
    return;
  }

  const after = p - st.cost;
  setPoints(u, after);
  setDailyCap(u, st.to);
  setCapLevel(u, idx+1);

  pushHistory(u, {
    type: "expense",
    title: `Increase daily cap (${st.from} → ${st.to})`,
    amount: -st.cost,
    balance: after,
    ts: now()
  });

  // accrued max changed, keep accrued within new cap
  const eff = effectiveIncomePerDay(u);
  setAccrued(u, Math.min(getAccrued(u), eff));
  setLastAccTs(u, now());

  refreshAll();
}

function renderTokens(){
  const list = $("tokenList");
  const sel = $("wdToken");
  if(!list || !sel) return;

  list.innerHTML = "";
  sel.innerHTML = "";

  TOKENS.forEach(t=>{
    // select option
    const op = document.createElement("option");
    op.value = t.key;
    op.textContent = t.label;
    sel.appendChild(op);

    // token row
    const row = document.createElement("div");
    row.className = "tokenRow";

    row.innerHTML = `
      <div class="tokenHead">
        <div class="tokenName">${t.label}</div>
        <div class="badge">${t.key}</div>
      </div>
      <div class="saveRow">
        <input type="text" placeholder="Enter your ${t.label} address" id="addrInp_${t.key}">
        <button class="btn ghost" id="saveBtn_${t.key}">Save</button>
      </div>
      <div class="muted" id="saved_${t.key}"></div>
    `;

    list.appendChild(row);

    // load saved
    const u = getUser();
    const saved = localStorage.getItem(LS.tokenAddr(u, t.key)) || "";
    const inp = $(`addrInp_${t.key}`);
    inp.value = saved;

    updateSavedText(t.key);

    $(`saveBtn_${t.key}`).addEventListener("click", ()=>{
      const u2 = getUser();
      const v = (inp.value || "").trim();
      localStorage.setItem(LS.tokenAddr(u2, t.key), v);
      updateSavedText(t.key);

      pushHistory(u2, {
        type: "info",
        title: `Saved address (${t.label})`,
        amount: 0,
        balance: getPoints(u2),
        ts: now()
      });

      alert("Saved");
    });
  });
}

function updateSavedText(tokenKey){
  const u = getUser();
  const t = TOKENS.find(x=> x.key === tokenKey);
  const saved = localStorage.getItem(LS.tokenAddr(u, tokenKey)) || "";
  const el = $(`saved_${tokenKey}`);
  if(!el) return;
  el.textContent = saved ? `Saved: ${saved}` : `No address saved`;
}

function doWithdraw(){
  const u = getUser();
  const tokenKey = $("wdToken").value;
  const token = TOKENS.find(t=> t.key === tokenKey);
  const amount = toInt($("wdAmount").value);

  const msg = $("wdMsg");
  msg.textContent = "";

  if(amount <= 0){
    msg.textContent = "Valid amount দিন";
    return;
  }

  const p = getPoints(u);
  if(p < 50000){
    msg.textContent = "Minimum withdraw 50,000 points";
    return;
  }
  if(amount > p){
    msg.textContent = "Points যথেষ্ট নেই";
    return;
  }

  const addr = (localStorage.getItem(LS.tokenAddr(u, tokenKey)) || "").trim();
  if(!addr){
    msg.textContent = "এই token এর address আগে save করুন";
    return;
  }

  // deduct and mark processing
  const after = p - amount;
  setPoints(u, after);

  const tx = makeTxId();
  pushHistory(u, {
    type: "withdraw",
    title: `Withdraw (${token?.label || tokenKey})`,
    amount: -amount,
    balance: after,
    status: "Processing",
    tx: maskTx(tx),
    ts: now()
  });

  msg.textContent = `Processing... (TX: ${maskTx(tx)})`;
  refreshAll();
}

function makeTxId(){
  return `TX-${Math.random().toString(16).slice(2,6).toUpperCase()}-${Math.random().toString(16).slice(2,6).toUpperCase()}-${Math.random().toString(16).slice(2,6).toUpperCase()}`;
}
function maskTx(tx){
  // hide middle 4 characters as requested style
  // example: TX-ABCD-xxxx-EF12
  const parts = tx.split("-");
  if(parts.length >= 4){
    return `${parts[0]}-${parts[1]}-xxxx-${parts[3]}`;
  }
  return tx.slice(0,4) + "xxxx" + tx.slice(-4);
}

// ------------- free video earn -------------
function ensureFreeDay(u){
  const t = todayKey();
  const saved = localStorage.getItem(LS.freeDay(u));
  if(saved !== t){
    localStorage.setItem(LS.freeDay(u), t);
    localStorage.setItem(LS.freeCount(u), "0");
    localStorage.setItem(LS.freeEarned(u), "0");
  }
}
function watchVideoEarn(){
  const u = getUser();
  ensureFreeDay(u);

  const count = toInt(localStorage.getItem(LS.freeCount(u)));
  if(count >= FREE_DAILY_LIMIT){
    alert("আজকের limit শেষ");
    return;
  }

  // add points instantly
  const before = getPoints(u);
  const after = before + FREE_PER_VIDEO;
  setPoints(u, after);

  localStorage.setItem(LS.freeCount(u), String(count+1));
  const earned = toInt(localStorage.getItem(LS.freeEarned(u))) + FREE_PER_VIDEO;
  localStorage.setItem(LS.freeEarned(u), String(earned));

  pushHistory(u, {
    type: "income",
    title: "Video reward",
    amount: FREE_PER_VIDEO,
    balance: after,
    ts: now()
  });

  refreshAll();
}

// ------------- leaderboard (local activity board) -------------
function buildLeaderboard(u){
  const youIncome = effectiveIncomePerDay(u);
  const youWorkers = getWorkers(u).length;

  // Make a moving list (changes over time) but for display only
  const seed = Math.floor(now() / (1000 * 60 * 30)); // changes every 30 min
  const rand = mulberry32(seed);

  const names = [
    "alpha_whale","hash_master","rig_king","pool_vip","fast_miner","blue_titan","nova_stack",
    "sky_runner","mint_lord","prime_node","coin_sailor","rapid_gear","vault_hunter","chain_captain"
  ];

  const rows = [];
  for(let i=0;i<10;i++){
    const nm = names[Math.floor(rand()*names.length)] + "_" + Math.floor(rand()*99);
    const workers = 99 + Math.floor(rand()*400);
    const income = 8000 + Math.floor(rand()*17000); // 8k..25k
    rows.push({ user:nm, workers, income, you:false });
  }

  // Insert you somewhere not always same
  const pos = 3 + Math.floor(rand()*5); // 3..7
  rows.splice(pos, 0, {
    user: `${u} (you)`,
    workers: youWorkers,
    income: youIncome,
    you:true
  });

  // sort by income desc but small random wobble
  rows.forEach(r=>{
    r.sortKey = r.income + Math.floor((rand()-0.5)*800);
  });
  rows.sort((a,b)=> b.sortKey - a.sortKey);

  return rows.slice(0, 12);
}

function mulberry32(a){
  return function(){
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ------------- UI refresh -------------
function refreshAll(){
  const u = getUser();
  if(!u) return;

  // accrue once on refresh
  accruePointsTick();

  // summary
  $("userPhone").textContent = u;
  $("points").textContent = fmt(getPoints(u));

  const w = getWorkers(u);
  const wLimit = getWorkerLimit(u);
  $("workerCount").textContent = fmt(w.length);
  $("workerLimit").textContent = fmt(wLimit);

  const cap = getDailyCap(u);
  $("dailyCap").textContent = fmt(cap);

  const effIncome = effectiveIncomePerDay(u);
  $("incomePerDay").textContent = fmt(effIncome);

  // cap upgrade text
  const idx = getCapLevel(u);
  if(idx >= CAP_LEVELS.length){
    $("capLevelText").textContent = `${fmt(cap)} → MAX`;
    $("capCostText").textContent = "—";
    $("btnCapUp").disabled = true;
    $("btnCapUp").style.opacity = 0.6;
  }else{
    // find matching step from current cap if possible
    const step = CAP_LEVELS.find(s=> s.from === cap) || CAP_LEVELS[idx];
    $("capLevelText").textContent = `${fmt(step.from)} → ${fmt(step.to)}`;
    $("capCostText").textContent = fmt(step.cost);
    $("btnCapUp").disabled = false;
    $("btnCapUp").style.opacity = 1;
  }

  // limit upgrade availability
  const canLimitUp = (wLimit === LIMIT_UPGRADE.from);
  $("btnLimitUp").disabled = !canLimitUp;
  $("btnLimitUp").style.opacity = canLimitUp ? 1 : 0.6;

  // accrued UI
  updateAccruedUI();

  // worker list UI
  const list = $("myWorkerList");
  if(list){
    list.innerHTML = "";
    if(w.length === 0){
      const empty = document.createElement("div");
      empty.className = "notice";
      empty.textContent = "এখনো কোনো worker কেনা হয়নি। Shop থেকে worker কিনো।";
      list.appendChild(empty);
    }else{
      w.slice().reverse().slice(0, 25).reverse().forEach((it)=>{
        const item = document.createElement("div");
        item.className = "listItem";
        item.innerHTML = `
          <div>
            <div class="shopName">${it.id}</div>
            <div class="muted">Income/day: <b>${fmt(it.income)}</b></div>
          </div>
          <div class="badge">${fmt(it.price)} pts</div>
        `;
        list.appendChild(item);
      });
    }
  }

  // history UI
  renderHistory();

  // free UI
  renderFreeUI();

  // leaderboard UI
  renderLeaderboard();
}

function updateAccruedUI(){
  const u = getUser();
  const eff = effectiveIncomePerDay(u);
  const ratePerSec = eff / 86400;
  const accrued = Math.min(getAccrued(u), eff);

  $("accrued").textContent = fmt(accrued);
  $("accruedMax").textContent = fmt(eff);
  $("rateText").textContent = `Rate: ${ratePerSec.toFixed(4)}/sec`;
  $("lastCollect").textContent = formatTime(getLastCollectTs(u));
}

function renderHistory(){
  const u = getUser();
  const box = $("historyList");
  if(!box) return;

  const hist = getHistory(u);
  box.innerHTML = "";

  if(hist.length === 0){
    const empty = document.createElement("div");
    empty.className = "notice";
    empty.textContent = "History খালি।";
    box.appendChild(empty);
    return;
  }

  hist.slice(0, 120).forEach(h=>{
    const div = document.createElement("div");
    div.className = "hItem";

    const amt = toInt(h.amount);
    const amtClass = amt >= 0 ? "hAmtPlus" : "hAmtMinus";

    const extra = h.type === "withdraw"
      ? `<div class="hMeta">Status: <b>${h.status || "Processing"}</b> • TX: <b>${h.tx || ""}</b></div>`
      : "";

    div.innerHTML = `
      <div class="hTop">
        <div class="hTitle">${h.title}</div>
        <div class="hTime">${formatTime(h.ts)}</div>
      </div>
      <div class="hMeta">
        Amount: <span class="${amtClass}">${amt >= 0 ? "+" : ""}${fmt(amt)}</span>
        • Balance: <b>${fmt(h.balance)}</b>
      </div>
      ${extra}
    `;
    box.appendChild(div);
  });
}

function renderFreeUI(){
  const u = getUser();
  ensureFreeDay(u);

  const count = toInt(localStorage.getItem(LS.freeCount(u)));
  const earned = toInt(localStorage.getItem(LS.freeEarned(u)));

  $("freeLimit").textContent = String(FREE_DAILY_LIMIT);
  $("freeRemain").textContent = String(Math.max(0, FREE_DAILY_LIMIT - count));
  $("freeEarned").textContent = fmt(earned);
}

function renderLeaderboard(){
  const u = getUser();
  const rows = buildLeaderboard(u);
  const body = $("lbBody");
  if(!body) return;

  body.innerHTML = "";
  rows.forEach((r, i)=>{
    const div = document.createElement("div");
    div.className = "tRow" + (r.you ? " you" : "");
    div.innerHTML = `
      <div>${i+1}</div>
      <div>${r.user}</div>
      <div class="right">${fmt(r.workers)}</div>
      <div class="right">${fmt(r.income)}</div>
    `;
    body.appendChild(div);
  });
    }
