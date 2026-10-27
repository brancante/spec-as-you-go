---
name: sayg-fit
description: Use continuously in a Spec as you go project to keep a living product manifesto: problem, who has it, alternatives, differentiation and product-market-fit evidence. Run at framing, after each slice that changes what users see, when a competitor or new tool appears, and on request ("is this still differentiated?", "who is this for?").
---

# sayg-fit

> Adapt questions, vocabulary, evidence and autonomy to the builder profile (`sayg-profile`), per area of depth.

The product thesis is a spec too: it is discovered, tested and revised. Keep it in `.sayg/product/manifesto.md` (template: `templates/product/manifesto.md`).

## Process

1. Read `intent.md`, the manifesto and recent discoveries.
2. **Scan the field live** with `sayg-scout`: direct competitors, substitutes (including "do nothing" and spreadsheets), and new AI-native entrants. Date and source every entry.
3. Update the manifesto sections:
   - **Problem and who has it**: specific segment, the job they are hiring a product for, how they solve it today, what that costs them.
   - **Differentiation**: what we do that alternatives cannot easily copy, and why now. If the answer is "better UX" or "uses AI", say it is weak.
   - **Riskiest assumptions**: ranked by (impact if wrong × uncertainty).
   - **Evidence log**: each claim tagged `measured`, `observed` (interviews, usage), `sourced` (external, with link) or `assumed`.
   - **PMF signals**: the metrics that would show pull (retention curve flattening, organic referral, "very disappointed" share in a Sean Ellis survey) and their current values, or "not measured yet".
4. Propose the **next experiment** for the riskiest assumption: smallest test, success threshold set in advance, and whether it needs a slice (code) or not (interview, landing page, concierge).
5. If differentiation weakened since the last run, say so first, plainly, and add a discovery.

## Human checkpoint

Changing the target segment or the core value proposition. Present evidence for and against.

## Rules

- Never present an assumption as evidence. Never invent market numbers, quotes or user counts.
- Keep it to two pages. Move detail to the evidence log.
