// ── CHART REGISTRY ────────────────────────────────────────
const COLORS = [
  '#5b8ff9','#a78bfa','#34d399','#fbbf24','#f87171',
  '#38bdf8','#fb923c','#a3e635','#f472b6','#94a3b8',
  '#60a5fa','#c084fc','#4ade80','#facc15','#f87171',
];

const _charts = {};

function destroyChart(id) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

const BASE_OPTS = () => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: {
    legend: {
      labels: { color:'#8b93a4', font:{ family:"'JetBrains Mono',monospace", size:11 }, boxWidth:12, padding:12 }
    },
    tooltip: {
      backgroundColor:'#1a1e25', borderColor:'rgba(255,255,255,0.08)', borderWidth:1,
      titleColor:'#e8eaf0', bodyColor:'#8b93a4',
      titleFont:{ family:"'Space Grotesk',sans-serif", size:13 },
      bodyFont:{ family:"'JetBrains Mono',monospace", size:12 },
      padding:10, cornerRadius:8,
    }
  },
  scales: {
    x: { ticks:{ color:'#4a5060', font:{size:11} }, grid:{ color:'rgba(255,255,255,0.04)', drawBorder:false } },
    y: { ticks:{ color:'#4a5060', font:{size:11} }, grid:{ color:'rgba(255,255,255,0.04)', drawBorder:false }, beginAtZero:true },
  }
});

// ── BAR / LINE / RADAR ────────────────────────────────────
function renderBarChart(sortDesc = false) {
  const data    = AppState.cleanData || AppState.rawData;
  const xCol    = document.getElementById('xCol').value;
  const yCol    = document.getElementById('yCol').value;
  const type    = document.getElementById('chartType').value;
  const aggFunc = document.getElementById('aggFunc').value;

  // group
  const groups = {};
  const counts = {};
  data.forEach(r => {
    const x = r[xCol] || '(empty)';
    const y = parseFloat(r[yCol]) || 0;
    if (!groups[x]) { groups[x] = 0; counts[x] = 0; }
    groups[x] += y;
    counts[x]++;
  });

  let entries = Object.entries(groups).map(([k,v]) => {
    let val;
    if      (aggFunc === 'avg')   val = v / counts[k];
    else if (aggFunc === 'count') val = counts[k];
    else if (aggFunc === 'max')   val = Math.max(...data.filter(r=>r[xCol]===k).map(r=>parseFloat(r[yCol])||0));
    else if (aggFunc === 'min')   val = Math.min(...data.filter(r=>r[xCol]===k).map(r=>parseFloat(r[yCol])||0));
    else                          val = v;
    return [k, parseFloat(val.toFixed(2))];
  });

  if (sortDesc) entries.sort((a,b) => b[1]-a[1]);
  entries = entries.slice(0,25);

  const labels = entries.map(e=>e[0]);
  const values = entries.map(e=>e[1]);

  destroyChart('chart1');
  const ctx = document.getElementById('chart1').getContext('2d');

  if (type === 'radar') {
    _charts['chart1'] = new Chart(ctx, {
      type:'radar',
      data:{ labels, datasets:[{
        label:`${aggFunc}(${yCol})`,
        data:values,
        backgroundColor:'rgba(91,143,249,0.2)',
        borderColor:'#5b8ff9', pointBackgroundColor:'#5b8ff9', borderWidth:2,
      }]},
      options:{ responsive:true, maintainAspectRatio:false, animation:{duration:400},
        scales:{ r:{ ticks:{color:'#4a5060',backdropColor:'transparent'}, grid:{color:'rgba(255,255,255,0.06)'}, pointLabels:{color:'#8b93a4',font:{size:11}} } },
        plugins:{ legend:{ labels:{color:'#8b93a4'} } }
      }
    });
    return;
  }

  const isLine = type === 'line';
  _charts['chart1'] = new Chart(ctx, {
    type,
    data:{ labels, datasets:[{
      label:`${aggFunc}(${yCol})`,
      data:values,
      backgroundColor: isLine ? 'rgba(91,143,249,0.1)' : COLORS,
      borderColor:     isLine ? '#5b8ff9' : COLORS,
      borderWidth:     isLine ? 2 : 1,
      tension:0.4, fill:isLine,
      pointBackgroundColor:'#5b8ff9', pointRadius:isLine?3:0, pointHoverRadius:5,
      borderRadius: isLine ? 0 : 5,
    }]},
    options: BASE_OPTS(),
  });
}

// ── SCATTER ───────────────────────────────────────────────
function renderScatter() {
  const data   = AppState.cleanData || AppState.rawData;
  const xCol   = document.getElementById('scatterX').value;
  const yCol   = document.getElementById('scatterY').value;
  const colBy  = document.getElementById('scatterColor')?.value || '';

  if (colBy) {
    // color by category
    const groups = {};
    data.forEach(r => {
      const cat = r[colBy] || 'other';
      if (!groups[cat]) groups[cat] = [];
      const x = parseFloat(r[xCol]), y = parseFloat(r[yCol]);
      if (!isNaN(x) && !isNaN(y)) groups[cat].push({x,y});
    });
    const datasets = Object.entries(groups).slice(0,10).map(([cat,pts],i) => ({
      label:cat, data:pts.slice(0,300),
      backgroundColor:COLORS[i%COLORS.length]+'99',
      pointRadius:4, pointHoverRadius:6,
    }));
    destroyChart('chart2');
    const ctx = document.getElementById('chart2').getContext('2d');
    const opts = { ...BASE_OPTS() };
    opts.scales.x.title = { display:true, text:xCol, color:'#8b93a4' };
    opts.scales.y.title = { display:true, text:yCol, color:'#8b93a4' };
    _charts['chart2'] = new Chart(ctx, { type:'scatter', data:{datasets}, options:opts });
  } else {
    const pts = data.map(r=>({ x:parseFloat(r[xCol]), y:parseFloat(r[yCol]) }))
      .filter(p=>!isNaN(p.x)&&!isNaN(p.y)).slice(0,500);
    destroyChart('chart2');
    const ctx = document.getElementById('chart2').getContext('2d');
    const opts = { ...BASE_OPTS() };
    opts.scales.x.title = { display:true, text:xCol, color:'#8b93a4' };
    opts.scales.y.title = { display:true, text:yCol, color:'#8b93a4' };
    _charts['chart2'] = new Chart(ctx, {
      type:'scatter',
      data:{ datasets:[{ label:`${xCol} vs ${yCol}`, data:pts, backgroundColor:'rgba(167,139,250,0.55)', pointRadius:4, pointHoverRadius:6 }] },
      options:opts
    });
  }
}

// ── PIE / DOUGHNUT ────────────────────────────────────────
function renderPie() {
  const data = AppState.cleanData || AppState.rawData;
  const col  = document.getElementById('pieCol').value;
  const type = document.getElementById('pieType').value;

  const freq = {};
  data.forEach(r => { const v=r[col]||'(empty)'; freq[v]=(freq[v]||0)+1; });
  const entries = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,12);

  destroyChart('chart3');
  const ctx = document.getElementById('chart3').getContext('2d');
  _charts['chart3'] = new Chart(ctx, {
    type,
    data:{
      labels:entries.map(e=>e[0]),
      datasets:[{
        data:entries.map(e=>e[1]),
        backgroundColor:COLORS, borderColor:'#0c0e12', borderWidth:2, hoverOffset:8,
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false, animation:{duration:400},
      plugins:{
        legend:{ position:'right', labels:{ color:'#8b93a4', font:{family:"'JetBrains Mono',monospace",size:11}, padding:12, boxWidth:12 } },
        tooltip:{
          backgroundColor:'#1a1e25', borderColor:'rgba(255,255,255,0.08)', borderWidth:1,
          titleColor:'#e8eaf0', bodyColor:'#8b93a4', padding:10, cornerRadius:8,
          callbacks:{ label:ctx => {
            const total = ctx.dataset.data.reduce((a,b)=>a+b,0);
            return ` ${ctx.label}: ${ctx.parsed} (${((ctx.parsed/total)*100).toFixed(1)}%)`;
          }}
        }
      }
    }
  });
}

// ── HISTOGRAM ────────────────────────────────────────────
function renderHistogram() {
  const data = AppState.cleanData || AppState.rawData;
  const col  = document.getElementById('histCol').value;
  const bins = parseInt(document.getElementById('histBins').value);

  const vals = data.map(r=>parseFloat(r[col])).filter(v=>!isNaN(v));
  if (!vals.length) return;

  const min = Math.min(...vals), max = Math.max(...vals);
  const step = (max - min) / bins;
  const buckets = Array.from({length:bins}, (_,i) => ({
    label:`${(min+i*step).toFixed(1)}`,
    count:0,
  }));
  vals.forEach(v => {
    const i = Math.min(Math.floor((v-min)/step), bins-1);
    buckets[i].count++;
  });

  destroyChart('chart4');
  const ctx = document.getElementById('chart4').getContext('2d');
  _charts['chart4'] = new Chart(ctx, {
    type:'bar',
    data:{
      labels:buckets.map(b=>b.label),
      datasets:[{
        label:`Distribution of ${col}`,
        data:buckets.map(b=>b.count),
        backgroundColor:'rgba(91,143,249,0.7)',
        borderColor:'#5b8ff9', borderWidth:1, borderRadius:3,
        barPercentage:0.95, categoryPercentage:1.0,
      }]
    },
    options:{ ...BASE_OPTS(), plugins:{ ...BASE_OPTS().plugins, legend:{display:false} } }
  });
}
