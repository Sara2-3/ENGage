import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AuthProvider } from './Context/Auth';
import { CaseProvider } from './Context/CaseContext';
import { StaffingProvider } from './Context/StaffingContext';
import App from './index';
import ProtectedRoute from './Services/ProtectedRoute';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProtectedRoute>
        {(role) => (
          <CaseProvider>
            <StaffingProvider>
              <App role={role} />
            </StaffingProvider>
          </CaseProvider>
        )}
      </ProtectedRoute>
    </AuthProvider>
  </StrictMode>,
);
