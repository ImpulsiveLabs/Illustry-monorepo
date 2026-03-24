---
title: Explosión de sol
description: Documento sobre la explosión del sol
---

La visualización **Sun Burst Chart** es una representación dinámica y atractiva de datos jerárquicos. Utiliza un diseño radial para transmitir la jerarquía de elementos y sus relaciones dentro de un conjunto de datos.


## Estructura de datos de la explosión solar

Para representar datos de mapa, puede utilizar la siguiente interfaz `HierarchyData`:

```typescript
{{HierarchyNode}}

{{HierarchyData}}
```
### Atributos clave

- **nombre:** El nombre del nodo.
- **valor:** Un número que representa una métrica para determinar qué tan grande es ese nodo.
- **categoría:** Describe la categoría o tipo al que pertenece el nodo.
- **niños:** Esta propiedad es opcional y representa una matriz de objetos HierarchyNode. Significa que el nodo puede tener nodos secundarios, creando una estructura jerárquica. Cada nodo secundario sigue la misma estructura HierarchyNode, lo que permite la representación de una jerarquía en forma de árbol.

### Pros y contras

#### Ventajas
- **Comprensión jerárquica:** Los rayos solares destacan por mostrar estructuras de datos jerárquicas, lo que proporciona una jerarquía visual que ayuda a comprender las relaciones entre diferentes niveles.

- **Diseño radial:** El diseño radial proporciona una representación visualmente atractiva y organizada de estructuras jerárquicas.

#### Contras
- **Posible desorden:** En casos con una gran cantidad de segmentos, el gráfico puede quedar desordenado, lo que afecta la legibilidad.

- **Limitado a datos jerárquicos:** Los mapas de árbol son más efectivos al visualizar datos jerárquicos; para conjuntos de datos no jerárquicos, las visualizaciones alternativas pueden ser más adecuadas.

## Ejemplo de explosión solar

![Sun Burst Example](/Illustry-monorepo/sun-burst.gif)
