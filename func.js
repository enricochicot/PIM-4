/* ══════════════════════════════════════════════════════════
   CONSTANTS & CONFIG
══════════════════════════════════════════════════════════ */
const STORAGE_KEY = 'reciclapetData_v2';

// Peso médio por tipo (em gramas)
const BOTTLE_WEIGHTS = {
  pet_small:  25,
  pet_medium: 35,
  pet_large:  55,
  pet_gallon: 130,
};

// Pontos por garrafa por tipo
const POINTS_PER_BOTTLE = {
  pet_small:  5,
  pet_medium: 8,
  pet_large:  12,
  pet_gallon: 25,
};

const BOTTLE_LABELS = {
  pet_small:  'PET Pequena',
  pet_medium: 'PET Média',
  pet_large:  'PET Grande',
  pet_gallon: 'Galão',
};

const COLLECT_ICONS = {
  home:       '🏠',
  store:      '🏪',
  ecostation: '♻️',
  school:     '🏫',
};

// Níveis gamificados
const LEVELS = [
  { name: '🌱 Plantinha',    min: 0,    max: 100  },
  { name: '🌿 Eco Amigo',    min: 100,  max: 300  },
  { name: '♻️ Reciclador',   min: 300,  max: 700  },
  { name: '🦋 Guardião',     min: 700,  max: 1500 },
  { name: '🌊 Eco Herói',    min: 1500, max: 3000 },
  { name: '🌍 Lenda Verde',  min: 3000, max: Infinity },
];

// Catálogo de recompensas
const REWARDS = [
  { id: 'r1', emoji: '🥤', name: '5% OFF Bebidas',  desc: 'Desconto em bebidas FEMSA', cost: 100 },
  { id: 'r2', emoji: '👕', name: 'Camiseta Eco',    desc: 'Edição limitada ReciclaPET', cost: 500 },
  { id: 'r3', emoji: '🛒', name: '10% no Mercado',  desc: 'Desconto em supermercados parceiros', cost: 750 },
  { id: 'r4', emoji: '🎒', name: 'Kit Sustentável', desc: 'Garrafa + sacola reutilizáveis', cost: 1200 },
  { id: 'r5', emoji: '🏕️', name: 'Acampamento Eco', desc: 'Vaga em evento de voluntariado', cost: 2000 },
  { id: 'r6', emoji: '✈️', name: 'Viagem Verde',    desc: 'Sorteio para retiro ecológico', cost: 5000 },
];

/* ══════════════════════════════════════════════════════════
   STATE MANAGEMENT
══════════════════════════════════════════════════════════ */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return JSON.parse(raw);
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Storage error:', e);
  }
}

function defaultState() {
  return {
    points:   0,
    bottles:  0,
    kgSaved:  0,
    history:  [],
    coupons:  [],
    // Simulate community with random seed
    globalUsers:   Math.floor(Math.random() * 800) + 1200,
    globalBottles: Math.floor(Math.random() * 50000) + 80000,
    globalKg:      0,
  };
}

function normalizeState(rawState) {
  const base = defaultState();
  const safe = rawState && typeof rawState === 'object' ? rawState : {};

  const toFloat = (v, fallback = 0) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v !== 'string') return fallback;

    const s = v.trim();
    if (!s) return fallback;

    // Handles pt-BR thousands/decimal formats like 1.234,56
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
      const n = Number(s.replace(/\./g, '').replace(',', '.'));
      return Number.isFinite(n) ? n : fallback;
    }

    // Handles en-US thousands/decimal formats like 1,234.56
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
      const n = Number(s.replace(/,/g, ''));
      return Number.isFinite(n) ? n : fallback;
    }

    const n = Number(s.replace(',', '.'));
    return Number.isFinite(n) ? n : fallback;
  };

  const toInt = (v, fallback = 0) => {
    if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
    if (typeof v !== 'string') return fallback;
    const digits = v.replace(/\D/g, '');
    if (!digits) return fallback;
    const n = Number(digits);
    return Number.isFinite(n) ? n : fallback;
  };

  return {
    ...base,
    ...safe,
    points: Math.max(0, toInt(safe.points, base.points)),
    bottles: Math.max(0, toInt(safe.bottles, base.bottles)),
    kgSaved: Math.max(0, toFloat(safe.kgSaved, base.kgSaved)),
    globalUsers: Math.max(0, toInt(safe.globalUsers, base.globalUsers)),
    globalBottles: Math.max(0, toInt(safe.globalBottles, base.globalBottles)),
    globalKg: Math.max(0, toFloat(safe.globalKg, base.globalKg)),
    history: Array.isArray(safe.history) ? safe.history : [],
    coupons: Array.isArray(safe.coupons) ? safe.coupons : [],
  };
}

let state = normalizeState(loadState());

// Persist normalized state to migrate older localStorage payloads
saveState(state);

// Calculate derived globalKg from globalBottles if missing
if (!state.globalKg) {
  state.globalKg = Math.round(state.globalBottles * 0.04);
  saveState(state);
}

function generateCouponCode(rewardId) {
  const seed = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RCP-${rewardId.toUpperCase()}-${seed.slice(-4)}${rand}`;
}

/* ══════════════════════════════════════════════════════════
   CORE LOGIC
══════════════════════════════════════════════════════════ */

/**
 * Register a new collection from the form
 */
function registerCollection() {
  const name       = document.getElementById('userName').value.trim();
  const countRaw   = document.getElementById('bottleCount').value;
  const type       = document.getElementById('bottleType').value;
  const point      = document.getElementById('collectPoint').value;

  // --- Validation ---
  if (!name) { showToast('⚠️', 'Campo obrigatório', 'Informe seu nome para continuar.', 'warn'); return; }
  const count = parseInt(countRaw, 10);
  if (!count || count < 1) { showToast('⚠️', 'Quantidade inválida', 'Informe ao menos 1 embalagem.', 'warn'); return; }
  if (count > 9999)        { showToast('⚠️', 'Limite excedido', 'Máximo de 9999 embalagens por registro.', 'warn'); return; }

  // --- Calculations ---
  const pts  = count * POINTS_PER_BOTTLE[type];
  const kg   = parseFloat(((count * BOTTLE_WEIGHTS[type]) / 1000).toFixed(2));

  // --- Update state ---
  const prevLevel = getLevel(state.points);
  state.points = (Number(state.points) || 0) + pts;
  state.bottles = (Number(state.bottles) || 0) + count;
  state.kgSaved = (Number(state.kgSaved) || 0) + kg;
  state.globalBottles = (Number(state.globalBottles) || 0) + count;
  state.globalKg = (Number(state.globalKg) || 0) + kg;

  const entry = {
    id:    Date.now(),
    name,
    count,
    type,
    point,
    pts,
    kg,
    date: new Date().toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }),
  };
  state.history.unshift(entry);
  if (state.history.length > 50) state.history.pop(); // keep last 50

  saveState(state);
  updateUI();
  updateHistory();
  updateRewards();

  // Level up check
  const newLevel = getLevel(state.points);
  if (newLevel.name !== prevLevel.name) {
    showToast('🏆', 'Nível alcançado!', `Você é agora ${newLevel.name}!`, 'success');
    setTimeout(() => showToast('✅', `+${pts} pontos`, `${count} embalagem(ns) registrada(s) — ${kg} kg evitados!`, 'success'), 600);
  } else {
    showToast('✅', `+${pts} pontos`, `${count} embalagem(ns) — ${kg} kg de plástico evitados!`, 'success');
  }

  // Reset form
  document.getElementById('bottleCount').value = '';
  document.getElementById('previewBox').style.display = 'none';
}

/**
 * Redeem a reward
 */
function redeemReward(rewardId) {
  const reward = REWARDS.find(r => r.id === rewardId);
  if (!reward) return;
  if (state.points < reward.cost) {
    showToast('🔒', 'Pontos insuficientes', `Você precisa de ${reward.cost} pts para este prêmio.`, 'warn');
    return;
  }
  openModal('redeem', reward);
}

function confirmRedeem(rewardId) {
  const reward = REWARDS.find(r => r.id === rewardId);
  if (!reward || state.points < reward.cost) return;

  state.points -= reward.cost;
  const coupon = {
    id: `cp-${Date.now()}`,
    rewardId: reward.id,
    rewardName: reward.name,
    code: generateCouponCode(reward.id),
    cost: reward.cost,
    createdAt: new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    status: 'ativo',
  };

  state.coupons.unshift(coupon);
  saveState(state);
  updateUI();
  updateRewards();
  closeModal();
  showToast('🎟️', 'Cupom gerado!', `${reward.name} · Código: ${coupon.code}`, 'success');
  setTimeout(() => {
    openModal('coupon', coupon);
  }, 250);
}

/* ══════════════════════════════════════════════════════════
   UI UPDATES
══════════════════════════════════════════════════════════ */

function getLevel(pts) {
  return LEVELS.slice().reverse().find(l => pts >= l.min) || LEVELS[0];
}

function updateUI() {
  const pts     = state.points;
  const bottles = state.bottles;
  const kg      = parseFloat(state.kgSaved.toFixed(2));
  const level   = getLevel(pts);
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];

  // Nav
  document.getElementById('navPoints').textContent = pts.toLocaleString('pt-BR');

  // Ring
  const maxPts = nextLevel ? nextLevel.min : level.min + 1000;
  const progress = Math.min(((pts - level.min) / (maxPts - level.min)) * 100, 100);
  const circumference = 2 * Math.PI * 54; // 339.3
  const offset = circumference - (progress / 100) * circumference;
  document.getElementById('ringFill').style.strokeDashoffset = offset;
  animateCounter('userPoints', pts);

  // Level
  document.getElementById('levelBadge').textContent = level.name;
  document.getElementById('levelNext').textContent = nextLevel
    ? `Próximo nível: ${nextLevel.min.toLocaleString('pt-BR')} pts`
    : '🏆 Nível máximo atingido!';
  document.getElementById('levelPct').textContent = Math.round(progress) + '%';

  // Progress bars
  animateCounter('userBottles', bottles);
  animateCounter('userKg', kg);
  document.getElementById('pbBottles').style.width = Math.min((bottles / 500) * 100, 100) + '%';
  document.getElementById('pbKg').style.width = Math.min((kg / 20) * 100, 100) + '%';
  document.getElementById('pbLevel').style.width = progress + '%';

  // Impact calculations
  const ocean  = Math.round(bottles * 0.5);
  const energy = parseFloat((kg * 5.8).toFixed(1));
  const water  = Math.round(kg * 17);
  const trees  = parseFloat((kg / 21).toFixed(2));
  document.getElementById('impOcean').textContent  = ocean.toLocaleString('pt-BR');
  document.getElementById('impEnergy').textContent = energy.toLocaleString('pt-BR');
  document.getElementById('impWater').textContent  = water.toLocaleString('pt-BR') + ' L';
  document.getElementById('impTrees').textContent  = trees.toLocaleString('pt-BR');

  // Global stats
  animateCounter('globalUsers', state.globalUsers);
  animateCounter('globalBottles', state.globalBottles);
  animateCounter('globalKg', Math.round(state.globalKg));
}

function updateHistory() {
  const list = document.getElementById('historyList');
  if (!state.history.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div>Nenhum registro ainda.<br/>Faça sua primeira coleta!</div></div>`;
    return;
  }
  list.innerHTML = state.history.map((e, i) => `
    <div class="history-item" style="animation-delay:${i * 0.04}s">
      <div class="history-icon">${COLLECT_ICONS[e.point] || '📦'}</div>
      <div class="history-text">
        <div class="history-name">${escHtml(e.name)} · ${e.count}x ${BOTTLE_LABELS[e.type] || e.type}</div>
        <div class="history-date">${e.date} · ${e.kg} kg evitados</div>
      </div>
      <div class="history-pts">+${e.pts}</div>
    </div>
  `).join('');
}

function updateRewards() {
  const grid = document.getElementById('rewardsGrid');
  grid.innerHTML = REWARDS.map(r => {
    const unlocked = state.points >= r.cost;
    return `
      <div class="reward-card ${unlocked ? '' : 'locked'}" onclick="${unlocked ? `redeemReward('${r.id}')` : ''}">
        ${!unlocked ? '<div class="reward-lock">🔒</div>' : ''}
        <div class="reward-emoji">${r.emoji}</div>
        <div class="reward-name">${r.name}</div>
        <div class="reward-desc">${r.desc}</div>
        <div class="reward-cost">⭐ ${r.cost.toLocaleString('pt-BR')} pts</div>
      </div>
    `;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   PREVIEW (realtime)
══════════════════════════════════════════════════════════ */
function updatePreview() {
  const countRaw = document.getElementById('bottleCount').value;
  const type     = document.getElementById('bottleType').value;
  const count    = parseInt(countRaw, 10);
  const box      = document.getElementById('previewBox');

  if (!count || count < 1) { box.style.display = 'none'; return; }

  const pts = count * POINTS_PER_BOTTLE[type];
  const kg  = parseFloat(((count * BOTTLE_WEIGHTS[type]) / 1000).toFixed(2));
  document.getElementById('prevPts').textContent = `+${pts} pts`;
  document.getElementById('prevKg').textContent  = `${kg} kg`;
  box.style.display = 'block';
}

document.getElementById('bottleCount').addEventListener('input', updatePreview);
document.getElementById('bottleType').addEventListener('change', updatePreview);

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */

/**
 * Simple animated counter
 */
const activeCounters = {};
function animateCounter(elemId, target) {
  const el = document.getElementById(elemId);
  if (!el) return;
  if (activeCounters[elemId]) cancelAnimationFrame(activeCounters[elemId]);

  const start  = parseFloat(el.textContent.replace(/[^\d.]/g, '')) || 0;
  const range  = target - start;
  const isFloat = String(target).includes('.');
  const duration = Math.min(Math.abs(range) * 2 + 400, 1200);
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const prog    = Math.min(elapsed / duration, 1);
    const eased   = 1 - Math.pow(1 - prog, 3);
    const val     = start + range * eased;
    el.textContent = isFloat
      ? val.toFixed(2)
      : Math.round(val).toLocaleString('pt-BR');
    if (prog < 1) activeCounters[elemId] = requestAnimationFrame(step);
    else el.textContent = isFloat ? target.toFixed(2) : target.toLocaleString('pt-BR');
  }
  activeCounters[elemId] = requestAnimationFrame(step);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
function showToast(icon, title, msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${msg}</div>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 350);
  }, 3800);
}

/* ══════════════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════════════ */
function openModal(type, data) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');

  if (type === 'redeem' && data) {
    content.innerHTML = `
      <h3>Resgatar Prêmio</h3>
      <p>Você está prestes a resgatar esta recompensa com seus pontos.</p>
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:3rem;margin-bottom:8px">${data.emoji}</div>
        <div style="font-family:Outfit,sans-serif;font-weight:700;font-size:1.2rem">${data.name}</div>
        <div style="font-size:0.85rem;opacity:0.6;margin-top:4px">${data.desc}</div>
      </div>
      <div class="modal-stat"><span>Seus pontos</span><span>${state.points.toLocaleString('pt-BR')} pts</span></div>
      <div class="modal-stat"><span>Custo</span><span>− ${data.cost.toLocaleString('pt-BR')} pts</span></div>
      <div class="modal-stat"><span>Saldo após resgate</span><span>${(state.points - data.cost).toLocaleString('pt-BR')} pts</span></div>
      <div class="modal-actions">
        <button class="btn btn-sm btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-sm btn-primary" onclick="confirmRedeem('${data.id}')">Confirmar Resgate</button>
      </div>
    `;
  } else if (type === 'points') {
    const level = getLevel(state.points);
    const latestCoupons = state.coupons.slice(0, 3);
    const couponsHtml = latestCoupons.length
      ? latestCoupons.map(c => `
        <div class="modal-stat">
          <span>${c.rewardName}</span>
          <span style="font-family:monospace">${c.code}</span>
        </div>
      `).join('')
      : '<p style="font-size:0.82rem;opacity:0.65;margin-top:10px">Nenhum cupom resgatado ainda.</p>';

    content.innerHTML = `
      <h3>Seus Pontos</h3>
      <p>Resumo completo da sua conta ReciclaPET</p>
      <div class="modal-stat"><span>Pontos acumulados</span><span>${state.points.toLocaleString('pt-BR')}</span></div>
      <div class="modal-stat"><span>Embalagens recolhidas</span><span>${state.bottles.toLocaleString('pt-BR')}</span></div>
      <div class="modal-stat"><span>Plástico evitado</span><span>${parseFloat(state.kgSaved.toFixed(2))} kg</span></div>
      <div class="modal-stat"><span>Nível atual</span><span>${level.name}</span></div>
      <div class="modal-stat"><span>Registros realizados</span><span>${state.history.length}</span></div>
      <div class="modal-stat"><span>Cupons gerados</span><span>${state.coupons.length}</span></div>
      <h4 style="margin-top:16px;margin-bottom:10px;font-size:0.95rem">Últimos cupons</h4>
      ${couponsHtml}
      <div class="modal-actions">
        <button class="btn btn-sm btn-outline" onclick="confirmReset()">🗑️ Resetar dados</button>
        <button class="btn btn-sm btn-primary" onclick="closeModal()">Fechar</button>
      </div>
    `;
  } else if (type === 'coupon' && data) {
    content.innerHTML = `
      <h3>Cupom Gerado</h3>
      <p>Use este código no resgate da recompensa.</p>
      <div style="text-align:center;padding:14px 0 8px;">
        <div style="font-size:2.2rem;margin-bottom:10px">🎟️</div>
        <div style="font-family:Outfit,sans-serif;font-weight:700;font-size:1.05rem;margin-bottom:6px">${data.rewardName}</div>
        <div style="font-family:monospace;font-size:1.1rem;letter-spacing:0.06em;background:rgba(255,255,255,0.06);border:1px dashed rgba(255,255,255,0.25);border-radius:10px;padding:10px 12px;display:inline-block;">${data.code}</div>
        <div style="font-size:0.78rem;opacity:0.65;margin-top:10px">Gerado em ${data.createdAt}</div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-sm btn-outline" onclick="copyCouponCode('${data.code}')">Copiar código</button>
        <button class="btn btn-sm btn-primary" onclick="closeModal()">Fechar</button>
      </div>
    `;
  }

  overlay.classList.add('open');
}

function closeModal(event) {
  if (event && event.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.remove('open');
}

function confirmReset() {
  if (confirm('Tem certeza? Todos os seus dados locais serão apagados.')) {
    localStorage.removeItem(STORAGE_KEY);
    state = normalizeState(defaultState());
    state.globalKg = Math.round(state.globalBottles * 0.04);
    saveState(state);
    updateUI();
    updateHistory();
    updateRewards();
    closeModal();
    showToast('🔄', 'Dados resetados', 'Tudo foi apagado. Começando do zero!', 'warn');
  }
}

async function copyCouponCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    showToast('📋', 'Código copiado!', `Cupom ${code} pronto para uso.`, 'success');
  } catch {
    showToast('⚠️', 'Erro ao copiar', 'Copie o código manualmente.', 'warn');
  }
}

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
(function init() {
  updateUI();
  updateHistory();
  updateRewards();
})();

/* ══════════════════════════════════════════════════════════
   SOCIAL SHARING
══════════════════════════════════════════════════════════ */

function buildShareText() {
  const level   = getLevel(state.points);
  const kg      = parseFloat(state.kgSaved.toFixed(2));
  const ocean   = Math.round(state.bottles * 0.5);
  const energy  = parseFloat((kg * 5.8).toFixed(1));

  return (
    `♻️ Estou fazendo a diferença com o ReciclaPET!\n\n` +
    `🏆 Nível: ${level.name}\n` +
    `⭐ ${state.points.toLocaleString('pt-BR')} pontos acumulados\n` +
    `🧴 ${state.bottles.toLocaleString('pt-BR')} embalagens recolhidas\n` +
    `🌿 ${kg} kg de plástico fora da natureza\n` +
    `🌊 ${ocean} m² de oceano protegidos\n` +
    `⚡ ${energy} kWh de energia economizada\n\n` +
    `Junte-se a mim! #ReciclaPET #Sustentabilidade #FEMSA`
  );
}

function openShareModal() {
  if (!state.bottles) {
    showToast('⚠️', 'Sem dados para compartilhar', 'Faça ao menos uma coleta antes de compartilhar!', 'warn');
    return;
  }

  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  const level   = getLevel(state.points);
  const kg      = parseFloat(state.kgSaved.toFixed(2));
  const ocean   = Math.round(state.bottles * 0.5);
  const energy  = parseFloat((kg * 5.8).toFixed(1));
  const shareText = buildShareText();

  content.innerHTML = `
    <h3>🌐 Compartilhar Impacto</h3>
    <p>Inspire outras pessoas mostrando sua contribuição ao planeta!</p>

    <div class="share-card">
      <div class="share-card-title">Meu Impacto Ambiental · ReciclaPET</div>
      <div class="share-stats-grid">
        <div class="share-stat">
          <div class="share-stat-val">${state.points.toLocaleString('pt-BR')}</div>
          <div class="share-stat-label">⭐ pontos</div>
        </div>
        <div class="share-stat">
          <div class="share-stat-val">${state.bottles.toLocaleString('pt-BR')}</div>
          <div class="share-stat-label">🧴 embalagens</div>
        </div>
        <div class="share-stat">
          <div class="share-stat-val">${kg}</div>
          <div class="share-stat-label">🌿 kg evitados</div>
        </div>
        <div class="share-stat">
          <div class="share-stat-val">${ocean}</div>
          <div class="share-stat-label">🌊 m² protegidos</div>
        </div>
      </div>
      <div class="share-level-tag">${level.name}</div>
    </div>

    <div class="share-text-preview" id="shareTextPreview">${shareText}</div>

    <div class="share-networks">
      <button class="share-net-btn whatsapp" onclick="shareWhatsApp()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
      </button>
      <button class="share-net-btn twitter" onclick="shareTwitter()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        X (Twitter)
      </button>
      <button class="share-net-btn linkedin" onclick="shareLinkedIn()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        LinkedIn
      </button>
      <button class="share-net-btn copy" id="copyBtn" onclick="copyShareText()">
        📋 Copiar Texto
      </button>
    </div>

    <div class="modal-actions">
      <button class="btn btn-sm btn-primary" onclick="closeModal()">Fechar</button>
    </div>
  `;

  overlay.classList.add('open');
}

function shareWhatsApp() {
  const text = encodeURIComponent(buildShareText());
  window.open(`https://wa.me/?text=${text}`, '_blank');
  showToast('📤', 'Abrindo WhatsApp...', 'Compartilhe com seus contatos!', 'success');
}

function shareTwitter() {
  const text = encodeURIComponent(buildShareText());
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  showToast('📤', 'Abrindo X (Twitter)...', 'Compartilhe com seus seguidores!', 'success');
}

function shareLinkedIn() {
  const text = encodeURIComponent(buildShareText());
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://reciclapetapp.com&summary=${text}`, '_blank');
  showToast('📤', 'Abrindo LinkedIn...', 'Inspire sua rede profissional!', 'success');
}

async function copyShareText() {
  const text = buildShareText();
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById('copyBtn');
    if (btn) { btn.textContent = '✅ Copiado!'; setTimeout(() => { btn.textContent = '📋 Copiar Texto'; }, 2000); }
    showToast('📋', 'Texto copiado!', 'Cole onde quiser para compartilhar.', 'success');
  } catch {
    showToast('⚠️', 'Erro ao copiar', 'Copie o texto manualmente.', 'warn');
  }
}
