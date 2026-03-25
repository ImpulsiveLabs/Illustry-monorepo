---
title: Mapa de árbol
description: Documento de mapa de árbol
---

La visualización **Mapa de árbol** es una forma dinámica y jerárquica de representar datos que proporciona una descripción clara de estructuras complejas. Al utilizar rectángulos anidados, Treemap visualiza de manera eficiente las relaciones jerárquicas de datos, lo que lo convierte en una herramienta invaluable para transmitir tanto el todo como las partes dentro de un conjunto de datos.

## Estructura de datos del mapa de árbol

Para representar datos de un mapa de árbol, puede utilizar la siguiente interfaz `HierarchyData`:

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
- **Comprensión jerárquica:** Los mapas de árbol destacan por mostrar estructuras de datos jerárquicas, lo que proporciona una jerarquía visual que ayuda a comprender las relaciones entre diferentes niveles.

- **Representación proporcional:** El tamaño proporcional de los rectángulos permite una representación intuitiva de los valores o tamaños relativos de diferentes categorías de datos.

- **Eficiencia espacial:** Los mapas de árbol utilizan el espacio de manera eficiente, lo que permite a los usuarios visualizar grandes conjuntos de datos sin saturar la pantalla.

- **Identificación rápida de patrones:** Los usuarios pueden identificar rápidamente patrones, valores atípicos y concentraciones dentro del conjunto de datos a través de la disposición visual de los rectángulos.

#### Contras
- **Complejidad con etiquetas superpuestas:** En los casos en que las etiquetas se superponen, especialmente en Treemaps densamente poblados, la legibilidad puede ser un desafío.

- **Dificultad de precisión:** Si bien los mapas de árbol brindan una descripción general amplia, lograr comparaciones precisas entre puntos de datos individuales puede ser un desafío debido a la naturaleza jerárquica.

- **Limitado a datos jerárquicos:** Los mapas de árbol son más efectivos al visualizar datos jerárquicos; para conjuntos de datos no jerárquicos, las visualizaciones alternativas pueden ser más adecuadas.

## Ejemplo de mapa de árbol

![Tree Map Example](/Illustry-monorepo/tree-map.gif)
