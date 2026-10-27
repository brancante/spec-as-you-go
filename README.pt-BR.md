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

Com muitas PRs abertas ao mesmo tempo, `/sayg-board` abre um painel com:

- **Ordem de merge**: PRs empilhadas depois da PR-mãe, prontas primeiro, depois as mais antigas, com aviso quando duas PRs mexem nos mesmos arquivos (faça rebase da seguinte depois do merge).
- **Próxima ação de cada PR**: merge, corrigir CI (com o nome dos checks que falharam), resolver conflito, atualizar a branch, pedir review, atender mudanças pedidas ou tirar do rascunho.
- **Deploys**: deployments recentes do GitHub e as últimas execuções de workflow na branch principal.
- **Evolução**: células por estágio, fatias por status, descobertas abertas, PRs mergeadas nos últimos 7 dias.

Atualiza a cada 5 minutos e logo depois de `git push` ou `gh pr ...`, mostra um resumo na linha de status e abre sozinho em projetos que têm `.sayg/`. O Claude também lê a saída do comando, então dá para perguntar "o que eu mergeio agora?". Lê o GitHub via `gh api` com o seu próprio login (`gh auth login`).

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

v0.5: skills, templates, templates de CI e `tools/repo-snapshot.sh`. Ainda não testado em campo.
