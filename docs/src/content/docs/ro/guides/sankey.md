---
title: Diagrama Sankey
description: Sankey
---

Vizualizarea **Sankey Diagram** este un instrument puternic pentru vizualizarea fluxului și a relațiilor dintre entitățile dintr-un set de date. Este deosebit de util pentru prezentarea distribuției și transformării valorilor într-un sistem sau proces.

## Structura de date a diagramei Sankey

Pentru a reprezenta o diagramă Sankey, puteți utiliza următoarea interfață `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Atribute cheie

- **nume:** Un identificator unic pentru nod.
- **categorie:** Clasifică nodul într-un anumit grup sau cluster.
- **sursa:** Identifică nodul sursă al legăturii.
- **țintă:** Identifică nodul țintă al legăturii.
- **valoare:** reprezintă o valoare numerică asociată cu legătura care sugerează cât de puternic sunt conectate nodurile.

### Argumente pro şi contra

#### Pro
- **Reprezentare flux:** Vizualizează eficient fluxul de valori sau cantități între entitățile dintr-un sistem sau proces.

- **Perspectivă asupra distribuției:** oferă informații despre modul în care valorile sunt distribuite și transformate în fiecare etapă.

#### Contra
- **Complexitate cu numeroase noduri:** Dezordinea vizuală poate apărea cu un număr mare de noduri, afectând lizibilitatea.

- **Caz de utilizare specializat:** Proiectat în primul rând pentru vizualizarea fluxului și distribuției; poate să nu fie potrivit pentru toate tipurile de seturi de date.

## Exemplu de diagramă Sankey

![Sankey Diagram Example](/Illustry-monorepo/sankey.gif)
