---
title: Gráfico de Disposição Forçada
description: Documento de Gráfico de Disposição Forçada
---

O **Forced Layout Graph** é uma representação dinâmica e envolvente de dados interligados. Ele usa um algoritmo de layout direcionado por força para transmitir visualmente relações entre entidades dentro de um conjunto de dados.

## Estrutura de dados do gráfico de layout forçado

Para representar Forced Layout Graph, você pode usar a seguinte interface `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}

```
### Atributos das Chaves

- **nome:** Um identificador único para o nó.
- ** Categoria:** Categoriza o nó em um grupo específico ou cluster.
- **fonte:** Identifica o nó de origem da ligação.
- ** Alvo:** Identifica o nó alvo da ligação.
- ** Valor: ** Representa um valor numérico associado ao link que sugere o quão fortemente conectados os nós são.

### Prós e contras

#### Prós
- ** Visualização da Relação: ** Representa claramente relações entre entidades através de nós e links conectados.

- ** Disposição dinâmica: ** Utiliza um layout direcionado à força para uma representação orgânica e visualmente atraente.

#### Contras
- **Complexidade com Gráficos Densas:** Em gráficos densamente interligados, a desordem visual pode afetar a legibilidade.

- **Limited to Network Data:** Mais eficaz para visualizar a rede ou dados baseados em relacionamentos; pode não ser adequado para todos os tipos de conjuntos de dados.

## Exemplo de Gráfico de Disposição Forçada

![Forced Layout Graph Example](/Illustry-monorepo/forced-layout-graph.gif)