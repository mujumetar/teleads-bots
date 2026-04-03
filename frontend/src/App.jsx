import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import CampaignCreate from './pages/CampaignCreate';
import CampaignDetail from './pages/CampaignDetail';
import Groups from './pages/Groups';
import GroupCreate from './pages/GroupCreate';
import Wallet from './pages/Wallet';
import AdminDashboard from './pages/AdminDashboard';
import SuperadminDashboard from './pages/SuperadminDashboard';
import Analytics from './pages/Analytics';
import AdInbox from './pages/AdInbox';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected inside Layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/campaigns"      element={<Campaigns />} />
            <Route path="/campaigns/new"  element={<CampaignCreate />} />
            <Route path="/campaigns/edit/:id" element={<CampaignCreate />} />
            <Route path="/campaigns/:id"  element={<CampaignDetail />} />
            <Route path="/groups"         element={<Groups />} />
            <Route path="/groups/new"     element={<GroupCreate />} />
            <Route path="/groups/edit/:id" element={<GroupCreate />} />
            <Route path="/wallet"         element={<Wallet />} />
            <Route path="/analytics"      element={<Analytics />} />
            <Route path="/ad-inbox"       element={<AdInbox />} />

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin','superadmin']}><AdminDashboard /></ProtectedRoute>
            } />
          </Route>

          {/* Superadmin - Standalone Layout */}
          <Route path="/superadmin" element={<Navigate to="/superadmin/overview" replace />} />
          <Route path="/superadmin/:tab" element={
            <ProtectedRoute roles={['superadmin']}><SuperadminDashboard /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
