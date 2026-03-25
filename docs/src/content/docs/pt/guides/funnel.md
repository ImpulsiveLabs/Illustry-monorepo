---
title: Funil
description: Doc funil
---

A visualização **Funnel** é uma ferramenta poderosa para rastrear as taxas de progressão e conversão de uma série de estágios em um processo. Ele fornece uma representação visual de como as entidades se movem através de diferentes estágios de um fluxo de trabalho definido.



## Estrutura de dados funil

Para representar Funnel, você pode usar a seguinte interface `FunnelData`:

```typescript
{{FunnelData}}
```
### Atributos das Chaves

- **valores:** Um dicionário onde cada chave é uma categoria ou dimensão, e o valor correspondente é um valor numérico.


### Prós e contras

#### Prós
- **Performance Metrics:** Funnel Charts são excelentes para visualizar métricas de desempenho, permitindo que as equipes rastreiem e melhorem os principais indicadores.

- ** Análise Segmentada: ** Cada estágio no funil permite a análise segmentada, ajudando a identificar áreas específicas de melhoria ou sucesso.

- **Insights Preditivos: Funnel Charts pode fornecer insights preditivos sobre o desempenho futuro com base em taxas de conversão histórica.

#### Contras

- ** Desafio com processos complexos:** Em cenários onde os processos envolvem inúmeros ramos ou loops intrincados, os gráficos funil podem lutar para representar a complexidade de forma eficaz.


## Exemplo do Funil

![Funnel Example](/Illustry-monorepo/funnel.gif)