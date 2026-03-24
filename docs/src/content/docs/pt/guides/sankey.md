---
title: Diagrama de Sankey
description: Sankey
---

A visualização do **Diagrama de Sankey** é uma ferramenta poderosa para visualizar o fluxo e os relacionamentos entre entidades em um conjunto de dados. É particularmente útil para mostrar a distribuição e transformação de valores em um sistema ou processo.

## Estrutura de dados do diagrama de Sankey

Para representar um diagrama de Sankey, você pode usar a seguinte interface `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Atributos principais

- **nome:** Um identificador exclusivo para o nó.
- **categoria:** categoriza o nó em um grupo ou cluster específico.
- **fonte:** Identifica o nó de origem do link.
- **target:** Identifica o nó de destino do link.
- **valor:** Representa um valor numérico associado ao link que sugere o quão fortemente conectados os nós estão.

### Prós e Contras

#### Prós
- **Representação de fluxo:** visualiza com eficácia o fluxo de valores ou quantidades entre entidades em um sistema ou processo.

- **Insight sobre distribuição:** oferece insights sobre como os valores são distribuídos e transformados em cada estágio.

#### Contras
- **Complexidade com vários nós:** A confusão visual pode ocorrer com um grande número de nós, afetando a legibilidade.

- **Caso de uso especializado:** Projetado principalmente para visualizar fluxo e distribuição; pode não ser adequado para todos os tipos de conjuntos de dados.

## Exemplo de diagrama de Sankey

![Sankey Diagram Example](/Illustry-monorepo/sankey.gif)
