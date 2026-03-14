// ── APP STATE ──────────────────────────────────────────────
const AppState = {
  rawData: null,       // original parsed rows
  cleanData: null,     // after cleaning
  columns: [],
  fileName: '',
  apiKey: '',
  model: 'llama-3.3-70b-versatile',
  aiInsights: '',
  charts: [],
};

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  navigate('upload');

  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });
});

function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  const titles = {
    upload: 'Upload Data',
    clean: 'Clean & Preprocess',
    eda: 'Explore (EDA)',
    analysis: 'AI Analysis',
    visualize: 'Visualize',
    report: 'Report & Export',
  };
  document.getElementById('breadcrumb').textContent = titles[page] || page;
  renderPage(page);
}

// ── SIDEBAR TOGGLE ─────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ── SETTINGS ──────────────────────────────────────────────
function loadSettings() {
  AppState.model = localStorage.getItem('groq_model') || 'llama-3.3-70b-versatile';
  updateApiStatus();
}

function openSettings() {
  document.getElementById('modelSelect').value = AppState.model;
  document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettings() {
  document.getElementById('settingsModal').style.display = 'none';
}

function saveSettings() {
  const model = document.getElementById('modelSelect').value;
  AppState.model = model;
  localStorage.setItem('groq_model', model);
  closeSettings();
}

function updateApiStatus() {
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  dot.classList.add('active');
  txt.textContent = 'AI Ready';
}

// ── DATA STATUS BADGE ──────────────────────────────────────
function updateDataBadge() {
  const el = document.getElementById('dataStatus');
  if (AppState.cleanData || AppState.rawData) {
    const data = AppState.cleanData || AppState.rawData;
    el.textContent = `${data.length} rows · ${AppState.columns.length} cols`;
    el.classList.add('loaded');
  } else {
    el.textContent = 'No data loaded';
    el.classList.remove('loaded');
  }
}

// ── GROQ API CALL (via Vercel backend — key hidden) ────────
async function callGroq(systemPrompt, userPrompt) {
  try {
    const res = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AppState.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 1024,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      return `⚠ API Error: ${err.error?.message || res.statusText}`;
    }
    const data = await res.json();
    return data.choices[0].message.content;
  } catch (e) {
    return `⚠ Network error: ${e.message}`;
  }
}

// ── HELPERS ───────────────────────────────────────────────
function getNumericColumns() {
  if (!AppState.cleanData?.length) return [];
  return AppState.columns.filter(col => {
    const vals = AppState.cleanData.slice(0, 20).map(r => r[col]).filter(v => v !== '' && v !== null && v !== undefined);
    return vals.length > 0 && vals.every(v => !isNaN(parseFloat(v)));
  });
}

function getCategoricalColumns() {
  const numCols = new Set(getNumericColumns());
  return AppState.columns.filter(c => !numCols.has(c));
}

function summarizeData(maxRows = 8) {
  const data = AppState.cleanData || AppState.rawData;
  if (!data) return 'No data loaded.';
  const sample = data.slice(0, maxRows);
  const numCols = getNumericColumns();
  const stats = numCols.map(col => {
    const vals = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
    const sum = vals.reduce((a, b) => a + b, 0);
    const mean = sum / vals.length;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return `  ${col}: mean=${mean.toFixed(2)}, min=${min}, max=${max}, count=${vals.length}`;
  }).join('\n');

  return `Dataset: ${AppState.fileName}
Rows: ${data.length}, Columns: ${AppState.columns.length}
Columns: ${AppState.columns.join(', ')}

Numeric stats:
${stats || '  (none)'}

Sample rows (first ${Math.min(maxRows, data.length)}):
${JSON.stringify(sample, null, 2)}`;
}
