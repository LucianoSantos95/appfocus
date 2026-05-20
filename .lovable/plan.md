## Adicionar Microsoft Clarity ao Hub Empresarial

### O que será feito
Adicionar o script de tracking do Microsoft Clarity (ID: `wu3znqphf2`) ao `<head>` do `index.html`, com atualização do Content-Security-Policy para permitir o carregamento.

### Mudanças técnicas
1. **CSP (`script-src`)**: Adicionar `https://www.clarity.ms` à lista de fontes de script permitidas.
2. **CSP (`connect-src`)**: Adicionar `https://*.clarity.ms` para permitir as conexões de telemetria.
3. **Script no `<head>`**: Inserir o snippet do Clarity antes do `</head>`, após os JSON-LD schemas.

### Localização
- Arquivo: `index.html`
- Script posicionado após os schemas de structured data e antes do fechamento do `</head>`.

### Impacto
- Rastreamento de heatmaps, session recordings e comportamento de usuários via Microsoft Clarity.
- Sem impacto em performance ou funcionalidade do app.