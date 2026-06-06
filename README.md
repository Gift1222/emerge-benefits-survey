# Emerge Livelihoods — Employee Benefits Review App

A React + Supabase app with two pages:
- `/` — Employee survey form (public, no login required)
- `/admin` — HR dashboard with charts, response table, and Excel export (login protected)

---

## Project structure

```
emerge-benefits/
├── index.html
├── vite.config.js
├── package.json
├── .env.example              ← copy to .env and fill in your values
├── supabase_setup.sql        ← run this once in Supabase SQL Editor
└── src/
    ├── main.jsx
    ├── App.jsx               ← routing
    ├── lib/
    │   └── supabaseClient.js ← shared Supabase client
    ├── components/
    │   └── ProtectedRoute.jsx
    └── pages/
        ├── SurveyForm.jsx    ← the employee form
        ├── AdminLogin.jsx    ← admin sign-in
        └── AdminDashboard.jsx← charts + table + Excel export
```

---

## Setup (one-time)

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New project → choose a region close to Malawi (e.g. eu-west).

### 2. Run the database setup
In Supabase Dashboard → **SQL Editor** → **New query**, paste the contents of `supabase_setup.sql` and click **Run**.

This creates the `responses` table and sets Row Level Security so:
- Any visitor can INSERT (submit the form) — no login needed
- Only authenticated admin users can SELECT (view responses in the dashboard)

### 3. Create an admin user
In Supabase Dashboard → **Authentication** → **Users** → **Add user**.
Enter the email and password for the HR admin (e.g. hr@emergelivelihoods.org).

### 4. Set environment variables
```bash
cp .env.example .env
```
Then open `.env` and fill in your values from Supabase Dashboard → **Project Settings** → **API**:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Install and run
```bash
npm install
npm run dev
```

The app runs at http://localhost:5173

---

## Pages

| URL | Who | What |
|-----|-----|------|
| `/` | Employees | Fill and submit the benefits review form |
| `/admin/login` | HR admin | Sign in with email + password |
| `/admin` | HR admin (authenticated) | Dashboard with charts, all responses table, and Excel export |

---

## Excel export

The **Export to Excel** button on the dashboard downloads a `.xlsx` file with 4 sheets:

| Sheet | Contents |
|-------|----------|
| All Responses | One row per submission with all fields and ratings |
| Average Ratings | Average score per benefit across all responses |
| Priority Rankings | Benefits ranked by weighted priority score |
| Salary Distribution | Breakdown of salary increment recommendations |

---

## Deploying to production

**Option A — Netlify (easiest):**
1. Push to GitHub
2. Connect to Netlify → Build command: `npm run build`, Publish: `dist`
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify → Site settings → Environment variables

**Option B — Vercel:**
Same as above but deploy via Vercel dashboard.

Share the production URL with employees. The `/admin` route is password-protected.

---

## How responses are stored (Supabase schema)

Table: `public.responses`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Auto-generated primary key |
| submitted_at | timestamptz | Submission timestamp |
| employee | jsonb | Name, employment type, programme, dept, years, pay |
| ratings | jsonb | `{ "Salary": 3, "Annual leave": 5, … }` |
| priorities | text[] | `["Salary", "Medical insurance", …]` (up to 6) |
| salary_increment | text | `"5%"`, `"10%"`, or `"15%"` |
| recommendations | text | Free-text response |
| suggestions | text | Free-text response |
