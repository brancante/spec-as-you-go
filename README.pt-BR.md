# Spec as you go

Specs vivas, guiadas pela descoberta, para pensadores de sistemas e *fixers*. Uma evolução do spec-driven development (SDD): a spec cresce com o que a construção ensina, a qualidade é checada a cada fatia, a tese do produto é revisada com evidência e o ecossistema é pesquisado ao vivo, não presumido. Toda skill se adapta a quem está construindo: um arquiteto experiente e um fundador com perfil de negócio recebem perguntas e graus de autonomia diferentes.

## Ciclo

```
setup ─► discover (perfil · greenfield | brownfield · intenção · estágio · stakeholders)
             │
          pitch (fit · scale · roast · insights)
             │
 scout → architect → slice (S0–S2 experiência, depois build) → gates → learn ─┐
   ▲                   ▲ roteado pelo modo de budget (setup)                  │
   └──────────── descobertas viram a próxima fatia ◄──────────────────────────┘
```

Oito skills:

| Skill | Função |
|---|---|
| `sayg-setup` | Ambiente (login do GitHub, painéis, CI/Sonar), wiki do código com OpenWiki e a regra "wiki primeiro", capacidade de IA nas janelas de 5h/semanal/mensal e o modo de budget |
| `sayg-discover` | Porta de entrada: perfil de quem constrói, discovery greenfield ou brownfield, intenção e estágio alvo, stakeholders e sobreposição com outros repos, primeiras fatias |
| `sayg-scout` | Busca ao vivo de skills, servidores MCP e libs: adotar / adaptar / construir |
| `sayg-architect` | Arquitetura de referência rápida: front + back no mesmo repo, organizado em células |
| `sayg-slice` | Escada de estágios S0 esboço → S5 produção, prototipagem com experiência primeiro, menor spec verificável, roteamento de modelo |
| `sayg-gates` | Gates de segurança, arquitetura, performance e aprovações por fatia; o pipeline gratuito de CI + Sonar |
| `sayg-learn` | Reconciliar spec e código, ADRs, descobertas, varredura de drift, promoção de estágio |
| `sayg-pitch` | Julgamento de produto em quatro modos: fit (manifesto vivo), scale (leitura de investidor), roast ("what would Elon do"), insights (um insight, uma melhoria e uma crítica pesquisados por PR) |

As skills de entendimento e desenho rodam no modelo mais forte; toda skill que mexe em código lê primeiro o wiki do projeto.

### SAYG board (widget ao lado do chat)

`/sayg-board` abre um painel com uma linha-resumo (`PRs 2 ready · 3 blocked │ gate OK │ 2 critical/high vulns │ CI 92% │ 5h 40% 7d 62%`) e quatro abas (teclas 1–4):

- **PRs**: ordem de merge (empilhadas depois da PR-mãe, prontas primeiro, depois as mais antigas), a próxima ação de cada uma (merge, corrigir CI com o nome dos checks, resolver conflito, atualizar branch, pedir review, atender mudanças, tirar do rascunho), avisos de arquivos em comum, PRs paradas e reviews esperando por você.
- **Health**: último relatório do `sayg-sonar` (gate, cobertura, duplicação, BLOCKER/HIGH), taxa de sucesso e duração mediana do CI na branch principal, alertas do Dependabot, code scanning e secret scanning por severidade, problemas de segurança e hotspots do Sonar.
- **Flow**: PRs mergeadas em 7 dias, tempo mediano de PR aberta até o merge, PRs paradas, deploys, células por estágio, fatias por status, descobertas abertas.
- **AI**: janelas de 5 horas e semanal da sua assinatura com horário de reset, o modo de budget que o `sayg-setup` definiria, custo e contexto da sessão, e as skills usadas na sessão.

Atualiza a cada 5 minutos e logo depois de `git push` ou `gh pr ...`, mostra a linha-resumo na barra de status e abre sozinho em projetos com `.sayg/`. O Claude também lê a saída do comando, então dá para pedir "o que eu mergeio agora?" ou "corrige o CI da #12". Lê o GitHub via `gh api` com o seu login (`gh auth login`); o que o seu login não consegue ler aparece como `n/a`.

### SAYG features (visão customizada)

`/sayg-features` abre um painel com as PRs abertas e as mergeadas nos últimos 14 dias, as **migrações** que elas trazem (arquivos de schema, o `contract/` de uma célula), com destaque quando já foram mergeadas mas ainda não foram para produção, e para cada PR três frases curtas: 💡 **insight**, 🔧 **melhoria**, ⚠️ **crítica**. Clicar numa PR abre o thread: a sessão do Claude Code que criou a PR, quando o corpo dela tem o link, ou a conversa da PR. **Generate insights** dispara um subagente em background num modelo forte (Opus por padrão; `insightModel` em `.sayg/config.json` para trocar), que lê o wiki, pesquisa na web e grava `.sayg/insights/pr-<n>.json`; ele pausa quando o budget está apertado.

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

v0.9: skills, templates, templates de CI e `tools/repo-snapshot.sh`. Ainda não testado em campo.
