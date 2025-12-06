# Project Plan: EnrichFlow

**Project Name**: EnrichFlow
**Objective**: Build a Next.js dashboard where users can input Apollo URLs to automate contact fetching and waterfall enrichment via n8n, using user-provided API keys.

---

## Milestones

### Milestone 1: CRM Frontend
**Goal**: Establish the visual foundation and user interface of the application.

*   **Day 1: Project Setup & Design System**
    *   Initialize Next.js 14+ (App Router) with TypeScript and Tailwind CSS.
    *   Install and configure **Shadcn/UI** for a premium, modern aesthetic.
    *   Setup global layout (Sidebar navigation, Header, Dark mode toggle).
*   **Day 2: Dashboard & Campaign UI**
    *   Create the **Dashboard Home**: Overview of recent campaigns and credit usage.
    *   Create **New Campaign Modal/Page**: Form to input Apollo Search URL and name the campaign.
    *   Create **Campaign Details View**: Table view to display fetched contacts (Name, Email, Company, Status, Enrichment Source).
*   **Day 3: Settings & API Management UI**
    *   Create **Settings Page**: Secure forms for users to input and save their own API keys for:
        *   Apollo
        *   LeadMagic
        *   IcyPeas
        *   FindyMail
        *   FullEnrich
    *   Implement client-side validation for these inputs.
*   **Day 4: UI Polish & Responsiveness**
    *   Ensure all pages are fully responsive (Mobile/Desktop).
    *   Add micro-interactions (loading states, toast notifications) for better UX.

---

### Milestone 2: Authentication + API Integrations Setup in CRM
**Goal**: Secure user access and prepare the database for data handling.

*   **Day 5: Supabase Setup & Auth**
    *   Initialize Supabase project.
    *   Implement Authentication (Email/Password + optional Google Auth).
    *   Create Protected Routes in Next.js (middleware to redirect unauthenticated users).
*   **Day 6: Database Schema & Security**
    *   Design and apply SQL Schema:
        *   `profiles`: User details.
        *   `api_keys`: Encrypted storage for user API keys.
        *   `campaigns`: Stores Apollo URL, status, and metadata.
        *   `contacts`: Stores individual lead data and enrichment results.
    *   Implement **Row Level Security (RLS)** policies to ensure users only see their own data.
*   **Day 7: Backend Integration**
    *   Connect Frontend "Settings" forms to the `api_keys` table.
    *   Connect "New Campaign" form to create records in the `campaigns` table.
    *   Setup Supabase Realtime (optional) or polling hooks to update UI when n8n processes data.

---

### Milestone 3: n8n Automation + Contacts Export
**Goal**: Build the core logic engine that fetches and enriches data.

*   **Day 8: n8n Setup & Apollo Integration**
    *   Setup n8n (Self-hosted on Render/Railway or Cloud).
    *   **Workflow Part 1**: Trigger via Webhook (from Next.js) -> Fetch User API Keys from Supabase.
    *   **Workflow Part 2**: Use Apollo API to fetch contacts based on the provided URL.
*   **Day 9: Waterfall Enrichment Logic (The Core)**
    *   Design the "Waterfall" logic in n8n:
        1.  **LeadMagic**: Check for valid email. If found -> Update Contact -> End.
        2.  **IcyPeas**: If no result from above -> Check IcyPeas.
        3.  **FindyMail**: If no result from above -> Check FindyMail.
        4.  **FullEnrich**: If no result from above -> Check FullEnrich.
*   **Day 10: Data Sync & Error Handling**
    *   Ensure n8n updates the `contacts` table in Supabase after *each* step or in batches.
    *   Handle API rate limits and failures (e.g., if a user's API key is invalid).
*   **Day 11: Frontend-Backend Connection**
    *   Wire up the "Start Campaign" button in Next.js to trigger the n8n Webhook.
    *   Display real-time progress in the Dashboard (e.g., "Enriching... 50/100").
*   **Day 12: Export Functionality**
    *   Implement "Export to CSV" button in the Campaign Details view.
    *   Generate CSV files based on the `contacts` table data.

---

### Milestone 4: Handover + Testing
**Goal**: Ensure stability, deploy, and transfer ownership.

*   **Day 13: End-to-End Testing**
    *   Test the full flow: Sign up -> Add Keys -> Create Campaign -> Wait for Enrichment -> Export CSV.
    *   Verify Waterfall logic (mock failures in primary services to ensure fallback works).
*   **Day 14: Deployment & Optimization**
    *   Deploy Next.js frontend to **Vercel**.
    *   Ensure n8n is running stably on the chosen hosting provider.
    *   Optimize database queries and UI performance.
*   **Day 15: Documentation & Handover**
    *   Write **README.md**: Setup instructions, environment variables.
    *   Write **User Guide**: How to get API keys, how to use the dashboard.
    *   Final code push and project closure.
