import { Router } from 'express';
import type { createConnectionService } from '../application/connection-service.js';

const checkErrors = {
  unavailable: { status: 503, message: 'Hãy chọn cấu hình Codex và đặt OPENAI_API_KEY trên máy chủ.' },
  cooldown: { status: 429, message: 'Mỗi lần kiểm tra cần cách nhau ít nhất 30 giây.' },
  unauthorized: { status: 502, message: 'OpenAI từ chối quyền truy cập. Kiểm tra API key và quyền dùng model.' },
  'rate-limited': { status: 502, message: 'OpenAI báo đã chạm giới hạn sử dụng. Kiểm tra hạn mức và thử lại.' },
  failed: { status: 502, message: 'OpenAI chưa trả về kết quả hoàn tất. Kiểm tra mã model hoặc thử lại.' },
};

export function connectionRoutes(service: ReturnType<typeof createConnectionService>) {
  const router = Router();
  router.get('/', (_request, response) => response.json(service.status()));
  router.post('/check', async (_request, response) => {
    const result = await service.check();
    if (result === 'ok') {
      response.status(204).end();
      return;
    }

    const error = checkErrors[result];
    response.status(error.status).json({ error: error.message });
  });
  return router;
}
