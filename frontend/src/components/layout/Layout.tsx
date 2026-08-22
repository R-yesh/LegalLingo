import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AIChatDrawer } from '../ai/AIChatDrawer';
import { useDocument } from '../../context/DocumentContext';
import { Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAIChatOpen, setIsAIChatOpen } = useDocument();
  const location = useLocation();

  // Don't show floating button on dedicated /ai page
  const isDedicatedAIPage = location.pathname === '/ai';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-canvas text-charcoal">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Floating AI Assistant Trigger Button */}
      {!isDedicatedAIPage && !isAIChatOpen && (
        <button
          onClick={() => setIsAIChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-brand-700 to-indigo-600 hover:from-brand-800 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-xl hover:shadow-2xl flex items-center gap-2.5 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-brand-500/30"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>Ask Legal AI</span>
        </button>
      )}

      {/* Slide-over AI Chat Panel */}
      <AIChatDrawer />

      <Footer />
    </div>
  );
};
