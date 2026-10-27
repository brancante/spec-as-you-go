# Stage exit criteria

Check each item with evidence (link, command, test result, recording). Not applicable items need a one-line reason.

## S0 Sketch
- [ ] Primary user and top 3 tasks named
- [ ] User journeys drawn (Mermaid flow or wireframes) for each task
- [ ] Decision-maker agreed the journeys

## S1 Clickable prototype
- [ ] UI lives in `cells/<x>/ui` and `apps/web`, reading data only through `cells/<x>/contract` with a mock implementation
- [ ] Each top task completable end to end, scripted with Playwright (or equivalent)
- [ ] Heuristic review done (e.g. Nielsen's 10), issues logged
- [ ] Automated accessibility check (e.g. axe) with no critical violations
- [ ] Preview URL shareable with stakeholders
- [ ] No real personal data, no production secrets

## S2 Validated experience
- [ ] Usability test run with target users (`templates/prototype/usability-test.md`); results recorded
- [ ] Success thresholds met (task success, time, satisfaction) or changes made and retested
- [ ] Contract v1 reviewed by consuming stakeholders and frozen
- [ ] Decision-maker approved moving to build

## S3 MVP
- [ ] Server implementation behind the same contract; mocks kept for tests
- [ ] Persistence and migrations owned by the cell
- [ ] Authentication and authorization on every entry point
- [ ] Acceptance criteria automated; per-PR CI green (`sayg-ci`)
- [ ] Boundary rules enforced; dependency audit and secret scan clean

## S4 Beta
- [ ] Threat model for each trust boundary
- [ ] Full Sonar scan within threshold (`sayg-sonar`)
- [ ] Logs, metrics and traces for the cell's main flows
- [ ] Performance baseline recorded against the budget in intent
- [ ] Backups and restore tested; feature flags for risky paths
- [ ] Limited real users; incident log reviewed

## S5 Production
- [ ] SLOs defined, alerts wired to someone who responds
- [ ] Runbook: deploy, rollback, common failures
- [ ] Data migration and rollback plan rehearsed
- [ ] Compliance checks done (e.g. LGPD/GDPR, PCI where relevant)
- [ ] Load test at expected peak within budget
- [ ] User documentation / manual updated
- [ ] Required sign-offs recorded (see `.sayg/stakeholders.md`)
