---
title: Gráfico de Tortas
description: Documento do Gráfico de Tortas
---

A visualização **Pie Chart** é uma forma concisa e visualmente impactante de representar a distribuição de partes dentro de um todo. É particularmente eficaz para exibir proporções e percentagens em formato circular.


## Estrutura de Dados do Gráfico de Tortas

Para representar Pie Chart, você pode usar a seguinte interface `PieChartData`:

```typescript
{{PieChartData}}
```
### Atributos das Chaves

- **valores:** Um dicionário onde cada chave é uma categoria ou dimensão, e o valor correspondente é um valor numérico.


### Prós e contras

#### Prós
- ** Representação percentual:** Gráficos de tortas fornecem uma representação clara da contribuição percentual de cada categoria para o todo.

- ** Simplicidade visual: ** A forma circular e a simplicidade dos Pie Charts facilitam a compreensão dos usuários.

#### Contras
- ** Limitado para Muitas Categorias: Ao lidar com inúmeras categorias, Pie Charts pode se tornar lotado e desafiador para interpretar.


## Exemplo de Gráfico de Tortas

![Pie Chart Example](/Illustry-monorepo/pie-chart.gif)