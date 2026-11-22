import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentProfilePage from './pages/StudentProfilePage';
import EmployerProfilePage from './pages/EmployerProfilePage';
import HomePage from './pages/HomePage';
import JobDetailPage from './pages/JobDetailPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import EmployerJobsPage from './pages/EmployerJobsPage';
import JobFormPage from './pages/JobFormPage';
import ApplicantsPage from './pages/ApplicantsPage';
import RoleSelectPage from './pages/RoleSelectPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SavedJobsPage from './pages/SavedJobsPage';
import AdminPage from './pages/AdminPage';
import MatchedJobsPage from './pages/MatchedJobsPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import AdminJobDetailPage from './pages/AdminJobDetailPage';
import './App.css';

const SV = ['STUDENT'];
const NTD = ['EMPLOYER'];
const AD = ['ADMIN'];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/social/complete" element={<RoleSelectPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />

            <Route path="/student/profile" element={<ProtectedRoute roles={SV}><StudentProfilePage /></ProtectedRoute>} />
            <Route path="/student/saved" element={<ProtectedRoute roles={SV}><SavedJobsPage /></ProtectedRoute>} />
            <Route path="/student/applications" element={<ProtectedRoute roles={SV}><MyApplicationsPage /></ProtectedRoute>} />
          <Route path="/student/matched" element={<ProtectedRoute roles={SV}><MatchedJobsPage /></ProtectedRoute>} />

            <Route path="/employer/profile" element={<ProtectedRoute roles={NTD}><EmployerProfilePage /></ProtectedRoute>} />
            <Route path="/employer/jobs" element={<ProtectedRoute roles={NTD}><EmployerJobsPage /></ProtectedRoute>} />
            <Route path="/employer/jobs/new" element={<ProtectedRoute roles={NTD}><JobFormPage /></ProtectedRoute>} />
            <Route path="/employer/jobs/:id/edit" element={<ProtectedRoute roles={NTD}><JobFormPage /></ProtectedRoute>} />
            <Route path="/employer/jobs/:id/applicants" element={<ProtectedRoute roles={NTD}><ApplicantsPage /></ProtectedRoute>} />
            
            <Route path="/admin" element={<ProtectedRoute roles={AD}><AdminPage /></ProtectedRoute>} />
            <Route path="/admin/users/:id" element={<ProtectedRoute roles={AD}><AdminUserDetailPage /></ProtectedRoute>} />
            <Route path="/admin/jobs/:id" element={<ProtectedRoute roles={AD}><AdminJobDetailPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
