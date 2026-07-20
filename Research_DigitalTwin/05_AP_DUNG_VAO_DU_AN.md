# Áp dụng nghiên cứu vào dự án Digital Twin Smart City
## Vinhomes Ocean Park (Technopark, VinUni) + SVĐ Trống Đồng + SVĐ PVF

## 1. Hiện trạng dự án (SVF_Stadium_Smartcity)

- Pipeline hiện có: **Blender (script Python) → GLB → dashboard web IOC** (`scripts/blender/`, `scripts/generate-smartcity-glb.mjs`, `scripts/generate-stadium-glb.mjs`, `shared-ioc/` với scene-3d, chart, map).
- Đã có logic mô phỏng xe (car logic), dashboard realtime mockup, tài liệu BRD/SRS IOC.
- **Đối chiếu case study:** hướng web-first này trùng với xu hướng thế giới (client-side rendering chi phí thấp, truy cập rộng) — nên **giữ và củng cố**, không cần chuyển toàn bộ sang Unity/Unreal.

## 2. Ánh xạ case study thế giới → từng khu vực của dự án

| Khu vực | Case study tham chiếu | Áp dụng cụ thể |
|---|---|---|
| **Vinhomes Ocean Park** (toàn khu) | Punggol Digital District (Unity, Singapore); 51World Singapore | Twin cấp *khu đô thị* (không tham vọng toàn Hà Nội): tích hợp năng lượng, chiếu sáng, an ninh, thoát nước hồ nước ngọt/biển hồ nhân tạo; mô phỏng ngập úng như 51World làm cho Singapore. Mục tiêu đo được kiểu Punggol (VD: giảm % điện làm mát) |
| **Technopark** | Orlando Regional Digital Twin (Unity) | Twin làm **công cụ xúc tiến đầu tư**: nhà đầu tư/doanh nghiệp thuê văn phòng "bay" qua mô hình 3D, xếp lớp dữ liệu tiện ích, giao thông, dân cư. Đây là use case sinh giá trị thương mại sớm nhất |
| **VinUni** | NYU Abu Dhabi, RWTH Aachen, University of Florida | Twin campus làm **testbed nghiên cứu**: sensor nhiệt độ/CO₂/năng lượng → tô màu không gian 3D theo dữ liệu; hợp tác sinh viên VinUni làm đề tài (mô hình đại học × twin đã chuẩn hóa trên thế giới) |
| **SVĐ Trống Đồng** | SoFi Stadium × Willow; FIFA 2026 | Twin **vận hành sự kiện**: asset registry từ BIM, luồng khán giả, hàng chờ, chỉ đường nhân viên, mô phỏng sơ tán. Sự kiện ca nhạc/thể thao lớn cần matchday-ops twin |
| **SVĐ PVF** | SoFi (O&M) + Bernabéu (trải nghiệm) + hướng đào tạo | Ngoài vận hành: twin **học viện bóng đá** — phủ dữ liệu GPS/thống kê cầu thủ lên mô hình sân tập phục vụ huấn luyện; tour ảo tuyển sinh học viên kiểu Bernabéu |

## 3. Kiến trúc khuyến nghị (rút từ mẫu số chung các case study)

```
[Tầng 1 — Thu thập]   IoT sensor, camera, BIM/CAD, GIS, dữ liệu vận hành
        │  (MQTT / REST — chuẩn như RWTH Aachen, SoFi)
[Tầng 2 — Nền tảng dữ liệu]   Data platform + API; ánh xạ sensor-ID ↔ object-3D-ID
        │
[Tầng 3 — Hiển thị]   a) Web dashboard IOC (three.js/CesiumJS + GLB)  ← chủ lực
                      b) Bản showcase Unreal/Unity + Pixel Streaming  ← demo/marketing
                      c) (dài hạn) Omniverse/Metropolis cho camera AI sân vận động
```

Nguyên tắc rút ra từ nghiên cứu:
1. **Twin "sống" nhờ dữ liệu, không nhờ mô hình** — ưu tiên nối 1 nguồn dữ liệu thật (dù chỉ là điện năng 1 tòa nhà) hơn là làm đẹp thêm mô hình 3D.
2. **LOD phân tầng kiểu 51World**: dựng chi tiết thủ công các công trình biểu tượng (tháp Technopark, VinUni dome, 2 sân vận động), phần còn lại giữ khối đơn giản/sinh tự động từ GIS.
3. **Chuẩn hóa asset**: giữ glTF/GLB (đang đúng), thêm nén Draco + KTX2; khi mở rộng ra bản đồ lớn thì chuyển sang **3D Tiles** để tương thích đồng thời web + Unity + Unreal.
4. **Mô hình nhẹ vẫn đủ giá trị**: SoFi quản lý 288.000 m² trong 16 GB truy cập bằng iPad — không cần photorealistic để vận hành.

## 4. Lộ trình đề xuất (3 giai đoạn)

| Giai đoạn | Nội dung | Case study làm chuẩn |
|---|---|---|
| **GĐ1 (0–3 tháng)** | Củng cố web twin: chuẩn hóa GLB (Draco/KTX2), ánh xạ object-ID, nối 1–2 luồng dữ liệu thật qua MQTT/WebSocket (điện, đếm xe); hoàn thiện car logic thành mô phỏng giao thông có dữ liệu | Twin giao thông Unity (PMC); RWTH MQTT |
| **GĐ2 (3–9 tháng)** | Twin vận hành SVĐ Trống Đồng/PVF: nhập BIM → asset registry; kịch bản sơ tán, luồng khán giả; bản showcase Unreal (Cesium + Google 3D Tiles làm nền Hà Nội/Gia Lâm) phục vụ Technopark gọi đầu tư | SoFi × Willow; Orlando; 51World |
| **GĐ3 (9–18 tháng)** | Trải nghiệm & AI: tour ảo sân PVF (tuyển sinh), sự kiện tương tác kiểu Realmadrid Games tại Trống Đồng; thí điểm camera AI (đếm người, cảnh báo) theo mô hình Metropolis; hợp tác VinUni làm testbed nghiên cứu | Bernabéu; NVIDIA smart spaces; NYU AD |

## 5. Rủi ro & lưu ý

- **Pixel Streaming đắt theo phiên** — chỉ dùng cho demo/showroom, không thay dashboard IOC web.
- **Tránh khóa công nghệ (vendor lock-in):** mọi dữ liệu gốc giữ ở chuẩn mở (glTF, 3D Tiles, IFC cho BIM); engine chỉ là lớp hiển thị thay được.
- **Bắt đầu từ quy mô quận/khu** (bài học Punggol) — twin "toàn thành phố" ngay từ đầu là nguyên nhân thất bại phổ biến của các dự án twin đô thị Trung Quốc bị đánh giá là "smart gadget" thay vì công cụ ra quyết định.
- Việt Nam mới có ít twin đô thị thực thụ (chủ yếu twin nhà máy như Orion × VNTT) — dự án này có cơ hội **đi đầu trong nước** nếu tập trung vào giá trị vận hành đo được thay vì chỉ trình diễn 3D.

## Nguồn chính

Xem danh mục nguồn đầy đủ trong [01](01_CASE_STUDY_UNITY.md), [02](02_CASE_STUDY_UNREAL_OMNIVERSE.md), [03](03_DIGITAL_TWIN_SAN_VAN_DONG.md), [04](04_SO_SANH_CONG_NGHE.md); bổ sung bối cảnh Việt Nam:
- [VNTT — Xu hướng ứng dụng Digital Twin trên thế giới và Việt Nam](https://vntt.com.vn/xu-huong-ung-dung-digital-twin-tren-the-gioi-va-viet-nam/)
- [Bộ Xây dựng — Công nghệ bản sao số mở hướng phát triển đô thị thông minh](https://moc.gov.vn/tl/_layouts/15/NCS.Webpart.MOC/mt_poup/Intrangweb.aspx?IdNews=93939)
- [3DI — Digital Twin là gì? Công nghệ mô phỏng tương lai của đô thị](https://3di.vn/digital-twin-la-gi)
