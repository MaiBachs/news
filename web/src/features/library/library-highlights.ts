export const libraryHighlights = [
  {
    id: 'work',
    category: 'Công việc',
    format: 'ARTICLE',
    source: 'n8n',
    title: 'Làm một báo cáo tự động với n8n',
    url: 'https://docs.n8n.io/build-your-first-workflow',
    note: 'Thử lấy dữ liệu theo lịch, viết báo cáo ngắn và lưu vào bảng bằng một quy trình mẫu.',
    keyPoints: [
      'Bài mẫu dùng dữ liệu thời tiết để minh họa bốn bước từ đặt lịch đến lưu báo cáo.',
      'Có phần hướng dẫn thao tác từng bước để thử luồng trước khi bật lịch chạy.',
    ],
  },
  {
    id: 'income',
    category: 'Ngách & mẹo kiếm tiền',
    format: 'ARTICLE',
    source: 'Casso Flow',
    title: 'Tính phí dịch vụ theo lượng giao dịch',
    url: 'https://flow.casso.vn/bang-gia/',
    note: 'Tham khảo cách tính phí theo lượng công việc, chẳng hạn số lô chứng từ đã xử lý.',
    keyPoints: [
      'Casso Flow bán gói năm theo hạn mức giao dịch. Trang giá giải thích rõ giao dịch nào được tính.',
      'Có thể thử cách này với dịch vụ xử lý chứng từ bằng một gói nhỏ tính theo số lô phiếu.',
    ],
  },
  {
    id: 'knowledge',
    category: 'Kiến thức',
    format: 'ARTICLE',
    source: 'Prusa Knowledge Base',
    title: 'Thiết kế chi tiết in 3D để lắp vừa',
    url: 'https://help.prusa3d.com/article/modeling-with-3d-printing-in-mind_164135',
    note: 'Đọc phần dung sai để biết cần thử gì trước khi in cả bộ linh kiện.',
    keyPoints: [
      'Độ hở phụ thuộc vào máy, vật liệu, hướng in và cách hai chi tiết lắp với nhau.',
      'In thử một đoạn nhỏ với vài mức độ hở rồi đo và thử lắp trước khi in nguyên mẫu.',
    ],
  },
  {
    id: 'leisure',
    category: 'Giải trí',
    format: 'VIDEO',
    source: 'Boston Dynamics',
    title: 'Robot nhảy theo Do You Love Me?',
    url: 'https://www.youtube.com/watch?v=fn3KWM1kuAw',
    note: 'Clip ngắn xem Atlas, Spot và Handle phối hợp trong cùng một bài nhảy.',
    keyPoints: [
      'Ba kiểu robot khác nhau cùng trình diễn theo nhạc.',
      'Để ý cách mỗi robot xoay, đổi nhịp hoặc giữ thăng bằng.',
    ],
  },
] as const;
