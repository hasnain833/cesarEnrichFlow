# EnrichFlow

**EnrichFlow** is a powerful Next.js dashboard designed to automate contact fetching from Apollo URLs and perform waterfall enrichment using multiple data providers via n8n. It serves as a central hub for managing lead generation campaigns, streamlining the process of gathering and verifying contact information.

## 🚀 Features

-   **Dashboard Overview**: View recent campaigns and track credit usage at a glance.
-   **Campaign Management**: Easily create new campaigns by pasting Apollo search URLs.
-   **Automated Enrichment**: Seamlessly integrates with n8n to execute waterfall enrichment workflows.
-   **Multi-Provider Support**: Supports integrations with:
    -   Apollo (Contact Fetching)
    -   LeadMagic
    -   IcyPeas
    -   FindyMail
    -   FullEnrich
-   **Secure API Key Management**: Safely store and manage your own API keys for each service.
-   **Export Data**: Export enriched contact lists to CSV for easy use in other tools.
-   **Modern UI**: Built with Shadcn/UI and Tailwind CSS for a premium, responsive user experience (Dark/Light mode included).

## 🛠️ Tech Stack

-   **Frontend**: [Next.js 14+](https://nextjs.org/) (App Router), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/)
-   **Backend/Database**: [Supabase](https://supabase.com/) (Authentication & PostgreSQL Database), [Prisma](https://www.prisma.io/) (ORM)
-   **Automation**: [n8n](https://n8n.io/) (Workflow Automation)

## 📋 Prerequisites

Before you begin, ensure you have the following:

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   npm or bun
-   A [Supabase](https://supabase.com/) project
-   An [n8n](https://n8n.io/) instance (Self-hosted or Cloud)

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/existantly/existantly_flow.git
    cd enrichflow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory and configure your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    DATABASE_URL=your_database_url
    NEXT_PUBLIC_SITE_URL=https://cesar-enrich-flow.vercel.app
    N8N_WEBHOOK_URL=https://n8n.srv1091332.hstgr.cloud/webhook/enrich-contacts
    N8N_API_KEY=your_n8n_api_key

    STRIPE_SECRET_KEY=your_stripe_secret_key
    STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
    NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=your_stripe_price_id_monthly
    NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=your_stripe_price_id_yearly
    NEXT_PUBLIC_APP_URL=https://cesar-enrich-flow.vercel.app
    ```

4.  **Database Setup:**
    Generate the Prisma client:
    ```bash
    npm run db:generate
    ```
    Push the schema to your database (if setting up for the first time):
    ```bash
    npm run db:push
    ```

## 🏃‍♂️ Usage

1.  **Run the development server:**
    ```bash
    npm run dev
    ```

2.  **Open the application:**
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

3.  **Get Started:**
    -   **Sign Up/Login**: Create an account to secure your data.
    -   **Configure Integrations**: Go to the settings or sidebar to add your API keys for Apollo and enrichment services.
    -   **Create a Campaign**: Paste an Apollo Search URL to start fetching and enriching contacts.
    -   **Export**: Once processing is complete, download your data as a CSV.

## 📜 Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the application for production.
-   `npm run start`: Starts the production server.
-   `npm run lint`: Runs ESLint checks.
-   `npm run db:generate`: Generates Prisma client.
-   `npm run db:push`: Pushes Prisma schema to the database.
-   `npm run db:studio`: Opens Prisma Studio to view database records.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
