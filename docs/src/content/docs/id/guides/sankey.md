---
title: Diagram Sankey
description: Sankey
---

Visualisasi **Sankey Diagram** adalah alat yang ampuh untuk memvisualisasikan aliran dan hubungan antar entitas dalam kumpulan data. Hal ini sangat berguna untuk menampilkan distribusi dan transformasi nilai di seluruh sistem atau proses.

## Struktur Data Diagram Sankey

Untuk merepresentasikan Diagram Sankey, Anda dapat menggunakan antarmuka `NodeLinkData` berikut:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Atribut Utama

- **nama:** Pengidentifikasi unik untuk node.
- **kategori:** Mengkategorikan node ke dalam grup atau klaster tertentu.
- **source:** Mengidentifikasi node sumber tautan.
- **target:** Mengidentifikasi simpul target tautan.
- **nilai:** Mewakili nilai numerik yang dikaitkan dengan tautan yang menunjukkan seberapa kuat keterhubungan simpul-simpul tersebut.

### Pro dan Kontra

#### Kelebihan
- **Representasi Aliran:** Secara efektif memvisualisasikan aliran nilai atau kuantitas antar entitas dalam sistem atau proses.

- **Wawasan tentang Distribusi:** Menawarkan wawasan tentang bagaimana nilai didistribusikan dan diubah di setiap tahap.

#### Kontra
- **Kompleksitas dengan Banyak Node:** Kekacauan visual dapat terjadi pada jumlah node yang banyak, sehingga memengaruhi keterbacaan.

- **Kasus Penggunaan Khusus:** Dirancang terutama untuk memvisualisasikan aliran dan distribusi; mungkin tidak cocok untuk semua jenis kumpulan data.

## Contoh Diagram Sankey

![Sankey Diagram Example](/Illustry-monorepo/sankey.gif)
