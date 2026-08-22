import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { DocumentProvider } from './context/DocumentContext';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './pages/LandingPage';
import { UploadPage } from './pages/UploadPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ClauseDetailPage } from './pages/ClauseDetailPage';
import { SchemesPage } from './pages/SchemesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AIPage } from './pages/AIPage';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <DocumentProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/documents/:documentId/analysis" element={<AnalysisPage />} />
              <Route path="/documents/:documentId/clause/:clauseId" element={<ClauseDetailPage />} />
              <Route path="/schemes" element={<SchemesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/ai" element={<AIPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </DocumentProvider>
    </LanguageProvider>
  );
};

export default App;
