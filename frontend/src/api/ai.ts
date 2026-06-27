import { post } from './request';

export interface ChatRequest {
  sessionId: string;
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  code: number;
  message: string;
  data: {
    sessionId: string;
    reply: string;
    type: 'text' | 'chart' | 'data';
    disclaimer: string;
    data?: any;
  };
}

export function sendChat(req: ChatRequest) {
  return post<ChatResponse>('/ai/chat', req);
}

export function sendChatStream(req: ChatRequest, onChunk: (chunk: string, done: boolean) => void) {
  // H5 使用 fetch 实现 SSE
  // #ifdef H5
  fetch(`http://localhost:3000/api/ai/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  }).then((res) => {
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    function read() {
      reader.read().then(({ done, value }) => {
        if (done) { onChunk('', true); return; }
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');
        lines.forEach((line) => {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onChunk(data.chunk || '', data.done);
            } catch {}
          }
        });
        read();
      });
    }
    read();
  });
  // #endif
}
