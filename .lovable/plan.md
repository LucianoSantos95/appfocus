
# Sistema de Coleta de Feedback para MVP

## Objetivo
Implementar um sistema para coletar feedback dos usuários de teste, salvando as respostas no banco de dados para que voce possa analisar posteriormente.

## Abordagem Escolhida
Vou implementar **as duas opcoes combinadas** para maximizar a coleta de feedback:

1. **Widget no Painel** - Uma caixinha fixa no dashboard onde usuarios podem deixar feedback a qualquer momento
2. **Popup Inicial** - Um popup que aparece na primeira visita convidando o usuario a dar feedback (usando localStorage para nao mostrar toda hora)

## O Que Sera Implementado

### 1. Banco de Dados
Criar tabela `feedbacks` com os seguintes campos:
- `id` - Identificador unico
- `nome` - Nome do usuario (opcional)
- `email` - Email para contato (opcional)
- `mensagem` - O feedback em si
- `avaliacao` - Nota de 1 a 5 estrelas
- `pagina` - De qual pagina o feedback foi enviado
- `created_at` - Data/hora do envio

A tabela tera RLS desabilitado temporariamente (politica publica) para permitir que qualquer visitante envie feedback sem precisar de login.

### 2. Componentes Novos

**FeedbackWidget** - Caixinha no dashboard
- Card compacto com titulo "Deixe seu Feedback"
- Campo para nome (opcional)
- Campo para email (opcional)  
- Campo para mensagem
- Sistema de avaliacao com estrelas (1-5)
- Botao de enviar
- Mensagem de sucesso apos envio

**FeedbackPopup** - Popup na primeira visita
- Dialog que aparece apos 5 segundos na primeira visita
- Mesmos campos do widget
- Usa localStorage para lembrar se o usuario ja viu
- Opcao de "Lembrar depois" ou "Nao mostrar novamente"

### 3. Integracao no Dashboard
O widget sera adicionado na area inferior do painel, ao lado ou abaixo dos widgets de Agenda e Mural de Recados.

## Como Voce Vai Visualizar os Feedbacks
Depois de implementado, voce podera:
1. Acessar o painel de backend (Lovable Cloud) para ver todos os feedbacks na tabela
2. Futuramente posso criar uma pagina administrativa para visualizar os feedbacks diretamente no app

---

## Detalhes Tecnicos

### Estrutura SQL da Tabela
```sql
CREATE TABLE public.feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT,
  email TEXT,
  mensagem TEXT NOT NULL,
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  pagina TEXT DEFAULT '/',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permitir insercao publica (sem autenticacao)
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir insercao publica" ON public.feedbacks
  FOR INSERT WITH CHECK (true);
```

### Arquivos a Serem Criados/Modificados
```text
src/
├── components/
│   └── feedback/
│       ├── FeedbackWidget.tsx    (novo)
│       └── FeedbackPopup.tsx     (novo)
└── pages/
    └── Index.tsx                 (modificar para incluir os componentes)
```

### Fluxo de Dados
```text
Usuario preenche formulario
        ↓
Validacao frontend (mensagem obrigatoria)
        ↓
supabase.from('feedbacks').insert({...})
        ↓
Toast de sucesso/erro
        ↓
Dados disponiveis no backend para consulta
```
