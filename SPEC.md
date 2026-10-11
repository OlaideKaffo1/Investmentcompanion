# Investing Companion — Product Spec

Oct 11, 2026 · @Olaide

## Overview

Investing Companion is a personal web app that explains, in plain English, what is happening with the companies and markets I care about, so I can decide where to put my money. It is a learning tool, not a trading app: it never places trades and never tells me to buy or sell.

The problem it solves: financial news and blogs assume you already speak the jargon. The app translates every update into three answers: what happened, what it means, and why it matters for my decision.

It covers up to 20 companies across US stocks and the Nigerian Exchange (NGX), plus the wider economy in the US, Nigeria, China, Europe and the rest of the world.

Success looks like:

- I can explain each of my companies, what it sells and how it makes money, in two sentences.
- A short daily read and a deeper weekly one replace hours of reading financial blogs.
- Every investment decision I make has written reasons I can check later.
- I understand the NGX well enough to make my first investments there.

## Product principles

These rules decide every design and writing choice in the app.

1. **Plain English first.** Avoid jargon; when a term is needed, explain it in place. If a smart non-expert can't follow a sentence, rewrite it.
2. **Personal, not generic.** Everything is framed around my holdings, my watchlist and my stated reasons for owning something.
3. **Always say why it matters.** Every update answers: what happened, what it means, and what it could mean for my decision.
4. **Teach, don't tell.** The app lays out evidence and trade-offs. It never says buy or sell; the decision stays with me.
5. **Buzz is not quality.** What's trending on blogs and social media lives in its own labelled section, never mixed with the fundamentals.
6. **Show sources.** Every claim links to where it came from, with a date.
7. **Calm by default.** Few notifications, short reads, nothing designed to make me trade more.

## Core features

Seven features make up the app; the dashboard ties them together.

### Dashboard (home)

- **Today's note:** 3 to 5 bullets on what changed across my holdings and watchlist.
- **My companies:** a card per stock with price, weekly change and a one-line status ("Earnings in 12 days").
- **Coming up:** earnings dates, central bank meetings and major economic data in the next two weeks.
- **Trending:** companies people are talking about, clearly labelled as buzz.
- **Learn one thing:** a single concept of the day, tied to something in the news.

### Briefs

| Brief | When (Lagos time) | What it covers | Read time |
| --- | --- | --- | --- |
| Daily | Weekday mornings | What changed on my stocks, big market moves, anything that needs my attention | 2 minutes |
| Weekly | Sunday evening | Each company's week in plain English; markets and economy in the US, Nigeria and the world; what to watch next week; trending names | 10 minutes |
| Monthly | First weekend of the month | Holdings checked against my reasons for owning them, portfolio mix, big themes such as AI, what I learned | 20 minutes |

Briefs live in the app and the weekly one is also emailed.

### Watchlist and weekly tracker

- Up to 20 companies, US or NGX, added by name or ticker.
- Each is marked **Holding** or **Watching**. For holdings I can optionally add amount invested, buy date and buy price.
- Every Sunday the app saves a snapshot: price, weekly change, value of each holding. Over time this builds a history chart.
- A portfolio mix view shows my split by currency (naira vs dollar), country, sector and company size.

### Company story cards

One page per company, written for a non-expert:

- What they sell and who pays them
- How they make money, in one paragraph
- Main competitors
- What could go wrong: the top three risks
- What to watch: next earnings date and the two or three numbers that matter most
- Key numbers in plain English: revenue growth, profit or loss, cash, debt, each with a one-line explanation
- Recent news as a short dated timeline
- What analysts say and what's buzzing online, in separate labelled boxes

### Glossary

- Any financial term in the app can be tapped for a one-line explanation, with an example from one of my own companies.
- I can mark a term "I know this" so the app stops explaining it.

### Decision journal

- When I buy, sell or start watching a company, I write one to three lines on why.
- Weekly and monthly briefs check the news against those reasons. Example: "You bought Ondas for its defence contracts. This month it won two new Army orders."
- Over time it shows which of my reasons held up and which didn't.

### Ask

- A chat box for questions about any company, term or market event, answered in plain English with sources.

## Learning tracks

Three tracks of short lessons, each tied to live examples from the news and my own companies. Progress is saved, and lessons show up in briefs when they become relevant.

### NGX for beginners

I have little NGX exposure, so this track starts from zero.

- How the Nigerian Exchange works: trading hours, how prices move, how it compares to US markets.
- How to invest: choosing a stockbroker, opening an account, how shares are held and how fees work.
- The main sectors: banks, telecoms, industrials such as cement, consumer goods, oil and gas.
- Why dividends matter more on the NGX than in US tech, and how to read a dividend announcement.
- How the naira, inflation and interest rates affect Nigerian stocks.
- A starter list of large, well-known NGX companies to follow and learn from before investing. The app suggests; I choose.

### US markets and AI

- How US markets work: the main indexes (S&P 500, Nasdaq), earnings seasons, and how Federal Reserve interest-rate decisions move stocks.
- A map of the AI economy: chips, data centres and cloud computing (where Nebius sits), AI models, and the apps built on them. Who makes money at each layer, and who is still spending to get there.
- How to read an earnings report in plain English.

### Global economy

- A monthly "world in plain English" covering the US, China, Europe, Nigeria and the rest of Africa: growth, interest rates, trade and major policy moves.
- **What to look forward to:** a calendar of upcoming events (central bank meetings, elections, major data releases) with one line on why each could matter.
- How world events reach my stocks. Example: US rules on exporting AI chips could affect Nebius.

## Email alerts

Alerts are rare and specific: an email only when something happens that I should look into and learn from. Each one answers what happened, why it matters to me, and what to read next, with a link to the full story in the app.

| Trigger | Example | Starting rule (adjustable) |
| --- | --- | --- |
| Big price move on a holding | A stock drops sharply in one day | Moves of 10% or more in a day |
| Earnings released | A holding reports quarterly results | Plain-English summary within a few hours |
| Major company news | Acquisition, large contract, new shares issued, leadership change, lawsuit or regulation | Holdings always; watchlist when significant |
| News touching my reasons | Something that supports or weakens a reason in my decision journal | Always |
| Major economic event | Fed or Central Bank of Nigeria rate decision; a policy change affecting my companies | Only when it plausibly affects my holdings |

Guardrails:

- At most 3 alert emails a day; anything beyond that rolls into the next daily brief.
- Quiet hours from 10pm to 7am Lagos time, except for very large moves on a holding.
- Each alert type can be turned on or off, and thresholds changed, in settings.

## Platform and technical approach

A mobile-first web app I log into, installable to my phone's home screen; no App Store for now.

- **Web app:** responsive and designed for phone first. Installable as a progressive web app (PWA), so it gets an icon, opens full screen and can send push notifications later. Dark mode supported.
- **Login:** single private account; email magic link or passkey.
- **Market data:** a stock data provider for US prices, company financials and earnings calendars. A paid tier is likely; delayed or end-of-day prices are fine for this use.
- **NGX data:** the hardest part. Options are an NGX data vendor, public NGX pages read through search, or manual entry to start. Build the data layer so the NGX source can be swapped later.
- **News and buzz:** the Claude API with web search, reading news, company announcements and finance blogs. Trending is measured by how often a company is being discussed, and kept separate from analysis.
- **Claude API:** writes briefs, story cards, glossary entries and alerts, and answers questions in Ask. Every output cites its sources with dates.
- **Scheduled jobs:** daily, weekly and monthly briefs; Sunday snapshots; alert checks a few times a day.
- **Database:** holdings, watchlist, decision journal, snapshots, briefs, glossary progress and saved research.
- **Email:** a transactional email service for alerts and the weekly brief.
- **Suggested stack (Claude Code can propose alternatives):** Next.js on Vercel, Postgres via Supabase (database and login), Resend for email.

&#91;embedded content: how the parts fit · data in, Claude in the middle, me at the end\]

Scheduled jobs pull data and news, Claude turns it into plain English, and the results reach me through the app and email. The app is two-way: my holdings and journal flow back into the database.

## Scope and phases

Build in three phases, each usable on its own, so I can live with the app and adjust before adding more.

1. **Phase 1, the core (US stocks):** login, watchlist of up to 20, holdings entry, Sunday snapshots and tracker, company story cards, glossary, weekly brief in the app and by email.
2. **Phase 2, staying informed:** daily brief, dashboard with Coming up and Trending, email alerts, decision journal, NGX for beginners learning track.
3. **Phase 3, going wider:** NGX company data and story cards, monthly brief, US markets and AI track, global economy track and calendar, Ask.

Keeping costs modest:

- Cap the watchlist at 20 companies.
- Save research per company and reuse it; only refresh what changed.
- Daily briefs are short summaries using a smaller, cheaper model; weekly and monthly briefs use a stronger one.
- Set a monthly spending limit on every API key, and show this month's spend on a settings page.

## Risks, limits and open questions

The biggest unknowns are NGX data and running costs; both should be settled before Phase 3.

- **Not financial advice.** The app explains; I decide. A short note in the app says so.
- **AI can be wrong.** Every claim is sourced and dated so I can check it before putting money in.
- **Data delays.** Cheaper data is often delayed or end-of-day. Fine for learning; not for day trading.
- **NGX data** may be limited, delayed or costly.
- **Privacy.** My holdings are personal financial data: private login, encrypted keys, no sharing.

Open questions:

- [ ] Which US market data provider, and what does it cost?
- [ ] Which NGX data source, if any, before relying on manual entry?
- [ ] Monthly budget ceiling for data and AI together?
- [ ] Start alerts with the default thresholds above, or tune first?
- [ ] What is the app called?

## Building it with Claude Code

Export this doc as Markdown, save it in the project as `SPEC.md`, and build Phase 1 in small steps, testing each on my phone.

1. Set up the project, login and database; deploy an empty app I can open on my phone.
2. Watchlist and holdings entry, plus Sunday snapshots.
3. Connect the market data provider; build company story cards.
4. Generate the weekly brief and email it.
5. Add the glossary, then move to Phase 2.

First prompt to paste into Claude Code:

> I'm building a personal investing companion web app. Read SPEC.md first. Start with Phase 1, step 1: set up a mobile-first web app with a single private login and a database, using the suggested stack unless you have a better recommendation. Explain each choice in plain language, and ask me before signing up for any paid service. When it's deployed, tell me how to open it on my phone and add it to my home screen.
