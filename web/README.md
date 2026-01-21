# easystage.nl

A Next.js application for finding internships in the Netherlands, powered by Convex for backend and authentication.

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev) account

### Setup

1. Install dependencies:

```bash
npm install
```

2. Set up Convex:

```bash
npx convex dev
```

This will prompt you to create a new project or link to an existing one.

3. Configure environment variables in your `.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# MeiliSearch
MEILI_URL=http://localhost:7700
MEILI_KEY=your-meilisearch-key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Set up Google OAuth in the Convex Dashboard:
   - Go to your project's Settings > Environment Variables
   - Add `AUTH_GOOGLE_ID` with your Google OAuth Client ID
   - Add `AUTH_GOOGLE_SECRET` with your Google OAuth Client Secret

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Convex
- **Authentication**: Convex Auth with Google OAuth
- **Search**: MeiliSearch
- **UI Components**: Radix UI

## Project Structure

```
web/
├── app/                  # Next.js App Router pages
├── components/           # React components
├── convex/              # Convex backend functions and schema
│   ├── auth.ts          # Authentication configuration
│   ├── http.ts          # HTTP routes for auth
│   └── schema.ts        # Database schema
└── lib/                 # Utility functions
```

## Learn More

- [Convex Documentation](https://docs.convex.dev)
- [Convex Auth Documentation](https://docs.convex.dev/auth)
- [Next.js Documentation](https://nextjs.org/docs)
