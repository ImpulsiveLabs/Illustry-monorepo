---
title: Hierarchiczne łączenie brzegów
description: Hierarchiczny Edge Bundling doc
---

Wizualizacja * * Hierarchiczna Edge Bundling * * jest wyrafinowaną techniką przedstawiającą hierarchiczne relacje i połączenia w zbiorze danych. Skupia się ona na łączeniu krawędzi w celu ograniczenia wizualnego bałaganu, podkreślając jednocześnie strukturę relacji w sposób hierarchiczny.

## Hierarchiczna struktura danych bundling krawędzi

Aby przedstawić Hierarchical Edge Bundling, możesz użyć następującego interfejsu `NodeLinkData`:

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
- * * Ulepszona estetyka i czytelność: * * Związane krawędzie przyczyniają się do czystszej i bardziej estetycznie przyjemnej wizualizacji. Poprzez zmniejszenie hałasu widzenia, użytkownicy mogą łatwiej interpretować relacje między węzłami, zwiększając ogólną czytelność.

- * * Zwiększona koncentracja na kluczowych relacjach: * * Łączenie krawędzi pozwala użytkownikom skupić się na kluczowych relacjach w strukturze hierarchicznej, podkreślając najważniejsze połączenia. Może to pomóc w identyfikacji ścieżek krytycznych lub węzłów centralnych w złożonych zbiorach danych.

#### Wózki
- * * Trudności w identyfikacji równoległych ścieżek: * * Identyfikacja równoległych ścieżek lub połączeń w gęsto połączonym obszarze może stanowić wyzwanie dla użytkowników. Rozróżnianie blisko zapakowanych krawędzi reprezentujących różne związki może być skomplikowane, wpływając na precyzję analizy.

- * * Challenges with Directional Perception: * * Użytkownicy mogą napotkać trudności w postrzeganiu kierunku skręcania krawędzi, szczególnie w przypadku scenariuszy, w których występuje wysoki stopień pokrywania się. Może to mieć wpływ na dokładną interpretację przepływu relacji.

## Przykład Hierarchicznego Bundling na krawędzi

![Hierarchical Edge Bundling Example](/Illustry-monorepo/hierarchical-edge-bundling.gif)
