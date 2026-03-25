---
title: Gráfico de diseño forzado
description: Documento de gráfico de diseño forzado
---

La visualización **Forced Layout Graph** es una representación dinámica y atractiva de datos interconectados. Utiliza un algoritmo de diseño dirigido por la fuerza para transmitir visualmente las relaciones entre entidades dentro de un conjunto de datos.

## Estructura de datos del gráfico de diseño forzado

Para representar un gráfico de diseño forzado, puede utilizar la siguiente interfaz `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}

```
### Atributos clave

- **nombre:** Un identificador único para el nodo.
- **categoría:** Clasifica el nodo en un grupo o clúster específico.
- **fuente:** Identifica el nodo de origen del enlace.
- **destino:** Identifica el nodo de destino del enlace.
- **valor:** Representa un valor numérico asociado con el vínculo que sugiere qué tan fuertemente conectados están los nodos.

### Pros y contras

#### Ventajas
- **Visualización de relaciones:** Representa claramente las relaciones entre entidades a través de nodos y enlaces conectados.

- **Diseño dinámico:** Utiliza un diseño dirigido por la fuerza para una representación orgánica y visualmente atractiva.

#### Contras
- **Complejidad con gráficos densos:** En gráficos densamente interconectados, el desorden visual puede afectar la legibilidad.

- **Limitado a datos de red:** Más eficaz para visualizar datos de red o basados ​​en relaciones; Puede que no sea adecuado para todos los tipos de conjuntos de datos.

## Ejemplo de gráfico de diseño forzado

![Forced Layout Graph Example](/Illustry-monorepo/forced-layout-graph.gif)
