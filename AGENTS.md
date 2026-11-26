# Quy ước làm việc với Radar

## Cấu trúc và phụ thuộc

- Giữ monolith TypeScript theo tính năng. Mỗi tính năng ở `server/src/features/<feature>/`. Chỉ tạo thư mục cho lớp có code thực tế.
- `web/` nhận và kiểm tra yêu cầu HTTP, gọi use case và trả mã trạng thái. HTTP, Express và cookie thuộc lớp này.
- `application/` điều phối use case và định nghĩa cổng cần thiết, ví dụ `SourceRepository`. Lớp này chỉ gọi domain hoặc các cổng và use case của nó.
- `domain/` chứa kiểm tra và quy tắc nghiệp vụ, giữ độc lập với HTTP, database, hệ thống tệp và API ngoài.
- `infrastructure/` hiện thực các cổng, chứa SQL, ánh xạ dữ liệu và client tích hợp. `server/src/app.ts` ghép các lớp tại điểm khởi tạo.
- Tính năng trao đổi qua use case hoặc cổng được ghép tại `app.ts`. `shared/` chỉ chứa hợp đồng và hằng số dùng chung cho React và Node.js.
- React đặt route và layout ở `web/src/app/`. Mỗi tính năng đặt UI và module gọi API ở `web/src/features/<feature>/`. Các module HTTP dùng chung ở `web/src/shared/`.

## Code và dữ liệu

- TypeScript `strict`, ESM, thụt 2 dấu cách. Dùng `import type` cho type. Import tương đối của backend dùng đuôi `.js` để chạy được sau khi biên dịch.
- Đặt tên file `kebab-case.ts`, component `PascalCase.tsx`, hàm và biến `camelCase`. Tên trong code dùng tiếng Anh. Giao diện và thông báo cho người dùng dùng tiếng Việt.
- Kiểm tra dữ liệu tại ranh giới. Dùng query có tham số. Thay đổi schema bằng migration SQL mới có số tăng dần trong `server/migrations/`.
- Ghi giá trị đích khi thay đổi trạng thái để request lặp lại có cùng kết quả. Dùng ràng buộc database cho tính duy nhất và transaction cho các lần ghi cần thành công cùng nhau.
- Thông tin bí mật vào biến môi trường. Radar mở trực tiếp trên localhost theo mặc định. Kiểm tra yêu cầu ghi của API.
- Trước khi bàn giao thay đổi, chạy `npm run build` và `npm test`. Test `layers.test.mjs` kiểm tra hướng phụ thuộc của backend. Bổ sung kiểm tra cho hành vi mới khi cần bảo vệ một use case hoặc ca lỗi cụ thể.

## Quy tắc thu thập và xử lý dữ liệu

### 1. Chọn và đọc nguồn

- Chỉ thu thập từ nguồn đang bật trong Quản trị. Ghi rõ tên nguồn, URL, thị trường (`GLOBAL`, `CHINA`, `VIETNAM`) và mục sử dụng (`NEWS`, `LIBRARY`). Gán thị trường theo phạm vi của nguồn. Xác định ngôn ngữ theo nội dung từng mục.
- Ưu tiên RSS/Atom chính thức và API công khai. Có thể dùng RSSHub, bảng tin nóng công khai hoặc API tìm kiếm được phép cho nguồn Trung Quốc. Với Zhihu, Xiaohongshu và Douyin, chỉ dùng các kênh công khai đó. Tôn trọng yêu cầu đăng nhập, giới hạn truy cập và quy định của nguồn.
- Kiểm tra `robots.txt` trước khi đọc feed và kiểm tra lại ở đích chuyển hướng. Giãn cách ít nhất 1 giây giữa các yêu cầu cùng origin và tuân thủ `Crawl-delay` dài hơn trong giới hạn bộ thu. Giữ giới hạn thời gian, dung lượng phản hồi và số lần chuyển hướng. Khi gặp HTTP 429, dừng đọc origin đó trong lần chạy và tiếp tục các nguồn khác.

### 2. Chuẩn hóa, lọc và lưu

- Giải mã HTML entity, bỏ thẻ HTML, script và style, rồi gộp khoảng trắng. Bỏ mục thiếu tiêu đề hoặc URL bài gốc hợp lệ. Dùng URL HTTPS chuẩn hóa làm khóa trong từng kho. Bỏ fragment và tham số theo dõi như `utm_*`, `fbclid`, `gclid`. Giữ tham số nhận diện bài hoặc video.
- Với Kho tin, giữ URL bài gốc, tiêu đề, tên nguồn, thị trường, ngày đăng và trích đoạn ngắn. Bộ đọc RSS/Atom hiện giới hạn tiêu đề 200 ký tự và trích đoạn 180 ký tự. Quy đổi ngày đăng sang `Asia/Ho_Chi_Minh`. Nếu thiếu hoặc sai ngày, lưu `null` và hiển thị “Chưa rõ ngày đăng”. Nội dung toàn bài chỉ dùng tạm thời khi cần biên tập tóm tắt từ nguồn cho phép.
- Lần chạy thường lấy tối đa 12 tin và 4 tài liệu mỗi nguồn. Chế độ `--backfill` lấy tối đa 100 tin và 80 tài liệu mỗi nguồn, ưu tiên bài mới nhất, bỏ tiêu đề gắn nhãn quảng cáo hoặc tài trợ rõ ràng và yêu cầu trích đoạn từ 30 ký tự. Tin backfill phải có ngày thuộc cửa sổ 180 ngày gần nhất. Thư viện có thể giữ hướng dẫn cũ còn hữu ích.
- Khi mở rộng kho, chọn nguồn có tin liên quan, đường dẫn bài hoạt động và đủ nội dung để đối chiếu. Ưu tiên báo cáo gốc, tài liệu sản phẩm, bài phân tích có dẫn nguồn và phản hồi người dùng có bối cảnh. Hạ ưu tiên bài giật tít, tin đồn thiếu căn cứ và bài chỉ lặp lại thông tin đã có.
- Một URL chỉ tạo một mục trong mỗi kho. Chạy lại giữ nội dung đã biên tập, bản dịch, bản tin lưu theo ngày và trạng thái đã lưu của tài liệu. Khi nhiều nguồn đăng lại cùng một thông tin, ưu tiên bản gốc để tổng hợp và chỉ tính một tín hiệu khi phân tích.
- Lưu URL mỗi tin hoặc tài liệu ở cột khóa. Đọc Kho tin theo trang và tính số đếm trên tập kết quả đầy đủ. Khi cần thu gọn SQLite, tạo bản sao kiểm tra được trước khi dùng `npm run db:maintenance -- --compact`.

### 3. Dịch, tóm tắt và phân loại

- Nhận diện ngôn ngữ riêng cho tiêu đề và trích đoạn của tin. Giữ phần đã viết bằng tiếng Việt và lưu riêng bản dịch cho phần tiếng nước ngoài. Dịch tự nhiên, giữ tên người, hãng, sản phẩm, mã phiên bản, số liệu, đơn vị và thuật ngữ chuẩn như AI agent, AIoT, LLM, API, RAG hoặc ESP32. Khi nguồn đưa ra dự đoán hoặc cáo buộc, giữ cách quy nguồn và mức độ chắc chắn.
- Thẻ tin dùng tiêu đề, trích đoạn đã dịch và nhãn giao diện tiếng Việt. Tên nguồn dùng tên chính thức hoặc tên Latin của thương hiệu khi có. Tiêu đề dẫn đến URL gốc. Nút **Tóm tắt** mở popup. Tìm kiếm đọc cả tiêu đề, trích đoạn gốc và bản dịch. Nếu tạm thiếu bản dịch, giữ trích đoạn nguồn để đối chiếu và xử lý lại bài còn thiếu trong lượt thu thập kế tiếp.
- Khi chỉ đọc RSS hoặc phần mô tả, ghi rõ “Bản dịch trích đoạn nguồn” hoặc dùng `SOURCE_PREVIEW` nếu đã biên tập các ý chính từ phần giới thiệu. Dùng `ARTICLE` khi đã đọc nội dung bài từ nguồn cho phép. Bản tóm tắt chi tiết viết lại khoảng 30% độ dài bài, bao quát các phần chính và giữ các số liệu, kết luận, điều kiện hoặc giới hạn quan trọng. Nếu thông tin giữa tiêu đề và trích đoạn mâu thuẫn, giữ rõ sự khác biệt khi tóm tắt.
- Mỗi tin có một chủ đề chính dựa trên nội dung trọng tâm. Ưu tiên chủ đề cụ thể như thiết bị AI giọng nói, AI agent hoặc AIoT trước nhóm rộng. Dùng **Khác** khi dữ liệu chưa đủ để phân loại. Dùng cùng quy tắc nhóm cho Kho tin và các bài nguồn của Bản tin sáng.
- Khi có bước xử lý bằng model, lọc từ khóa và loại mục trùng trước. Dùng model xử lý tin trong profile đang chọn cho bước lọc nâng cao, dịch hoặc tóm tắt. Dành model phân tích cho nhận định và dự báo. Kiểm tra đầu ra theo hợp đồng dữ liệu trước khi lưu. Dùng lại kết quả đã lưu, xử lý bài mới hoặc còn thiếu và phân tích lại bài cũ khi có yêu cầu. Tuân theo trần chi phí AI theo ngày và ngân sách VPS cộng API tối đa 500.000 đồng/tháng. Luồng dịch RSS hiện tại chạy cục bộ bằng Chrome khi đã cấu hình.

### 4. Xử lý theo mục hiển thị

- **Kho tin** là nơi tra cứu bài đã thu thập. **Bản tin sáng** chọn bài có giá trị, nhóm theo chủ đề, tóm lược điều mới và dẫn link nguồn cho từng nhận định chính. Khi dữ liệu còn ít, ghi rõ phạm vi và chọn các bài đủ căn cứ.
- **Thư viện** tách kênh YouTube, blog và case study. Gắn chủ đề cụ thể cho nội dung chọn lọc. Ưu tiên công việc phụ, ngách kiếm tiền và kiến thức có thể áp dụng. Chọn ít mục giải trí có thời lượng ngắn. Một case study cần nêu sản phẩm, khách hàng và cách thu tiền dựa trên nguồn. Nếu có số doanh thu do tác giả tự công bố, ghi rõ nguồn công bố.
- **Cộng đồng Trung Quốc** trong Thư viện chỉ lấy thảo luận qua RSS/Atom công khai từ nguồn đã bật. Ưu tiên bài về sản phẩm, khách hàng, cách định giá, ra mắt và xu hướng công nghệ. Loại bài phát mã, mời nhóm, quảng cáo rõ ràng và trích đoạn quá ngắn. Giữ URL thảo luận, tên nguồn, ngày đăng và trích đoạn tối đa 180 ký tự, lưu riêng bản dịch tiếng Việt. Gắn nhãn trích đoạn và kiểm chứng riêng các kết quả do thành viên nêu trước khi dùng trong nhận định thị trường.
- **Video theo kênh** đọc danh sách tải lên qua YouTube Data API khi đã cấu hình. Giữ đúng link từng video, tiêu đề, ngày đăng và đoạn giới thiệu. Dùng `DESCRIPTION` khi chỉ có mô tả video và `EDITORIAL` khi ý chính đã được biên tập từ nội dung thực tế. Lượt đồng bộ thành công thay dữ liệu tạm của kênh theo thời hạn lưu hiện có và bảo toàn các mục biên tập.

### 5. Dùng dữ liệu cho thống kê và nhận định

- Số bài và tần suất đề cập đo hoạt động trong kho Radar. Biểu đồ ghi rõ khoảng thời gian, bộ lọc và nhóm đang đếm. Khi so tuần hoặc tháng, dùng kỳ có thể so sánh và kiểm tra độ phủ nguồn. Nếu nguồn thay đổi đáng kể hoặc mẫu quá nhỏ, ghi rõ giới hạn của so sánh.
- Với nhu cầu, đối thủ, triển vọng AI và độ phù hợp ở Việt Nam, dẫn link cho từng tín hiệu quan trọng và nêu thời điểm cùng phạm vi của dữ liệu. Ưu tiên dữ liệu gốc, bằng chứng khách hàng và sản phẩm thực tế. Khi ghi nhận nhu cầu, gom các câu hỏi và phàn nàn lặp lại theo vấn đề, đối chiếu giữa các nguồn độc lập và ghi rõ nếu có bằng chứng trả tiền. Phân biệt số đo, tín hiệu từ kho tin và giả thuyết. Khi tìm chưa thấy sản phẩm tương đương ở Việt Nam, nêu phạm vi tìm và điều kiện cần kiểm chứng trước khi ước độ trễ.
- Khi xếp hạng công việc phụ, đánh giá khả năng học trái ngành và vận hành độc lập bởi cá nhân hoặc nhóm nhỏ. Dùng `EXCLUDE` khi đối thủ lớn đã bán cho cùng tệp khách và giải quyết cùng quy trình. Dự báo ghi mốc thời gian, giả định, tín hiệu cần theo dõi và cách thử với khách hàng.

### 6. Ghi nhận lỗi và kiểm tra sau lượt thu thập

- Báo theo từng nguồn số mục đọc được, số mục chọn, số mục mới và lỗi nếu có. Theo dõi số bản dịch lưu thành công. Lượt chạy lại ưu tiên nguồn hoặc bước còn lỗi và bài còn thiếu, giữ các kết quả đã lưu thành công.
- Sau khi thu thập hoặc backfill, đối chiếu số mục đã lưu với API và bộ lọc hoặc biểu đồ tương ứng. Kiểm tra mẫu ở từng thị trường có dữ liệu mới, gồm link gốc, ngày đăng, chủ đề, bản Việt, thuật ngữ, số liệu và nội dung popup. Với Thư viện, kiểm tra đúng kênh, link của từng video và nhãn phần tóm tắt. Chạy lại trên cùng dữ liệu mẫu để kiểm tra chống trùng trước khi bàn giao thay đổi luồng thu thập.
