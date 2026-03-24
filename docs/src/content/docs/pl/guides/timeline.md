---
title: Terminy
description: Czas dok
---

* * Timeline * * jest wszechstronną wizualizacją wyświetlającą wydarzenia lub działania chronologicznie w czasie. Oferuje kompleksowy obraz wydarzeń historycznych lub przyszłych, zapewniając wgląd w wzorce, czas trwania i relacje.


## Struktura danych czasowych

Aby przedstawić Timeline Data, możesz użyć następującego interfejsu `TimelineData`:

```typescript
{{TimelineEventTag}}

{{TimelineEvent}}

{{TimelineData}}
```
### Atrybuty kluczowe

#### Tag zdarzenia na osi czasu
- * * name: * * Nazwa znacznika powiązanego z zdarzeniem Timeline.

#### Czas trwania zdarzenia
- * * streszczenie: * * Krótkie podsumowanie lub tytuł wydarzenia.
- * * data: * * Data wystąpienia zdarzenia.
- * * type: * * Rodzaj lub kategoria wydarzenia.
- * * autor: * * Autor lub twórca wydarzenia.
- * * tags: * * Lista znaczników związanych z wydarzeniem.
- * * opis: * * Szczegółowy opis zdarzenia.

#### Terminy
- * * [data]: * * Klucz daty reprezentujący określony zakres daty.
  - *
    - * * tytuł: * * Podsumowanie dla rangi dni.
  - **zdarzenia:** tablica obiektów `TimelineEvent` powiązanych z tą datą.

### Plusy i minusy

#### Zalety
- * * Chronologiczne zrozumienie: * * Terminy oferują chronologiczną reprezentację zdarzeń, zapewniając jasne zrozumienie sekwencji, w której miały miejsce.

- * * Klasyfikacja zdarzeń: * * Możliwość kategoryzacji zdarzeń przy użyciu tagów pozwala na zorganizowaną i efektywną grupowanie, wspomagając analizę konkretnych rodzajów zdarzeń.

- * * Elastyczna wizualizacja: * * Terminy są elastyczne i mogą być dostosowywane do różnych rodzajów danych, dzięki czemu są odpowiednie do reprezentowania szerokiego zakresu wydarzeń i działań.

#### Wózki
- * * Potencjalne tłumienie: * * W liniach czasowych z dużą gęstością zdarzeń istnieje ryzyko zaburzenia widzenia i potencjalnych trudności w rozróżnianiu poszczególnych zdarzeń.

- * * Ograniczone dla niektórych typów danych: * * Chociaż linie czasowe są wszechstronne, mogą nie być najbardziej skuteczne w przedstawianiu pewnych złożonych relacji lub struktur danych.

- * * Subjektywność w znaczeniu zdarzenia: * * Znaczenie wydarzeń może być subiektywne, a ich reprezentacja w harmonogramie może nie uwzględniać niuanse znaczenia postrzegane przez jednostki.

## Przykład terminarza

![Timeline Example](/Illustry-monorepo/timeline.gif)
