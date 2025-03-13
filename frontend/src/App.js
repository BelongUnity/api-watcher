import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import store from './redux/store';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/routing/PrivateRoute';

// Pages
import Dashboard from './components/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ApiDetail from './pages/ApiDetail';
import ApiForm from './pages/ApiForm';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="d-flex flex-column min-vh-100 bg-light">
          <Header />
          <main className="flex-grow-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<PrivateRoute component={Dashboard} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/api/:id" element={<PrivateRoute component={ApiDetail} />} />
              <Route path="/api/new" element={<PrivateRoute component={ApiForm} />} />
              <Route path="/api/edit/:id" element={<PrivateRoute component={ApiForm} />} />
              <Route path="/profile" element={<PrivateRoute component={Profile} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </Provider>
  );
}

export default App; 