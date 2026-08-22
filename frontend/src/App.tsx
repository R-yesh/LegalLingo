import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { DocumentProvider } from './context/DocumentContext';
import { Layout } from './components/layout/Layout';
import { RequireAuth } from './components/auth/RequireAuth';
import { LandingPage } from './pages/LandingPage';
import { UploadPage } from './pages/UploadPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ClauseDetailPage } from './pages/ClauseDetailPage';
import { SchemesPage } from './pages/SchemesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AIPage } from './pages/AIPage';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { OnboardingPage } from './pages/OnboardingPage';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DocumentProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/schemes" element={<SchemesPage />} />

                {/* Only the real-upload flow requires sign-in — the interactive sample
                    document, its analysis, clause detail, and AI chat stay open so
                    people can explore LegalLingo before creating an account (see
                    "Demo Mode" in frontend/index.md: sample access must never be
                    gated behind an extra step). */}
                <Route path="/upload" element={<RequireAuth><UploadPage /></RequireAuth>} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/documents/:documentId/analysis" element={<AnalysisPage />} />
                <Route path="/documents/:documentId/clause/:clauseId" element={<ClauseDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/ai" element={<AIPage />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </DocumentProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
