
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function MainLayout() {
  return (
    <div className="layout-grid">
      <Sidebar />
      <div className="flex flex-col min-h-screen bg-ink-50">
        <Topbar />
        <main className="flex-1 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
