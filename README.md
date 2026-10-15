<div align="center">

# Monivo

**Know where your money goes, without the spreadsheet.**

![Expo SDK 57](https://img.shields.io/badge/Expo_SDK-57-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)

</div>

Most budgeting apps fail for the same reason: logging every coffee is a chore, so people stop doing it. Monivo is built around making that part fast. Snap a photo of the receipt, or just say "twelve fifty for lunch and forty for petrol", and it's recorded. The rest of the app turns those entries into a clear picture of your month, and tells you early when you're heading over budget.

It runs on iOS and Android, syncs to the cloud, and keeps working when you're offline.

## What it does

**A home screen that answers "how am I doing?"**
Your total balance sits at the top, and one tap switches it to this month's income or spending. Below it, a budget ring fills up as you spend and changes colour as you near your limit. A pace chart shows whether you're spending faster than your budget allows, and a breakdown ring shows which categories are taking the most.

**Adding money in or out takes seconds**
Type it in, scan a receipt, or speak. Receipt scanning reads the store, total, date and category for you to confirm. Voice understands several items in one sentence and turns each into its own entry.

**An assistant that knows your numbers**
Ask "How much did I spend on food this month?" or "Am I on track with my budget?" and get a straight answer, with a chart when it helps and a few follow-up questions to dig deeper.

**Accounts, history and exports**
Keep cash, bank and credit card accounts side by side with live balances. Search and filter your history, see daily income and spending for the month, undo an accidental delete, and export everything to CSV.

**Nudges in your inbox**
Get an email when your spending passes your alert threshold, and a weekly recap every Monday morning (in your own time zone) with your top categories and a couple of practical tips. Every email has a one-tap unsubscribe.

**Built to be trusted with your finances**
Sign-ins use 6-digit email codes, two-step login works with any authenticator app and comes with backup codes, and your session is encrypted on the device. You can delete your account and every piece of your data whenever you like.

**Pleasant to use**
Light and dark themes with a frosted-glass look, smooth animations that respect "Reduce motion", and a layout that fits small phones and tablets alike.

## Under the hood

The app is written in **TypeScript** with **Expo** and **React Native**, using Expo Router for navigation, NativeWind for styling, TanStack Query for data and offline caching, and Reanimated for animation.

The backend is **Supabase**. Postgres row-level security means each person can only ever reach their own data, so the app talks to the database directly without a custom API. Anything that needs a secret runs in Edge Functions: **Google Gemini** for receipts, voice and the assistant, and Gmail SMTP for email. Scheduled emails are driven by pg_cron.

## Run it yourself

You'll need Node.js 20+, a free [Supabase](https://supabase.com) project, a [Gemini API key](https://aistudio.google.com) and a Gmail [App Password](https://myaccount.google.com/apppasswords).

```bash
npm install
cp .env.example .env.local    # add your Supabase URL and publishable key

npx supabase link --project-ref <your-project-ref>
npx supabase db push && npx supabase config push && npx supabase functions deploy --use-api
npx supabase secrets set GEMINI_API_KEY=... SMTP_USER=you@gmail.com SMTP_PASS=...

npx expo start                # scan the QR code with Expo Go
```

Then switch on custom SMTP in the Supabase dashboard (`smtp.gmail.com`, port `465`) so sign-up codes and alerts can be sent.

Handy commands while working on it: `npm test`, `npm run lint` and `npm run typecheck`.

## Project layout

```
app/          Screens and navigation
src/          Components, hooks, services and theme
supabase/     Database migrations, Edge Functions and email templates
```

## Security

Every table is protected by row-level security, API keys never ship inside the app, server functions check who's calling and cap AI usage, and passwords are hashed by Supabase Auth. If you find a security issue, please report it privately instead of opening a public issue.
