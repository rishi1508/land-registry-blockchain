import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { WalletContext } from './WalletContext';

const Navbar = () => {
  const { isConnected, accountName, connectWallet, networkError } = useContext(WalletContext);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar-dark-custom">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <NavLink to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
          Land Registry
        </NavLink>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {menuOpen ? '\u2715' : '\u2630'}
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/manage-land" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Manage</NavLink>
          <NavLink to="/search" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Search</NavLink>
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Admin</NavLink>

          <div className="nav-wallet">
            {isConnected ? (
              <div className="wallet-badge">
                <span className="dot"></span>
                <span>{accountName}</span>
              </div>
            ) : (
              <button className="btn-gradient btn-sm-custom" onClick={connectWallet}>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>

      {networkError && (
        <div style={{ maxWidth: 1200, margin: '0.5rem auto 0', padding: '0 1.5rem' }}>
          <div className="alert-dark alert-warning-dark" style={{ marginBottom: 0 }}>
            {networkError}
          </div>
        </div>
      )}

      <style>{`
        .mobile-menu-btn {
          display: none;
          background: none;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 6px 10px;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 1.2rem;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .nav-wallet { margin-left: 1rem; }
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block; }
          .nav-links {
            display: none;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(10, 14, 23, 0.98);
            border-bottom: 1px solid var(--border-color);
            padding: 1rem;
            gap: 0.25rem;
            z-index: 999;
          }
          .nav-links.open { display: flex; }
          .nav-wallet { margin-left: 0; margin-top: 0.75rem; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
