import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AboutCard from '../components/home/AboutCard';
import TechBubbles from '../components/home/TechBubbles';

const Home: React.FC = () => {
  // Typewriter effect for intro text
  const [displayText, setDisplayText] = React.useState('');
  const fullText = "Hi, I am a Computer Engineering student with a passion for technology, problem-solving, and exploring diverse opportunities to learn and grow.";
  
  React.useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayText(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);
    
    return () => clearInterval(typingInterval);
  }, []);

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    Sanat Karkhanis'
                  </motion.span>
                  <br />
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    Interactive Portfolio
                  </motion.span>
                </motion.div>
              </motion.div>
              <br />
              
              <motion.div
                className="h-16 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  {displayText}
                  <span className="ml-1 inline-block w-2 h-5 bg-blue-500 animate-blink"></span>
                </p>
              </motion.div>
              
              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <Link
                  to="/projects"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300 flex items-center"
                >
                  View Projects
                  <ArrowRight size={18} className="ml-2" />
                </Link>
                
                <Link
                  to="/skills"
                  className="px-6 py-3 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 font-medium rounded-md transition-colors duration-300"
                >
                  Explore Skills
                </Link>
              </motion.div>
            </div>
            
            <div className="md:w-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <AboutCard />
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Tech Bubbles Section */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/30">
        <div className="container mx-auto">
          <motion.h2 
            className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Technologies I Work With
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <TechBubbles />
          </motion.div>
          
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Drag the bubbles around to interact with them!
            </p>
            
            <Link
              to="/contact"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300 inline-flex items-center"
            >
              Get In Touch
              <ArrowRight size={18} className="ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;