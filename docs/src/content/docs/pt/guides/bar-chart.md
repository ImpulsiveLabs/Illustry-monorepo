---
title: Gráfico de Barras
description: Documento do gráfico de barras
---

O **Bar Chart** é uma ferramenta versátil e eficaz para representar dados categóricos de forma visualmente envolvente. Utiliza barras horizontais ou verticais para mostrar os valores de diferentes categorias, facilitando aos usuários a comparação e compreensão das distribuições de dados.

## Estrutura de dados do gráfico de barras

Para representar Bar Chart, você pode usar a seguinte interface `AxisChartData`:

```typescript
{{AxisChartData}}
```
### Atributos das Chaves

- ** Cabeçalhos:** Um array de strings representando as categorias ou dimensões ao longo de um dos eixos.
- **valores:** Um dicionário onde cada chave é uma categoria ou dimensão, e o valor correspondente é uma matriz de valores numéricos ao longo do outro eixo.


### Prós e contras

#### Prós
- ** Comparação Multidimensional: ** Gráficos de barras se sobressaem na comparação simultânea de múltiplas dimensões, fornecendo uma visão abrangente dos dados.

- ** Representação de Valor Limpo:** Os valores numéricos são claramente representados ao longo dos eixos X e Y, facilitando a interpretação e comparação dos usuários.

#### Contras
- **Complexidade com categorias excessivas:** Ao lidar com um grande número de categorias ou dimensões, a visualização pode se tornar lotada e desafiadora para interpretar.

- ** Limitado para dados categóricos:** Gráficos de barras são mais eficazes para dados numéricos e podem não ser a escolha ideal para representar dados categóricos.

## Exemplo de Gráfico de Barras

![Bar Chart Example](/Illustry-monorepo/bar-chart.gif)
