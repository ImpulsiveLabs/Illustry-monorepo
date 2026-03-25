---
title: Matriks
description: dokumen matriks
---

Visualisasi **Matrix** merupakan visualisasi multidimensi, dimana node dari 2 kategori dapat divisualisasikan sebagai pelengkap satu sama lain.

## Struktur Data Matriks

Untuk merepresentasikan Matriks, Anda dapat menggunakan antarmuka `NodeLinkData` berikut:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Atribut Utama

- **nama:** Pengidentifikasi unik untuk node.
- **kategori:** Mengkategorikan node ke dalam grup atau klaster tertentu.
- **labels:** Merupakan array nilai nama yang mewakili atribut spesifik dari node.
- **source:** Mengidentifikasi node sumber tautan.
- **target:** Mengidentifikasi simpul target tautan.
- **nilai:** Mewakili nilai numerik yang dikaitkan dengan tautan yang menunjukkan seberapa kuat keterhubungan simpul-simpul tersebut.

### Pro dan Kontra

#### Kelebihan
- **Data Besar:** Jumlah data yang sangat besar dapat ditampilkan dalam satu jendela.

- **Pemfilteran:** Pemfilteran pada baris dan kolom.

#### Kontra
- **Gulungan diperlukan:** Terlalu banyak data yang mungkin perlu digulir agar dapat melihat semuanya.


## Contoh Matriks

![Matrix Example](/Illustry-monorepo/matrix.gif)
