---
title: Cronologie
description: Cronologie doc
---

**Cronologia** este o vizualizare versatilă care afișează evenimente sau activități cronologic de-a lungul timpului. Oferă o vedere cuprinzătoare a evenimentelor istorice sau viitoare, oferind perspective asupra tiparelor, duratelor și relațiilor.


## Structura de date cronologică

Pentru a reprezenta date cronologice, puteți utiliza următoarea interfață `TimelineData`:

```typescript
{{TimelineEventTag}}

{{TimelineEvent}}

{{TimelineData}}
```
### Atribute cheie

#### TimelineEventTag
- **nume:** Numele etichetei asociate unui eveniment Timeline.

#### TimelineEvent
- **rezumat:** Un scurt rezumat sau titlul evenimentului.
- **data:** Data la care a avut loc evenimentul.
- **tip:** Tipul sau categoria evenimentului.
- **autor:** Autorul sau creatorul evenimentului.
- **etichete:** o serie de etichete asociate evenimentului.
- **descriere:** O descriere detaliată a evenimentului.

#### TimelineData
- **[data]:** Tasta de dată care reprezintă un anumit interval de date.
  - **rezumat:**
    - **titlu:** Un titlu rezumativ pentru intervalul de date.
  - **evenimente:** o matrice de `TimelineEvent` obiecte asociate cu data respectivă.

### Argumente pro şi contra

#### Pro
- **Înțelegerea cronologică:** Cronologia oferă o reprezentare cronologică a evenimentelor, oferind o înțelegere clară a secvenței în care au avut loc.

- **Categorizarea evenimentelor:** Abilitatea de a clasifica evenimentele folosind etichete permite o grupare organizată și eficientă, ajutând la analiza unor tipuri specifice de evenimente.

- **Vizualizare flexibilă:** Cronologia este flexibilă și se poate adapta la diferite tipuri de date, făcându-le potrivite pentru a reprezenta o gamă largă de evenimente și activități.

#### Contra
- **Aglomerare potențială:** În cronologie cu o densitate mare de evenimente, există riscul dezordinei vizuale și dificultăți potențiale în distingerea evenimentelor individuale.

- **Limitat pentru anumite tipuri de date:** Deși cronologia este versatile, este posibil să nu fie cele mai eficiente pentru a reprezenta anumite relații complexe sau structuri de date.

- **Subiectivitate în importanța evenimentului:** Importanța evenimentelor poate fi subiectivă, iar reprezentarea lor pe o linie temporală ar putea să nu capteze semnificația nuanțată percepută de indivizi.

## Exemplu de cronologie

![Timeline Example](/Illustry-monorepo/timeline.gif)
