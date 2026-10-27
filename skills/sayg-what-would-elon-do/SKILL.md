---
name: sayg-what-would-elon-do
description: Roast an idea, product, architecture or codebase as if Elon Musk were the shark in a Shark Tank, to provoke change and different thinking - first principles, deleting parts, 10x instead of 10%, impossible goals, world-changing scale, and blunt comparisons with what already exists. Use when the user asks for a roast, "what would Elon do", to think bigger, to stress-test ambition, before a pitch or a big bet, or when the product feels incremental.
---

# sayg-what-would-elon-do

> Adapt questions, vocabulary, evidence and autonomy to the builder profile (`sayg-profile`), per area of depth.

A roast that exists to change minds, not to entertain. Every hit lands on the idea or the code, never on the person, and every hit comes with the rebuild: what to try instead, this week.

This is a lens built from principles Elon Musk has stated publicly (first principles, his five-step "algorithm", "the best part is no part", 10x over 10%, aggressive timelines). It is not his opinion, not affiliated with him, and must never put words in his mouth: no invented quotes, no "Elon would say…" claims about specific facts.

## Before the tank

1. Read what exists: `.sayg/intent.md`, `product/manifesto.md`, the latest `scale-*.md`, `architecture.md`, discoveries, and the code itself (`tools/repo-snapshot.sh`, the board's health tab if available).
2. Get the **pitch**: ask for it in two sentences. If nothing exists, ask for it; if the user rambles, that is the first roast ("If you can't say it in two sentences, the customer won't either").
3. Set the heat: `mild`, `spicy` (default) or `full roast`. The user can change it any time. Heat changes tone, never honesty.
4. Research live with `sayg-scout`: the real competitors, the incumbent, and the best-in-class reference for each claim. Comparisons must be to things that exist, with sources and dates.

## The rounds

Use `templates/roast/questions.md` for the question bank. Keep each round short and punchy; at most five hits per round. Each hit = **the roast** (one blunt line, with evidence) + **the rebuild** (a concrete alternative or experiment).

**Round 1 · The cold open.** Five one-liners on the weakest points: incremental, copyable, slow, too many parts, small or vague market, nobody in pain. Compare each to something that exists ("This is a spreadsheet with a login. Airtable already sells that.").

**Round 2 · First principles.** Strip the idea to fundamental truths, not analogies ("everyone does it this way" is not a reason). Compute the **idiot index**: the price or cost per unit versus the raw floor (compute, storage, tokens, human minutes). Where is the 10× waste? Is the stated limit physics or just convention?

**Round 3 · The algorithm, in order.** Apply it to the product, the code and the process:
1. *Make requirements less dumb*: each one needs a named person who owns it, not a department. Which requirement is the dumbest?
2. *Delete*: features, steps, services, dependencies, code paths, meetings. If nothing needs adding back afterwards, not enough was deleted. Name specific candidates from the repo.
3. *Simplify and optimize*, only what survived deletion. Optimizing something that should not exist is the classic mistake.
4. *Accelerate*: cycle time from idea to production, from commit to deploy, from user feedback to fix. Measure it (the board's flow tab).
5. *Automate*: last, never first.

**Round 4 · 10× or go home.** What would this look like 10× cheaper, 10× faster, or with zero humans in the loop? Set one **impossible goal** with a deadline that feels too short, then find the smallest path that makes it merely very hard.

**Round 5 · Change the world.** If this works at full scale (every company in the segment, a billion people), what changes? If the honest answer is "a bit of convenience", it is a feature, not a company. Write the mission in one sentence that would make an engineer quit their job to join.

**Round 6 · The analogy test.** Pick the analogy that fits and push on it, as a thinking tool, not as a claim about those companies: making the expensive version first and then the mass-market one; reusing what everyone throws away; owning the bottleneck component instead of buying it; bundling separate tools into one platform; the decade-long bet nobody else will fund. Then compare with a real, current competitor found in step 4.

**Round 7 · The code roast** (when there is code). Too many services for the number of users? A framework where a function would do? A queue nobody needed? Tests that test nothing? A deploy that takes longer than the change? Point to files and numbers.

## The verdict

- **I'm in / I'm out / Come back when…**, with the one condition that would flip it.
- **Scorecard** 1–10: Ambition (10× or 10%?), First-principles soundness, Deletion (how much is gone), Speed of iteration, Physics vs convention, World impact, Unfair advantage. Grade each by evidence (`measured`, `observed`, `sourced`, `assumed`); an `assumed` score caps at 6.
- **The one thing to change this week**: a single, concrete move.

Write the roast to `.sayg/product/roast-YYYY-MM-DD.md` (template: `templates/roast/report.md`), so the next roast can show what changed.

## Turning the roast into change

- Each accepted rebuild becomes a discovery in `.sayg/discoveries.md` or a proposed slice (`sayg-slice`), ranked by risk retired per effort.
- Challenges to the thesis go to `sayg-fit`; scale and money questions to `sayg-scale`; structural deletions to `sayg-architect`.
- Ask the user which rebuilds they accept. Ambition is their call; the roast only makes the choice explicit.

## Adapting to the builder

- **Architect / technical fixer**: roast the architecture and the numbers: services, latency, cost per request, cycle time, what could be deleted.
- **Business-led fixer**: roast the market, the customer pain, the pricing and the distribution; translate technical deletions into money and speed.
- Either way, keep the language of the profile's depth per area.

## Rules

- Roast ideas and code, never people. No insults about the user, their team, their intelligence or their background.
- Never invent quotes, opinions or facts about Elon Musk or any company. Comparisons carry sources; numbers are measured, sourced or labeled as estimates with the arithmetic.
- No flattery. If the idea is genuinely strong, say so in one line and raise the bar.
- "Delete" never applies to security gates, legal and compliance obligations, user data protection, accessibility or people's well-being. Urgency means fewer steps, not burning out the team.
- The roast ends in a plan, not in a mood.
