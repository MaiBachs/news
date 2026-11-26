# Radar

Web cá nhân theo dõi tin tại Quốc tế, Trung Quốc và Việt Nam, tìm ngách nghề tay trái và lưu tài liệu về mô hình kiếm tiền. Bộ khung dùng React, Node.js 24, Express, TypeScript và SQLite.

## Phát triển tại máy

Cần Node.js 24 LTS và npm. Chạy từ thư mục dự án. Tạo `.env` từ `.env.example` nếu muốn chỉnh cổng hoặc cấu hình AI.

```sh
npm ci
npm run dev
```

Mở [Radar trên cổng 5173](http://127.0.0.1:5173). Vite chuyển `/api` đến Node.js trên cổng `8080` mặc định. SQLite tạo `data/radar.sqlite` ở lần chạy đầu. Có thể đổi đường dẫn bằng `RADAR_DB_PATH`.

```sh
npm run build
npm test
npm start
```

`npm start` phục vụ cả web đã build và API tại [cổng 8080](http://127.0.0.1:8080). API có `GET /api/health` để kiểm tra tiến trình.

Để quét SonarQube, đặt `SONAR_HOST_URL` và `SONAR_TOKEN` trong môi trường chạy scanner. Phạm vi quét nằm trong `sonar-project.properties`.

```sh
npx @sonar/scan -Dsonar.qualitygate.wait=true
```

## Chạy bằng Docker Compose

Chạy từ thư mục dự án.

```sh
docker compose up -d --build
docker compose logs -f radar
```

Compose mở cổng ở `127.0.0.1` của máy chạy container. Khi chạy Radar trên VPS, có thể truy cập từ xa qua SSH port forwarding. SQLite nằm trong volume `radar-data`. Khi sao lưu trực tiếp file SQLite, dừng container trước khi sao chép.

## Chọn cấu hình AI

Đặt `RADAR_AI_PROFILE` trong `.env`, rồi khởi động lại Radar. Nếu chạy Docker Compose, dùng `docker compose up -d` để áp dụng biến môi trường mới.

| `RADAR_AI_PROFILE` | Lọc và xử lý tin sau khi thu thập | Tổng hợp kết luận và dự báo |
| --- | --- | --- |
| `codex` | GPT-6 Luna (`gpt-6-luna`) | GPT-6 Sol (`gpt-6-sol`) |
| `claude` (mặc định) | Claude Sonnet 5.5 (`claude-sonnet-5-5`) | Claude Opus 5.5 (`claude-opus-5-5`) |

Có thể đổi từng model bằng các biến `RADAR_CODEX_CRAWL_MODEL`, `RADAR_CODEX_ANALYSIS_MODEL`, `RADAR_CLAUDE_CRAWL_MODEL` và `RADAR_CLAUDE_ANALYSIS_MODEL` trong `.env.example`. Radar đọc cấu hình khi khởi động.

Để thử OpenAI, đặt `RADAR_AI_PROFILE=codex` và `OPENAI_API_KEY` trong `.env` trên máy chạy Radar. Sau khi khởi động lại, mở **Quản trị → Kết nối AI → Kiểm tra kết nối OpenAI**. Nút này dùng model xử lý tin để gửi một yêu cầu thử ngắn qua Responses API. Cấu hình model dành cho các bước dịch, tóm tắt và dự báo tự động trong lộ trình. Bộ thu RSS hiện đọc trực tiếp từ nguồn.

## Bộ khung hiện tại

- Mở thẳng vào Bản tin sáng và điều hướng năm menu trên desktop, điện thoại.
- Quản trị nguồn cho phép thêm URL RSS/Atom, chọn thị trường và mục dùng, xem danh sách, bật/tắt và báo feed trùng trong cùng một mục.
- Bản tin sáng hiển thị bản tổng hợp thủ công mới nhất và nhóm bài nguồn theo chủ đề. Kho tin nhóm các bài từ bản tin và RSS/Atom theo cùng chủ đề, có bộ lọc thị trường và tìm kiếm. Công việc phụ có ngách trái ngành cho cá nhân hoặc nhóm nhỏ và phần tiềm năng tương lai có xếp hạng ngành, ngách cùng nguồn đối chiếu. Thư viện có tài liệu chọn lọc, case study và cập nhật RSS/Atom.
- Đọc [thiết kế nền tảng](DESIGN.md) và [quy ước code](AGENTS.md) trước khi mở rộng tính năng.

## Thu thập RSS/Atom

Build rồi chạy `npm run collect -- --seed` để đăng ký các feed trong `scripts/starter-feeds.json` và thu thập. Các lần sau chạy `npm run collect` để chỉ đọc những nguồn đang bật trong Quản trị. Có thể chạy `docker compose exec radar npm run collect` trên Compose.

Radar kiểm tra `robots.txt`, giãn cách ít nhất một giây giữa các yêu cầu cùng nguồn và báo lỗi theo từng feed. Một lần chạy thường chọn tối đa 12 tin và 4 tài liệu mỗi nguồn. Radar lưu tiêu đề, link gốc và một đoạn trích tối đa 180 ký tự. Chạy lại giữ một mục cho mỗi URL. Bản tin sáng và bảng phân tích công việc tiềm năng cập nhật bằng luồng biên tập riêng. Lệnh này chưa lên lịch 06:00 và không gọi API AI.

Dùng `npm run collect -- --seed --backfill` để thu thập bổ sung từ các feed đã xác minh, tối đa 100 tin và 80 tài liệu mỗi nguồn. Chế độ này chọn tin có ngày đăng trong 180 ngày gần nhất, yêu cầu trích đoạn tối thiểu 30 ký tự và loại nội dung gắn nhãn quảng cáo rõ ràng. Thư viện có thể giữ tài liệu hướng dẫn cũ còn hữu ích.

Riêng **Thư viện → Cộng đồng Trung Quốc**, chạy `npm run import:library -- scripts/starter-china-communities.json` để nhập danh mục và `npm run collect -- --china-community --seed --backfill` để đăng ký rồi nạp thảo luận từ feed công khai. Lượt thu thập thường tự đọc các feed cộng đồng đang bật. Chọn **Trung Quốc**, **Thư viện** và **Nguồn thảo luận cộng đồng** khi thêm feed trong Quản trị.

### Dịch tiêu đề và trích đoạn của Kho tin

Đặt `RADAR_NEWS_CHROME` trong `.env` bằng đường dẫn đến Chrome có hỗ trợ Translator API. Có thể đặt `RADAR_NEWS_CHROME_PROFILE` để lưu các gói ngôn ngữ trong một hồ sơ riêng. Chrome tải gói ở lần dùng đầu và sau đó dịch trên máy.

Khi có cấu hình này, lệnh thu thập tự dịch các tin tiếng nước ngoài còn thiếu bản dịch. Dùng `npm run collect -- --translate-only` để dịch kho hiện có. Radar lưu bản Việt cùng tiêu đề, trích đoạn và link nguồn, giữ các thuật ngữ kỹ thuật đã nhận diện và tìm kiếm được theo cả hai bản. Bản dịch trích đoạn và tóm tắt biên tập có nhãn riêng trong Kho tin.

## Lưu trữ và bảo trì SQLite

- Tin RSS và tài liệu dùng URL nguồn làm khóa. URL lưu một lần trong cột khóa. Phần nội dung giữ trích đoạn và bản dịch khi có. Tin đã dịch và tin tiếng Việt được đánh dấu để bộ thu ưu tiên các tin còn chờ.
- Kho tin tải tối đa 3 bài xem trước theo chủ đề hoặc 20 bài mỗi trang. Bộ lọc và biểu đồ tính trên toàn bộ kết quả. Dữ liệu lịch sử tiếp tục được lưu trong SQLite và dung lượng tăng theo lượng nội dung duy nhất.
- Nông nghiệp lưu mô hình, số liệu và kế hoạch trong SQLite. Sau khi build, `npm run import:farming -- <tệp JSON>` nhận `models`, `evidence` hoặc `plan` theo hợp đồng `shared/farming.ts`. Dùng cùng `id` để cập nhật mục hiện có. API đọc tại `/api/farming`.
- `npm run db:maintenance` kiểm tra dữ liệu, cập nhật thống kê truy vấn và thu gọn nhật ký WAL nếu có thể. Dùng `--backup` để tạo bản sao SQLite trong thư mục `backups` cạnh DB. `--compact` tạo bản sao đã kiểm tra trước khi chạy `VACUUM` để thu hồi trang trống. Chạy thu gọn vào lúc ít truy cập.

## Nhập bản tổng hợp thủ công

Tệp JSON gồm `date`, `headline`, `summary`, `opportunity` và `stories` theo [hợp đồng Bulletin](shared/bulletins.ts). Mỗi tin kèm nguồn và URL gốc, có thể thêm `topic` để chọn chủ đề chính. Tin thiếu chủ đề được nhóm theo tiêu đề và tóm tắt khi đọc. Chạy từ thư mục dự án sau khi build.

```sh
npm run import:bulletin -- data/imports/YYYY-MM-DD.json
```

Radar lưu bản tổng hợp trong SQLite và cập nhật bản cũ khi nhập lại cùng ngày.

## Nhập tóm tắt ý chính của bài

Tệp JSON là mảng các mục gồm `url` (link đang lưu trong Kho tin), `basis` (`ARTICLE` nếu đọc nội dung bài hoặc `SOURCE_PREVIEW` nếu dựa trên phần giới thiệu) và `keyPoints` (1–4 ý chính). Mục có `basis: ARTICLE` có thể thêm `sections`, mỗi mục gồm `heading` và `paragraphs`. Viết lại khoảng 30% độ dài bài, bao quát các phần chính và giữ nguyên ý nghĩa của kết luận, số liệu hoặc giới hạn do nguồn nêu. Kho tin tải các phần chi tiết khi mở cửa sổ tóm tắt. Nhập lại cập nhật toàn bộ tóm tắt của URL.

```sh
npm run import:digests -- data/imports/digests-YYYY-MM-DD.json
```

## Nhập nhận định ngành và ngách

Dùng hợp đồng [RankingAssessment](shared/rankings.ts) cho tệp JSON. Đợt đánh giá `MARKET` dùng sáu tiêu chí 0–5, quy đổi tối đa 100 điểm gồm nhu cầu 25, khả năng kiếm tiền 20, khả năng làm tay trái 20, triển vọng AI 10, dư địa cạnh tranh 15 và phù hợp ở Việt Nam 10. Bản ghi `market` nêu nguồn cho từng tín hiệu, mức trùng của từng đối thủ và điều kiện kiểm chứng. Hướng có nhà cung cấp lớn bán cho cùng tệp và cùng quy trình cần đặt `EXCLUDE` để hiện bên dưới bảng ưu tiên. Các đợt cũ giữ thang sàng lọc 75 điểm.

```sh
npm run import:ranking -- data/imports/ranking-YYYY-MM-DD.json
```

Radar cập nhật bản nhận định theo ngày và hiển thị đợt mới nhất trong **Công việc phụ → Tiềm năng tương lai**.
Để một ngách đã đánh giá xuất hiện trong **Công việc phụ → Ngách trái ngành**, ghi kỹ năng cần học vào `crossFieldLearning` và điều kiện tự vận hành vào `market.operation`.

## Nhập dữ liệu Thư viện

Tệp JSON là mảng [LibraryResource](shared/library.ts). Radar cập nhật nội dung theo URL gốc và giữ trạng thái đã lưu của từng tài liệu. Thư viện có mục riêng cho Kênh YouTube, Blog và Case study. Trường `theme` chọn nhóm hiển thị, `topics` ghi các chủ đề cụ thể của từng tài liệu, còn `startHere` cho phép trỏ đến video hoặc hướng dẫn nên xem trước.

```sh
npm run import:library -- data/imports/library-YYYY-MM-DD.json
```

### Video theo kênh YouTube

Sau khi nhập các kênh, có thể nạp bộ video chọn lọc với phần giới thiệu và các ý chính bằng tiếng Việt.

```sh
npm run collect:youtube -- --import scripts/starter-youtube-videos.json
```

Đặt `YOUTUBE_API_KEY` trong `.env` rồi chạy `npm run collect:youtube` để đọc tối đa 15 video mới từ danh sách tải lên của mỗi kênh đã lưu. Trên Compose, dùng `docker compose exec radar npm run collect:youtube`. Đồng bộ lấy tiêu đề, link, ngày và trích đoạn giới thiệu qua YouTube Data API. Video chọn lọc giữ phần biên tập khi đồng bộ lại. Mục từ API có thời hạn 29 ngày và được thay bằng dữ liệu mới sau lần đồng bộ thành công.
