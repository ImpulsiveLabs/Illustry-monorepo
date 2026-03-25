---
title: Conjunto de bordas hierárquicas
description: Documento de agrupamento hierárquico de bordas
---

O **Hierarchical Edge Bundling** é uma técnica sofisticada para descrever relações hierárquicas e conexões dentro de um conjunto de dados. Ele alavanca o agrupamento de bordas para reduzir a desordem visual, destacando a estrutura das relações de forma hierárquica.

## Estrutura de dados de agrupamento de bordas hierárquicas

Para representar Hierarchical Edge Bundling, você pode usar a seguinte interface `NodeLinkData`:

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
- ** Melhor estética e legibilidade: ** As bordas empacotadas contribuem para uma visualização mais limpa e esteticamente agradável. Ao reduzir a desordem visual, os usuários podem interpretar mais facilmente as relações entre nós, aumentando a legibilidade geral.

- ** Foco Melhorado nas Relações Chaves: ** O agrupamento de bordas permite que os usuários se concentrem em relacionamentos chave dentro da estrutura hierárquica, enfatizando as conexões mais significativas. Isso pode ajudar na identificação de caminhos críticos ou nós centrais em conjuntos de dados complexos.

#### Contras
- ** Dificuldade em identificar caminhos paralelos: ** Identificar caminhos ou conexões paralelos em uma área densamente empacotada pode representar desafios para os usuários. Distinguir-se entre bordas próximas representando diferentes relações pode ser complexo, afetando a precisão da análise.

- ** Desafios com Percepção de Direccionalidade:** Os usuários podem enfrentar dificuldades em perceber a direcionalidade das bordas agrupadas, particularmente em cenários onde há um alto grau de sobreposição. Isso pode impactar a interpretação precisa do fluxo de relacionamentos.

## Exemplo de agrupamento de bordas hierárquicas

![Hierarchical Edge Bundling Example](/Illustry-monorepo/hierarchical-edge-bundling.gif)