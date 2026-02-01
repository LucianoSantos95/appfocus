
# Automacao Inteligente para Modulo de Clientes

## Resumo Executivo

Vamos adicionar inteligencia artificial ao modulo de Clientes para automatizar tarefas repetitivas e gerar insights valiosos. A IA vai trabalhar nos bastidores para classificar, analisar e sugerir acoes - tudo sem voce precisar fazer nada manualmente.

---

## O Que Sera Implementado

### 1. Classificacao Automatica de Clientes

Quando um cliente for cadastrado ou atualizado, a IA vai automaticamente classificar:

| Classificacao | Descricao |
|---------------|-----------|
| **VIP** | Alto valor, interacoes frequentes, potencial estrategico |
| **Padrao** | Cliente regular com bom relacionamento |
| **Em Risco** | Pouca interacao, possivel churn |
| **Novo** | Recem cadastrado, ainda em avaliacao |

### 2. Analise Automatica de Historico

A IA vai analisar as informacoes do cliente e extrair:
- **Palavras-chave** do perfil (ex: "tecnologia", "B2B", "startup")
- **Potencial estimado** baseado no segmento e valor
- **Prioridade de contato** (alta, media, baixa)

### 3. Alertas Inteligentes

O sistema vai mostrar alertas automaticos para:
- Clientes sem interacao ha mais de 30 dias
- Prospectos "quentes" que devem ser contatados
- Clientes que podem estar insatisfeitos (baseado em padroes)

### 4. Sugestoes de Proximas Acoes

Um painel vai mostrar sugestoes geradas pela IA:
- "Ligar para Tech Solutions - ultimo contato ha 15 dias"
- "Enviar proposta para Nova Startup - prospecto quente"
- "Agendar reuniao de renovacao com Grupo ABC"

---

## Como Vai Aparecer na Interface

### Card de Insights IA (no topo da pagina)

```text
+--------------------------------------------------+
| [Icone IA] Insights Inteligentes                 |
|                                                  |
| 3 clientes precisam de atencao                   |
| 2 prospectos quentes para contato                |
| 1 renovacao proxima                              |
|                                                  |
| [Ver Sugestoes]                                  |
+--------------------------------------------------+
```

### Badge de Classificacao (em cada card de cliente)

```text
+---------------------------+
| Tech Solutions       VIP  |  <- Badge colorido
| Tecnologia               |
| ...                      |
+---------------------------+
```

### Painel de Sugestoes (expandivel)

```text
+--------------------------------------------------+
| Sugestoes da IA                           [X]    |
+--------------------------------------------------+
| [ ] Ligar para Grupo ABC (30 dias sem contato)   |
| [ ] Proposta Nova Startup (prospecto quente)     |
| [ ] Revisar contrato StartupCo (vence em 60d)    |
+--------------------------------------------------+
```

---

## Fluxo de Funcionamento

```text
1. Usuario cadastra/edita cliente
           |
           v
2. Dados salvos no banco de dados
           |
           v
3. Edge Function "analyze-client" e chamada
           |
           v
4. Lovable AI analisa os dados do cliente
           |
           v
5. Retorna classificacao, insights e sugestoes
           |
           v
6. Dados enriquecidos salvos na tabela
           |
           v
7. Interface atualiza com badges e alertas
```

---

## Beneficios Praticos

1. **Economia de tempo** - Nao precisa classificar clientes manualmente
2. **Nao esquece ninguem** - Alertas automaticos de follow-up
3. **Prioriza melhor** - Sabe quem precisa de atencao primeiro
4. **Insights rapidos** - Ve o panorama geral num relance
5. **Sem custo extra** - Usa Lovable AI incluso no plano

---

## Detalhes Tecnicos

### 1. Banco de Dados

Criar tabela `clientes` para persistir os dados (atualmente estao apenas em memoria):

**Campos principais:**
- `id`, `nome`, `email`, `telefone`, `segmento`, `status`, `valor_total`
- `tipo_contrato`, `ultima_interacao`, `anexo_url`

**Campos de IA (preenchidos automaticamente):**
- `classificacao` - VIP, Padrao, Em Risco, Novo
- `potencial` - Alto, Medio, Baixo
- `prioridade_contato` - Alta, Media, Baixa
- `palavras_chave` - Array de termos relevantes
- `proxima_acao_sugerida` - Texto com sugestao da IA
- `analisado_em` - Timestamp da ultima analise

### 2. Edge Function: analyze-client

Funcao serverless que:
- Recebe ID do cliente
- Monta contexto com todos os dados
- Envia para Lovable AI com prompt estruturado
- Usa tool calling para resposta estruturada
- Atualiza registro com resultados

### 3. Componentes de Interface

**ClienteInsightsCard** - Card no topo com resumo de alertas
**ClienteAIBadge** - Badge de classificacao nos cards
**SugestoesPainel** - Lista de acoes sugeridas pela IA

### 4. Prompt de Analise

A IA recebera instrucoes para avaliar:
- Valor do cliente vs media do segmento
- Tempo desde ultima interacao
- Status atual e historico
- Tipo de contrato e potencial de expansao

### Arquivos a Serem Criados/Modificados

```text
supabase/
├── functions/
│   └── analyze-client/
│       └── index.ts              (novo)
└── migrations/
    └── xxx_create_clientes.sql   (novo)

src/
├── components/
│   └── clientes/
│       ├── ClienteInsightsCard.tsx   (novo)
│       ├── ClienteAIBadge.tsx        (novo)
│       └── SugestoesPainel.tsx       (novo)
└── pages/
    └── Clientes.tsx                  (modificar)
```

### Custos e Performance

- **Lovable AI**: Incluso no plano, sem custo adicional
- **Tempo de analise**: 1-3 segundos por cliente
- **Trigger**: Analise acontece ao salvar/atualizar cliente
