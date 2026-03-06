import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function CitizenLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-cta-500 focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content / الانتقال إلى المحتوى الرئيسي
      </a>
      <Header />
      <main id="main-content" className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
