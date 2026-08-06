import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './store/authStore.jsx';
import { ThemeProvider } from './store/themeStore.jsx';
import { PlatformSettingsProvider } from './store/platformSettingsContext.jsx';
import AppRoutes from './routes/AppRoutes';
import OfflineGuard from './components/OfflineGuard.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import DialogToaster from './components/DialogToaster.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <OfflineGuard>
        <BrowserRouter>
          <AuthProvider>
            <PlatformSettingsProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
              <DialogToaster />
            </PlatformSettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </OfflineGuard>
    </ThemeProvider>
  );
}
