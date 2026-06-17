
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { GroupsListPage } from '@/pages/groups/GroupsListPage';
import { GroupDetailPage } from '@/pages/groups/GroupDetailPage';
import { TemplatesListPage } from '@/pages/templates/TemplatesListPage';
import { ScheduleTasksPage } from '@/pages/templates/ScheduleTasksPage';
import { MembersListPage } from '@/pages/members/MembersListPage';
import { TagsManagePage } from '@/pages/members/TagsManagePage';
import { SegmentsPage } from '@/pages/members/SegmentsPage';
import { AlertsCenterPage } from '@/pages/alerts/AlertsCenterPage';
import { KeywordsConfigPage } from '@/pages/alerts/KeywordsConfigPage';
import { AnalyticsOverviewPage } from '@/pages/analytics/AnalyticsOverviewPage';
import { StrategyComparePage } from '@/pages/analytics/StrategyComparePage';
import { LifecycleManagePage } from '@/pages/lifecycle/LifecycleManagePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/groups" element={<GroupsListPage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route path="/templates" element={<TemplatesListPage />} />
            <Route path="/templates/schedule" element={<ScheduleTasksPage />} />
            <Route path="/members" element={<MembersListPage />} />
            <Route path="/members/tags" element={<TagsManagePage />} />
            <Route path="/members/segments" element={<SegmentsPage />} />
            <Route path="/alerts" element={<AlertsCenterPage />} />
            <Route path="/alerts/settings" element={<KeywordsConfigPage />} />
            <Route path="/analytics" element={<AnalyticsOverviewPage />} />
            <Route path="/analytics/compare" element={<StrategyComparePage />} />
            <Route path="/lifecycle" element={<LifecycleManagePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
