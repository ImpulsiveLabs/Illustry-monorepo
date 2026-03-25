---
title: Mapa da árvore
description: Documento do mapa de árvore
---

A visualização do **Mapa de Árvore** é uma forma dinâmica e hierárquica de representar dados que fornece uma visão geral clara de estruturas complexas. Ao utilizar retângulos aninhados, o Treemap visualiza com eficiência relacionamentos hierárquicos de dados, tornando-o uma ferramenta inestimável para transmitir o todo e as partes dentro de um conjunto de dados.

## Estrutura de dados do mapa em árvore

Para representar dados de um mapa de árvore, você pode usar a seguinte interface `HierarchyData`:

```typescript
{{HierarchyNode}}

{{HierarchyData}}
```
### Atributos principais

- **nome:** O nome do nó.
- **valor:** um número que representa uma métrica para determinar o tamanho desse nó.
- **categoria:** Descreve a categoria ou tipo ao qual o nó pertence.
- **filhos:** Esta propriedade é opcional e representa uma matriz de objetos HierarchyNode. Significa que o nó pode ter nós filhos, criando uma estrutura hierárquica. Cada nó filho segue a mesma estrutura HierarchyNode, permitindo a representação de uma hierarquia semelhante a uma árvore.

### Prós e Contras

#### Prós
- **Compreensão hierárquica:** Os mapas em árvore são excelentes na exibição de estruturas de dados hierárquicas, fornecendo uma hierarquia visual que ajuda a compreender as relações entre diferentes níveis.

- **Representação Proporcional:** O dimensionamento proporcional dos retângulos permite uma representação intuitiva dos valores ou tamanhos relativos de diferentes categorias de dados.

- **Eficiência de espaço:** Treemaps usam o espaço de forma eficiente, permitindo que os usuários visualizem grandes conjuntos de dados sem sobrecarregar a tela.

- **Identificação rápida de padrões:** os usuários podem identificar rapidamente padrões, valores discrepantes e concentrações no conjunto de dados por meio do arranjo visual de retângulos.

#### Contras
- **Complexidade com rótulos sobrepostos:** Nos casos em que os rótulos se sobrepõem, especialmente em mapas de árvore densamente povoados, a legibilidade pode ser um desafio.

- **Dificuldade de precisão:** embora os Treemaps forneçam uma visão geral ampla, conseguir comparações precisas entre pontos de dados individuais pode ser um desafio devido à natureza hierárquica.

- **Limitado a dados hierárquicos:** Os mapas em árvore são mais eficazes na visualização de dados hierárquicos; para conjuntos de dados não hierárquicos, visualizações alternativas podem ser mais adequadas.

## Exemplo de mapa de árvore

![Tree Map Example](/Illustry-monorepo/tree-map.gif)
