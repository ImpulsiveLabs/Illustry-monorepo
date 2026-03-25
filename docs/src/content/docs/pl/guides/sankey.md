---
title: Schemat Sankeya
description: Sankeya
---

Wizualizacja **Diagram Sankeya** to potężne narzędzie do wizualizacji przepływu i relacji pomiędzy jednostkami w zbiorze danych. Jest szczególnie przydatny do pokazania rozkładu i transformacji wartości w systemie lub procesie.

## Struktura danych diagramu Sankeya

Aby przedstawić diagram Sankeya, możesz użyć następującego interfejsu `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Kluczowe atrybuty

- **name:** Unikalny identyfikator węzła.
- **kategoria:** kategoryzuje węzeł w określonej grupie lub klastrze.
- **źródło:** Identyfikuje węzeł źródłowy łącza.
- **target:** Identyfikuje węzeł docelowy łącza.
- **wartość:** reprezentuje wartość liczbową powiązaną z łączem, która sugeruje, jak silnie połączone są węzły.

### Plusy i minusy

#### Plusy
- **Reprezentacja przepływu:** skutecznie wizualizuje przepływ wartości lub ilości pomiędzy jednostkami w systemie lub procesie.

- **Wgląd w dystrybucję:** zapewnia wgląd w sposób dystrybucji i transformacji wartości na każdym etapie.

#### Wady
- **Złożoność z dużą liczbą węzłów:** W przypadku dużej liczby węzłów może wystąpić bałagan wizualny, wpływający na czytelność.

- **Specjalistyczny przypadek użycia:** Zaprojektowany głównie do wizualizacji przepływu i dystrybucji; może nie być odpowiedni dla wszystkich typów zbiorów danych.

## Przykład diagramu Sankeya

![Sankey Diagram Example](/Illustry-monorepo/sankey.gif)
