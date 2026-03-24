---
title: Nắng bùng nổ
description: Tài liệu Sun Burst
---

Hình ảnh **Sun Burst Chart** là cách thể hiện năng động và hấp dẫn của dữ liệu phân cấp. Nó sử dụng bố cục xuyên tâm để truyền tải thứ bậc của các phần tử và mối quan hệ của chúng trong tập dữ liệu.


## Cấu trúc dữ liệu Sun Burst

Để thể hiện Dữ liệu bản đồ, bạn có thể sử dụng giao diện `HierarchyData` sau:

```typescript
{{HierarchyNode}}

{{HierarchyData}}
```
### Thuộc tính chính

- **tên:** Tên nút.
- **giá trị:** Một số đại diện cho một số liệu để xác định mức độ lớn của nút đó.
- **danh mục:** Mô tả danh mục hoặc loại mà nút thuộc về.
- **con:** Thuộc tính này là tùy chọn và đại diện cho một mảng đối tượng HierarchyNode. Nó biểu thị rằng nút có thể có các nút con, tạo ra cấu trúc phân cấp. Mỗi nút con tuân theo cùng một cấu trúc HierarchyNode, cho phép biểu diễn một hệ thống phân cấp giống như cây.

### Ưu và nhược điểm

#### Ưu điểm
- **Hiểu biết về thứ bậc:** Sunbursts vượt trội trong việc hiển thị cấu trúc dữ liệu có thứ bậc, cung cấp thứ bậc trực quan hỗ trợ việc hiểu mối quan hệ giữa các cấp độ khác nhau.

- **Bố cục xuyên tâm:** Bố cục xuyên tâm cung cấp cách trình bày có tổ chức và hấp dẫn về mặt trực quan của các cấu trúc phân cấp.

#### Nhược điểm
- **Có thể có sự lộn xộn:** Trong trường hợp có nhiều phân đoạn, biểu đồ có thể trở nên lộn xộn, ảnh hưởng đến khả năng đọc.

- **Giới hạn ở Dữ liệu phân cấp:** Sơ đồ cây hiệu quả nhất khi trực quan hóa dữ liệu phân cấp; đối với các tập dữ liệu không phân cấp, hình ảnh trực quan thay thế có thể phù hợp hơn.

## Ví dụ về vụ nổ mặt trời

![Sun Burst Example](/Illustry-monorepo/sun-burst.gif)
