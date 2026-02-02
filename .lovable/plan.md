
# Sistema de Importacao de Planilhas - Todas as Paginas

## Resumo

Vamos implementar um sistema universal de importacao de dados via planilha Excel (.xlsx) e CSV que funcionara em todos os modulos do Hub. Cada modulo tera seu proprio botao "Importar Planilha" e mapeamento de colunas especifico para seus dados.

---

## Modulos que Receberao Importacao

| Modulo | Dados Importaveis |
|--------|-------------------|
| **Clientes** | Nome, email, telefone, empresa, segmento, valor, contrato |
| **Financas** | Transacoes (receitas e despesas), categorias, contas |
| **RH** | Colaboradores e vagas |
| **Projetos** | Projetos com orcamento, equipe, datas |
| **Tarefas** | Tarefas e metas com prioridade |
| **Marketing** | Campanhas e conteudos planejados |
| **Processos** | Processos com etapas |

---

## Interface de Importacao

Um modal unificado que se adapta ao modulo:

```text
+----------------------------------------------------------+
|  Importar Planilha - [Nome do Modulo]                [X] |
+----------------------------------------------------------+
|                                                          |
|  [1] Arraste seu arquivo ou clique para selecionar       |
|      +------------------------------------------+        |
|      |     Arraste .xlsx ou .csv aqui           |        |
|      |     ou clique para selecionar            |        |
|      +------------------------------------------+        |
|                                                          |
|  [2] Preview dos Dados (5 primeiras linhas)              |
|      +------------------------------------------+        |
|      | Col A    | Col B       | Col C    | ...  |        |
|      |----------|-------------|----------|------|        |
|      | Dado 1   | Dado 2      | Dado 3   | ...  |        |
|      +------------------------------------------+        |
|                                                          |
|  [3] Mapeamento de Colunas                               |
|      Coluna "A" -> [Selecionar campo...]                 |
|      Coluna "B" -> [Selecionar campo...]                 |
|      Coluna "C" -> [Ignorar]                             |
|                                                          |
|  [x] Disparar analise IA para clientes importados        |
|                                                          |
|  +---------------+  +------------------+  +-------------+|
|  |   Cancelar    |  | Baixar Template  |  | Importar    ||
|  +---------------+  +------------------+  +-------------+|
+----------------------------------------------------------+
```

---

## Mapeamento por Modulo

### Clientes
| Campo Sistema | Colunas Aceitas na Planilha |
|---------------|----------------------------|
| nome | Nome, Nome do Cliente, Cliente |
| email | Email, E-mail |
| telefone | Telefone, Tel, Fone |
| empresa | Empresa, Razao Social |
| segmento | Segmento, Setor, Area |
| status | Status |
| valor_total | Valor, Valor Total, Faturamento |
| tipo_contrato | Contrato, Tipo Contrato |

### Financas - Transacoes
| Campo Sistema | Colunas Aceitas |
|---------------|-----------------|
| description | Descricao, Historico |
| value | Valor, Montante |
| date | Data, Vencimento |
| category | Categoria |
| type | Tipo (receita/despesa) |
| status | Status (pago/pendente) |
| client | Cliente |
| provider | Fornecedor |

### RH - Colaboradores
| Campo Sistema | Colunas Aceitas |
|---------------|-----------------|
| name | Nome, Colaborador |
| role | Cargo, Funcao |
| department | Departamento, Setor |
| salary | Salario |
| startDate | Admissao, Data Inicio |
| email | Email |
| phone | Telefone |
| status | Status |

### RH - Vagas
| Campo Sistema | Colunas Aceitas |
|---------------|-----------------|
| title | Titulo, Vaga |
| department | Departamento |
| level | Nivel, Senioridade |
| salaryRange | Faixa Salarial |
| status | Status |
| priority | Prioridade |

### Projetos
| Campo Sistema | Colunas Aceitas |
|---------------|-----------------|
| name | Nome, Projeto |
| status | Status |
| priority | Prioridade |
| startDate | Inicio |
| endDate | Fim, Prazo |
| budget | Orcamento |
| responsible | Responsavel, PM |
| members | Equipe |

### Tarefas
| Campo Sistema | Colunas Aceitas |
|---------------|-----------------|
| title | Titulo, Tarefa |
| description | Descricao |
| dueDate | Prazo, Vencimento |
| priority | Prioridade |
| status | Status |
| category | Tipo (tarefa/meta) |
| responsible | Responsavel |

### Marketing - Campanhas
| Campo Sistema | Colunas Aceitas |
|---------------|-----------------|
| name | Nome, Campanha |
| objective | Objetivo |
| platforms | Plataformas |
| budget | Orcamento |
| startDate | Inicio |
| endDate | Fim |
| status | Status |

### Marketing - Conteudos
| Campo Sistema | Colunas Aceitas |
|---------------|-----------------|
| title | Titulo |
| format | Formato |
| theme | Tema |
| priority | Prioridade |
| status | Status |
| dueDate | Prazo |

### Processos
| Campo Sistema | Colunas Aceitas |
|---------------|-----------------|
| name | Nome, Processo |
| description | Descricao |
| department | Departamento |
| owner | Responsavel |
| status | Status |

---

## Funcionalidades Inteligentes

1. **Auto-deteccao de colunas**: Reconhece nomes similares automaticamente
2. **Validacao em tempo real**: Mostra erros antes de importar
3. **Template para download**: Cada modulo tem seu modelo
4. **Importacao em lotes**: Para grandes volumes (50 registros por vez)
5. **Integracao com IA**: Opcao de analisar clientes apos import

---

## Beneficios

- Migracao rapida de sistemas legados
- Importacao de dados de planilhas existentes
- Sem digitacao manual
- Validacao antes de salvar
- Templates prontos para facilitar

---

## Detalhes Tecnicos

### Dependencia

```json
{
  "xlsx": "^0.18.5"
}
```

### Componentes Reutilizaveis

| Componente | Funcao |
|------------|--------|
| `ImportDialog.tsx` | Modal principal, recebe config do modulo |
| `FileDropzone.tsx` | Area drag-and-drop para arquivos |
| `DataPreview.tsx` | Tabela de preview dos dados |
| `ColumnMapper.tsx` | Interface de mapeamento |
| `ImportProgress.tsx` | Barra de progresso da importacao |

### Configuracao por Modulo

```typescript
// src/lib/import-configs.ts
export const importConfigs = {
  clientes: {
    label: "Clientes",
    table: "clientes", // tabela do Supabase
    fields: [
      { key: "nome", label: "Nome", required: true, aliases: ["Nome", "Cliente"] },
      { key: "email", label: "Email", aliases: ["Email", "E-mail"] },
      // ...
    ]
  },
  financas: {
    label: "Transacoes",
    // config local (sem Supabase por enquanto)
    fields: [...]
  },
  // outros modulos...
}
```

### Hook de Importacao

```typescript
// src/hooks/useDataImport.ts
export function useDataImport(config: ImportConfig) {
  // Parsing do arquivo
  // Mapeamento de colunas
  // Validacao de dados
  // Insercao em lotes
  // Callback de progresso
}
```

### Arquivos a Serem Criados

```text
src/
├── components/
│   └── import/
│       ├── ImportDialog.tsx       (modal principal)
│       ├── FileDropzone.tsx       (drag & drop)
│       ├── DataPreview.tsx        (preview da tabela)
│       ├── ColumnMapper.tsx       (mapeamento)
│       └── ImportProgress.tsx     (progresso)
├── hooks/
│   └── useDataImport.ts           (logica de importacao)
└── lib/
    ├── spreadsheet.ts             (funcoes de parsing xlsx/csv)
    └── import-configs.ts          (configs por modulo)
```

### Arquivos a Modificar

```text
src/pages/Clientes.tsx    (adicionar botao importar)
src/pages/Financas.tsx    (adicionar botao importar)
src/pages/RH.tsx          (adicionar botao importar para colaboradores e vagas)
src/pages/Projetos.tsx    (adicionar botao importar)
src/pages/Tarefas.tsx     (adicionar botao importar)
src/pages/Marketing.tsx   (adicionar botao importar para campanhas e conteudos)
src/pages/Processos.tsx   (adicionar botao importar)
```

### Fluxo de Importacao

```text
1. Usuario clica "Importar Planilha"
           |
           v
2. Modal abre com dropzone
           |
           v
3. Usuario seleciona arquivo (.xlsx ou .csv)
           |
           v
4. Frontend le arquivo com SheetJS
           |
           v
5. Extrai cabecalhos e 5 primeiras linhas
           |
           v
6. Auto-mapeia colunas conhecidas
           |
           v
7. Usuario ajusta mapeamento se necessario
           |
           v
8. Usuario clica "Importar"
           |
           v
9. Valida todos os registros
           |
           v
10. Insere em lotes de 50 registros
           |
           v
11. Mostra progresso e resultado
           |
           v
12. (Opcional) Dispara analise IA para clientes
```

### Templates para Download

Cada modulo tera um botao "Baixar Template" que gera uma planilha Excel com:
- Cabecalhos corretos
- Exemplo de dados
- Instrucoes na primeira aba

---

## Ordem de Implementacao

1. Criar componentes base (ImportDialog, FileDropzone, etc.)
2. Criar hook useDataImport
3. Criar configs por modulo
4. Integrar em Clientes (com Supabase)
5. Integrar em Financas (local)
6. Integrar nos demais modulos
7. Testar com arquivos reais

