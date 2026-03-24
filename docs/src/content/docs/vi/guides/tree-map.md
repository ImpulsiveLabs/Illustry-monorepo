---
title: Bản đồ cây
description: Tài liệu bản đồ cây
---

Trực quan hóa **Bản đồ cây** là một cách trình bày dữ liệu động và có thứ bậc nhằm cung cấp cái nhìn tổng quan rõ ràng về các cấu trúc phức tạp. Bằng cách sử dụng các hình chữ nhật lồng nhau, Treemap trực quan hóa một cách hiệu quả các mối quan hệ dữ liệu phân cấp, khiến nó trở thành một công cụ vô giá để truyền tải cả toàn bộ và các phần trong tập dữ liệu.

## Cấu trúc dữ liệu bản đồ cây

Để biểu thị Dữ liệu bản đồ cây, bạn có thể sử dụng giao diện `HierarchyData` sau:

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
- **Hiểu biết về thứ bậc:** Sơ đồ cây vượt trội trong việc hiển thị cấu trúc dữ liệu có thứ bậc, cung cấp thứ bậc trực quan giúp hiểu được mối quan hệ giữa các cấp độ khác nhau.

- **Biểu diễn theo tỷ lệ:** Định cỡ theo tỷ lệ của hình chữ nhật cho phép biểu diễn trực quan các giá trị hoặc kích thước tương đối của các danh mục dữ liệu khác nhau.

- **Hiệu quả về không gian:** Sơ đồ cây sử dụng không gian một cách hiệu quả, cho phép người dùng trực quan hóa các tập dữ liệu lớn mà không làm lộn xộn màn hình.

- **Xác định nhanh các mẫu:** Người dùng có thể nhanh chóng xác định các mẫu, ngoại lệ và nồng độ trong tập dữ liệu thông qua việc sắp xếp trực quan các hình chữ nhật.

#### Nhược điểm
- **Sự phức tạp với các Nhãn chồng chéo:** Trong trường hợp các nhãn trùng nhau, đặc biệt là trong các Sơ đồ cây có mật độ dân cư đông đúc, khả năng đọc có thể là một thách thức.

- **Khó khăn về độ chính xác:** Mặc dù Sơ đồ cây cung cấp cái nhìn tổng quan nhưng việc đạt được sự so sánh chính xác giữa các điểm dữ liệu riêng lẻ có thể là một thách thức do tính chất phân cấp.

- **Giới hạn ở Dữ liệu phân cấp:** Sơ đồ cây hiệu quả nhất khi trực quan hóa dữ liệu phân cấp; đối với các tập dữ liệu không phân cấp, hình ảnh trực quan thay thế có thể phù hợp hơn.

## Ví dụ về bản đồ cây

![Tree Map Example](/Illustry-monorepo/tree-map.gif)
