---
title: Gráfico de Linhas
description: Documento de Gráfico de Linhas
---

A visualização **Line Chart** é uma ferramenta versátil para representar tendências e padrões em dados numéricos ao longo do tempo. É amplamente utilizado para visualizar a relação entre duas variáveis contínuas e destacar tendências ou flutuações.

## Estrutura de dados do gráfico de linhas

Para representar Line Chart, você pode usar a seguinte interface `AxisChartData`:

```typescript
{{AxisChartData}}
```
### Atributos das Chaves

- ** Cabeçalhos:** Um array de strings representando as categorias ou dimensões ao longo de um dos eixos.
- **valores:** Um dicionário onde cada chave é uma categoria ou dimensão, e o valor correspondente é uma matriz de valores numéricos ao longo do outro eixo.


### Prós e contras

#### Prós
- ** Comparação Multidimensional: ** Line Charts se destaca na comparação de múltiplas dimensões simultaneamente, fornecendo uma visão abrangente dos dados.

- ** Representação de Valor Limpo:** Os valores numéricos são claramente representados ao longo dos eixos X e Y, facilitando a interpretação e comparação dos usuários.

#### Contras
- **Complexidade com categorias excessivas:** Ao lidar com um grande número de categorias ou dimensões, a visualização pode se tornar lotada e desafiadora para interpretar.

- ** Limitado para dados categóricos:** Os gráficos de linhas são mais eficazes para dados numéricos e podem não ser a escolha ideal para representar dados categóricos.

## Exemplo de Gráfico de Linhas

![Line Chart Example](/Illustry-monorepo/line-chart.gif)