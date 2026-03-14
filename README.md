# 🤖 AI Data Analysis Automation

A fully browser-based data analysis platform powered by **Groq API** (free!) with Llama 3.3 / Mixtral models.

## ✨ Features

| Feature | Description |
|---|---|
| 📂 **Upload Data** | CSV and Excel (.xlsx/.xls) support, drag & drop |
| 🧹 **Clean & Preprocess** | Auto-detect missing values, outliers, fill/trim options |
| 📊 **EDA** | Statistical summary — mean, median, std dev, distributions |
| 🤖 **AI Analysis** | Ask anything about your data using Groq (free LLM API) |
| 📈 **Visualize** | Bar, Line, Scatter, Pie charts with Chart.js |
| 📑 **Export** | Download cleaned CSV, JSON, or full HTML report |

## 🚀 Deploy to GitHub Pages (Free Hosting)

### Step 1: Fork / Clone this repo
```bash
git clone https://github.com/YOUR_USERNAME/ai-data-analysis.git
cd ai-data-analysis
```

### Step 2: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-data-analysis.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow will auto-deploy on every push to `main`
4. Your site will be live at: `https://YOUR_USERNAME.github.io/ai-data-analysis`

### Step 4: Get Free Groq API Key
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for free (no credit card required)
3. Create an API key
4. In the app, click **⚙ Settings** and paste your key

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (no build step needed!)
- **AI**: [Groq API](https://console.groq.com) — free tier with Llama 3.3 70B, Mixtral 8x7B
- **CSV Parsing**: [PapaParse](https://www.papaparse.com/)
- **Excel Parsing**: [SheetJS](https://sheetjs.com/)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **Hosting**: GitHub Pages (free)

## 📁 Project Structure

```
ai-data-analysis/
├── index.html              # Main app shell
├── css/
│   └── style.css           # Dark theme styling
├── js/
│   ├── app.js              # State, settings, Groq API call
│   ├── pages.js            # Page renderers (Upload, Clean, EDA, Analysis, Visualize, Report)
│   ├── charts.js           # Chart.js wrappers
│   ├── analysis.js         # Analysis utilities
│   └── report.js           # CSV/JSON/HTML export
├── .github/
│   └── workflows/
│       └── deploy.yml      # Auto-deploy to GitHub Pages
└── README.md
```

## 🔒 Privacy

- Your API key is stored **only in your browser** (localStorage)
- Your data **never leaves your browser** — all processing is client-side
- The only external call is to Groq API for AI analysis

## 📝 License

MIT — free to use and modify.
