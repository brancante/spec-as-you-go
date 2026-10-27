# Spec as you go

Specs vivas, guiadas pela descoberta, para pensadores de sistemas e *fixers*. Uma evolução do spec-driven development (SDD): a spec cresce com o que a construção ensina, a qualidade é checada a cada fatia, a tese do produto é revisada com evidência e o ecossistema é pesquisado ao vivo, não presumido. Toda skill se adapta a quem está construindo: um arquiteto experiente e um fundador com perfil de negócio recebem perguntas e graus de autonomia diferentes.

## Ciclo

```
profile ─► discover (greenfield | brownfield) ─► stakeholders · estágio alvo
              │
         prototype S0–S2 (jornadas → UI clicável com mocks → teste de usabilidade → contrato congelado)
              │
            fit ◄──────────────── scale (sob demanda)
             │
frame → scout → architect → slice → build → gates → learn ─┐
  ▲                           ▲                             │
  │                    budget (roteamento por janela de uso)│
  └──────── descobertas viram a próxima fatia ◄─────────────┘
       pipeline: checagens por PR + Sonar a cada N PRs mergeados
```

| Skill | Função |
|---|---|
| `sayg-profile` | Nível técnico e de negócio, estilo de decisão e assinatura; como cada skill se adapta |
| `sayg-discover` | Porta de entrada. Discovery greenfield ou brownfield com núcleo comum; avaliação do código, coleta de evidências, primeiras fatias |
| `sayg-stage` | Escada de maturidade S0 esboço → S5 produção; critérios de saída; gates e aprovações escalam com o estágio |
| `sayg-prototype` | Experiência primeiro (S0–S2): jornadas, UI clicável sobre mocks do contrato, testes de usabilidade, congelamento do contrato |
| `sayg-stakeholders` | Mapa de stakeholders, sobreposição com outros repos/times, divisão de trabalho, contratos compartilhados, aprovações, rascunhos de RFC |
| `sayg-frame` | Intenção, restrições, sinais de sucesso |
| `sayg-scout` | Busca ao vivo de skills, servidores MCP e libs: adotar / adaptar / construir |
| `sayg-architect` | Arquitetura de referência rápida: front + back no mesmo repo, organizado em células |
| `sayg-slice` | Menor spec verificável + roteamento de modelo |
| `sayg-gates` | Segurança, arquitetura e performance por fatia |
| `sayg-learn` | Reconciliar spec e código, ADRs, descobertas, varredura de drift |
| `sayg-pipeline` | GitHub Actions: checagens por PR e scan do SonarQube Community Build a cada N PRs mergeados |
| `sayg-fit` | Manifesto vivo do produto: problema, segmento, diferencial, evidência de PMF |
| `sayg-scale` | Leitura de escala, impacto de mercado e atratividade para investidores |
| `sayg-budget` | Consumo nas janelas de 5h/semanal/mensal, modo de orçamento para roteamento, upgrades e provedores mais baratos |

### SAYG board (widget ao lado do chat)

`/sayg-board` abre um painel com uma linha-resumo (`PRs 2 ready · 3 blocked │ gate OK │ 2 critical/high vulns │ CI 92% │ 5h 40% 7d 62%`) e quatro abas (teclas 1–4):

- **PRs**: ordem de merge (empilhadas depois da PR-mãe, prontas primeiro, depois as mais antigas), a próxima ação de cada uma (merge, corrigir CI com o nome dos checks, resolver conflito, atualizar branch, pedir review, atender mudanças, tirar do rascunho), avisos de arquivos em comum, PRs paradas e reviews esperando por você.
- **Health**: último relatório do `sayg-sonar` (gate, cobertura, duplicação, BLOCKER/HIGH), taxa de sucesso e duração mediana do CI na branch principal, alertas do Dependabot, code scanning e secret scanning por severidade, problemas de segurança e hotspots do Sonar.
- **Flow**: PRs mergeadas em 7 dias, tempo mediano de PR aberta até o merge, PRs paradas, deploys, células por estágio, fatias por status, descobertas abertas.
- **AI**: janelas de 5 horas e semanal da sua assinatura com horário de reset, o modo de budget que o `sayg-budget` definiria, custo e contexto da sessão, e as skills usadas na sessão.

Atualiza a cada 5 minutos e logo depois de `git push` ou `gh pr ...`, mostra a linha-resumo na barra de status e abre sozinho em projetos com `.sayg/`. O Claude também lê a saída do comando, então dá para pedir "o que eu mergeio agora?" ou "corrige o CI da #12". Lê o GitHub via `gh api` com o seu login (`gh auth login`); o que o seu login não consegue ler aparece como `n/a`.

O estado do projeto fica em `.sayg/`; o estado pessoal (perfil e budget) em `~/.sayg/`. Comece com: "use sayg-discover neste repositório".

## Instalação (Claude Code)

Em um passo, dentro do Claude Code (v2.1.275 ou superior):

```
/plugin install spec-as-you-go --marketplace brancante/spec-as-you-go
```

Ou pelo terminal:

```
claude plugin marketplace add brancante/spec-as-you-go
claude plugin install spec-as-you-go@spec-as-you-go
```

Para atualizar depois: `claude plugin marketplace update spec-as-you-go`.

## Status

v0.6: skills, templates, templates de CI e `tools/repo-snapshot.sh`. Ainda não testado em campo.
