import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BackofficeHeader from './BackofficeHeader';

export default function BackofficeLayout() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <BackofficeHeader />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
