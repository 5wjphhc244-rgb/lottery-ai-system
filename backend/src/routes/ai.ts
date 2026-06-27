import { Router } from 'express';
import { aiService } from '../services/aiService';
import { ChatRequest } from '../types';

const router = Router();

// POST /api/ai/chat - 非流式对话
router.post('/chat', async (req, res) => {
  try {
    const { sessionId, message, history } = req.body;
    if (!sessionId || !message) {
      res.status(400).json({
        code: 400,
        message: '缺少必要参数: sessionId 和 message',
        data: null,
      });
      return;
    }

    const chatRequest: ChatRequest = { sessionId, message, history };
    const response = await aiService.processChat(chatRequest);

    res.json({
      code: 0,
      message: 'ok',
      data: response,
    });
  } catch (err: any) {
    console.error('AI chat error:', err);
    res.status(500).json({
      code: 500,
      message: '服务内部错误，请稍后重试',
      data: null,
    });
  }
});

// POST /api/ai/chat/stream - 流式对话 (SSE)
router.post('/chat/stream', async (req, res) => {
  try {
    const { sessionId, message, history } = req.body;
    if (!sessionId || !message) {
      res.status(400).json({
        code: 400,
        message: '缺少必要参数: sessionId 和 message',
        data: null,
      });
      return;
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲

    const chatRequest: ChatRequest = { sessionId, message, history };

    let buffer = '';
    let disclaimer = '';

    await aiService.processChatStream(
      chatRequest,
      (chunk: string) => {
        buffer += chunk;
        // 每累积一定字符发送一次，降低网络开销
        if (buffer.length >= 10) {
          res.write(
            `data: ${JSON.stringify({ sessionId, chunk: buffer, done: false })}

`
          );
          buffer = '';
        }
      },
      (disclaimerText: string) => {
        disclaimer = disclaimerText;
        // 发送剩余缓冲区和完成标记
        if (buffer.length > 0) {
          res.write(
            `data: ${JSON.stringify({ sessionId, chunk: buffer, done: false })}

`
          );
          buffer = '';
        }
        res.write(
          `data: ${JSON.stringify({ sessionId, chunk: '', disclaimer, done: true })}

`
        );
        res.end();
      }
    );
  } catch (err: any) {
    console.error('AI chat stream error:', err);
    // 如果已设置 SSE 头，用 SSE 格式返回错误
    if (!res.headersSent) {
      res.status(500).json({
        code: 500,
        message: '服务内部错误，请稍后重试',
        data: null,
      });
    } else {
      res.write(
        `data: ${JSON.stringify({ error: '服务内部错误，请稍后重试' })}

`
      );
      res.end();
    }
  }
});

export default router;