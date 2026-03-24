---
title: Wybuch słońca
description: Dokument „Wybuch słońca”.
---

Wizualizacja **Wykres rozbłysku słońca** to dynamiczna i wciągająca reprezentacja danych hierarchicznych. Wykorzystuje układ promieniowy do przekazywania hierarchii elementów i ich relacji w zbiorze danych.


## Struktura danych wybuchu słońca

Aby przedstawić dane mapy, możesz użyć następującego interfejsu `HierarchyData`:

```typescript
{{HierarchyNode}}

{{HierarchyData}}
```
### Kluczowe atrybuty

- **nazwa:** nazwa węzła.
- **wartość:** liczba reprezentująca metrykę określającą wielkość tego węzła.
- **kategoria:** opisuje kategorię lub typ, do którego należy węzeł.
- **dzieci:** Ta właściwość jest opcjonalna i reprezentuje tablicę obiektów HierarchyNode. Oznacza to, że węzeł może mieć węzły podrzędne, tworząc strukturę hierarchiczną. Każdy węzeł podrzędny ma tę samą strukturę HierarchyNode, co pozwala na reprezentację hierarchii przypominającej drzewo.

### Plusy i minusy

#### Plusy
- **Rozumienie hierarchiczne:** Sunbursts przoduje w wyświetlaniu hierarchicznych struktur danych, zapewniając wizualną hierarchię, która pomaga w zrozumieniu relacji między różnymi poziomami.

- **Układ promieniowy:** Układ promieniowy zapewnia atrakcyjną wizualnie i zorganizowaną reprezentację struktur hierarchicznych.

#### Wady
- **Potencjalne zaśmiecenie:** w przypadku dużej liczby segmentów wykres może stać się zaśmiecony, co wpłynie na czytelność.

- **Ograniczone do danych hierarchicznych:** Mapy drzewa są najskuteczniejsze podczas wizualizacji danych hierarchicznych; w przypadku niehierarchicznych zbiorów danych bardziej odpowiednie mogą być alternatywne wizualizacje.

## Przykład wybuchu słońca

![Sun Burst Example](/Illustry-monorepo/sun-burst.gif)
