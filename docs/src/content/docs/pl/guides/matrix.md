---
title: Matryca
description: Dokument matrycy
---

Wizualizacja * * Matrix * * jest wielowymiarową wizualizacją, gdzie węzły 2 kategorii mogą być wizualizowane jako komplementarne z innymi

## Struktura danych macierzy

Aby przedstawić Matrix, możesz użyć następującego interfejsu `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Atrybuty kluczowe

- * * Nazwa: * * Unikalny identyfikator węzła.
- * * kategoria: * * Klasyfikacja węzła do określonej grupy lub klastra.
- * * Etykiety: * * Są tablicą wartości nazw, które reprezentują specyficzne atrybuty węzła.
- * * źródło: * * Identyfikuje węzeł źródłowy łącza.
- * * target: * * Identyfikuje docelowy węzeł łącza.
- * * wartość: * * Przedstawia wartość liczbową związaną z linkiem, która sugeruje, jak silnie połączone są węzły.

### Plusy i minusy

#### Zalety
- * * Duże dane: * * Bardzo duża ilość danych może być wyświetlana w jednym oknie.

- * * Filtrowanie: * * Filtrowanie wierszy i kolumn.

#### Wózki
- * * Scroll need: * * Zbyt wiele danych może potrzebować zwoju, aby zobaczyć je wszystkie.


## Przykład macierzy

![Matrix Example](/Illustry-monorepo/matrix.gif)
