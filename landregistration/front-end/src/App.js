import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { WalletProvider } from './components/WalletContext';
import LandingPage from './components/LandingPage';
import ManageLandPage from './components/ManageLandPage';
import AdminPanel from './components/AdminPanel';
import PropertySearch from './components/PropertySearch';

function App() {
  return (
    <WalletProvider>
      <Router basename="/land-registry-blockchain">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/manage-land" element={<ManageLandPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/search" element={<PropertySearch />} />
        </Routes>
      </Router>
    </WalletProvider>
  );
}

export default App;
