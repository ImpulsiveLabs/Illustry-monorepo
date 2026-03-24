---
title: Matriz
description: Documento matriz
---

A visualização **Matrix** é uma visualização multidimensional, onde nós de 2 categorias podem ser visualizados como complementares entre si

## Estrutura de dados matriciais

Para representar Matrix, você pode usar a seguinte interface `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Atributos das Chaves

- **nome:** Um identificador único para o nó.
- ** Categoria:** Categoriza o nó em um grupo específico ou cluster.
- ** Rótulos:** São uma matriz de valores de nome que representam atributos específicos do nó.
- **fonte:** Identifica o nó de origem da ligação.
- ** Alvo:** Identifica o nó alvo da ligação.
- ** Valor: ** Representa um valor numérico associado ao link que sugere o quão fortemente conectados os nós são.

### Prós e contras

#### Prós
- **Grandes Dados:** Uma grande quantidade de dados pode ser exibida em uma única janela.

- **Filtragem:** Filtrando nas linhas e nas colunas.

#### Contras
- ** Rolo necessário: Muitos dados podem precisar de um pergaminho para ver todos eles.


## Exemplo de Matriz

![Matrix Example](/Illustry-monorepo/matrix.gif)
