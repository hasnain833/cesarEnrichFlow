# Backend

This folder contains the backend database setup using Prisma.

## Setup

1. Make sure you have a `.env` file in the root directory with your `DATABASE_URL`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   ```

2. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

3. Push the schema to your database:
   ```bash
   npm run db:push
   ```

   Or run migrations:
   ```bash
   npm run db:migrate
   ```

4. (Optional) Open Prisma Studio to view your data:
   ```bash
   npm run db:studio
   ```

## Database Schema

- **User**: Stores user information linked to Supabase auth
  - `id`: UUID (Primary Key)
  - `supabaseId`: String (Unique, links to Supabase auth user)
  - `email`: String (Unique)
  - `firstName`: String (Optional)
  - `lastName`: String (Optional)
  - `createdAt`: DateTime
  - `updatedAt`: DateTime

- **Integration**: Stores API keys for each user's integrations (Apollo API, LeadMagic, etc.)
  - `id`: UUID (Primary Key)
  - `userId`: String (Foreign Key to User)
  - `serviceName`: String (e.g., "Apollo API", "LeadMagic", "IcyPeas")
  - `apiKey`: String
  - `isActive`: Boolean
  - `createdAt`: DateTime
  - `updatedAt`: DateTime
  - Unique constraint on `[userId, serviceName]`

## API Routes

The API routes are located in `app/api/integrations/`:
- `GET /api/integrations` - Get all integrations for the authenticated user
- `POST /api/integrations` - Create or update an integration
- `DELETE /api/integrations?serviceName=...` - Delete an integration
- `GET /api/integrations/[serviceName]` - Get a specific integration
