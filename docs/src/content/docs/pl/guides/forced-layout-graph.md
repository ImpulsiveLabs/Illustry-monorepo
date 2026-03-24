---
title: Wykres układu wymuszonego
description: Wykres układu wymuszonego
---

Wizualizacja * * wymuszonego układu graficznego * * jest dynamiczną i angażującą reprezentacją wzajemnie połączonych danych. Używa silnego algorytmu układu do wizualnego przekazywania relacji pomiędzy jednostkami w zbiorze danych.

## Struktura danych dotyczących układu wymuszonego

Aby przedstawić Forced Layout Graph, możesz użyć następującego interfejsu `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}

```
### Atrybuty kluczowe

- * * Nazwa: * * Unikalny identyfikator węzła.
- * * kategoria: * * Klasyfikacja węzła do określonej grupy lub klastra.
- * * źródło: * * Identyfikuje węzeł źródłowy łącza.
- * * target: * * Identyfikuje docelowy węzeł łącza.
- * * wartość: * * Przedstawia wartość liczbową związaną z linkiem, która sugeruje, jak silnie połączone są węzły.

### Plusy i minusy

#### Zalety
- * * Relacja Wizualizacja: * * Wyraźnie reprezentuje relacje pomiędzy jednostkami poprzez połączone węzły i połączenia.

- * * Dynamiczny układ: * * Wykorzystuje układ ukierunkowany na siłę dla organicznej i wizualnie atrakcyjnej reprezentacji.

#### Wózki
- * * Complexity with Dense Graphs: * * W gęsto połączonych wykresach, zaburzenia widzenia mogą mieć wpływ na czytelność.

- * * Limited to Network Data: * * Najbardziej skuteczne do wizualizacji danych sieciowych lub opartych na relacjach; może nie być odpowiednie dla wszystkich typów zbiorów danych.

## Przykład wykresu układu wymuszonego

![Forced Layout Graph Example](/Illustry-monorepo/forced-layout-graph.gif)
