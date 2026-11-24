import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 注意：dev 模式不使用 StrictMode，避免 SSE 流式 fetch 被
// React 的 double-invoke effects 提前 abort (ERR_ABORTED)
// 生产构建依然安全，StrictMode 不影响 prod 运行时
createRoot(document.getElementById('root')!).render(<App />);
