---
title: Gráfico de Dispersão
description: Documento de dispersão
---

O **Scatter Plot** é uma poderosa ferramenta para visualizar as relações entre duas variáveis numéricas. Utiliza pontos em um plano cartesiano para representar pontos de dados individuais, facilitando a identificação de padrões, correlações e outliers.


## Estrutura de Dados do Gráfico de Dispersão

Para representar Scatter Plot, você pode usar a seguinte interface `ScatterData`:

```typescript
{{ScatterPoint}}

{{ScatterData}}
```

### Atributos das Chaves

- ** Valor: ** Uma matriz de dois valores numéricos [x, y], representando as coordenadas de um ponto de dados nos eixos X e Y.
- **valores:** Uma string indicando a categoria ou grupo a que pertence o ponto de dados.


### Prós e contras

#### Prós
- ** Identificação da Relação: ** Os gráficos de dispersão se sobressaem em revelar relações, padrões e tendências entre duas variáveis numéricas.

- **Outlier Detection:**Outliers, ou pontos de dados que se desviam significativamente da norma, são facilmente identificados em um gráfico de dispersão.

#### Contras

- ** Sobreposição Potencial: ** Nos casos com alta densidade de pontos de dados, pode ocorrer sobreplotagem, afetando a visibilidade de pontos individuais.

## Exemplo do Gráfico de Dispersão

![Scatter Plot Example](/Illustry-monorepo/scatter.gif)