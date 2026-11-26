# Rule chọn dữ liệu cho Radar

File này quy định dữ liệu nào **đáng giữ** cho từng menu. Các quy tắc kỹ thuật như `robots.txt`, giãn cách, giới hạn số mục, chuẩn hóa URL và chống trùng nằm trong [AGENTS.md](AGENTS.md). Khi hai file khác nhau, AGENTS.md thắng.

Mục tiêu của Radar không phải đọc cho biết. Radar tìm **ngách làm tay trái có người trả tiền**, phù hợp với một cá nhân hoặc nhóm nhỏ ở Việt Nam. Một mục chỉ có giá trị khi nó làm thay đổi một quyết định: thử, kiểm chứng tiếp hoặc loại bỏ một ngách.

## 0. Quy tắc chung cho mọi menu

### 0.1 Giả thuyết đang theo dõi

Mọi lượt thu thập bám theo danh sách giả thuyết trong bảng xếp hạng mới nhất ở **Công việc phụ** (`/api/rankings/latest`). Cụ thể là các ngành và ngách có quyết định `PILOT` hoặc `VALIDATE`. Ngách `EXCLUDE` chỉ cần theo dõi khi có tín hiệu làm đổi quyết định, ví dụ đối thủ lớn rút lui hoặc tệp khách mới xuất hiện.

Ngoài ra, mỗi lượt cũng bám theo 8 hồ sơ của **Nghề dịch vụ** và các giải pháp `PILOT` hoặc `VALIDATE` của **AIoT & Chatbot**.

### 0.2 Năm loại tín hiệu

Mỗi mục được giữ phải gắn được ít nhất một loại tín hiệu sau:

| Mã | Tín hiệu | Ví dụ đạt | Ví dụ không đạt |
| --- | --- | --- | --- |
| `PAIN` | Nỗi đau, nhu cầu lặp lại | Chủ shop hỏi công cụ trả lời tin nhắn tự động, phàn nàn chi phí nhân viên trực | "Thị trường AI tăng trưởng mạnh" |
| `MONEY` | Bằng chứng trả tiền | Giá bán, doanh thu tự công bố, số khách trả phí, hợp đồng | Định giá vòng gọi vốn của công ty lớn |
| `ENABLER` | Năng lực mới hoặc chi phí giảm, mở ra ngách | Model nhỏ chạy trên ESP32, giá API giảm 50%, linh kiện rẻ đi | Thông số kỹ thuật không đổi chi phí hay khả năng |
| `COMPETITOR` | Đối thủ hoặc sản phẩm tương tự | Sản phẩm bán cho cùng tệp khách, có giá và kênh bán | Tin nhân sự, cổ phiếu của doanh nghiệp |
| `RULE` | Luật, chính sách đổi luật chơi cho ngách | Quy định hóa đơn điện tử cho hộ kinh doanh, luật định danh điện tử | Tin hành chính không tác động tới tệp khách nhỏ |

### 0.3 Chấm điểm giữ hoặc bỏ

Chấm 0–3 cho từng tiêu chí rồi cộng lại, tối đa 12 điểm:

- **Liên quan**: chạm vào một giả thuyết đang theo dõi (3) hoặc chỉ chạm vào nhóm chủ đề rộng (1).
- **Cụ thể**: có tên sản phẩm, giá, số liệu, khách hàng hoặc mốc thời gian.
- **Căn cứ**: nguồn gốc, tài liệu sản phẩm hoặc người trong cuộc (3); báo đăng lại có dẫn nguồn (2); tin đồn hoặc giật tít (0).
- **Hành động được**: đọc xong biết phải hỏi ai, thử gì hoặc loại gì.

Ngưỡng:

- **≥ 7**: hiển thị mặc định và được chọn vào Bản tin sáng.
- **4–6**: lưu trong Kho tin, chỉ hiện khi lọc hoặc tìm kiếm.
- **≤ 3**: không cần dịch hay tóm tắt. Vẫn lưu URL để chống trùng, nhưng không xử lý thêm.

Với mục được giữ, ghi một câu **"Vì sao đáng đọc"** nêu tín hiệu gì cho giả thuyết nào. Nếu không viết được câu này, hạ mục xuống mức 4–6.

### 0.4 Luôn loại bỏ

- Biến động cổ phiếu, khối ngoại, tỷ giá hằng ngày, kết quả kinh doanh quý của doanh nghiệp niêm yết (trừ khi đó là đối thủ trực tiếp).
- Bất động sản, nhân sự cấp cao, giải thưởng, xếp hạng nơi làm việc, sự kiện lễ hội.
- Tin rò rỉ, đồn đoán sản phẩm tiêu dùng (giá điện thoại sắp tăng, bản lề gập bao nhiêu lần).
- Bản tin tổng hợp hằng tuần không có nội dung riêng, ví dụ "Research Focus #97".
- Bài quảng cáo, tài trợ, PR có nhãn rõ ràng. Bài chỉ lặp lại tin đã có từ nguồn gốc.

## 1. Bản tin sáng (`/`)

**Câu hỏi menu trả lời:** Hôm qua có gì mới làm thay đổi một ngách mình đang theo dõi?

- Chỉ chọn bài đạt ≥ 7 điểm, có ngày đăng trong 48 giờ qua (tối đa 7 ngày khi dữ liệu ít), và đã có `digest`.
- Chọn 5–10 bài. Mỗi bài thuộc một chủ đề chính. Không quá 3 bài từ cùng một nguồn.
- Trộn đủ thị trường khi có dữ liệu: ít nhất 1 bài `VIETNAM` có tín hiệu `PAIN`, `MONEY` hoặc `RULE`. Nếu không có bài đạt, ghi rõ trong `summary`.
- `headline` nêu **điều thay đổi**. Không dùng tiêu đề kiểu "Tổng hợp tin công nghệ".
- `opportunity` gồm:
  - `title`: một ngách cụ thể.
  - `evidence`: dẫn bài nguồn và phân biệt số đo, tín hiệu và giả thuyết.
  - `experiment`: một phép thử ≤ 14 ngày, chi phí thấp, có tiêu chí đạt hoặc dừng bằng con số.
- Nếu hôm đó không có cơ hội đủ căn cứ, ghi rõ và đề xuất theo dõi tiếp. Không ép ra cơ hội.
- Định dạng nhập theo `Bulletin` trong [shared/bulletins.ts](shared/bulletins.ts). Nhập bằng `npm run import:bulletin -- data/imports/<YYYY-MM-DD>.json`.

## 2. Kho tin (`/kho-tin`)

**Câu hỏi menu trả lời:** Có những tín hiệu nào về chủ đề X, ở thị trường Y, trong khoảng thời gian Z?

- Lưu mọi mục đọc được từ nguồn `NEWS` đang bật để chống trùng và thống kê. Chỉ dịch và tóm tắt các mục đạt ≥ 4 điểm.
- Bản dịch phải đúng nghĩa thuật ngữ. Ví dụ "generally available" là "chính thức phát hành", "flash weights" là "trọng số bản Flash". Khi bản dịch máy sai thuật ngữ, sửa ở bước biên tập rồi nhập lại bằng `import:digests`.
- Không cắt câu giữa chừng. Khi trích đoạn quá 180 ký tự, cắt ở dấu câu gần nhất và giữ ý chính.
- `digest.basis = ARTICLE` chỉ khi đã đọc toàn bài từ nguồn cho phép. Chỉ đọc RSS thì dùng `SOURCE_PREVIEW`.
- `keyPoints` có 2–4 ý. Ý đầu tiên trả lời "điều gì mới". Giữ số liệu, giá, điều kiện và giới hạn.
- Tỷ lệ mục đạt ≥ 4 điểm theo từng nguồn là chỉ số chính để đánh giá nguồn (xem mục 8).

## 3. Công việc phụ (`/cong-viec-phu`)

**Câu hỏi menu trả lời:** Ngách nào đáng thử ngay, ngách nào cần kiểm chứng, ngách nào bỏ?

Dữ liệu đầu vào là các tín hiệu đạt ≥ 7 điểm từ Kho tin và Thư viện, cộng với tìm kiếm bổ sung có mục tiêu. Không lấy từ tin tổng hợp chung.

- **Nhu cầu (`demand`)**: gom câu hỏi và phàn nàn lặp lại theo vấn đề. Cần ít nhất 2 nguồn độc lập. Ghi rõ có hay chưa có bằng chứng trả tiền.
- **Đối thủ (`competitors`)**: mỗi đối thủ có `sourceId` trỏ tới trang sản phẩm hoặc bảng giá. Đối thủ `MAJOR` + `DIRECT` cùng tệp khách nghĩa là quyết định `EXCLUDE`.
- **Việt Nam (`vietnam`)**: khi chưa tìm thấy sản phẩm tương đương, ghi phạm vi đã tìm (từ khóa, nền tảng, ngày tìm). Không kết luận "chưa có ai làm".
- **Triển vọng AI (`aiPotential`)**: chỉ dựa trên tín hiệu `ENABLER` có nguồn.
- **Phép thử (`test`, `validation`)**: có thời hạn, chi phí và chỉ số dừng.
- Đánh giá học trái ngành (`crossFieldLearning`) và khả năng vận hành một mình (`operation`).
- Mỗi lần nhập là một bản theo ngày. Giữ bản cũ để so sánh. Nhập bằng `npm run import:ranking -- <file>.json`, định dạng theo [shared/rankings.ts](shared/rankings.ts).

## 4. Nông nghiệp ở quê (`/nong-nghiep`)

**Câu hỏi menu trả lời:** Với vườn, ao, ruộng ở nhà, mô hình nào làm được, tốn bao nhiêu, bán cho ai?

- Ưu tiên nguồn: khuyến nông, viện nghiên cứu và sở nông nghiệp; báo nông nghiệp có số liệu; mô hình hộ có số liệu chi phí và đầu ra; tài liệu kỹ thuật cảm biến hoặc tưới cho quy mô nhỏ.
- Một mô hình (`FarmModel`) cần đủ các phần: điều kiện phù hợp (`fit`), công chăm sóc (`care`), cách thử nhỏ (`pilot`), chi phí (`costs`), đầu ra (`outlet`), quyết định (`decision`). Mỗi phần phải dựa trên `sources`.
- Bằng chứng (`FarmEvidence`): ghi điều quan sát được kèm nơi và thời điểm, và cách áp dụng cho diện tích nhà mình.
- Loại bỏ: mô hình chỉ có quy mô trang trại lớn, chuyện "lãi tiền tỷ" không có chi phí đầu vào, và quảng cáo giống hoặc vật tư.
- Nhập bằng `npm run import:farming -- <file>.json`, định dạng theo [shared/farming.ts](shared/farming.ts).

## 5. Thư viện (`/thu-vien`)

**Câu hỏi menu trả lời:** Học cách làm từ ai, ở đâu, và ai đã kiếm được tiền bằng cách đó?

Có bốn loại mục (`libraryKind`):

- **`CASE_STUDY`**: bắt buộc có `caseStudy.product`, `customer`, `pricing`. Thêm `acquisition` (kênh tìm khách) khi nguồn có nêu. Ghi `reportedRevenue` kèm "do tác giả tự công bố" khi đúng như vậy. Thiếu khách hàng hoặc cách thu tiền thì không phải case study, chuyển sang `BLOG` hoặc bỏ.
- **`BLOG`**: hướng dẫn áp dụng được, có các bước làm, mã nguồn hoặc cấu hình. Bỏ bài tin tức thuần, bài tuyển dụng và bài PR sản phẩm.
- **`YOUTUBE`**: ưu tiên kênh dạy làm hoặc kể case có số liệu. Dùng `DESCRIPTION` khi chỉ có mô tả video, `EDITORIAL` khi đã xem nội dung. Ít video giải trí.
- **`COMMUNITY`** (V2EX, w2solo, Appinn…): đây là nguồn tín hiệu `PAIN` và `MONEY` tốt nhất. Giữ chủ đề có người kể sản phẩm, giá, doanh thu, câu hỏi tìm công cụ hoặc phàn nàn cụ thể. Bỏ chủ đề hỏi đáp chung, tán gẫu, tuyển dụng.

Mọi mục chọn lọc phải có `takeaway`: một câu nêu bài học áp dụng được. Gắn `theme` và `topics` cụ thể. Nhập bằng `npm run import:library -- <file>.json`, định dạng theo [shared/library.ts](shared/library.ts).

## 6. Nghề dịch vụ (`/nghe-dich-vu`)

**Câu hỏi menu trả lời:** Với 8 nghề (viết nội dung, thiết kế, dựng video, dịch, chăm sóc khách, kế toán cơ bản, viết code, nghiên cứu thị trường), khách trả bao nhiêu, AI thay được phần nào và nên bán gói gì?

Hợp đồng dữ liệu nằm trong [DESIGN.md](DESIGN.md), phần Nghề dịch vụ. Mỗi tin hoặc tài liệu liên quan được gắn `serviceLines` ở bước chấm điểm.

### 6.1 Dữ liệu cần lấy cho mỗi nghề

| Khối | Dữ liệu đạt | Tín hiệu |
| --- | --- | --- |
| Nhu cầu | Bài tuyển hoặc thuê ngoài, câu hỏi "cần người làm…", phàn nàn về chất lượng hay giá dịch vụ. Gom theo vấn đề, ít nhất 2 nguồn độc lập. | `PAIN` |
| Giá | Giá niêm yết trên trang dịch vụ, nền tảng freelance hoặc bài tuyển có ngân sách. Ghi đơn vị, thị trường, ngày ghi nhận. Không dùng giá "khoảng" không rõ nguồn. | `MONEY` |
| AI thay đổi | Ra mắt hoặc cập nhật công cụ làm thay một bước của nghề, kèm giá công cụ. Ghi phần nào tự động được và phần nào còn cần người, như hiểu khách, kiểm duyệt, chịu trách nhiệm. | `ENABLER` |
| Đối thủ | Agency, nền tảng tự phục vụ (ví dụ công cụ thiết kế hoặc dịch tự động bán thẳng cho khách), freelancer có bảng giá. Nền tảng lớn giải quyết trọn quy trình cho cùng tệp khách thì quyết định là `EXCLUDE`. | `COMPETITOR` |
| Luật | Thuế, hóa đơn, điều kiện hành nghề, bản quyền nội dung và hình ảnh do AI tạo. | `RULE` |
| Học trái ngành | Khóa học, tài liệu, case người chuyển ngành có thời gian học và kết quả. | `MONEY`/`ENABLER` |

### 6.2 Điểm riêng từng nghề

- **Viết nội dung (`CONTENT`)**: bám ngách có chuyên môn, như ngành hẹp, tiếng Việt chuẩn SEO hoặc nội dung cho sàn TMĐT. Bỏ tin "AI viết thay hoàn toàn" không có số liệu.
- **Thiết kế (`DESIGN`)**: theo dõi nền tảng mẫu và công cụ tạo ảnh như đối thủ trực tiếp. Giữ tín hiệu về gói thiết kế theo tháng cho shop nhỏ.
- **Dựng video (`VIDEO`)**: giá theo phút hoặc theo clip ngắn, công cụ tự cắt và phụ đề. Nhu cầu video ngắn cho bán hàng livestream và TikTok Shop.
- **Dịch (`TRANSLATION`)**: phân biệt dịch máy + hậu kiểm với dịch chuyên ngành. Giữ cặp ngôn ngữ Trung–Việt và Anh–Việt, tài liệu kỹ thuật và hồ sơ pháp lý (ghi rõ yêu cầu công chứng nếu có).
- **Chăm sóc khách (`CUSTOMER_CARE`)**: nối với menu AIoT & Chatbot. Giữ dữ liệu về trực tin nhắn thuê, chatbot Zalo OA và Messenger, chi phí nhân viên trực so với chatbot.
- **Kế toán cơ bản (`BOOKKEEPING`)**: bắt buộc có khối `legal` với nguồn từ cơ quan thuế hoặc văn bản pháp luật. Ghi rõ việc cá nhân được làm (ghi sổ, lập chứng từ, hỗ trợ kê khai) và việc cần chứng chỉ hoặc tổ chức hành nghề. Theo dõi thay đổi chế độ thuế với hộ kinh doanh. Không kết luận khi chưa đối chiếu văn bản gốc.
- **Viết code (`CODING`)**: ưu tiên việc nhỏ trọn gói, như tự động hóa n8n hoặc Zapier, sửa web, tích hợp API, script dữ liệu. Bỏ tin tuyển dụng toàn thời gian.
- **Nghiên cứu thị trường (`MARKET_RESEARCH`)**: giữ bài có phương pháp, gói báo cáo có giá, công cụ AI tổng hợp. Đây cũng là năng lực Radar đang luyện, nên ghi lại cách làm để đóng gói thành dịch vụ.

### 6.3 Loại bỏ

- Tin tuyển dụng toàn thời gian.
- Khóa học bán kèm lời hứa thu nhập.
- Bảng "top công cụ AI" không có giá hay cách dùng.
- Bài dự báo "nghề X sẽ biến mất" không có số liệu.

### 6.4 Nguồn ứng viên

Kiểm tra feed, `robots.txt` và điều khoản trước khi bật:

- Reddit (`.rss` công khai): r/freelance, r/freelanceWriters, r/copywriting, r/graphic_design, r/VideoEditing, r/TranslationStudies, r/Bookkeeping, r/smallbusiness.
- Changelog hoặc blog chính thức của công cụ: Canva, Figma, CapCut, Descript, DeepL, n8n (đã có), Zapier (đã có).
- Việt Nam: blog phần mềm kế toán và hóa đơn điện tử, trang tin của cơ quan thuế, nền tảng freelance trong nước có trang việc công khai.
- Giá trên nền tảng cần đăng nhập thì ghi nhận thủ công, có ngày và link. Không thu thập tự động.

## 7. AIoT & Chatbot (`/aiot-chatbot`)

**Câu hỏi menu trả lời:** Thiết bị AIoT nào kèm chatbot có thể đóng gói và bán cho hộ gia đình, cửa hàng nhỏ hoặc trang trại ở Việt Nam?

### 7.1 Dữ liệu cần lấy

- **Linh kiện & nền tảng (`AiotPart`)**:
  - Bo mạch như ESP32-S3, module cảm biến, micro và loa.
  - Model giọng nói hoặc ngôn ngữ chạy được trên thiết bị hay qua API.
  - Nền tảng chatbot như Zalo OA, Messenger, web widget.
  - Mỗi mục cần năng lực cụ thể, giá kèm ngày ghi nhận và nguồn.
  - Đánh dấu `ENABLER` khi giá giảm hoặc thêm khả năng mới, ví dụ hỗ trợ tiếng Việt hay nhận lệnh offline.
- **Giải pháp đóng gói (`AiotSolution`)**:
  - Phải có bài toán cụ thể, khách hàng, BOM, kênh chatbot và vai trò của chatbot.
  - Phải có giá lắp và phí tháng, đối thủ, rủi ro vận hành và phép thử.
  - Thiếu khách hàng hoặc cách thu tiền thì chỉ lưu như ý tưởng ở mức `VALIDATE`.
- **Tín hiệu từ Kho tin**: chủ đề `aiot`, `giong-noi`, `chatbot`. Ưu tiên dự án mở có release mới, sản phẩm thương mại có giá, phản hồi người dùng về độ ổn định, chi phí điện và mạng.

### 7.2 Ưu tiên

- Dự án mã nguồn mở đang hoạt động, có hướng dẫn lắp và danh sách linh kiện, ví dụ các dự án trợ lý giọng nói trên ESP32.
- Sản phẩm thương mại Trung Quốc bán cùng tệp khách, dùng làm mốc giá và đối thủ.
- Kênh chatbot người Việt đang dùng (Zalo, Messenger), cùng phí API và quy định duyệt của nền tảng.
- Bài toán gắn với nhà và quê: cảnh báo ao, vườn, máy bơm, cửa hàng nhỏ (trả lời giá, nhận đơn), người già ở nhà (nhắc thuốc, gọi người thân).

### 7.3 Loại bỏ

- Ra mắt robot hoặc thiết bị cao cấp không có giá hay ngày bán.
- Concept tại hội chợ.
- Tin gọi vốn của hãng lớn không đổi giá linh kiện hay khả năng.
- Hướng dẫn chỉ chạy demo, không xử lý mất mạng, nguồn điện hoặc bảo trì. Giữ ở Thư viện nếu học được kỹ thuật, nhưng không tính là giải pháp.

### 7.4 Nguồn ứng viên

Kiểm tra trước khi bật:

- Nguồn đang có: CNX Software, Hackaday, Home Assistant Blog, Raspberry Pi News, IEEE Spectrum Robotics, Random Nerd Tutorials, Twilio Changelog.
- Thêm: feed tin của Espressif, Seeed Studio blog, ESPHome và các dự án trợ lý giọng nói ESP32 qua `releases.atom` của GitHub.
- Changelog nền tảng Zalo for Developers và Messenger Platform nếu có feed.
- Kênh AIoT của 量子位 và 36Kr.

### 7.5 Quan hệ với menu khác

- Giải pháp cho ao, vườn liên kết sang Nông nghiệp ở quê.
- Giải pháp chatbot cho cửa hàng liên kết sang Nghề dịch vụ, mã `CUSTOMER_CARE`.
- Quyết định mới cập nhật vào Công việc phụ cùng `id`.

## 8. Quản trị nguồn (`/quan-tri`)

### 8.1 Đánh giá nguồn

Sau mỗi tuần, tính cho từng nguồn:

- **Tỷ lệ hữu ích** = số mục đạt ≥ 4 điểm / số mục đọc được.
- **Tỷ lệ tín hiệu** = số mục đạt ≥ 7 điểm / số mục đọc được.

Áp dụng ngưỡng sau trên ít nhất 30 mục:

- Tỷ lệ hữu ích < 10%: **tắt** nguồn.
- Tỷ lệ hữu ích 10–25%: giữ, nhưng chỉ đọc tiêu đề và không dịch toàn bộ.
- Tỷ lệ tín hiệu ≥ 10%: **ưu tiên** khi chạy lại và backfill.

### 8.2 Đề xuất theo dữ liệu ngày 2026-11-22

Kết quả lọc thô bằng từ khóa trên 1.779 tin: khoảng 16% có liên quan đến mục tiêu. Đề xuất sau còn chờ chấm điểm thật theo mục 0.3.

- **Cân nhắc tắt:** CafeF Thị trường chứng khoán, CafeF Tài chính ngân hàng, VietNamNet Kinh doanh, Tuổi Trẻ Kinh doanh, Thanh Niên Kinh tế, Insurance Journal, SCMP Business.
- **Giữ và theo dõi tỷ lệ:** Dân trí Công nghệ, VnExpress, IT之家, 36Kr, OpenAI News, GitHub Changelog.
- **Đưa lên ưu tiên:** V2EX (business, starter, create), w2solo, SaaStr, n8n Blog, Random Nerd Tutorials, CNX Software, Home Assistant Blog.
- **Ứng viên thêm mới** (kiểm tra feed, `robots.txt` và điều khoản trước khi bật):
  - Hacker News Show HN / Ask HN (RSS công khai của hnrss.org).
  - Indie Hackers.
  - Reddit r/SaaS, r/Entrepreneur, r/smallbusiness, r/homeassistant qua `.rss` công khai.
  - Product Hunt.
  - Starter Story.
  - Tinhte và Voz nếu có RSS công khai cho mục kinh doanh hoặc công nghệ.

## 9. Kiểm tra trước khi nhập

- [ ] Mỗi mục có URL gốc hoạt động, ngày đăng (hoặc `null`) và đúng thị trường.
- [ ] Mỗi nhận định trong Bản tin sáng, Công việc phụ, Nghề dịch vụ, AIoT & Chatbot và Nông nghiệp có link nguồn.
- [ ] Mỗi giá (dịch vụ, linh kiện, gói bán) có đơn vị, tiền tệ, ngày ghi nhận và nguồn. Giá cũ hơn 90 ngày được đánh dấu cần kiểm tra lại.
- [ ] Hồ sơ `BOOKKEEPING` có khối `legal` dẫn văn bản hoặc nguồn của cơ quan thuế.
- [ ] Phân biệt số đo, tín hiệu và giả thuyết. Khi nguồn dự đoán hoặc cáo buộc, giữ nguyên cách quy nguồn.
- [ ] Không có mục nào trong danh sách loại bỏ ở mục 0.4.
- [ ] Bốc mẫu 5 mục mỗi thị trường để kiểm tra bản dịch, thuật ngữ, số liệu và nội dung popup.
- [ ] Chạy lại lệnh nhập trên cùng file, số mục không tăng (kiểm tra chống trùng).
