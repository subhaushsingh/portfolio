import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import { Footer, Navbar } from "./components";
import { About, Contact, Home, Landing2D, Projects } from "./pages";

const App = () => {
  return (
    <main className='bg-slate-300/20'>
      <Router>
        <Routes>
          {/* 2D landing page — new homepage, no Navbar/Footer wrapping needed if it's a standalone single-scroll page */}
          <Route path='/' element={<Landing2D />} />

          {/* 3D experience — moved from / to /experience, kept nav-free like the original design */}
          <Route path='/experience' element={<Home />} />

          {/* Everything else keeps Navbar + Footer */}
          <Route
            path='/*'
            element={
              <>
                <Navbar />
                <Routes>
                  <Route path='about' element={<About />} />
                  <Route path='projects' element={<Projects />} />
                  <Route path='contact' element={<Contact />} />
                </Routes>
                <Footer />
              </>
            }
          />
        </Routes>
      </Router>
    </main>
  );
};

export default App;