---
title: Mapa drzewa
description: Mapa drzew, dok
---

Wizualizacja **Mapa drzewa** to dynamiczny i hierarchiczny sposób reprezentowania danych, który zapewnia przejrzysty przegląd złożonych struktur. Wykorzystując zagnieżdżone prostokąty, mapa drzewa skutecznie wizualizuje hierarchiczne relacje danych, co czyni ją nieocenionym narzędziem do przekazywania zarówno całości, jak i części zbioru danych.

## Struktura danych mapy drzewa

Aby przedstawić dane mapy drzewa, możesz użyć następującego interfejsu `HierarchyData`:

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
- **Rozumienie hierarchiczne:** Mapy drzew doskonale wyświetlają hierarchiczne struktury danych, zapewniając wizualną hierarchię, która pomaga w zrozumieniu relacji między różnymi poziomami.

- **Reprezentacja proporcjonalna:** Proporcjonalna wielkość prostokątów pozwala na intuicyjną reprezentację względnych wartości lub rozmiarów różnych kategorii danych.

- **Efektywność przestrzenna:** Mapy drzew efektywnie wykorzystują przestrzeń, umożliwiając użytkownikom wizualizację dużych zbiorów danych bez zaśmiecania ekranu.

- **Szybka identyfikacja wzorców:** Użytkownicy mogą szybko identyfikować wzorce, wartości odstające i koncentracje w zbiorze danych za pomocą wizualnego układu prostokątów.

#### Wady
- **Złożoność w przypadku nakładających się etykiet:** W przypadkach, gdy etykiety nakładają się na siebie, zwłaszcza w gęsto zaludnionych mapach drzewa, czytelność może stanowić wyzwanie.

- **Trudność w precyzji:** Chociaż mapy drzewa zapewniają szeroki przegląd, osiągnięcie precyzyjnych porównań pomiędzy poszczególnymi punktami danych może być wyzwaniem ze względu na hierarchiczną naturę.

- **Ograniczone do danych hierarchicznych:** Mapy drzewa są najskuteczniejsze podczas wizualizacji danych hierarchicznych; w przypadku niehierarchicznych zbiorów danych bardziej odpowiednie mogą być alternatywne wizualizacje.

## Przykład mapy drzewa

![Tree Map Example](/Illustry-monorepo/tree-map.gif)
