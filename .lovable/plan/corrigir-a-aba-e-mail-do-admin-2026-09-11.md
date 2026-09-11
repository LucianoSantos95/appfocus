# Corrigir a aba "E-mail" do admin

## O que está acontecendo

A aba quebra e mostra "Algo deu errado". O erro no console é claro:
`SelectLabel must be used within SelectGroup`.

No seletor de "Público" (`src/components/admin/EmailPanel.tsx`, linhas 116-131), o título
"Quem baixou um produto específico" usa `SelectLabel` solto dentro de um fragmento `<>...</>`.
Esse componente só pode existir dentro de um `SelectGroup`, então a tela toda cai no
erro assim que a aba é aberta.

## Correção

Trocar o fragmento por `SelectGroup`, envolvendo o rótulo e os itens de produto:

```
<SelectSeparator />
<SelectGroup>
  <SelectLabel ...>Quem baixou um produto específico</SelectLabel>
  ...itens de produto...
</SelectGroup>
```

Adicionar `SelectGroup` ao import do mesmo arquivo. Nenhuma outra lógica muda:
públicos, contagem de destinatários e disparo continuam iguais.

## Verificação

Abrir `/admin?aba=email` no navegador, confirmar que o painel carrega, abrir o seletor de
Público e ver a lista de produtos com o rótulo do grupo, sem erro no console.
