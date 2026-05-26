**Tác giả:** Nguyễn Triệu Gia Khánh

# Kế hoạch triển khai — IOC Sân vận động PVF & IOC Smart City

**Dự án:** Vinsmartcity  
**Thời gian dự kiến:** 6 tuần (25/05 – 05/07/2026)  
**Thứ tự triển khai:** **PVF trước (tuần 1–3)** → **Smart City sau (tuần 4–6)**, khi PVF đã nghiệm thu  
**Trạng thái hiện tại:** Tuần 1 — khởi động giai đoạn PVF

> **Lưu ý quan trọng:** Hệ thống IOC Sân vận động PVF cần **tích hợp VOC (Venue Operations Centre)** theo **tiêu chuẩn vận hành sân của FIFA** — bảo đảm phòng điều hành venue đáp ứng yêu cầu giám sát an ninh, sự kiện, hạ tầng và dịch vụ khán giả trong ngày thi đấu. Giai đoạn 6 tuần tập trung **giao diện + prototype + bộ tài liệu sản phẩm chuẩn**; tích hợp VOC đầy đủ với hệ thống backend có thể mở rộng sau khi nghiệm thu giao diện.

---

## 1. Mục tiêu dự án (tóm tắt cho lãnh đạo)

Triển khai **hai hệ thống IOC** trên web theo thứ tự ưu tiên:

| Thứ tự | Hệ thống | Phục vụ ai | Trả lời câu hỏi gì |
|--------|----------|------------|-------------------|
| **1 — Làm trước** | **IOC Sân vận động PVF** | Ban vận hành sân / an ninh sự kiện | Trận đấu / sự kiện diễn ra thế nào? Khán giả, camera, hạ tầng sân có vấn đề gì? |
| **2 — Làm sau** | **IOC Smart City** | Ban quản lý đô thị / khu thông minh | Thành phố đang ổn không? Giao thông, an ninh, môi trường có sự cố gì? |

**Lý do ưu tiên PVF trước:** Nhu cầu vận hành sự kiện / trận đấu gấp hơn; hoàn thiện PVF trước (kèm chuẩn VOC–FIFA) giúp có mẫu vận hành venue, sau đó mở rộng sang phạm vi đô thị Smart City.

Cuối dự án, hai hệ thống **liên kết chéo** (chuyển một cú click trên header).

---

## 2. Giới thiệu Sân vận động PVF

> **Nguồn tham chiếu:** [VnExpress — *Các công nghệ độc đáo trong sân bóng lớn nhất Việt Nam*](https://vnexpress.net/cac-cong-nghe-doc-dao-trong-san-bong-lon-nhat-viet-nam-4953345.html) (20/10/2025). Các thông số và mô tả công nghệ có ký hiệu **†** được lấy từ **video nhúng trong bài báo** (và phần nội dung bài viết tương ứng).

### 2.1 Tổng quan công trình

**Sáng 19/10†**, sân vận động **PVF** chính thức **khởi công tại Hưng Yên†**, nằm trong **quần thể tổ hợp thể thao – dịch vụ rộng 920.000 m²†**. Riêng phần sân vận động PVF có **diện tích công trình trên 55.000 m²**, gồm **bốn khán đài chính** với **sức chứa 60.000 chỗ ngồi†**. Khi hoàn thành, đây sẽ là **công trình thể thao lớn nhất Việt Nam†** kể từ Khu liên hợp thể thao Quốc gia Mỹ Đình đưa vào hoạt động năm 2002†.

Ngoài sân chính, quần thể còn có **quảng trường và bãi đỗ xe rộng 18 ha†** (tương đương ~180.000 m² bãi đỗ theo bài báo), tạo không gian tiếp nhận khán giả và vận hành sự kiện quy mô lớn.

| Thông số | Giá trị | Nguồn |
|----------|---------|-------|
| Vị trí | Hưng Yên | † VnExpress (video) |
| Quy mô quần thể | 920.000 m² | † VnExpress (video) |
| Diện tích sân PVF | > 55.000 m² | — |
| Sức chứa | **60.000 chỗ ngồi** | † VnExpress (video) |
| Khán đài | 4 khán đài chính | — |
| Quảng trường & bãi đỗ | 18 ha (~180.000 m² bãi đỗ) | † VnExpress (video) |
| Khởi công | 19/10 | † VnExpress (video) |
| Vị thế | Sân lớn nhất VN (kể từ Mỹ Đình 2002) | † VnExpress (video) |

*Ghi chú: **†** = thông tin có trong [bài VnExpress](https://vnexpress.net/cac-cong-nghe-doc-dao-trong-san-bong-lon-nhat-viet-nam-4953345.html), dẫn chứng từ video nhúng trong bài. Các dòng không đánh dấu là thông số bổ sung ngoài nguồn này.*

### 2.2 Công nghệ nổi bật

Theo đơn vị thiết kế (theo bài VnExpress†), PVF áp dụng **công nghệ tiên tiến** tương đương các sân hàng đầu thế giới (tham chiếu **AT&T Stadium** — Mỹ, **Al-Bayt** — Qatar†):

| Hạng mục | Mô tả | Nguồn |
|----------|--------|-------|
| **Mái vòm đóng mở tự động** | Đóng hoặc mở hoàn toàn trong **12–20 phút†**; cấu trúc trượt trên ray bằng động cơ điện† | VnExpress (video) |
| **Màng PTFE xuyên sáng** | Nhẹ, chịu nhiệt cao, chống tia UV, giảm tiếng ồn mưa — vật liệu phổ biến cho mái vòm hiện đại† | VnExpress (video) |
| **Cảm biến & an toàn** | Giám sát độ lệch, tốc độ di chuyển mái; cơ chế **phanh khẩn cấp†** | VnExpress (video) |
| **Mặt cỏ modular hybrid** | Linh hoạt cho nhiều loại sự kiện / môn thi đấu† | VnExpress (video) |
| **Hệ thống kỹ thuật tích hợp thông minh** | BMS, chiếu sáng, HVAC, điều khiển mái — nối về VOC† | VnExpress (video) |

**Lợi ích vận hành mái vòm** *(theo mô tả trong video VnExpress†)*:

- **Trời xấu** (mưa, nắng gắt, gió mạnh): đóng mái — bảo vệ khán giả và mặt cỏ.
- **Trời đẹp**: mở mái — thông gió tự nhiên, trải nghiệm gần sân ngoài trời.
- Nâng **chất lượng chuyên môn trận đấu** và kéo dài tuổi thọ mặt sân.

### 2.3 Mô phỏng trên IOC PVF (prototype giai đoạn 6 tuần)

Trong giai đoạn prototype, IOC PVF sẽ **giả lập (mô phỏng) trạng thái đóng/mở mái vòm** — dùng dữ liệu demo, chưa điều khiển mái thật:

| Tính năng mô phỏng | Hiển thị trên IOC | Ghi chú |
|--------------------|-------------------|---------|
| Trạng thái mái | **Đang mở** / **Đang đóng** / **Đã đóng** / **Đã mở** | Thanh tiến trình 12–20 phút† (theo VnExpress, video trong bài) |
| Nút thao tác | Mở mái · Đóng mái · Dừng khẩn cấp | Demo luồng vận hành VOC |
| Chỉ số kỹ thuật | Tốc độ trượt, % hoàn thành, cảnh báo gió | Tab **Cơ sở hạ tầng** |
| Tổng hợp | Icon trạng thái mái trên **Tổng quan** | Nhìn một chỗ trước trận |

> **Lưu ý:** Đây là **mô phỏng giao diện** phục vụ demo và nghiệm thu BRD/SRS. Điều khiển mái thật sẽ nối qua hệ BMS / SCADA ở giai đoạn tích hợp sau.

### 2.4 Liên hệ PVF ↔ IOC ↔ VOC–FIFA

```
Sân vận động PVF (vật lý)
  ├── Mái vòm · cỏ · HVAC · điện · camera
  └── Hệ thống kỹ thuật tích hợp
           │
           ▼
    VOC (Venue Operations Centre) — chuẩn FIFA
           │
           ▼
    IOC PVF (giao diện web — prototype)
      Tổng quan · An ninh · Sự kiện · Hạ tầng · Dịch vụ · Báo cáo
```

IOC PVF là **lớp hiển thị và điều phối** giúp đội vận hành venue theo dõi sức chứa **60.000 khán giả**, trạng thái mái vòm, an ninh và hạ tầng trong ngày thi đấu.

---

## 3. Chuẩn sản phẩm & bộ tài liệu phát triển

Dự án tuân thủ quy trình phát triển sản phẩm chuẩn — mỗi giai đoạn có tài liệu rõ ràng để cấp trên và các bên liên quan theo dõi, nghiệm thu.

### 3.1 Bộ tài liệu theo loại

| Loại tài liệu | Viết tắt | Mục đích | Đối tượng đọc |
|---------------|----------|----------|---------------|
| **Business Requirements Document** | **BRD** | Mục tiêu kinh doanh, phạm vi, stakeholder, KPI vận hành | Ban lãnh đạo, product owner |
| **Software Requirements Specification** | **SRS** | Yêu cầu chức năng / phi chức năng chi tiết, use case | BA, dev, QA |
| **Tài liệu kiến trúc** | **Architecture** | Cấu trúc hệ thống, module, luồng dữ liệu, tích hợp VOC | Kỹ thuật, kiến trúc sư |
| **Mockup** | — | Giao diện tĩnh — bố cục, màu, nội dung tab | Thiết kế, lãnh đạo duyệt UI |
| **Prototype** | — | Giao diện tương tác — click, chuyển tab, demo luồng | UAT, demo stakeholder |
| **Nghiên cứu UI** | — | Căn cứ thiết kế, pattern, so sánh hai IOC | Thiết kế, product |

### 3.2 Tài liệu trong repo & lộ trình soạn thảo

| Tài liệu | Trạng thái / vị trí | Hoàn thiện dự kiến |
|----------|---------------------|-------------------|
| Mockup Smart City (Tổng quan, Giao thông) | ✅ `ioc_smartcity_homepage_mockup.html`, `ioc_realtime_dashboard.html` | Có sẵn |
| Prototype PVF | ✅ `stadium-ioc/` | Tuần 1–3 (tin chỉnh) |
| Prototype Smart City | ✅ `smartcity-ioc/` | Tuần 4–6 |
| Nghiên cứu & thiết kế UI | ✅ `NguyenTrieuGiaKhanh_RESEARCH.md` | Cập nhật liên tục |
| Kế hoạch triển khai | ✅ Tài liệu này | — |
| **Kế hoạch 6 tuần (Excel — báo cáo lãnh đạo)** | ✅ `NguyenTrieuGiaKhanh_KeHoach_6Tuan_IOC.xlsx` | — |
| **BRD** (PVF + Smart City) | 📝 Soạn / cập nhật | Tuần 1 (PVF), tuần 4 (Smart City) |
| **SRS** (PVF + Smart City) | 📝 Soạn / cập nhật | Tuần 1–2 (PVF), tuần 4–5 (Smart City) |
| **Tài liệu kiến trúc** (dual IOC + VOC) | 📝 Soạn / cập nhật | Tuần 2 (PVF), tuần 5 (Smart City) |
| Báo cáo tiến độ | ✅ `Vinsmartcity_BaoCao_TienDo_IOC.xlsx` | Hàng tuần |
| Biên bản nghiệm thu (UAT) | 📝 | Tuần 3 (PVF), tuần 6 (tổng) |

### 3.3 Tích hợp VOC theo chuẩn FIFA (PVF)

**VOC (Venue Operations Centre)** là mô hình trung tâm điều hành sân trong ngày sự kiện, được FIFA khuyến nghị cho các sân tổ chức thi đấu quy mô lớn. IOC PVF trong dự án này **định hướng tương thích VOC**, gồm:

| Nhóm năng lực VOC | Ánh xạ trên giao diện PVF |
|-------------------|---------------------------|
| Giám sát an ninh & đám đông | Tab **An ninh** — camera, sơ đồ sân, mật độ khán giả |
| Vận hành sự kiện / trận đấu | Tab **Sự kiện** — timeline, trạng thái trận |
| Hạ tầng kỹ thuật sân | Tab **Cơ sở hạ tầng** — điện, HVAC, **mô phỏng mái vòm** |
| Dịch vụ khán giả | Tab **Dịch vụ** — F&B, bãi xe, VIP |
| Báo cáo & tổng hợp | Tab **Tổng quan**, **Báo cáo** — KPI, KPI theo trận |

**Trong 6 tuần:** BRD/SRS ghi rõ yêu cầu VOC–FIFA; prototype PVF minh họa luồng vận hành; tài liệu kiến trúc mô tả điểm tích hợp VOC (camera, BMS, ticketing…) cho giai đoạn nối hệ thống sau.

---

## 4. Tổng quan 6 tuần

```
┌─────────────────────────────────────────────────────────────┐
│  GIAI ĐOẠN 1 — PVF (Tuần 1 → 3)     │  Nghiệm thu PVF      │
│  BRD · SRS · Kiến trúc · VOC–FIFA   │  + bộ tài liệu PVF    │
├─────────────────────────────────────┼───────────────────────┤
│  GIAI ĐOẠN 2 — Smart City (4 → 6)  │  Nghiệm thu tổng thể  │
│  BRD · SRS · Prototype · Mockup     │  + bàn giao full pack │
└─────────────────────────────────────┴───────────────────────┘
```

| Giai đoạn | Tuần | Thời gian | Trọng tâm |
|-----------|------|-----------|-----------|
| **PVF** | 1 | 25/05 – 31/05 | Kickoff; BRD/SRS PVF; mockup/prototype 6 tab; căn VOC–FIFA |
| **PVF** | 2 | 01/06 – 07/06 | Tài liệu kiến trúc; chỉnh prototype; kiểm thử phòng điều hành |
| **PVF** | 3 | 08/06 – 14/06 | **Nghiệm thu PVF** + bàn giao tài liệu PVF |
| **Smart City** | 4 | 15/06 – 21/06 | BRD/SRS Smart City; An ninh & Giao thông 3D |
| **Smart City** | 5 | 22/06 – 28/06 | 4 tab còn lại; kiến trúc tổng; liên kết PVF |
| **Smart City** | 6 | 29/06 – 05/07 | **Nghiệm thu tổng** + bàn giao full bộ tài liệu |

---

## 5. Giai đoạn 1 — IOC Sân vận động PVF (Tuần 1–3)

### 5.1 Phạm vi 6 tab PVF

| STT | Tab | Nội dung chính | Liên quan VOC |
|-----|----------|----------------|---------------|
| 1 | Tổng quan | Trạng thái sân, **60.000 chỗ**, sự kiện đang diễn ra, **icon mái vòm** | Dashboard VOC tổng |
| 2 | An ninh | Video camera + sơ đồ sân, mật độ khán giả | Safety & security |
| 3 | Sự kiện | Lịch trình, timeline trận đấu | Event operations |
| 4 | Cơ sở hạ tầng | Điện, điều hòa; **mô phỏng đóng/mở mái vòm** | Technical operations + mái |
| 5 | Dịch vụ | F&B, bãi xe, khu VIP | Spectator services |
| 6 | Báo cáo | KPI vận hành theo trận / sự kiện | Reporting |

### 5.2 Kế hoạch từng tuần — PVF

| Tuần | Việc làm | Sản phẩm tuần |
|------|----------|---------------|
| **1** | Kickoff PVF; soạn **BRD/SRS** (ghi rõ 60.000 chỗ, mái vòm); căn **VOC–FIFA**; branding PVF; prototype 6 tab | BRD/SRS bản 1 + prototype xem trước |
| **2** | **Mô phỏng đóng/mở mái vòm** trên tab Cơ sở hạ tầng; tài liệu kiến trúc; kiểm thử phòng điều hành | Giả lập mái + kiến trúc bản 1 |
| **3** | UAT PVF; cập nhật tài liệu; ký checklist; **bàn giao gói PVF** | **PVF + bộ tài liệu hoàn thành** |

### 5.3 Tiêu chí xong giai đoạn PVF (cuối tuần 3)

- 6 tab PVF (prototype) hoạt động ổn định.
- **Mô phỏng đóng/mở mái vòm** hoạt động trên prototype (dữ liệu demo).
- Bộ tài liệu **BRD, SRS, Kiến trúc** PVF (60.000 chỗ, mái vòm, VOC–FIFA) đã duyệt.
- Ban vận hành sân **ký nghiệm thu** checklist PVF.

---

## 6. Giai đoạn 2 — IOC Smart City (Tuần 4–6)

*Bắt đầu sau khi PVF đã nghiệm thu tuần 3.*

### 6.1 Phạm vi 6 tab Smart City

| STT | Tab | Nội dung chính |
|-----|----------|----------------|
| 1 | Tổng quan | Chỉ số tổng thể, cổng vào các phân hệ (gồm link về PVF) |
| 2 | Giao thông | Bản đồ ngã tư 3D + bảng điều khiển hai bên |
| 3 | An ninh | Mô hình khu đô thị 3D + camera, cảnh báo |
| 4 | Môi trường | Chất lượng không khí, trạm đo, biểu đồ |
| 5 | Tiện ích | Điện, nước, chiếu sáng |
| 6 | Báo cáo | Bảng số liệu, biểu đồ tổng hợp |

### 6.2 Kế hoạch từng tuần — Smart City

| Tuần | Việc làm | Sản phẩm tuần |
|------|----------|---------------|
| **4** | Soạn **BRD/SRS** Smart City; hoàn thiện prototype **An ninh & Giao thông** 3D; tham chiếu mockup nguồn | BRD/SRS SC bản 1 + 2 tab cốt lõi |
| **5** | Hoàn thiện 4 tab còn lại; **tài liệu kiến trúc** dual IOC; liên kết Smart City ↔ PVF | Kiến trúc tổng + 6 tab SC |
| **6** | UAT Smart City; hoàn thiện toàn bộ tài liệu; bàn giao **full pack** | **Dự án hoàn thành** |

### 6.3 Tiêu chí xong giai đoạn Smart City (cuối tuần 6)

- 6 tab Smart City (prototype) hoàn chỉnh.
- Liên kết **Smart City ↔ PVF** hoạt động ổn định.
- Bộ tài liệu **BRD, SRS, Kiến trúc** Smart City + nghiên cứu UI đã cập nhật.
- Ban quản lý đô thị **ký nghiệm thu** + buổi demo / training tổng kết.

---

## 7. Sản phẩm bàn giao cuối dự án (tuần 6)

### 7.1 Giao diện & prototype

| # | Sản phẩm | Thời điểm |
|---|----------|-----------|
| 1 | Mockup nguồn Smart City (HTML tĩnh) | Có sẵn |
| 2 | **Prototype PVF** — `stadium-ioc/` (6 tab + **mô phỏng mái vòm**) | Tuần 3 |
| 3 | **Prototype Smart City** — `smartcity-ioc/` (6 tab, tương tác) | Tuần 6 |
| 4 | Liên kết hai IOC trên header | Tuần 5–6 |

### 7.2 Tài liệu sản phẩm chuẩn

| # | Tài liệu | Phạm vi | Thời điểm |
|---|----------|---------|-----------|
| 1 | **BRD** | PVF (VOC–FIFA) | Tuần 3 |
| 2 | **BRD** | Smart City | Tuần 6 |
| 3 | **SRS** | PVF + Smart City | Tuần 3 / 6 |
| 4 | **Tài liệu kiến trúc** | Dual IOC, tích hợp VOC | Tuần 3 / 6 |
| 5 | **Nghiên cứu thiết kế UI** | `NguyenTrieuGiaKhanh_RESEARCH.md` | Liên tục |
| 6 | **Kế hoạch triển khai** | Tài liệu này | — |
| 7 | Báo cáo tiến độ | `Vinsmartcity_BaoCao_TienDo_IOC.xlsx` | Hàng tuần |
| 8 | Hướng dẫn vận hành + biên bản UAT | PVF & tổng dự án | Tuần 3 / 6 |

---

## 8. Yêu cầu phối hợp từ ban lãnh đạo

| Hạng mục | Cần làm gì | Thời điểm |
|----------|------------|-----------|
| **Xác nhận ưu tiên PVF & VOC–FIFA** | Đồng ý phạm vi VOC trên 6 tab PVF | Tuần 1 |
| **Duyệt BRD/SRS** | Phê duyệt phạm vi trước khi nghiệm thu | Tuần 2–3 (PVF), tuần 5–6 (SC) |
| **Đại diện nghiệm thu PVF** | 1 người vận hành sân — UAT tuần 3 | Tuần 3 |
| **Đại diện nghiệm thu Smart City** | 1–2 người ban quản lý đô thị — UAT tuần 6 | Tuần 6 |
| **Phản hồi định kỳ** | Xem demo + mockup/prototype cuối tuần | Hàng tuần |
| **Môi trường demo** | Màn hình phòng điều hành / VOC | Tuần 2 trở đi |

---

## 9. Rủi ro & giải pháp

| Rủi ro | Cách xử lý |
|--------|------------|
| PVF chưa nghiệm thu kịp tuần 3 | Smart City **chỉ bắt đầu tuần 4** khi PVF đã ký duyệt |
| Yêu cầu VOC–FIFA chưa thống nhất sớm | Rà soát BRD tuần 1; chốt phạm vi trước tuần 2 |
| Chưa có dữ liệu / API hệ thống thật | 6 tuần: mockup + prototype + tài liệu; tích hợp VOC thật ở giai đoạn sau |
| Thay đổi yêu cầu giữa chừng | Cập nhật BRD/SRS; điều chỉnh lộ trình tuần kế |
| Tab 3D Smart City nặng máy cũ | Tối ưu tuần 5–6 |

---

## 10. Tài liệu liên quan (trong repo)

### 10.1 Nguồn ngoài (PVF)

| Nguồn | Loại | Nội dung | Ghi chú |
|-------|------|----------|---------|
| [VnExpress — *Các công nghệ độc đáo trong sân bóng lớn nhất Việt Nam*](https://vnexpress.net/cac-cong-nghe-doc-dao-trong-san-bong-lon-nhat-viet-nam-4953345.html) | Bài báo + video | Thông số sân PVF, công nghệ mái vòm, cỏ hybrid, quy mô 60.000 chỗ | Dẫn chứng hình ảnh & mô tả công nghệ lấy từ **video nhúng trong bài** (mục 2) |

### 10.2 Tài liệu trong repo

| Tài liệu | Loại | Nội dung |
|----------|------|----------|
| `NguyenTrieuGiaKhanh_RESEARCH.md` | Nghiên cứu UI | Thiết kế giao diện Smart City & PVF |
| `NguyenTrieuGiaKhanh_KE_HOACH_TRIEN_KHAI.md` | Kế hoạch | Tài liệu này |
| `ioc_smartcity_homepage_mockup.html` | Mockup | Tổng quan Smart City |
| `ioc_realtime_dashboard.html` | Mockup | Giao thông (nguồn thiết kế) |
| `stadium-ioc/` | Prototype | IOC Sân vận động PVF |
| `smartcity-ioc/` | Prototype | IOC Smart City |
| `Vinsmartcity_BaoCao_TienDo_IOC.xlsx` | Tiến độ | Báo cáo hàng tuần |
| BRD / SRS / Kiến trúc | 📝 Chuẩn sản phẩm | Soạn theo lộ trình mục 3.2 |

**Demo:**  
- PVF: `http://localhost:3457/stadium-ioc/`  
- Smart City: `http://localhost:3457/smartcity-ioc/` (từ tuần 4)

**Người phụ trách:** Nguyễn Triệu Gia Khánh  
**Cập nhật lần cuối:** 25/05/2026
