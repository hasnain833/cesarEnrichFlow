# Backend

This folder contains the backend logic for the application, including Prisma database models and integration management.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up your database URL in `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

3. Run Prisma migrations:
```bash
npx prisma migrate dev
```

4. Generate Prisma Client:
```bash
npx prisma generate
```

## Database Schema

### User
- `id`: UUID (Primary Key)
- `supabaseId`: String (Unique) - Links to Supabase auth user
- `email`: String (Unique)
- `firstName`: String (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Integration
- `id`: UUID (Primary Key)
- `userId`: String (Foreign Key to User)
- `apiName`: String - Name of the API (e.g., "Apollo API", "LeadMagic")
- `apiKey`: String - Encrypted API key
- `isActive`: Boolean
- `createdAt`: DateTime
- `updatedAt`: DateTime

## Usage

Import the integration functions from `Backend/lib/integrations.ts`:

```typescript
import { getUserIntegrations, upsertIntegration } from '@/Backend/lib/integrations'

// Get all integrations for a user
const integrations = await getUserIntegrations(supabaseUserId)

// Create or update an integration
const integration = await upsertIntegration(
  supabaseUserId,
  'Apollo API',
  'api-key-here',
  'user@example.com',
  'John'
)
```

