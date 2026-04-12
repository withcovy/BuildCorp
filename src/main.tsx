import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Electron 환경이 아니면 mock API 사용 (브라우저 개발/테스트용)
if (!window.electronAPI) {
  import('./mock/electronAPI').then(({ mockElectronAPI }) => {
    window.electronAPI = mockElectronAPI as any;
    renderApp();
  });
} else {
  renderApp();
}

function renderApp() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
