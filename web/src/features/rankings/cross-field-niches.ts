interface CrossFieldNiche {
  id: string;
  title: string;
  customer: string;
  setup: string;
  learningHours: number;
  learning: string;
  firstPilot: string;
  validation: string;
  independence: string;
  guides: ReadonlyArray<{ label: string; url: string }>;
}

export const crossFieldNiches: readonly CrossFieldNiche[] = [
  {
    id: 'nursery-iot',
    title: 'IoT/AIoT theo dõi môi trường vườn ươm',
    customer: 'Nhà vườn nhỏ cần xem nhiệt độ, độ ẩm và biết lúc chỉ số lệch ngưỡng khi vắng mặt.',
    setup: 'Một người dựng mẫu. Nhóm nhỏ có thể chia việc lắp tại vườn và kiểm tra dữ liệu.',
    learningHours: 24,
    learning: 'Học đọc cảm biến, thiết lập ESP32 với ESPHome, lưu số đo và tạo cảnh báo theo ngưỡng. Tập kiểm tra mất Wi-Fi, mất nguồn và so số đo với thiết bị tham chiếu. Sau khi có dữ liệu ổn định, có thể thử phát hiện bất thường để nâng lên AIoT.',
    firstPilot: 'Hỏi vài chủ vườn về số lần họ phải ra kiểm tra. Nếu một người đồng ý thử, làm một điểm đo dùng nguồn thấp áp, hiển thị số đo tại chỗ và bàn giao file cấu hình. Thống nhất mức cảnh báo và thời hạn hỗ trợ trước khi lắp.',
    validation: 'Đối chiếu số đo và cảnh báo ở vị trí lắp thật. Đo số cảnh báo có ích, số lần báo nhầm và xem khách có trả tiền cho công lắp và hỗ trợ hay không. Phạm vi thử là theo dõi môi trường.',
    independence: 'Bán và hỗ trợ trực tiếp cho từng vườn. Lưu cấu hình và dữ liệu tại chỗ, chọn linh kiện có nguồn thay thế. Công việc tại vườn vẫn cần điện, mạng nội bộ và quyền vào lắp.',
    guides: [
      { label: 'Home Assistant · tích hợp thiết bị ESPHome', url: 'https://www.home-assistant.io/integrations/esphome/' },
      { label: 'ESPHome Devices · mẫu đo nhiệt độ và độ ẩm', url: 'https://devices.esphome.io/devices/apollo-automation-temp-1/' },
    ],
  },
  {
    id: 'household-vermiculture',
    title: 'Nuôi trùn quế quy mô hộ cho nhà vườn',
    customer: 'Hộ nuôi, nhà vườn hoặc cơ sở có thể mua trùn giống hay sinh khối tại địa phương.',
    setup: 'Cá nhân hoặc hộ gia đình tự chăm. Cần chỗ phù hợp và người theo dõi thường xuyên.',
    learningHours: 10,
    learning: 'Xem một mô hình đã vận hành ở địa phương để học chọn nơi nuôi, theo dõi độ ẩm, nhiệt và chất lượng đầu vào. Tập ghi chi phí, công chăm và tình trạng một ô nhỏ trước khi tính sản lượng.',
    firstPilot: 'Hỏi hộ nuôi và nhà vườn gần nơi ở xem họ mua dạng nào, bao nhiêu và theo mùa ra sao. Chạy một ô thử, dùng đầu ra trong vườn mẫu hoặc cho khách xem mẫu. Chỉ dự trù mở rộng khi có đầu ra cụ thể.',
    validation: 'Theo dõi công chăm, chi phí đầu vào, mùi, thoát nước và khả năng duy trì qua điều kiện thời tiết thực tế. Dùng số liệu của lứa thử để tính giá giao tại địa phương.',
    independence: 'Tự giữ nơi nuôi, lịch chăm và quan hệ với vài khách lẻ. Tìm hơn một nguồn giống hoặc đầu vào có thể kiểm tra. Cần diện tích và nguồn cung phù hợp tại nơi ở.',
    guides: [
      { label: 'Khuyến nông Quốc gia · mô hình nuôi trùn quế khởi đầu từ một ô thử ở Bình Định', url: 'https://khuyennongvn.gov.vn/guong-san-xuat-gioi/binh-dinh-mot-thanh-nien-co-thu-nhap-kha-tu-nuoi-trun-que-16610.html' },
      { label: 'Khuyến nông Quốc gia · mô hình và đầu ra tại Quảng Ngãi', url: 'https://khuyennongvn.gov.vn/guong-san-xuat-gioi/quang-ngai-thu-nhap-cao-va-on-dinh-tu-nuoi-trun-que-19330.html' },
    ],
  },
  {
    id: 'small-batch-3d-printing',
    title: 'Thiết kế và in 3D chi tiết theo kích thước',
    customer: 'Cửa hàng hoặc xưởng nhỏ cần số ít chi tiết như gá dây, vách chia khay hoặc chân kê nhẹ theo kích thước riêng.',
    setup: 'Một người có thể đo và vẽ mẫu. Nhóm nhỏ có thể chia việc đo, thiết kế và in.',
    learningHours: 18,
    learning: 'Học đo kích thước, vẽ bản phác theo tham số trong FreeCAD và xuất tệp in. In thử một mẫu để kiểm tra độ lắp vừa và ghi lại sai số trước khi báo lô.',
    firstPilot: 'Nhận một chi tiết không có chức năng chịu tải hoặc bảo đảm an toàn. Chốt kích thước, số lượng nhỏ và một vòng duyệt mẫu với khách. Có thể thuê in mẫu trước khi cân nhắc mua máy.',
    validation: 'Khách thử lắp trên vật thật. Tính cả công đo, vẽ, in lỗi và sửa mẫu trước khi định giá. Nhận đơn từ vài khách khác nhau để biết nhu cầu lặp hay chỉ phát sinh một lần.',
    independence: 'Giữ bản vẽ chỉnh sửa và tệp xuất tiêu chuẩn để tự in hoặc gửi qua nhiều xưởng. Tự tìm khách trực tiếp. Nếu thuê in, thời gian giao còn phụ thuộc vào năng lực của xưởng.',
    guides: [
      { label: 'FreeCAD · dự án thiết kế 3D mã nguồn mở', url: 'https://github.com/FreeCAD/FreeCAD' },
      { label: 'Prusa · thiết kế và thử mẫu cho in 3D', url: 'https://help.prusa3d.com/article/modeling-with-3d-printing-in-mind_164135' },
    ],
  },
];
