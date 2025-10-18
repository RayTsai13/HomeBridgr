# HomeBridgr

A Next.js TypeScript application.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Project Structure

```
├── app/                 # Next.js 13+ App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout component
│   ├── page.tsx        # Home page
│   ├── api/            # API routes
│   ├── protected/      # Protected routes
│   └── public/         # Public routes
├── components/         # Reusable React components
├── lib/               # Utility functions and configurations
├── public/            # Static assets
├── styles/            # Additional stylesheets
├── next.config.js     # Next.js configuration
├── tsconfig.json      # TypeScript configuration
└── package.json       # Dependencies and scripts
```

## Available Scripts

In the project directory, you can run:

- `npm run dev` - Runs the development server
- `npm run build` - Builds the app for production
- `npm run start` - Runs the built app in production mode
- `npm run lint` - Runs ESLint to check for code issues
- `npm run type-check` - Runs TypeScript compiler to check for type errors

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!