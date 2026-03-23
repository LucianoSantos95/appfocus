

## Correção: CSP bloqueando login desde dia 20

### Problema
A Content Security Policy adicionada em `index.html` tem `connect-src` restritivo demais. Faltam domínios essenciais:
- `https://*.lovable.dev` — SDK de autenticação e gateway AI
- `https://*.lovable.app` — redirecionamentos
- `https://*.stripe.com` — checkout/pagamentos

### Solução
Atualizar a meta tag CSP em `index.html` adicionando os domínios faltantes ao `connect-src` e `frame-src`.

### Detalhes técnicos

**Arquivo**: `index.html` (linha 12)

Adicionar ao `connect-src`:
```
https://*.lovable.dev https://*.lovable.app https://*.stripe.com
```

Adicionar ao `frame-src`:
```
https://*.lovable.dev
```

Adicionar ao `script-src`:
```
https://js.stripe.com
```

