---
title: Matriz
description: Documento de matriz
---

La visualización **Matrix** es una visualización multidimensional, donde los nodos de 2 categorías se pueden visualizar como complementarios entre sí.

## Estructura de datos matricial

Para representar una Matriz, puede utilizar la siguiente interfaz `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Atributos clave

- **nombre:** Un identificador único para el nodo.
- **categoría:** Clasifica el nodo en un grupo o clúster específico.
- **etiquetas:** Son una matriz de valores de nombre que representan atributos específicos del nodo.
- **fuente:** Identifica el nodo de origen del enlace.
- **destino:** Identifica el nodo de destino del enlace.
- **valor:** Representa un valor numérico asociado con el vínculo que sugiere qué tan fuertemente conectados están los nodos.

### Pros y contras

#### Ventajas
- **Gran cantidad de datos:** Se puede mostrar una gran cantidad de datos en una sola ventana.

- **Filtrado:** Filtrado por filas y columnas.

#### Contras
- **Desplazamiento necesario:** Demasiados datos podrían necesitar un desplazamiento para verlos todos.


## Ejemplo de matriz

![Matrix Example](/Illustry-monorepo/matrix.gif)
