import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/ToastContext';
import Toast from './components/ui/Toast';
import AdminRoute from './components/admin/AdminRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CommandPalette from './components/ui/CommandPalette';
import Home from './pages/Home';
import Skills from './pages/Skills';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCreate from './pages/AdminCreate';
import AdminProjects from './pages/admin/AdminProjects';
import AdminBlog from './pages/admin/AdminBlog';
import AdminContact from './pages/admin/AdminContact';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <CommandPaletteProvider>
            <ToastProvider>
                <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
                  <Header />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/skills" element={<Skills />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/admin-create" element={<AdminCreate />} />
                      <Route 
                        path="/admin/*" 
                        element={
                          <AdminRoute>
                            <AdminDashboard />
                          </AdminRoute>
                        }
                      >
                        <Route index element={<div className="text-center py-12">Welcome to Admin Dashboard</div>} />
                        <Route path="projects" element={<AdminProjects />} />
                        <Route path="blog" element={<AdminBlog />} />
                        <Route path="contact" element={<AdminContact />} />
                      </Route>
                    </Routes>
                  </main>
                  <Footer />
                  <Toast />
                  <CommandPalette />
                </div>
            </ToastProvider>
          </CommandPaletteProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;