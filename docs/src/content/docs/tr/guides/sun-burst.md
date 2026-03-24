---
title: Güneş Patlaması
description: Güneş Patlaması belgesi
---

**Güneş Patlaması Grafiği** görselleştirmesi hiyerarşik verilerin dinamik ve ilgi çekici bir temsilidir. Bir veri kümesi içindeki öğelerin hiyerarşisini ve bunların ilişkilerini iletmek için radyal bir düzen kullanır.


## Güneş Patlaması Veri Yapısı

Bir Harita Verisini temsil etmek için aşağıdaki `HierarchyData` arayüzünü kullanabilirsiniz:

```typescript
{{HierarchyNode}}

{{HierarchyData}}
```
### Anahtar Nitelikler

- **ad:** Düğüm adı.
- **değer:** Bu düğümün ne kadar büyük olduğunu belirleyen bir ölçümü temsil eden sayı.
- **kategori:** Düğümün ait olduğu kategoriyi veya türü açıklar.
- **children:** Bu özellik isteğe bağlıdır ve HierarchyNode nesnelerinin bir dizisini temsil eder. Düğümün alt düğümlere sahip olabileceğini ve hiyerarşik bir yapı oluşturabileceğini belirtir. Her alt düğüm aynı HierarchyNode yapısını takip ederek ağaç benzeri bir hiyerarşinin temsiline olanak tanır.

### Artıları ve Eksileri

#### Artıları
- **Hiyerarşik Anlama:** Güneş patlamaları hiyerarşik veri yapılarını görüntülemede üstündür ve farklı düzeyler arasındaki ilişkilerin anlaşılmasına yardımcı olan görsel bir hiyerarşi sağlar.

- **Radyal Düzen:** Radyal düzen, hiyerarşik yapıların görsel olarak çekici ve düzenli bir temsilini sağlar.

#### Eksileri
- **Potansiyel Dağınıklık:** Çok sayıda segmentin olduğu durumlarda grafik karmaşık hale gelebilir ve okunabilirliği etkileyebilir.

- **Hiyerarşik Verilerle Sınırlıdır:** Ağaç haritaları hiyerarşik verileri görselleştirirken en etkilidir; hiyerarşik olmayan veri kümeleri için alternatif görselleştirmeler daha uygun olabilir.

## Güneş Patlaması Örneği

![Sun Burst Example](/Illustry-monorepo/sun-burst.gif)
