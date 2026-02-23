
# Precos Anuais + Performance do Site

## 1. Corrigir exibicao de precos anuais

**Problema**: O preco anual mostra apenas "R$99/mes", o que pode confundir o usuario achando que pagara R$99 pelo ano inteiro.

**Solucao**: Quando o toggle "Anual" estiver ativo, mostrar o valor total como destaque e o equivalente mensal como informacao secundaria.

**Arquivo**: `src/pages/Planos.tsx`

- Adicionar campo `annualTotal` calculado (`annualPrice * 12`) ao array de planos
- Quando **mensal**: manter `R$119/mes`
- Quando **anual**: exibir `R$1.188/ano` como preco principal, e abaixo em texto menor `equivale a R$99/mes`

| Plano | Mensal | Anual Total | Equivalente Mensal |
|---|---|---|---|
| Plus | R$119/mes | R$1.188/ano | R$99/mes |
| Pro | R$249/mes | R$2.388/ano | R$199/mes |
| Enterprise | R$497/mes | R$4.764/ano | R$397/mes |

---

## 2. Melhorar velocidade do site

### 2a. Skeleton de carregamento para pagina de Planos
A pagina `/planos` depende do `PlanContext` que faz chamadas ao backend (tabela `subscriptions` + edge function `check-subscription`). Enquanto carrega, a pagina fica travada.

**Solucao**: Adicionar um estado de loading com skeleton cards enquanto o contexto carrega, para dar feedback visual imediato ao usuario.

### 2b. Evitar chamada desnecessaria ao check-subscription na pagina de Planos
O `PlanContext` ja carrega o plano ao iniciar. Porem, a pagina de Planos nao precisa bloquear a renderizacao ate o plano estar disponivel -- ela pode mostrar os cards e desabilitar o botao "Plano Atual" somente quando o dado estiver pronto.

### 2c. Mover `QueryClient` para fora do componente
O `QueryClient` ja esta fora do componente (correto). Nenhuma mudanca necessaria.

### 2d. Suspense fallback com spinner visual
O `Suspense` fallback atual e uma `div` vazia. Trocar por um indicador de carregamento visual (spinner ou skeleton) para que a transicao entre rotas parecam mais rapidas.

### 2e. Prefetch da fonte Inter
A fonte Inter ja usa `display=swap` e `preconnect`, mas o `media="print"` com `onload` atrasa o carregamento. Mudar para carregamento direto sem o truque de `media="print"` para que a fonte carregue mais cedo.

---

## Resumo de alteracoes

| Arquivo | Mudanca |
|---|---|
| `src/pages/Planos.tsx` | Exibicao de preco anual total + skeleton de loading |
| `src/App.tsx` | Suspense fallback com spinner visual |
| `index.html` | Remover truque `media="print"` da fonte Inter |

Nenhuma alteracao de backend necessaria.
