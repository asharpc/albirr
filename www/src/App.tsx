import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import Dashboard from "./pages/dashboard";
import StudentsPage from "./pages/students";
import StudentDetail from "./pages/students/StudentDetail";
import StaffPage from "./pages/staff";
import StaffDetail from "./pages/staff/StaffDetail";
import AddStaffForm from "./pages/staff/add";
import EditStaffForm from "./pages/staff/edit";
import FinancesPage from "./pages/finances";
import AddFeePage from "./pages/finances/add-fee";
import AddSalaryPage from "./pages/finances/add-salary";
import ReportsPage from "./pages/reports";
import ReceiptsPage from "./pages/receipts";
import Logout from "./pages/logout";
import NotFound from "./pages/NotFound";
import AddStudentForm from "./pages/students/add";
import EditStudentForm from "./pages/students/edit";

import ConfigPage from "./pages/ConfigPage";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const queryClient = new QueryClient();

const EditStudentFormWrapper = () => {
  const { id } = useParams();
  const { data: student, isLoading, error } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const response = await api.get(`/students/${id}/`);
      return response.data;
    },
  });

  const handleSubmit = async (formData: any) => {
    try {
      await api.put(`/students/${id}/`, formData);
      // Handle success (e.g., navigate back, show toast)
    } catch (error) {
      // Handle error
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading student</div>;
  if (!student) return <div>Student not found</div>;

  return <EditStudentForm student={student} onSubmit={handleSubmit} />;
};

const EditStaffFormWrapper = () => {
  const { id } = useParams();
  const { data: staff, isLoading, error } = useQuery({
    queryKey: ["staff", id],
    queryFn: async () => {
      const response = await api.get(`/staff/${id}/`);
      return response.data;
    },
  });

  const handleSubmit = async (formData: any) => {
    try {
      await api.put(`/staff/${id}/`, formData);
      // Handle success (e.g., navigate back, show toast)
    } catch (error) {
      // Handle error
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading staff member</div>;
  if (!staff) return <div>Staff member not found</div>;

  return <EditStaffForm staff={staff} onSubmit={handleSubmit} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SidebarProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/auth/login" replace />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                // <ProtectedRoute>
                  <Dashboard />
                // </ProtectedRoute>
              }
            />
            <Route
              path="/config"
              element={
                // <ProtectedRoute>
                  <ConfigPage />
                // </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute>
                  <StudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/:id"
              element={
                // <ProtectedRoute>
                  <StudentDetail />
                // </ProtectedRoute>
              }
            />
            <Route
              path="/students/add"
              element={
                // <ProtectedRoute>
                  <AddStudentForm />
                // </ProtectedRoute>
              }
            />
            <Route
              path="/students/edit/:id"
              element={
                <ProtectedRoute>
                  <EditStudentFormWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <StaffPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/:id"
              element={
                // <ProtectedRoute>
                  <StaffDetail />
                // </ProtectedRoute>
              }
            />
            <Route
              path="/staff/add"
              element={
                // <ProtectedRoute>
                  <AddStaffForm />
                // </ProtectedRoute>
              }
            />
            <Route
              path="/staff/edit/:id"
              element={
                <ProtectedRoute>
                  <EditStaffFormWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finances"
              element={
                <ProtectedRoute>
                  <FinancesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finances/add-fee"
              element={
                <ProtectedRoute>
                  <AddFeePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finances/add-salary"
              element={
                <ProtectedRoute>
                  <AddSalaryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receipts"
              element={
                <ProtectedRoute>
                  <ReceiptsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logout"
              element={
                <ProtectedRoute>
                  <Logout />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </SidebarProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;