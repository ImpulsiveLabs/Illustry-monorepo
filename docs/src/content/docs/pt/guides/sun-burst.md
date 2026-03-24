---
title: Explosão do Sol
description: Documento Explosão do Sol
---

A visualização **Sun Burst Chart** é uma representação dinâmica e envolvente de dados hierárquicos. Ele usa um layout radial para transmitir a hierarquia dos elementos e seus relacionamentos dentro de um conjunto de dados.


## Estrutura de dados do Sun Burst

Para representar dados de mapa, você pode usar a seguinte interface `HierarchyData`:

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
- **Compreensão hierárquica:** Sunbursts se destacam na exibição de estruturas de dados hierárquicas, fornecendo uma hierarquia visual que ajuda na compreensão das relações entre diferentes níveis.

- **Layout Radial:** O layout radial fornece uma representação visualmente atraente e organizada de estruturas hierárquicas.

#### Contras
- **Potencial desordem:** em casos com um grande número de segmentos, o gráfico pode ficar desordenado, afetando a legibilidade.

- **Limitado a dados hierárquicos:** Os mapas em árvore são mais eficazes na visualização de dados hierárquicos; para conjuntos de dados não hierárquicos, visualizações alternativas podem ser mais adequadas.

## Exemplo de explosão solar

![Sun Burst Example](/Illustry-monorepo/sun-burst.gif)
