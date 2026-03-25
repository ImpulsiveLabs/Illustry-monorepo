---
title: Pâlnie
description: Pâlnie doc
---

Vizualizarea **Pâlnie** este un instrument puternic pentru urmărirea progresiei și ratelor de conversie a unei serii de etape dintr-un proces. Oferă o reprezentare vizuală a modului în care entitățile se deplasează prin diferite etape ale unui flux de lucru definit.



## Structura datelor canalului

Pentru a reprezenta o pâlnie, puteți utiliza următoarea interfață `FunnelData`:

```typescript
{{FunnelData}}
```
### Atribute cheie

- **valori:** un dicționar în care fiecare cheie este o categorie sau o dimensiune, iar valoarea corespunzătoare este o valoare numerică.


### Argumente pro şi contra

#### Pro
- **Metrici de performanță:** Diagramele funnel sunt excelente pentru vizualizarea valorilor de performanță, permițând echipelor să urmărească și să îmbunătățească indicatorii cheie.

- **Analiza segmentată:** Fiecare etapă a pâlniei permite o analiză segmentată, ajutând la identificarea zonelor specifice de îmbunătățire sau de succes.

- **Informații predictive:** Diagramele canal pot oferi informații predictive asupra performanței viitoare, pe baza ratelor de conversie istorice.

#### Contra

- **Provocare cu procese complexe:** în scenariile în care procesele implică numeroase ramuri sau bucle complicate, diagramele funnel pot avea dificultăți să reprezinte complexitatea în mod eficient.


## Exemplu de pâlnie

![Funnel Example](/Illustry-monorepo/funnel.gif)
