# Roast question bank

Pick what hits the weakest point; never ask what the repo, manifesto or scorecard already answers. Phrase per the builder's depth in the area (technical / plain).

## The pitch
- Say it in two sentences. Who is in pain, and what changes for them?
- Why will this exist in ten years when the current alternatives won't?
- If you had to launch in 30 days with a tenth of the plan, what would you ship?

## First principles
- What are the fundamental truths here, ignoring how everyone does it today?
- What is the raw cost floor per unit (compute, storage, tokens, human minutes)? How far are you from it? That gap is the idiot index.
- Which "constraint" is physics and which is just habit, regulation nobody checked, or a vendor's pricing?

## Requirements and deletion
- Who, by name, asked for each of the top 5 requirements? Which one has no owner?
- Which feature would no customer miss if it vanished tomorrow? Delete it.
- Which service, dependency, queue or framework exists because "we might need it"?
- How many steps from a user's intent to the value? Which steps can disappear?
- What did you delete this month? If nothing, why not?

## Speed
- How long from idea to production today? From commit to deploy? From bug report to fix?
- What would it take to ship to real users every day?
- What is the slowest approval, review or handoff, and who owns removing it?

## 10× thinking
- What would this look like 10× cheaper? 10× faster? With zero humans in the loop?
- What is the impossible goal with a deadline that feels too short? What's the smallest path to it?
- What would you build if you knew the incumbent would copy your current version next quarter?

## World-changing scale
- If every company in your segment used this, what would be different in the world?
- If it worked for a billion people, what breaks first: cost, trust, infrastructure, regulation?
- Is this a feature, a product, or a company? Be honest.

## Unfair advantage
- What do you have that a well-funded competitor can't buy in 12 months?
- Which bottleneck component should you own instead of renting?
- What data, distribution or network effect compounds with every user?

## Comparisons (find the real ones live; these are thinking prompts, not claims)
- The incumbent: why hasn't it done this, and what will it do when you get traction?
- The expensive-first path: is there a premium version that funds the mass-market one?
- The reuse path: what does everyone throw away that you could reuse?
- The bundle path: which separate tools do customers glue together that one product could replace?
- The decade bet: what would you build if you had to be right in 10 years, not 10 months?

## Code
- How many services, and how many users? Justify each service boundary.
- Which framework could be a function? Which abstraction has one implementation?
- What does a deploy cost in minutes, and what does a rollback cost?
- Which tests would still pass if the feature were deleted?
- Where is the 80% of runtime cost, and has anyone measured it?
