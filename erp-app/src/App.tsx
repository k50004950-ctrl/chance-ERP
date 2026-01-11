import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

// 인사관리
import Employees from './pages/hr/Employees';
import AttendancePage from './pages/hr/Attendance';
import LeaveCalendar from './pages/hr/LeaveCalendar';
import Leaves from './pages/hr/Leaves';

// 관리자 - 영업자 일정/메모 관리
import SalespersonSchedules from './pages/admin/SalespersonSchedules';
import SalesClientsManagement from './pages/admin/SalesClientsManagement';
import CommissionSummary from './pages/admin/CommissionSummary';
import MonthlyPerformance from './pages/admin/MonthlyPerformance';

// DB관리
import SalesDBRegister from './pages/sales-db/Register';
import SalesDBSearch from './pages/sales-db/Search';

// 영업자 관리
import SalespersonCommissionStatement from './pages/salesperson/CommissionStatement';
import SalespersonRegister from './pages/salesperson/Register';
import ScheduleManagement from './pages/salesperson/ScheduleManagement';
import MemoManagement from './pages/salesperson/MemoManagement';
import MonthlyRanking from './pages/salesperson/MonthlyRanking';

// 섭외자 관리
import RecruiterMyData from './pages/recruiter/MyData';

// 계약 관리
import SalesCommission from './pages/contract/SalesCommission';
import RecruitmentCommission from './pages/contract/RecruitmentCommission';

// 설정
import AccountSettings from './pages/settings/AccountSettings';
import CompanySettings from './pages/settings/CompanySettings';
import MyAccountEdit from './pages/settings/MyAccountEdit';
import CompleteProfile from './pages/settings/CompleteProfile';

// 관리자 - 계정 변경 승인
import AccountChangeApproval from './pages/admin/AccountChangeApproval';
import SalespersonPerformance from './pages/admin/SalespersonPerformance';
import RecruiterPerformance from './pages/admin/RecruiterPerformance';
import NoticeManagement from './pages/admin/NoticeManagement';

// 출퇴근
import ClockIn from './pages/attendance/ClockIn';
import ClockOut from './pages/attendance/ClockOut';
import LeaveRequest from './pages/attendance/LeaveRequest';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* 프로필 완성 페이지 (Layout 없이) */}
          <Route path="/settings/complete-profile" element={<CompleteProfile />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* 출퇴근 */}
            <Route path="attendance/clock-in" element={<ClockIn />} />
            <Route path="attendance/clock-out" element={<ClockOut />} />
            <Route path="attendance/leave-request" element={<LeaveRequest />} />
            
            {/* 인사관리 */}
            <Route path="hr/employees" element={<Employees />} />
            <Route path="hr/attendance" element={<AttendancePage />} />
            <Route path="hr/attendance-status" element={<LeaveCalendar />} />
            <Route path="hr/leaves" element={<Leaves />} />
            
            {/* 관리자 - 영업자 일정/메모 */}
            <Route path="admin/salesperson-schedules" element={<SalespersonSchedules />} />
            <Route path="admin/sales-clients" element={<SalesClientsManagement />} />
            <Route path="admin/monthly-performance" element={<MonthlyPerformance />} />
            <Route path="admin/salesperson-performance" element={<SalespersonPerformance />} />
            <Route path="admin/recruiter-performance" element={<RecruiterPerformance />} />
            <Route path="admin/commission-summary" element={<CommissionSummary />} />
            <Route path="admin/account-change-approval" element={<AccountChangeApproval />} />
            <Route path="admin/notice-management" element={<NoticeManagement />} />
            
            {/* DB관리 */}
            <Route path="sales-db/register" element={<SalesDBRegister />} />
            <Route path="sales-db/search" element={<SalesDBSearch />} />
            
            {/* 영업자 관리 */}
            <Route path="salesperson/commission-statement" element={<SalespersonCommissionStatement />} />
            <Route path="salesperson/register" element={<SalespersonRegister />} />
            <Route path="salesperson/schedules" element={<ScheduleManagement />} />
            <Route path="salesperson/memos" element={<MemoManagement />} />
            <Route path="salesperson/monthly-ranking" element={<MonthlyRanking />} />
            
            {/* 섭외자 관리 */}
            <Route path="recruiter/my-data" element={<RecruiterMyData />} />
            
            {/* 계약 관리 */}
            <Route path="contract/sales-commission" element={<SalesCommission />} />
            <Route path="contract/recruitment-commission" element={<RecruitmentCommission />} />
            
            {/* 설정 */}
            <Route path="settings/accounts" element={<AccountSettings />} />
            <Route path="settings/company" element={<CompanySettings />} />
            <Route path="settings/my-account" element={<MyAccountEdit />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
