# Case study Digital Twin xây dựng bằng Unreal Engine & NVIDIA Omniverse

## 1. 51World — Digital twin toàn thành phố Thượng Hải (Unreal Engine)

- **Quy mô:** Bản sao số toàn bộ Thượng Hải — **3.750 km²**; hơn 20 công trình biểu tượng (Oriental Pearl, Shanghai Tower) được dựng thủ công chi tiết, phần còn lại sinh tự động từ dữ liệu **vệ tinh, drone và cảm biến**.
- **Công ty:** 51World (Trung Quốc, thành lập 2015) — nhà cung cấp engine digital twin đô thị lớn nhất Trung Quốc, một trong những đơn vị đầu tiên dùng Unreal cho dịch vụ twin thành phố.
- **Triển khai tại Singapore:** twin tích hợp tòa nhà, giao thông, công viên, thoát nước; vận hành viên giám sát giao thông, bảo trì cầu, và **mô phỏng lũ lụt** phục vụ phòng chống thiên tai.
- **Bài học:**
  - Chiến lược "**LOD phân tầng**": chỉ model thủ công công trình biểu tượng, còn lại sinh tự động (procedural) từ GIS — tiết kiệm chi phí quyết định tính khả thi.
  - Twin không chỉ để xem: giá trị nằm ở **mô phỏng kịch bản** (ngập lụt, sự cố, giao thông).

## 2. Cesium for Unreal / Unity — hạ tầng địa không gian chuẩn mở

- **Cesium 3D Tiles** là chuẩn OGC cho phép stream dữ liệu địa không gian quy mô hành tinh (photogrammetry, LiDAR, BIM/CAD) vào CesiumJS (web), Unreal, Unity, Omniverse và deck.gl.
- **Google Photorealistic 3D Tiles** (qua Cesium ion): mô hình 3D thực tế của **2.500+ thành phố tại 49 quốc gia** — có thể dùng làm nền địa hình/đô thị xung quanh mà không phải tự dựng.
- Từ 2026 hệ sinh thái Cesium hỗ trợ thêm **3D Gaussian Splats với LOD phân cấp** — hướng mới để đưa scan thực tế độ chân thực cao lên web.
- **Bài học:** Chuẩn hóa tài sản 3D theo 3D Tiles ngay từ đầu ⇒ cùng một dữ liệu chạy được trên cả web dashboard lẫn bản Unreal/Unity showcase.

## 3. Nghiên cứu xây dựng & campus dùng Unreal

| Dự án | Nội dung | Điểm rút ra |
|---|---|---|
| RWTH Aachen — Construction Site Twin | Unreal + **MQTT** đồng bộ dữ liệu 2 chiều công trường ↔ twin, phục vụ đào tạo | MQTT là giao thức chuẩn de-facto nối IoT vào engine 3D |
| NYU Abu Dhabi — Office/Campus Twin | Unreal hiển thị phân vùng màu theo **nhiệt độ/chất lượng không khí** từ sensor, kèm dashboard | Pattern "tô màu không gian theo dữ liệu sensor" đơn giản mà giá trị cao |
| Construction Digital Twins (MDPI Buildings, 2024) | Twin an toàn lao động + giám sát tiến độ trên Unreal | Twin công trường hữu ích ngay trong *giai đoạn xây dựng*, trước khi vận hành |
| University of Florida | Hợp tác Unreal, Autodesk, Siemens, NVIDIA — BIM → twin nghiên cứu | Đại học là môi trường thử nghiệm twin lý tưởng (tương tự VinUni) |

## 4. NVIDIA Omniverse — mô phỏng quy mô lớn và AI

- **Định vị:** Không phải game engine mà là **nền tảng cộng tác + mô phỏng vật lý** trên chuẩn OpenUSD; mạnh nhất khi cần mô phỏng chính xác (nhiệt, luồng khí, robot, giao thông) và huấn luyện AI (kết hợp Metropolis cho video analytics).
- **Case study:** **SNCF Gares&Connexions** (Pháp) — twin cho mạng lưới **3.000 nhà ga**: giám sát vận hành thời gian thực, mô phỏng ứng cứu khẩn cấp, lập kế hoạch nâng cấp hạ tầng. NVIDIA cũng có Omniverse Blueprint riêng cho smart city AI (kết hợp digital twin + AI agent + phân tích video), áp dụng từ đường phố, sân bay đến **sân vận động**.
- **Bài học:** Khi dự án cần camera AI (đếm người, phát hiện sự cố trong sân vận động), mô hình tham chiếu là Metropolis + twin; tuy nhiên chi phí hạ tầng GPU cao — chỉ nên đưa vào lộ trình dài hạn.

## Nguồn

- [Unreal Engine Spotlight — 51World creates digital twin of Shanghai](https://www.unrealengine.com/en-US/spotlights/51world-creates-digital-twin-of-the-entire-city-of-shanghai)
- [Geoawesome — Urban Digital Twins in China](https://geoawesome.com/urban-digital-twins-in-china-a-smart-gadget-or-a-decision-support-tool/)
- [Incredibuild — 51World case study](https://www.incredibuild.com/case-studies/51world)
- [Cesium — Smart Cities](https://cesium.com/industries/smart-cities/)
- [Cesium — Photorealistic 3D Tiles for Unity](https://cesium.com/learn/unity/unity-photorealistic-3d-tiles/) / [for Unreal](https://cesium.com/learn/unreal/unreal-photorealistic-3d-tiles/)
- [Cesium — Photorealistic 3D Tiles in Cesium ion](https://cesium.com/blog/2023/10/26/photorealistic-3d-tiles-in-cesium-ion/)
- [Cesium — 3D Gaussian Splats with hierarchical LOD](https://cesium.com/blog/2026/04/27/3d-gaussian-splats-lod/)
- [MDPI Buildings — Construction Digital Twins using Unreal](https://www.mdpi.com/2075-5309/14/7/2216)
- [Springer — Digital twins as education support in construction (RWTH Aachen)](https://link.springer.com/article/10.1007/s41693-022-00070-7)
- [NVIDIA — Smart Cities and Spaces](https://www.nvidia.com/en-us/industries/smart-cities-and-spaces/)
- [NVIDIA Blog — Omniverse Blueprint for smart city AI (SNCF)](https://blogs.nvidia.com/blog/smart-city-ai-blueprint-europe/)
