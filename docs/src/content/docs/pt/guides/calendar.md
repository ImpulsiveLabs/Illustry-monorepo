---
title: Calendário
description: Documento do calendário
---

A visualização **Calendar** é uma representação única projetada para fornecer insights sobre relacionamentos temporais dentro de um conjunto de dados. Oferece uma abordagem distinta para visualizar eventos, ocorrências ou entidades ao longo do tempo.

## Estrutura de dados do calendário

Para representar Calendar, você pode usar a seguinte interface `CalendarData`:

```typescript
{{CalendarType}}

{{CalendarData}}
```
### Atributos das Chaves

- **data:** Uma data única de um ano específico.
- ** Valor: ** Quão impactante foi essa data para o evento.
- ** Categoria:** Categoriza as datas em eventos específicos.


### Prós e contras

#### Prós
- ** Visualização da Relação: ** A visualização do calendário fornece uma maneira intuitiva e amigável de explorar relacionamentos temporais, tornando fácil para os usuários entender padrões ao longo do tempo.

- ** Representação Compact:** Um calendário otimiza o espaço, apresentando eventos em um formato compacto, permitindo que os usuários visualizem uma quantidade significativa de dados temporais sem imagens esmagadoras.

- **Multiplos anos Se os eventos estiverem acontecendo em um horário multi-ano mais visualizações de calendário serão exibidas.

#### Contras
- **Complexidade com Gráficos Densas:** Devido à sua natureza compacta, um calendário pode fornecer espaço limitado para detalhar cada evento. Em cenários que exijam amplas informações, podem ser necessárias interações adicionais ou visões suplementares.

- ** Não é ideal para sobreposição de eventos densas: ** Nos casos em que múltiplos eventos se sobrepõem de perto no tempo, a visualização pode enfrentar desafios na manutenção da clareza e prevenção de desordem visual relacionada à sobreposição.

## Exemplo de Calendário

![Calendar Example](/Illustry-monorepo/calendar.gif)