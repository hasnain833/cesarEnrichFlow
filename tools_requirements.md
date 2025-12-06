# Tools & Requirements: EnrichFlow

To successfully build and run **EnrichFlow**, the following tools, services, and accounts are required.

## 1. Core Technology Stack

### Frontend & Backend Framework
*   **Next.js 14+**: The React framework for building the dashboard and handling server-side logic.
*   **TypeScript**: For type-safe code.
*   **Tailwind CSS**: For styling.
*   **Shadcn/UI**: For pre-built, accessible UI components.

### Database & Authentication
*   **Supabase**:
    *   **PostgreSQL Database**: To store user data, API keys, campaigns, and contacts.
    *   **Supabase Auth**: To handle user signup, login, and session management.
    *   **Realtime**: (Optional) To push updates to the dashboard when enrichment completes.

### Automation Engine
*   **n8n**: The workflow automation tool that connects the APIs.
    *   *Note*: n8n requires a hosting environment (see below) or can be used via their Cloud offering.

---

## 2. Hosting & Infrastructure

### Frontend Hosting
*   **Vercel** (Recommended): Best for Next.js. Free tier is usually sufficient for development/demos.
    *   *Alternative*: Netlify, Render.

### n8n Hosting
*   **Option A: n8n Cloud** (Easiest): Managed service by n8n. Starts at ~$20/mo.
*   **Option B: Self-Hosted (Render/Railway/Fly.io)** (Cheaper/Flexible):
    *   **Render**: Can host the n8n Docker image. Estimated cost: ~$7/mo for a starter instance.
    *   **Railway**: Good alternative for Docker hosting.
    *   **VPS (DigitalOcean/Hetzner)**: For full control, starting at ~$5/mo.

### Database Hosting
*   **Supabase Cloud**: Free tier is generous and perfect for this project scope (500MB DB, 50k monthly active users).

---

## 3. Required APIs (User Provided)

The application relies on the user providing their own API keys for these services. For *development and testing*, you (the developer) will need at least trial access to these:

1.  **Apollo API**: For searching and fetching initial contact data.
2.  **LeadMagic**: Enrichment Service #1.
3.  **IcyPeas**: Enrichment Service #2.
4.  **TryKitt**: Enrichment Service #3.
5.  **A-Leads**: Enrichment Service #4.
6.  **MailVerify**: Verification Service #1
7.  **Enrichley**: Verification Service #2 

*Note: The system is designed to handle cases where a user might only have keys for some of these services, but for full "Waterfall" testing, access to all is ideal.*

---

## 4. Development Tools

*   **Node.js & npm/pnpm**: For running the Next.js local development server.
*   **Git & GitHub/GitLab**: For version control.
*   **Postman / Insomnia**: For testing API endpoints independently of n8n.
*   **Docker** (Optional): If you choose to run n8n locally during development.
