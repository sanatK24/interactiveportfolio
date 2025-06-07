import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import { ToastProvider } from './components/ui/ToastContext';
import { Toaster } from 'react-hot-toast';
import Toast from './components/ui/Toast';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CommandPalette from './components/ui/CommandPalette';
import Home from './pages/Home';
import Skills from './pages/Skills';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import EducationExperience from './pages/EducationExperience';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <CommandPaletteProvider>
          <ToastProvider>
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
              <Toaster position="top-right" />
              <Header />
              <main className="flex-grow pt-16">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/skills" element={<Skills />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/education" element={<EducationExperience />} />
                </Routes>
              </main>
              <Footer />
              <CommandPalette />
              <Toast />
            </div>
          </ToastProvider>
        </CommandPaletteProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;