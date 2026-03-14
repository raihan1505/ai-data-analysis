// ── PAGE RENDERER ─────────────────────────────────────────
function renderPage(page) {
  const el = document.getElementById('pageContent');
  switch (page) {
    case 'upload':    el.innerHTML = pageUpload();    bindUpload();    break;
    case 'clean':     el.innerHTML = pageClean();     bindClean();     break;
    case 'eda':       el.innerHTML = pageEDA();                        break;
    case 'analysis':  el.innerHTML = pageAnalysis();                   break;
    case 'visualize': el.innerHTML = pageVisualize(); bindVisualize(); break;
    case 'report':    el.innerHTML = pageReport();                     break;
  }
}

// ═══════════════════════════════════════════════════════════
//  PAGE 1 — UPLOAD
// ═══════════════════════════════════════════════════════════
function pageUpload() {
  const hasData = !!(AppState.rawData);
  return `
  <h1 class="page-title">Upload Data</h1>
  <p class="page-sub">Supports CSV and Excel (.xlsx / .xls). Everything runs in your browser — your data never leaves your device.</p>

  <label class="upload-zone" id="uploadZone" for="fileInput">
    <input type="file" id="fileInput" accept=".csv,.xlsx,.xls"/>
    <div class="upload-icon">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.35"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    </div>
    <div class="upload-title">Drop your file here, or click to browse</div>
    <div class="upload-sub">CSV · XLSX · XLS &nbsp;—&nbsp; processed locally, no upload needed</div>
  </label>

  <div class="divider-text">— or explore with a sample dataset —</div>
  <div class="sample-cards">
    <button class="sample-card" onclick="loadSample('sales')">
      <div class="sample-icon">📊</div>
      <div class="sample-name">Sales Data</div>
      <div class="sample-meta">120 rows · 6 cols</div>
    </button>
    <button class="sample-card" onclick="loadSample('iris')">
      <div class="sample-icon">🌸</div>
      <div class="sample-name">Iris Dataset</div>
      <div class="sample-meta">90 rows · 5 cols</div>
    </button>
    <button class="sample-card" onclick="loadSample('students')">
      <div class="sample-icon">🎓</div>
      <div class="sample-name">Student Grades</div>
      <div class="sample-meta">60 rows · 6 cols</div>
    </button>
    <button class="sample-card" onclick="loadSample('ecommerce')">
      <div class="sample-icon">🛒</div>
      <div class="sample-name">E-Commerce</div>
      <div class="sample-meta">150 rows · 8 cols</div>
    </button>
  </div>

  <div id="uploadPreview"></div>`;
}

function bindUpload() {
  const zone  = document.getElementById('uploadZone');
  const input = document.getElementById('fileInput');
  input.addEventListener('change', e => handleFile(e.target.files[0]));
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag');
    handleFile(e.dataTransfer.files[0]);
  });
  if (AppState.rawData) showUploadPreview(AppState.rawData, AppState.columns);
}

function handleFile(file) {
  if (!file) return;
  AppState.fileName = file.name;
  const ext = file.name.split('.').pop().toLowerCase();
  const zone = document.getElementById('uploadZone');
  if (zone) zone.innerHTML = `<div style="padding:1rem;color:var(--text2);font-size:13px">⏳ Loading <strong>${file.name}</strong>…</div>`;

  if (ext === 'csv') {
    const r = new FileReader();
    r.onload = e => parseCSV(e.target.result);
    r.readAsText(file);
  } else if (ext === 'xlsx' || ext === 'xls') {
    const r = new FileReader();
    r.onload = e => parseXLSX(e.target.result);
    r.readAsArrayBuffer(file);
  } else {
    alert('Unsupported file type. Use CSV or XLSX.');
  }
}

function parseCSV(text) {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
  setData(result.data, result.meta.fields);
}

function parseXLSX(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const cols = json.length ? Object.keys(json[0]) : [];
  setData(json.map(r => { const o = {}; cols.forEach(c => o[c] = String(r[c] ?? '')); return o; }), cols);
}

function setData(rows, cols) {
  AppState.rawData   = rows;
  AppState.cleanData = null;
  AppState.columns   = cols;
  AppState.aiInsights = '';
  updateDataBadge();
  showUploadPreview(rows, cols);
}

function showUploadPreview(rows, cols) {
  const preview = document.getElementById('uploadPreview');
  if (!preview) return;
  const sample = rows.slice(0, 5);
  preview.innerHTML = `
  <div class="card" style="margin-top:1.5rem">
    <div class="stat-grid" style="margin-bottom:1.25rem">
      <div class="stat-card"><div class="stat-label">Rows</div><div class="stat-value blue">${rows.length.toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">Columns</div><div class="stat-value blue">${cols.length}</div></div>
      <div class="stat-card"><div class="stat-label">File</div><div class="stat-value" style="font-size:13px;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${AppState.fileName}</div></div>
    </div>
    <div class="section-label">Preview — first 5 rows</div>
    <div class="table-wrap">
      <table>
        <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${sample.map(r => `<tr>${cols.map(c => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
    <div class="btn-row" style="margin-top:1.25rem">
      <button class="btn-primary" onclick="navigate('clean')">Next: Clean Data →</button>
    </div>
  </div>`;
}

// ── SAMPLE DATA ───────────────────────────────────────────
function loadSample(type) {
  let rows = [], cols = [];
  const rnd = (min, max) => Math.round(min + Math.random() * (max - min));

  if (type === 'sales') {
    cols = ['Month','Product','Region','Sales','Units','Profit'];
    const months   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const products = ['Widget A','Widget B','Gadget X','Gadget Y','Tool Z'];
    const regions  = ['North','South','East','West'];
    rows = Array.from({length:120}, (_, i) => ({
      Month:   months[i % 12],
      Product: products[i % 5],
      Region:  regions[i % 4],
      Sales:   String(rnd(1000, 10000)),
      Units:   String(rnd(10, 200)),
      Profit:  String(rnd(100, 3000)),
    }));
    rows[5].Sales=''; rows[12].Profit=''; rows[20].Units=''; rows[33].Sales='';

  } else if (type === 'iris') {
    cols = ['sepal_length','sepal_width','petal_length','petal_width','species'];
    const sp = ['setosa','versicolor','virginica'];
    rows = Array.from({length:90}, (_, i) => ({
      sepal_length: (4.5 + Math.random()*3.5).toFixed(1),
      sepal_width:  (2.0 + Math.random()*2.0).toFixed(1),
      petal_length: (1.0 + Math.random()*5.5).toFixed(1),
      petal_width:  (0.1 + Math.random()*2.3).toFixed(1),
      species: sp[i % 3],
    }));

  } else if (type === 'students') {
    cols = ['Name','Age','Math','Science','English','Grade'];
    const names = ['Alice','Bob','Charlie','Diana','Eve','Frank','Grace','Henry','Ivy','Jack'];
    rows = Array.from({length:60}, (_, i) => {
      const m = rnd(40,100), s = rnd(40,100), e = rnd(40,100);
      const avg = (m+s+e)/3;
      return {
        Name: names[i%10]+(i>=10?` ${Math.floor(i/10)+1}`:''),
        Age:  String(15+(i%4)),
        Math: String(m), Science: String(s), English: String(e),
        Grade: avg>=85?'A':avg>=70?'B':avg>=55?'C':avg>=40?'D':'F',
      };
    });

  } else if (type === 'ecommerce') {
    cols = ['OrderID','Date','Category','Product','Qty','Price','Revenue','Status'];
    const cats  = ['Electronics','Clothing','Food','Books','Sports'];
    const stats = ['Delivered','Pending','Cancelled','Returned'];
    const prods = ['Laptop','T-Shirt','Coffee','Python Book','Tennis Racket','Phone','Jeans','Tea','JS Book','Yoga Mat'];
    rows = Array.from({length:150}, (_, i) => {
      const qty = rnd(1,10), price = rnd(5,500);
      return {
        OrderID:  `ORD-${1000+i}`,
        Date:     `2024-${String(Math.floor(i/13)+1).padStart(2,'0')}-${String((i%28)+1).padStart(2,'0')}`,
        Category: cats[i%5],
        Product:  prods[i%10],
        Qty:      String(qty),
        Price:    String(price),
        Revenue:  String(qty*price),
        Status:   stats[i%4],
      };
    });
    rows[7].Revenue=''; rows[22].Price=''; rows[45].Qty='';
  }

  AppState.fileName = `${type}_sample.csv`;
  setData(rows, cols);
}


// ═══════════════════════════════════════════════════════════
//  PAGE 2 — CLEAN & PREPROCESS
// ═══════════════════════════════════════════════════════════
function pageClean() {
  if (!AppState.rawData) return emptyState('upload','Upload data first');
  const issues = detectIssues(AppState.rawData);
  const issueCount = issues.reduce((s,i)=>s+i.count, 0);

  return `
  <h1 class="page-title">Clean & Preprocess</h1>
  <p class="page-sub">Auto-detect and fix data quality issues before analysis.</p>

  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <div class="card-title" style="margin-bottom:0">Data Quality Scan</div>
      ${issueCount > 0
        ? `<span class="badge badge-amber">${issueCount} issue${issueCount>1?'s':''} found</span>`
        : `<span class="badge badge-green">✓ Clean</span>`}
    </div>
    ${issues.length === 0
      ? `<div style="color:var(--success);font-size:13px;display:flex;align-items:center;gap:8px"><span style="font-size:18px">✅</span> No issues detected — your data looks great!</div>`
      : `<div style="display:flex;flex-direction:column;gap:0">
          <div style="display:grid;grid-template-columns:1fr 2fr auto;gap:8px;padding:0.4rem 0;border-bottom:1px solid var(--border)">
            <span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">Column</span>
            <span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">Issue</span>
            <span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">Count</span>
          </div>
          ${issues.map(i=>`
          <div class="issue-row" style="display:grid;grid-template-columns:1fr 2fr auto;gap:8px">
            <span class="issue-name">${i.col}</span>
            <span style="font-size:12px;color:var(--text2)">${i.desc}</span>
            <span class="issue-count">${i.count}</span>
          </div>`).join('')}
        </div>`
    }
  </div>

  <div class="card">
    <div class="card-title">Cleaning Options</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <label class="clean-opt"><input type="checkbox" id="optFill"    checked/><div><div class="opt-title">Fill Missing Values</div><div class="opt-desc">Mean for numeric · mode for text</div></div></label>
      <label class="clean-opt"><input type="checkbox" id="optTrim"    checked/><div><div class="opt-title">Trim Whitespace</div><div class="opt-desc">Remove leading/trailing spaces</div></div></label>
      <label class="clean-opt"><input type="checkbox" id="optDupes"   checked/><div><div class="opt-title">Remove Duplicates</div><div class="opt-desc">Drop identical rows</div></div></label>
      <label class="clean-opt"><input type="checkbox" id="optEmpty"         /><div><div class="opt-title">Drop Empty Rows</div><div class="opt-desc">Remove rows with all values empty</div></div></label>
      <label class="clean-opt"><input type="checkbox" id="optCase"          /><div><div class="opt-title">Normalize Text Case</div><div class="opt-desc">Lowercase all text columns</div></div></label>
      <label class="clean-opt"><input type="checkbox" id="optOutlier"       /><div><div class="opt-title">Cap Outliers (3σ)</div><div class="opt-desc">Clip extreme numeric values</div></div></label>
    </div>
    <div class="btn-row">
      <button class="btn-primary" onclick="runCleaning()">▶ Run Auto-Cleaning</button>
      <button class="btn-ghost"   onclick="skipCleaning()">Skip (use raw data)</button>
    </div>
  </div>

  <div id="cleanResult"></div>`;
}

function bindClean() {
  document.querySelectorAll('.clean-opt').forEach(el => {
    const inp = el.querySelector('input');
    inp.style.cssText = 'accent-color:var(--accent);width:15px;height:15px;flex-shrink:0;margin-top:2px';
  });
}

function detectIssues(data) {
  const issues = [];
  AppState.columns.forEach(col => {
    const vals = data.map(r => r[col]);
    const missing = vals.filter(v => v===''||v===null||v===undefined||v==='null'||v==='undefined'||v==='NaN').length;
    if (missing > 0) issues.push({col, desc:'Missing / empty values', count:missing});

    const numVals = vals.map(v=>parseFloat(v)).filter(v=>!isNaN(v));
    if (numVals.length > 10) {
      const mean = numVals.reduce((a,b)=>a+b,0)/numVals.length;
      const std  = Math.sqrt(numVals.map(v=>(v-mean)**2).reduce((a,b)=>a+b,0)/numVals.length);
      const out  = numVals.filter(v=>Math.abs(v-mean)>3*std).length;
      if (out > 0) issues.push({col, desc:'Statistical outliers (>3σ)', count:out});
    }
  });
  // duplicate check
  const seen = new Set();
  let dupes = 0;
  data.forEach(r => { const k = JSON.stringify(r); if(seen.has(k)) dupes++; else seen.add(k); });
  if (dupes > 0) issues.push({col:'(all columns)', desc:'Duplicate rows', count:dupes});
  return issues;
}

function runCleaning() {
  const optFill    = document.getElementById('optFill').checked;
  const optTrim    = document.getElementById('optTrim').checked;
  const optDupes   = document.getElementById('optDupes').checked;
  const optEmpty   = document.getElementById('optEmpty').checked;
  const optCase    = document.getElementById('optCase').checked;
  const optOutlier = document.getElementById('optOutlier').checked;

  let data = AppState.rawData.map(r=>({...r}));
  const orig = data.length;

  if (optTrim) {
    data = data.map(r => {
      const nr={};
      AppState.columns.forEach(c => { nr[c] = typeof r[c]==='string'?r[c].trim():r[c]; });
      return nr;
    });
  }
  if (optCase) {
    const cats = getCategoricalColumns();
    data = data.map(r => {
      const nr={...r};
      cats.forEach(c=>{ if(typeof nr[c]==='string') nr[c]=nr[c].toLowerCase(); });
      return nr;
    });
  }
  if (optEmpty) {
    data = data.filter(r => AppState.columns.some(c=>r[c]!==''&&r[c]!==null&&r[c]!==undefined));
  }
  if (optDupes) {
    const seen=new Set();
    data = data.filter(r=>{ const k=JSON.stringify(r); if(seen.has(k)) return false; seen.add(k); return true; });
  }
  if (optFill) {
    AppState.columns.forEach(col => {
      const numVals = data.map(r=>parseFloat(r[col])).filter(v=>!isNaN(v));
      if (numVals.length > 0) {
        const mean = (numVals.reduce((a,b)=>a+b,0)/numVals.length).toFixed(2);
        data.forEach(r => { if(r[col]===''||r[col]===null||r[col]===undefined) r[col]=mean; });
      } else {
        const freq={};
        data.forEach(r=>{ if(r[col]) freq[r[col]]=(freq[r[col]]||0)+1; });
        const mode=Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0];
        if (mode) data.forEach(r=>{ if(!r[col]) r[col]=mode; });
      }
    });
  }
  if (optOutlier) {
    const numCols = getNumericColumns();
    numCols.forEach(col => {
      const vals = data.map(r=>parseFloat(r[col])).filter(v=>!isNaN(v));
      if (vals.length < 5) return;
      const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
      const std  = Math.sqrt(vals.map(v=>(v-mean)**2).reduce((a,b)=>a+b,0)/vals.length);
      const lo = mean - 3*std, hi = mean + 3*std;
      data.forEach(r => {
        const v = parseFloat(r[col]);
        if (!isNaN(v)) r[col] = String(Math.min(Math.max(v,lo),hi).toFixed(2));
      });
    });
  }

  AppState.cleanData = data;
  updateDataBadge();

  const removed = orig - data.length;
  document.getElementById('cleanResult').innerHTML = `
  <div class="card" style="border-color:rgba(52,211,153,0.2)">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem">
      <span style="font-size:22px">✅</span>
      <span style="font-weight:600;color:var(--success);font-size:15px">Cleaning complete!</span>
    </div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-label">Original Rows</div><div class="stat-value amber">${orig.toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">After Cleaning</div><div class="stat-value green">${data.length.toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">Removed</div><div class="stat-value red">${removed}</div></div>
      <div class="stat-card"><div class="stat-label">Columns</div><div class="stat-value blue">${AppState.columns.length}</div></div>
    </div>
    <div class="btn-row">
      <button class="btn-primary" onclick="navigate('eda')">Next: Explore Data →</button>
      <button class="btn-ghost"   onclick="navigate('analysis')">Skip to AI Analysis</button>
    </div>
  </div>`;
}

function skipCleaning() {
  AppState.cleanData = AppState.rawData.map(r=>({...r}));
  updateDataBadge();
  navigate('eda');
}


// ═══════════════════════════════════════════════════════════
//  PAGE 3 — EDA
// ═══════════════════════════════════════════════════════════
function pageEDA() {
  const data = AppState.cleanData || AppState.rawData;
  if (!data) return emptyState('upload','Upload data first');

  const numCols = getNumericColumns();
  const catCols = getCategoricalColumns();

  const statsRows = numCols.map(col => {
    const vals = data.map(r=>parseFloat(r[col])).filter(v=>!isNaN(v));
    if (!vals.length) return '';
    const sorted = [...vals].sort((a,b)=>a-b);
    const mean   = vals.reduce((a,b)=>a+b,0)/vals.length;
    const q1     = sorted[Math.floor(sorted.length*0.25)];
    const median = sorted[Math.floor(sorted.length*0.5)];
    const q3     = sorted[Math.floor(sorted.length*0.75)];
    const std    = Math.sqrt(vals.map(v=>(v-mean)**2).reduce((a,b)=>a+b,0)/vals.length);
    const miss   = data.length - vals.length;
    return `<tr>
      <td style="color:var(--accent)">${col}</td>
      <td>${vals.length}</td>
      <td>${mean.toFixed(2)}</td>
      <td>${median.toFixed(2)}</td>
      <td>${std.toFixed(2)}</td>
      <td>${sorted[0]}</td>
      <td>${sorted[sorted.length-1]}</td>
      <td>${q1.toFixed(1)}</td><td>${q3.toFixed(1)}</td>
      <td>${miss > 0 ? `<span class="badge badge-amber">${miss}</span>` : '<span class="badge badge-green">0</span>'}</td>
    </tr>`;
  }).join('');

  return `
  <h1 class="page-title">Exploratory Data Analysis</h1>
  <p class="page-sub">Statistical overview of your ${AppState.cleanData ? 'cleaned' : 'raw'} dataset.</p>

  <div class="stat-grid">
    <div class="stat-card"><div class="stat-label">Total Rows</div><div class="stat-value blue">${data.length.toLocaleString()}</div></div>
    <div class="stat-card"><div class="stat-label">Columns</div><div class="stat-value blue">${AppState.columns.length}</div></div>
    <div class="stat-card"><div class="stat-label">Numeric</div><div class="stat-value green">${numCols.length}</div></div>
    <div class="stat-card"><div class="stat-label">Categorical</div><div class="stat-value amber">${catCols.length}</div></div>
  </div>

  ${numCols.length ? `
  <div class="card">
    <div class="card-title">Numeric Statistics</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Column</th><th>Count</th><th>Mean</th><th>Median</th><th>Std Dev</th><th>Min</th><th>Max</th><th>Q1</th><th>Q3</th><th>Missing</th></tr></thead>
        <tbody>${statsRows}</tbody>
      </table>
    </div>
  </div>` : ''}

  ${catCols.length ? `
  <div class="card">
    <div class="card-title">Categorical Distributions</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1.5rem">
      ${catCols.map(col => {
        const freq={};
        data.forEach(r=>{ const v=r[col]||'(empty)'; freq[v]=(freq[v]||0)+1; });
        const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,6);
        const total = Object.values(freq).reduce((a,b)=>a+b,0);
        const unique = Object.keys(freq).length;
        return `<div>
          <div style="font-family:var(--mono);font-size:12px;color:var(--accent);margin-bottom:4px">${col}</div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:8px">${unique} unique values</div>
          ${top.map(([v,c])=>`
            <div style="margin-bottom:5px">
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
                <span style="color:var(--text2);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${v}</span>
                <span style="color:var(--text3);font-family:var(--mono)">${((c/total)*100).toFixed(1)}%</span>
              </div>
              <div style="height:3px;background:var(--bg4);border-radius:2px"><div style="height:100%;background:var(--accent2);width:${Math.round(c/total*100)}%;border-radius:2px;transition:width 0.3s"></div></div>
            </div>`).join('')}
        </div>`;
      }).join('')}
    </div>
  </div>` : ''}

  <div class="btn-row">
    <button class="btn-primary" onclick="navigate('analysis')">Next: AI Analysis →</button>
    <button class="btn-ghost"   onclick="navigate('visualize')">Go to Visualize</button>
  </div>`;
}


// ═══════════════════════════════════════════════════════════
//  PAGE 4 — AI ANALYSIS (Groq)
// ═══════════════════════════════════════════════════════════
function pageAnalysis() {
  const data = AppState.cleanData || AppState.rawData;
  if (!data) return emptyState('upload','Upload data first');

  return `
  <h1 class="page-title">AI Analysis</h1>
  <p class="page-sub">Powered by <strong style="color:var(--accent)">Groq API</strong> (free) — ask anything about your data using Llama 3.3 / Mixtral.</p>

  ${!AppState.apiKey ? `
  <div class="alert-card">
    <span style="font-size:22px">🔑</span>
    <div style="flex:1">
      <div style="font-weight:600;margin-bottom:3px">Groq API key required</div>
      <div style="font-size:12px;color:var(--text2)">Free at <a href="https://console.groq.com" target="_blank" style="color:var(--accent)">console.groq.com</a> — no credit card needed. Then click Settings.</div>
    </div>
    <button class="btn-ghost" onclick="openSettings()">⚙ Settings</button>
  </div>` : ''}

  <div class="card">
    <div class="card-title">Quick Analysis</div>
    <div class="chip-row">
      <span class="chip" onclick="runPreset('summary')">📋 Executive Summary</span>
      <span class="chip" onclick="runPreset('trends')">📈 Trend Analysis</span>
      <span class="chip" onclick="runPreset('outliers')">⚡ Outlier Detection</span>
      <span class="chip" onclick="runPreset('correlations')">🔗 Correlations</span>
      <span class="chip" onclick="runPreset('recommendations')">💡 Recommendations</span>
      <span class="chip" onclick="runPreset('quality')">🩺 Data Quality Report</span>
      <span class="chip" onclick="runPreset('ml')">🤖 ML Suggestions</span>
      <span class="chip" onclick="runPreset('kpi')">📊 Key KPIs</span>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Custom Question</div>
    <div class="query-row">
      <input type="text" class="query-input" id="customQuery"
        placeholder="e.g. Which product has the highest profit margin? What are the anomalies?"
        onkeydown="if(event.key==='Enter') runCustomQuery()"/>
      <button class="btn-primary" onclick="runCustomQuery()">Ask AI ↗</button>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
      <span style="font-size:11px;color:var(--text3);margin-right:4px">Try:</span>
      ${['Summarize in 3 bullet points','What drives revenue?','Find patterns by category','Predict next month'].map(q=>
        `<span style="font-size:11px;color:var(--accent2);cursor:pointer;text-decoration:underline;text-decoration-style:dotted" onclick="document.getElementById('customQuery').value='${q}'">${q}</span>`
      ).join('')}
    </div>
  </div>

  <div id="analysisOutput">
    ${AppState.aiInsights ? `<div class="ai-bubble">${AppState.aiInsights.replace(/\n/g,'<br>')}</div>` : ''}
  </div>`;
}

async function runPreset(type) {
  const prompts = {
    summary:         'Provide a comprehensive executive summary of this dataset. Include key metrics, patterns, data quality observations, and top 3 takeaways.',
    trends:          'Analyze trends and patterns in this dataset. Identify changes over time or across categories. Highlight seasonality, growth, or decline.',
    outliers:        'Identify outliers and anomalies in this dataset. For each, explain the possible cause and business impact.',
    correlations:    'Analyze correlations between the numeric columns. Which variables are most strongly related? What causal relationships might exist?',
    recommendations: 'Based on this data, provide exactly 5 specific, actionable business recommendations with data-backed rationale.',
    quality:         'Provide a data quality report: completeness, consistency, accuracy issues, and concrete steps to improve data collection.',
    ml:              'Suggest machine learning approaches for this dataset. What can be predicted? Which algorithms fit best and why? What features matter most?',
    kpi:             'Identify and calculate the key performance indicators (KPIs) from this dataset. Present them clearly with context.',
  };
  await runAIAnalysis(prompts[type]);
}

async function runCustomQuery() {
  const q = document.getElementById('customQuery')?.value?.trim();
  if (!q) return;
  await runAIAnalysis(q);
}

async function runAIAnalysis(question) {
  const out = document.getElementById('analysisOutput');
  out.innerHTML = `<div class="ai-bubble loading">🤖 Analyzing with <strong>${AppState.model}</strong>…</div>`;

  const system = `You are a senior data analyst and statistician. Analyze the provided dataset and answer questions with clear, actionable insights.
Use markdown-style formatting: **bold** for key terms, bullet points (- item) for lists, and numbered lists for steps.
Be concise but thorough. Focus on business value and practical insights. Do not repeat the data back verbatim.`;

  const result = await callGroq(system,
    `Dataset overview:\n${summarizeData(12)}\n\nQuestion: ${question}`);

  AppState.aiInsights = result;

  // Simple markdown → HTML
  const html = result
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<div style="font-size:13px;font-weight:600;color:var(--text);margin:12px 0 4px">$1</div>')
    .replace(/^## (.+)$/gm,  '<div style="font-size:14px;font-weight:600;color:var(--accent);margin:14px 0 4px">$1</div>')
    .replace(/^# (.+)$/gm,   '<div style="font-size:15px;font-weight:600;color:var(--accent);margin:16px 0 4px">$1</div>')
    .replace(/^- (.+)$/gm,   '<div style="display:flex;gap:6px;margin:3px 0"><span style="color:var(--accent2);flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div style="display:flex;gap:6px;margin:3px 0"><span style="color:var(--accent);flex-shrink:0;font-family:var(--mono)">$1.</span><span>$2</span></div>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');

  out.innerHTML = `
    <div class="ai-bubble" style="white-space:normal;line-height:1.8">${html}</div>
    <div class="btn-row">
      <button class="btn-ghost" onclick="navigate('visualize')">→ Visualize</button>
      <button class="btn-ghost" onclick="navigate('report')">→ Export Report</button>
    </div>`;
}


// ═══════════════════════════════════════════════════════════
//  PAGE 5 — VISUALIZE
// ═══════════════════════════════════════════════════════════
function pageVisualize() {
  const data = AppState.cleanData || AppState.rawData;
  if (!data) return emptyState('upload','Upload data first');

  const numCols = getNumericColumns();
  const catCols = getCategoricalColumns();
  const allCols = AppState.columns;

  return `
  <h1 class="page-title">Visualize</h1>
  <p class="page-sub">Build interactive charts from your data. Select columns and chart type, then click Generate.</p>

  <!-- Bar / Line / Radar -->
  <div class="card">
    <div class="card-title">Bar · Line · Radar Chart</div>
    <div class="ctrl-row">
      <div class="ctrl-group">
        <div class="section-label">X Axis</div>
        <select class="field-input" id="xCol">${allCols.map(c=>`<option>${c}</option>`).join('')}</select>
      </div>
      <div class="ctrl-group">
        <div class="section-label">Y Axis (numeric)</div>
        <select class="field-input" id="yCol">${numCols.map(c=>`<option>${c}</option>`).join('')}</select>
      </div>
      <div class="ctrl-group">
        <div class="section-label">Aggregation</div>
        <select class="field-input" id="aggFunc">
          <option value="sum">Sum</option>
          <option value="avg">Average</option>
          <option value="count">Count</option>
          <option value="max">Max</option>
          <option value="min">Min</option>
        </select>
      </div>
      <div class="ctrl-group">
        <div class="section-label">Chart Type</div>
        <select class="field-input" id="chartType">
          <option value="bar">Bar</option>
          <option value="line">Line</option>
          <option value="radar">Radar</option>
        </select>
      </div>
    </div>
    <div class="btn-row" style="margin-top:0.75rem">
      <button class="btn-primary" onclick="renderBarChart()">Generate Chart</button>
      <button class="btn-ghost"   onclick="renderBarChart(true)">Sort Descending</button>
    </div>
    <div style="margin-top:1rem"><div class="chart-container"><canvas id="chart1"></canvas></div></div>
  </div>

  <!-- Scatter -->
  ${numCols.length >= 2 ? `
  <div class="card">
    <div class="card-title">Scatter Plot</div>
    <div class="ctrl-row">
      <div class="ctrl-group">
        <div class="section-label">X Column</div>
        <select class="field-input" id="scatterX">${numCols.map(c=>`<option>${c}</option>`).join('')}</select>
      </div>
      <div class="ctrl-group">
        <div class="section-label">Y Column</div>
        <select class="field-input" id="scatterY">${numCols.slice(1).map(c=>`<option>${c}</option>`).join('')}</select>
      </div>
      ${catCols.length ? `
      <div class="ctrl-group">
        <div class="section-label">Color by (optional)</div>
        <select class="field-input" id="scatterColor"><option value="">None</option>${catCols.map(c=>`<option>${c}</option>`).join('')}</select>
      </div>` : ''}
    </div>
    <button class="btn-primary" onclick="renderScatter()" style="margin-top:0.75rem">Generate Scatter</button>
    <div style="margin-top:1rem"><div class="chart-container"><canvas id="chart2"></canvas></div></div>
  </div>` : ''}

  <!-- Pie / Doughnut -->
  ${catCols.length ? `
  <div class="card">
    <div class="card-title">Pie · Doughnut Distribution</div>
    <div class="ctrl-row">
      <div class="ctrl-group">
        <div class="section-label">Category Column</div>
        <select class="field-input" id="pieCol">${catCols.map(c=>`<option>${c}</option>`).join('')}</select>
      </div>
      <div class="ctrl-group">
        <div class="section-label">Chart Type</div>
        <select class="field-input" id="pieType">
          <option value="doughnut">Doughnut</option>
          <option value="pie">Pie</option>
        </select>
      </div>
    </div>
    <button class="btn-primary" onclick="renderPie()" style="margin-top:0.75rem">Generate Chart</button>
    <div style="margin-top:1rem"><div class="chart-container" style="height:320px"><canvas id="chart3"></canvas></div></div>
  </div>` : ''}

  <!-- Histogram -->
  ${numCols.length ? `
  <div class="card">
    <div class="card-title">Histogram / Distribution</div>
    <div class="ctrl-row">
      <div class="ctrl-group">
        <div class="section-label">Column</div>
        <select class="field-input" id="histCol">${numCols.map(c=>`<option>${c}</option>`).join('')}</select>
      </div>
      <div class="ctrl-group">
        <div class="section-label">Bins</div>
        <select class="field-input" id="histBins">
          <option value="10">10</option><option value="15">15</option>
          <option value="20" selected>20</option><option value="30">30</option>
        </select>
      </div>
    </div>
    <button class="btn-primary" onclick="renderHistogram()" style="margin-top:0.75rem">Generate Histogram</button>
    <div style="margin-top:1rem"><div class="chart-container"><canvas id="chart4"></canvas></div></div>
  </div>` : ''}`;
}

function bindVisualize() {
  const numCols = getNumericColumns();
  if (numCols.length >= 2) {
    const sy = document.getElementById('scatterY');
    if (sy) sy.value = numCols[1];
  }
}


// ═══════════════════════════════════════════════════════════
//  PAGE 6 — REPORT
// ═══════════════════════════════════════════════════════════
function pageReport() {
  const data = AppState.cleanData || AppState.rawData;
  return `
  <h1 class="page-title">Report & Export</h1>
  <p class="page-sub">Download your data and analysis in multiple formats.</p>

  ${!data ? emptyState('upload','No data to export') : `
  <div class="card">
    <div class="card-title">Export Options</div>
    <button class="export-option" onclick="exportCSV()">
      <span class="export-icon">📄</span>
      <div><div class="export-title">Cleaned CSV</div><div class="export-desc">Download the cleaned dataset as a .csv file</div></div>
      <span style="margin-left:auto;color:var(--text3);font-size:12px">${data.length} rows</span>
    </button>
    <button class="export-option" onclick="exportJSON()">
      <span class="export-icon">📦</span>
      <div><div class="export-title">JSON Data</div><div class="export-desc">Download data in JSON format with metadata</div></div>
    </button>
    <button class="export-option" onclick="exportReport()">
      <span class="export-icon">📑</span>
      <div><div class="export-title">Full HTML Report</div><div class="export-desc">Complete report with stats, charts data, and AI insights</div></div>
    </button>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-title">Report Contents</div>
    <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;color:var(--text2)">
      <div style="display:flex;align-items:center;gap:8px"><span style="color:var(--success)">✓</span> Dataset overview (${data.length} rows × ${AppState.columns.length} cols)</div>
      <div style="display:flex;align-items:center;gap:8px"><span style="color:${getNumericColumns().length>0?'var(--success)':'var(--text3)'}">✓</span> Statistical summary (${getNumericColumns().length} numeric columns)</div>
      <div style="display:flex;align-items:center;gap:8px"><span style="color:${AppState.cleanData?'var(--success)':'var(--text3)'}">✓</span> Data cleaning applied: ${AppState.cleanData?'Yes':'No'}</div>
      <div style="display:flex;align-items:center;gap:8px"><span style="color:${AppState.aiInsights?'var(--success)':'var(--text3)'}">✓</span> AI Insights: ${AppState.aiInsights?'Included':'Not generated yet'}</div>
    </div>
    ${!AppState.aiInsights ? `<div style="margin-top:1rem"><button class="btn-ghost" onclick="navigate('analysis')">→ Generate AI Insights first</button></div>` : ''}
  </div>`}

  <div id="reportStatus"></div>`;
}


// ── SHARED EMPTY STATE ────────────────────────────────────
function emptyState(linkPage, msg) {
  return `<div class="empty-state">
    <div class="empty-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.12"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    </div>
    <div class="empty-title">${msg}</div>
    <div style="margin-top:1rem">
      <button class="btn-primary" onclick="navigate('${linkPage}')">Go to ${linkPage.charAt(0).toUpperCase()+linkPage.slice(1)}</button>
    </div>
  </div>`;
}
