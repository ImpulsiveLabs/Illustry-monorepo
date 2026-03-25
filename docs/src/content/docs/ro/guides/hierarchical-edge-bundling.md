---
title: Grupare ierarhica a muchiilor
description: Ierarhic Edge Bundling doc
---

Vizualizarea **Hierarhical Edge Bundling** este o tehnică sofisticată pentru a descrie relațiile ierarhice și conexiunile într-un set de date. Utilizează gruparea marginilor pentru a reduce dezordinea vizuală, evidențiind în același timp structura relațiilor într-o manieră ierarhică.

## Structura de date de grupare ierarhică de margine

Pentru a reprezenta un grup ierarhic Edge, puteți utiliza următoarea interfață `NodeLinkData`:

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
- **Estetică și lizibilitate îmbunătățite:** Marginile grupate contribuie la o vizualizare mai curată și mai plăcută din punct de vedere estetic. Prin reducerea dezordinei vizuale, utilizatorii pot interpreta mai ușor relațiile dintre noduri, îmbunătățind lizibilitatea generală.

- ** Focalizare îmbunătățită asupra relațiilor cheie:** Gruparea Edge permite utilizatorilor să se concentreze asupra relațiilor cheie din structura ierarhică, punând accent pe cele mai semnificative conexiuni. Acest lucru poate ajuta la identificarea căilor critice sau a nodurilor centrale în seturi de date complexe.

#### Contra
- **Dificultate în identificarea căilor paralele:** Identificarea căilor paralele sau a conexiunilor într-o zonă dens grupată poate reprezenta provocări pentru utilizatori. Distincția între muchiile strâns împachetate care reprezintă diferite relații poate fi complexă, afectând precizia analizei.

- **Provocări legate de percepția direcționalității:** Utilizatorii pot întâmpina dificultăți în a percepe direcționalitatea marginilor grupate, în special în scenariile în care există un grad ridicat de suprapunere. Acest lucru poate afecta interpretarea corectă a fluxului de relații.

## Exemplu de grupare a marginilor ierarhice

![Hierarchical Edge Bundling Example](/Illustry-monorepo/hierarchical-edge-bundling.gif)
