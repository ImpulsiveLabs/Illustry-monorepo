---
title: Nuvem de Palavras
description: Documento da nuvem de palavras
---

A visualização **Word Cloud** é usada para representar dados textuais de forma visualmente envolvente e informativa. Transforma palavras em elementos gráficos, com o tamanho de cada palavra indicando sua frequência ou importância no conjunto de dados dado.

## Estrutura de dados Word Cloud

Para representar Word Cloud, você pode usar a seguinte interface `WordCloudData`:

```typescript
{{WordType}}

{{WordCloudData}}

```
### Atributos das Chaves

- ** nome:** A própria palavra.
- ** Valor: ** Um número que representa uma métrica para determinar a importância dessa palavra.


### Prós e contras

#### Prós
- ** Simplicidade:** Word Clouds destilar dados textuais em um formato simples e visualmente acessível.

- ** Análise rápida: ** Os usuários podem analisar e identificar rapidamente as palavras mais significativas sem aprofundar o texto detalhado.

#### Contras
- **Perda de Contexto:** Enquanto as Word Clouds destacam palavras individuais, elas podem não ter o contexto fornecido pelo texto completo ou visualizações mais complexas.

- ** Subjetividade:** Interpretação de uma nuvem de palavras pode ser subjetiva, e a importância de uma palavra pode variar entre os indivíduos.

## Exemplo de nuvem de palavras

![Word Cloud Example](/Illustry-monorepo/word-cloud.gif)