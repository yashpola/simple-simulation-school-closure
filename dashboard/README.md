# School Closure Deliberation · Interactive Dashboard (Digital Twin)

A minimalistic, interactive dashboard and digital twin for the multi-agent deliberation experiment on School Closures & Mergers in Singapore.

This web application mirrors the exact local execution pipeline from `src/main.py`, `src/deliberation.py`, and `src/evaluation.py`, providing:
1. **Interactive Configuration Studio**: Configure model assignments, temperatures, random seeds, deliberation turn budgets, and prompts directly as in `config.json`.
2. **Bring Your Own Key (BYOK) Security**: Secure client-side API key & base URL configuration. Users provide their own keys (Together AI, OpenAI, Groq, OpenRouter, or local vLLM/Ollama) so the host does not pay for visitors' compute. Keys are stored only in the user's browser, never saved to Supabase, and never logged.
3. **Runs Directory (`expXXX`)**: Browse and filter past experiment runs saved in Supabase (or local storage fallback), matching the indexed directory structure (`exp000`, `exp001`, etc.).
4. **Run Inspector (Interactive Twin)**:
   - **Deliberation Dialogue & Scratchpads**: Side-by-side or tabbed view of System 1 (Control: direct dialogue) vs System 2 (Treatment: internal reflection `<private_scratchpad>` before `<public_response>`).
   - **Pre vs Post Stance Evolution**: Track how each agent (MOE Official & Teacher) shifted their opinions.
   - **Discourse Quality Index (DQI)**: Turn-by-turn LLM-as-a-Judge calibrated rubric comparison across 5 dimensions (Level of Justification, Content of Justification, Respect, Constructive Politics, Interactivity).
   - **Directory Files Viewer**: View, copy, or download the exact JSON artifacts: `config.json`, `results_control.json`, `results_treatment.json`, and `evals.json`.
5. **Live Experiment Runner**: Run real-time deliberation trials directly from the browser with streaming progress updates and automatic persisting to Supabase as the next `expXXX` directory run.

---

## 🔒 Bring-Your-Own-Key (BYOK) Security & Privacy Architecture

To protect your cloud compute budget and ensure users can safely run their own choice of LLMs (Together AI, OpenAI, Groq, OpenRouter, or local vLLM/Ollama), the dashboard implements a **zero-persistence, client-controlled credential model**:

### 1. Where is the Key Stored?
- **Client-Side Only**: Your API key lives entirely in your local browser storage (`sessionStorage` or `localStorage`).
- **Session Purge Option**: Selecting *"This session only"* automatically purges the key from memory the instant you close the browser tab.
- **One-Click Instant Erase**: Clicking *"Clear Key"* wipes the stored credential immediately from local browser storage.

### 2. How is the Key Transmitted & Processed?
- **TLS 1.3 Transport Encryption**: The key is transmitted exclusively over encrypted HTTPS directly to the `/api/run-experiment` endpoint inside the POST request body. It is **never** passed via URL query parameters, preventing exposure in browser history or reverse-proxy logs.
- **Transient In-Memory Execution (RAM Only)**: The Next.js serverless execution runtime receives the key in-memory, instantiates the OpenAI-compatible client, streams the simulation dialogue turns, and immediately discards the reference upon stream termination.
- **Zero Disk Writes & Zero Logging**: The server never writes the key to file systems, temporary files, disk caches, or console logs.

### 3. What Gets Saved to Supabase?
- **Strict Database Sanitization**: When a simulation completes, only the resulting conversational transcripts, stance shifts, and DQI scores are written to the `school_closure_experiments` table. All API keys, tokens, and authorization headers are strictly excluded and stripped before any Supabase write occurs.
- **No Cross-User Leakage**: Other visitors viewing the public run history can inspect dialogue and metrics, but have **zero access** to your API keys.

### 4. Zero-Cloud / Offline Option (Local Models)
- If you prefer total data sovereignty with no external API calls, select the **Custom / Local** preset and enter `http://localhost:11434/v1` (for Ollama, vLLM, or LMStudio). You can use any arbitrary placeholder text as the API key, keeping 100% of data and compute entirely on your machine.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies

```bash
cd dashboard
bun install
# or: npm install
```

### 2. Configure Environment Variables

Edit `dashboard/.env`:

```ini
# Supabase Configuration ("Simulation Experiments" Database)
NEXT_PUBLIC_SUPABASE_URL=https://inukvqkyonfklkelpkzh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_IIV7U1mG3WJp_UIebuYltw_4P6iZLl1

# Default Base URL (Optional, users configure this in the UI)
OPENAI_BASE_URL=https://api.together.xyz/v1
```

> **Note**: Leave `OPENAI_API_KEY` blank in `.env` so that each visitor enters their own key in the UI.

### 3. Start the Development Server

```bash
bun dev
# or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Supabase Database Setup ("Simulation Experiments")

1. Open your Supabase project (**Simulation Experiments**).
2. Go to the **SQL Editor** tab on the left sidebar.
3. Open or copy the contents of `dashboard/supabase/schema.sql` and click **Run**:

```sql
CREATE TABLE IF NOT EXISTS school_closure_experiments (
    id TEXT PRIMARY KEY,                 -- e.g. 'exp000', 'exp001'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL DEFAULT 'School Closure Deliberation',
    description TEXT,
    status TEXT DEFAULT 'completed',     -- 'completed', 'running', 'failed'
    
    config JSONB NOT NULL,               -- config.json
    results_control JSONB,               -- results_control.json
    results_treatment JSONB,             -- results_treatment.json
    evals JSONB,                         -- evals.json
    metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE school_closure_experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on school_closure_experiments" ON school_closure_experiments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on school_closure_experiments" ON school_closure_experiments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on school_closure_experiments" ON school_closure_experiments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on school_closure_experiments" ON school_closure_experiments FOR DELETE USING (true);
```

---

## ☁️ Deploying to Vercel

1. Push your repository to GitHub / GitLab.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New... → Project**.
3. Select this repository.
4. In the project configuration:
   - **Root Directory**: Click "Edit" and set to `dashboard`.
   - **Framework Preset**: Next.js (auto-detected).
5. In the **Environment Variables** section, add only your Supabase keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   *(Do **not** add `OPENAI_API_KEY` on Vercel so visitors pay for their own compute using their own keys).*
6. Click **Deploy**.
