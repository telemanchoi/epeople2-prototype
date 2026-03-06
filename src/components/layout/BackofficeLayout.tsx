import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BackofficeHeader from './BackofficeHeader';

export default function BackofficeLayout() {
  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-cta-500 focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content / الانتقال إلى المحتوى الرئيسي
      </a>
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <BackofficeHeader />
        <main id="main-content" className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
