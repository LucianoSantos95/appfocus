

# Exibir seletor de conta Google no login

## O que muda

Quando o usuario clicar em "Entrar com Google", aparecera a caixinha do Google mostrando as contas disponiveis (como na imagem de referencia). Ao selecionar a conta, ele sera redirecionado automaticamente ao app.

## Alteracao

Arquivo: `src/pages/Auth.tsx`

Na funcao `handleGoogleLogin`, adicionar o parametro `prompt: "select_account"` para garantir que o Google sempre mostre o seletor de contas:

```text
const { error } = await lovable.auth.signInWithOAuth("google", {
  redirect_uri: window.location.origin,
  extraParams: {
    prompt: "select_account",
  },
});
```

## Secao Tecnica

- O parametro `prompt: "select_account"` forca o Google a exibir a lista de contas, mesmo que o usuario so tenha uma conta logada no navegador.
- Apos selecionar a conta, o redirecionamento para o app acontece automaticamente (comportamento padrao do OAuth).
- Nenhuma outra alteracao e necessaria no backend ou em outras paginas.
- A tela de consentimento ("Focus Hub quer acessar...") aparecera apenas no primeiro login. Nos proximos, sera direto o seletor de conta e redirecionamento.

