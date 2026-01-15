// =====================
// Helpers
// =====================
function $(id){ return document.getElementById(id); }
function toInt(v){ return parseInt(v, 10) || 0; }

function getPhone(){
  return localStorage.getItem("user_phone") || "";
}
function isLoggedIn(){
  return localStorage.getItem("logged_in") === "true";
}

function pointsKey(phone){ return "points_" + phone; }
function workersKey(phone){ return "workers_" + phone; }
function refStatusKey(phone){ return "ref_by_" + phone; } // pending/done
const DEVICE_LOCK_KEY = "device_locked_user"; // same phone lock

function getPoints(phone){
  return toInt(localStorage.getItem(pointsKey(phone)));
}
function setPoints(phone, p){
  localStorage.setItem(pointsKey(phone), String(p));
}
function getWorkers(phone){
  return toInt(localStorage.getItem(workersKey(phone)));
}
function setWorkers(phone, w){
  localStorage.setItem(workersKey(phone), String(w));
}

// =====================
// FULL SCREEN LOCK POPUP (Background Hidden)
// =====================
function showLockOverlay(seconds = 8){
  const overlay = document.getElementById("lockOverlay");
  const btn = document.getElementById("lockBtn");
  if(!overlay || !btn) return;

  overlay.style.display = "flex";
  document.body.style.overflow = "hidden";

  let left = seconds;
  btn.disabled = true;
  btn.textContent = `Close (${left}s)`;

  const t = setInterval(() => {
    left--;
    if(left > 0){
      btn.textContent = `Close (${left}s)`;
    } else {
      clearInterval(t);
      btn.disabled = false;
      btn.textContent = "Close";
      btn.onclick = () => {
        overlay.style.display = "none";
        document.body.style.overflow = "auto";
      };
    }
  }, 1000);
}

// =====================
// Referral capture (index page load)
// =====================
(function captureReferralFromURL(){
  const url = new URL(window.location.href);
  const ref = url.searchParams.get("ref");
  if(ref){
    localStorage.setItem("ref_code_temp", ref);
  }
})();

// =====================
// Login
// =====================
function login(){
  const phone = $("phone").value.trim();
  const password = $("password").value.trim();

  if(!phone || !password){
    alert("Phone & Password fill up কর!");
    return;
  }

  // show lock overlay first (hide background)
  showLockOverlay(8);

  // Same device -> only 1 ID (demo lock)
  const locked = localStorage.getItem(DEVICE_LOCK_KEY);
  if(locked && locked !== phone){
    alert("❌ এই ফোন/ডিভাইসে আগেই অন্য ID খোলা আছে। নতুন ID খুলতে পারবে না।");
    return;
  }
  localStorage.setItem(DEVICE_LOCK_KEY, phone);

  // Session
  localStorage.setItem("user_phone", phone);
  localStorage.setItem("logged_in", "true");

  // New user bonus: 5000 points
  if(!localStorage.getItem(pointsKey(phone))){
    setPoints(phone, 5000);
  }

  // Apply referral bonus once (+500) if came via link
  const tempRef = localStorage.getItem("ref_code_temp");
  if(tempRef && tempRef !== phone){
    if(localStorage.getItem(refStatusKey(phone)) !== "done"){
      localStorage.setItem(refStatusKey(phone), "pending");
    }
    localStorage.removeItem("ref_code_temp");
  }

  // If pending, add +500
  if(localStorage.getItem(refStatusKey(phone)) === "pending"){
    setPoints(phone, getPoints(phone) + 500);
    localStorage.setItem(refStatusKey(phone), "done");
  }

  // after 8s redirect to dashboard
  setTimeout(()=>{
    window.location.href = "dashboard.html";
  }, 8000);
}

// =====================
// Dashboard init
// =====================
function dashboardInit(){
  if(!isLoggedIn()){
    window.location.href = "index.html";
    return;
  }

  const phone = getPhone();
  $("userPhone").innerText = phone;

  // Fake stats
  $("online").innerText = String(Math.floor(Math.random()*500)+120);
  $("workersGlobal").innerText = String(Math.floor(Math.random()*200)+60);

  // Referral link (auto)
  const base = window.location.origin + window.location.pathname.replace("dashboard.html","index.html");
  const refLink = base + "?ref=" + encodeURIComponent(phone);
  $("refLink").innerText = refLink;

  renderPoints();
  renderWorkers();

  // Auto income: every 10s add workers*5 points
  setInterval(()=>{
    const w = getWorkers(phone);
    if(w > 0){
      setPoints(phone, getPoints(phone) + (w * 5));
      renderPoints();
    }
  }, 10000);
}

function renderPoints(){
  const phone = getPhone();
  $("points").innerText = String(getPoints(phone));
}
function renderWorkers(){
  const phone = getPhone();
  $("myWorkers").innerText = String(getWorkers(phone));
}

function copyRef(){
  const txt = $("refLink").innerText;
  navigator.clipboard.writeText(txt);
  alert("✅ Referral Link Copied!");
}

function buyWorker(){
  const phone = getPhone();
  const w = getWorkers(phone) + 1;
  setWorkers(phone, w);
  renderWorkers();
  alert("✅ Worker Purchased! (Auto income চালু)");
}

function withdraw(){
  const phone = getPhone();
  const amount = toInt($("withdrawAmount").value);
  const p = getPoints(phone);

  if(amount <= 0){
    $("withdrawMsg").innerText = "❌ Valid points লিখ!";
    return;
  }

  if(p < 50000){
    $("withdrawMsg").innerText = "❌ Withdraw করতে হলে Minimum 50,000 points লাগবে!";
    return;
  }

  if(amount > p){
    $("withdrawMsg").innerText = "❌ আপনার পয়েন্ট যথেষ্ট না!";
    return;
  }

  setPoints(phone, p - amount);
  renderPoints();
  $("withdrawMsg").innerText = "✅ Withdraw Request Submitted! (" + amount + " Points)";
}

function logout(){
  localStorage.removeItem("logged_in");
  localStorage.removeItem("user_phone");
  window.location.href = "index.html";
}
