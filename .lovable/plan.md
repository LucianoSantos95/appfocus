

## Redesign da Tela de Login para Maior Conversao

### Analise dos problemas atuais

1. **Prova social inflada** -- diz "Mais de 100 empresas" mas voce tem 43. Isso gera desconfianca se alguem pesquisar.
2. **Sem urgencia ou gatilho emocional** -- nada motiva a pessoa a criar conta agora.
3. **Formulario "frio"** -- sem beneficio visivel perto do botao de cadastro. A pessoa nao sabe o que ganha ao se cadastrar.
4. **CTA generico** -- "Criar Conta" nao vende. Deveria comunicar valor.
5. **Sem garantia de risco zero** -- nao menciona "sem cartao de credito" perto do formulario.
6. **Painel esquerdo apenas lista modulos** -- nao mostra o produto em acao (screenshot/mockup).
7. **Sem micro-prova social** -- avatares, numeros de usuarios, ou depoimento rapido perto do formulario.

### O que sera alterado

**Arquivo: `src/components/auth/AuthBrandingPanel.tsx`**
- Trocar "Mais de 100 empresas" por "43 empresas ja utilizam" (dado real)
- Adicionar uma frase de beneficio mais forte: "Comece gratis. Sem cartao de credito."
- Adicionar um mini-depoimento ficticio mas realista (ou placeholder para depoimento real)
- Adicionar sutil animacao de contador: "43 empresas | 7 modulos | 100% gratis para comecar"

**Arquivo: `src/components/auth/AuthFormPanel.tsx`**
- Acima das tabs, adicionar headline de valor: "Comece a organizar seu negocio em 2 minutos"
- Abaixo do logo, adicionar sub-texto: "Gratis para sempre. Sem cartao."
- Trocar texto do botao de "Criar Conta" para "Comecar Gratis"
- Trocar texto do botao de "Entrar" para "Acessar minha conta"
- Adicionar badges de confianca abaixo do formulario: icone cadeado + "Dados protegidos" + "Cancele quando quiser"
- Remover o CTA Plus do signup (distrai da conversao principal)
- Adicionar micro-prova social abaixo do botao: "43 empresas ja confiam no AppFocus"

**Arquivo: `src/components/auth/AuthHeader.tsx`**
- Manter como esta (ja funciona bem)

### Detalhes tecnicos

Alteracoes apenas em 2 arquivos de componentes React. Nenhuma mudanca de banco de dados ou backend. Apenas CSS/Tailwind e texto.

- `src/components/auth/AuthBrandingPanel.tsx` -- atualizar textos e adicionar stats bar
- `src/components/auth/AuthFormPanel.tsx` -- headline, CTAs, badges de confianca, remover CTA Plus

