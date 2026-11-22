const STORAGE_KEY = "digiverso_state_v1";
const MAX_LEVEL = 100;

const DEFAULT_DATA = {
  creatureId: "slime",
  unlockedIds: ["slime"],
  energy: 85,
  bits: 180,
  xp: 0,
  level: 1,
  sleeping: false
};

const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
let data = { ...DEFAULT_DATA, ...savedData };

// Remove atributos antigos: o jogo passa a usar somente ENERGIA.
delete data.hunger;
delete data.health;
delete data.fun;

// Migra o saldo antigo de moedas para o saldo único de MOEDAS, sem perder progresso.
if (Object.prototype.hasOwnProperty.call(savedData, "coins")) {
  data.bits = (Number(data.bits) || 0) + (Number(savedData.coins) || 0);
  delete data.coins;
}

if (!CREATURE_TREE[data.creatureId]) data.creatureId = "slime";

// Garante que saves antigos ou alterados respeitem o limite de nível.
data.level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(Number(data.level) || 1)));
data.xp = Math.max(0, Math.floor(Number(data.xp) || 0));
if (data.level >= MAX_LEVEL) data.xp = 0;

let activeTab = "arena";

const FOODS = [
  { id: "data_berry", name: "Comida 1", cost: 10, energy: 18 },
  { id: "digi_meat", name: "Comida 2", cost: 22, energy: 35 },
  { id: "core_gel", name: "Comida 3", cost: 35, energy: 50 }
];

const ARCADE_GAMES = [
  { name: "JOGO DA VELHA", desc: "Vença e ganhe 10 moedas", path: "minijogos/jogo_da_velha.html" },
  { name: "QUEDA", desc: "Desvie e colete moedas", path: "minijogos/queda.html" },
  { name: "CHUVA VERDE", desc: "Colete as moedas que caem", path: "minijogos/chuva_verde.html" },
  { name: "SNAKE", desc: "Colete moedas e cresça", path: "minijogos/snake.html" },
  { name: "NAVE", desc: "Desvie e colete moedas", path: "minijogos/nave.html" }
];

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function toast(msg) {
  const el = document.getElementById("status-toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.add("hidden"), 2000);
}

function pulseBox() {
  const box = document.getElementById("creature-box");
  box.classList.remove("pulse");
  void box.offsetWidth;
  box.classList.add("pulse");
}

function gainXP(amount) {
  if (data.level >= MAX_LEVEL) {
    data.xp = 0;
    return;
  }

  data.xp += Math.max(0, Number(amount) || 0);
  while (data.level < MAX_LEVEL && data.xp >= data.level * 100) {
    data.xp -= data.level * 100;
    data.level += 1;
    data.bits += 35;
    if (data.level === MAX_LEVEL) {
      data.xp = 0;
      toast("NÍVEL MÁXIMO ALCANÇADO: 100");
    } else {
      toast("NÍVEL " + data.level + " (+35 MOEDAS)");
    }
    DigiAudio.beep(784, 0.18, "triangle");
  }
}

function renderHUD() {
  const noProximoNivel = data.level >= MAX_LEVEL;
  const xpNecessario = noProximoNivel ? 0 : data.level * 100;
  const xpRestante = noProximoNivel ? 0 : Math.max(0, xpNecessario - data.xp);
  const progressoXP = noProximoNivel
    ? 100
    : Math.min(100, (data.xp / xpNecessario) * 100);

  document.getElementById("bar-energy").style.width = data.energy + "%";
  document.getElementById("bits-val").textContent = data.bits;
  document.getElementById("arcade-bits-val").textContent = data.bits;
  document.getElementById("level-val").textContent = data.level;

  const xpValEl = document.getElementById("xp-val");
  const xpNextEl = document.getElementById("xp-next");
  const xpLeftEl = document.getElementById("xp-left");
  const xpBarEl = document.getElementById("bar-xp");
  if (xpValEl) xpValEl.textContent = noProximoNivel ? "MAX" : data.xp;
  if (xpNextEl) xpNextEl.textContent = noProximoNivel ? "MAX" : xpNecessario;
  if (xpLeftEl) {
    xpLeftEl.textContent = noProximoNivel
      ? "NÍVEL MÁXIMO"
      : `Faltam ${xpRestante} XP`;
  }
  if (xpBarEl) xpBarEl.style.width = progressoXP + "%";

  const c = CREATURE_TREE[data.creatureId];
  document.getElementById("creature-stage-label").textContent = c.stage;
  document.getElementById("creature-name").textContent = c.name;
  document.getElementById("creature-file-label").textContent = c.img;

  const imgEl = document.getElementById("creature-img");
  if (imgEl.getAttribute("src") !== c.img) {
    imgEl.src = c.img;
  }
  imgEl.alt = c.name;

  document.body.classList.toggle("sleeping", Boolean(data.sleeping));
  saveData();
}

function renderPanel() {
  const panel = document.getElementById("panel-content");
  const c = CREATURE_TREE[data.creatureId];

  if (activeTab === "arena") {
    panel.innerHTML = `<div class="grid-2">
      <button class="card-btn" onclick="trainPet()">
        <span class="card-title">TREINAR</span>
        <span class="card-sub">-10 ENERGIA | +15 XP</span>
      </button>
    </div>`;
  } else if (activeTab === "nutricao") {
    panel.innerHTML = `<div class="grid-3">${FOODS.map((f, i) => `
      <button class="card-btn" onclick="feedPet(${i})">
        <span class="card-title">${f.name}</span>
        <span class="card-sub">${f.cost} MOEDAS | +${f.energy} ENERGIA</span>
      </button>`).join("")}</div>`;
  } else if (activeTab === "evolucao") {
    const targets = c.evolvesTo || [];
    const evoCards = targets.length
      ? targets.map(tid => {
          const t = CREATURE_TREE[tid];
          const okLevel = data.level >= t.minLevel;
          const okBits = data.bits >= t.costBits;
          const disabled = !okLevel || !okBits;
          return `<button class="card-btn" ${disabled ? "disabled" : ""} onclick="evolveTo('${tid}')">
            <span class="card-title">EVOLUIR PARA ${t.name}</span>
            <span class="card-sub">REQ: NV.${t.minLevel} | ${t.costBits} MOEDAS (${t.img})</span>
          </button>`;
        }).join("")
      : `<div class="card-sub">ESTA LINHA ALCANCAR O ESTAGIO FINAL ATUAL.</div>`;

    const rosterCards = data.unlockedIds.map(uid => {
      const u = CREATURE_TREE[uid];
      const active = uid === data.creatureId;
      return `<button class="card-btn" onclick="switchCreature('${uid}')">
        <span class="card-title">${u.name} ${active ? "[ATIVO]" : ""}</span>
        <span class="card-sub">${u.stage}</span>
      </button>`;
    }).join("");

    panel.innerHTML = `<div class="evo-list">
      <div>${evoCards}</div>
      <div class="card-sub">FORMAS DESBLOQUEADAS:</div>
      <div class="grid-3">${rosterCards}</div>
    </div>`;
  } else if (activeTab === "repouso") {
    panel.innerHTML = `<div class="grid-2">
      <button class="card-btn" onclick="toggleSleep()">
        <span class="card-title">${data.sleeping ? "DESPERTAR" : "MODO REPOUSO"}</span>
        <span class="card-sub">RECUPERA ENERGIA CONTINUAMENTE</span>
      </button>
      <button class="card-btn" onclick="resetSave()">
        <span class="card-title">REINICIAR SAVE</span>
        <span class="card-sub">VOLTA PARA SLIME NV.1</span>
      </button>
    </div>`;
  } else if (activeTab === "minijogos") {
    panel.innerHTML = `<div class="grid-2">${ARCADE_GAMES.map((g, i) => `
      <button class="card-btn" onclick="launchGame(${i})">
        <span class="card-title">${g.name}</span>
        <span class="card-sub">${g.desc}</span>
      </button>`).join("")}</div>`;
  }
}

window.trainPet = () => {
  if (data.sleeping) return toast("EM REPOUSO");
  if (data.energy < 10) return toast("SEM ENERGIA");
  data.energy -= 10;
  gainXP(15);
  pulseBox();
  DigiAudio.beep(600, 0.1, "square");
  renderHUD();
  renderPanel();
};

window.feedPet = (idx) => {
  if (data.sleeping) return toast("EM REPOUSO");
  const f = FOODS[idx];
  if (data.bits < f.cost) return toast("MOEDAS INSUFICIENTES");
  data.bits -= f.cost;
  data.energy = Math.min(100, data.energy + f.energy);
  pulseBox();
  DigiAudio.beep(480, 0.1, "triangle");
  renderHUD();
  renderPanel();
};

window.evolveTo = (targetId) => {
  const t = CREATURE_TREE[targetId];
  if (!t || data.level < t.minLevel || data.bits < t.costBits) return;
  data.bits -= t.costBits;
  data.creatureId = targetId;
  if (!data.unlockedIds.includes(targetId)) {
    data.unlockedIds.push(targetId);
  }
  pulseBox();
  DigiAudio.evolveFanfare();
  toast("EVOLUCAO: " + t.name);
  renderHUD();
  renderPanel();
};

window.switchCreature = (uid) => {
  if (!data.unlockedIds.includes(uid)) return;
  data.creatureId = uid;
  pulseBox();
  DigiAudio.beep(580, 0.1, "sine");
  renderHUD();
  renderPanel();
};

window.toggleSleep = () => {
  data.sleeping = !data.sleeping;
  toast(data.sleeping ? "REPOUSO ATIVO" : "ATIVO");
  renderHUD();
  renderPanel();
};

window.resetSave = () => {
  localStorage.removeItem(STORAGE_KEY);
  data = { ...DEFAULT_DATA, unlockedIds: ["slime"] };
  renderHUD();
  renderPanel();
};

window.launchGame = (idx) => {
  if (data.sleeping) return toast("DESPERTE PRIMEIRO");
  const g = ARCADE_GAMES[idx];
  document.getElementById("arcade-title").textContent = g.name;
  document.getElementById("arcade-frame").src = g.path;
  document.getElementById("arcade-overlay").classList.remove("hidden");
};

document.getElementById("btn-exit-game").addEventListener("click", () => {
  document.getElementById("arcade-frame").src = "about:blank";
  document.getElementById("arcade-overlay").classList.add("hidden");
  renderHUD();
  renderPanel();
});

document.getElementById("creature-box").addEventListener("click", () => {
  if (data.sleeping) return toast("Zzz...");
  gainXP(2);
  pulseBox();
  DigiAudio.beep(660, 0.07, "sine");
  renderHUD();
});

window.addEventListener("message", (ev) => {
  if (ev.data && ev.data.type === "COIN_REWARD") {
    const amount = Math.max(0, Math.floor(Number(ev.data.coins) || 0));
    data.bits = (Number(data.bits) || 0) + amount;
    renderHUD();
    toast("+" + amount + (amount === 1 ? " MOEDA" : " MOEDAS"));
  }
});

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeTab = btn.dataset.tab;
    document.body.className = "zone-" + activeTab + (data.sleeping ? " sleeping" : "");
    renderPanel();
  });
});

setInterval(() => {
  if (data.sleeping) {
    data.energy = Math.min(100, data.energy + 5);
  } else {
    data.energy = Math.max(0, data.energy - 0.8);
  }
  renderHUD();
}, 6000);

renderHUD();
renderPanel();
