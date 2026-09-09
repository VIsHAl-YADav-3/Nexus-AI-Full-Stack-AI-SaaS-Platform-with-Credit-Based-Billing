import { Toaster } from 'react-hot-toast';

const Toast = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 3500,
      style: {
        background: '#18181b',
        color: '#f4f4f5',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        fontSize: '14px',
        padding: '12px 16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      },
      success: {
        iconTheme: { primary: '#10b981', secondary: '#18181b' },
      },
      error: {
        iconTheme: { primary: '#ef4444', secondary: '#18181b' },
      },
    }}
  />
);

export default Toast;
