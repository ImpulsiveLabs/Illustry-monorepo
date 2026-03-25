---
title: Vẽ Đồ thị Phân tán
description: Phân tán Tiến sĩ
---

Bộ đồ thị **Một công cụ mạnh mẽ để hình dung mối quan hệ giữa hai biến số. Nó sử dụng các điểm trên một chiếc máy bay Cartesian để đại diện cho các điểm dữ liệu cá nhân, làm cho nó dễ dàng để xác định các mẫu hình, tương quan và xa hơn.


## Cấu trúc dữ liệu đồ thị rải rác

▫ bi Jinu diễn diễn, b longn cón s Thụy Điển dụng gao di Ahn'Scatterdata' sau:

```typescript
{{ScatterPoint}}

{{ScatterData}}
```

### Thuộc tính chính

- ** Giá trị:** Một dãy của hai giá trị số [x, y], đại diện cho tọa độ của một điểm dữ liệu trên trục X và Y.
- ** Giá trị:** Một chuỗi chỉ ra loại hoặc nhóm mà điểm dữ liệu thuộc về.


### Pros và Cons

#### Ưu điểm
- ** Nhận dạng sự tương quan:** Sự phân tán tạo ra những điểm nổi bật trong việc tiết lộ những mối quan hệ, mẫu hình và xu hướng giữa hai biến số.

- ** Phát hiện ra ngoài:** Những điểm ngoại lệ, hoặc những điểm dữ liệu đi lệch khỏi quy tắc, dễ dàng được nhận diện trên một vùng phân tán.

#### Con

- ** Sự giám sát thực dụng:** Trong những trường hợp có nhiều điểm dữ liệu, việc khám phá có thể xảy ra, ảnh hưởng đến tầm nhìn của từng điểm.

## Ví dụ đồ thị Phân tán

![Scatter Plot Example](/Illustry-monorepo/scatter.gif)