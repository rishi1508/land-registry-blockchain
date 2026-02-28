import React from 'react';
import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer-dark">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <div>
            <div className="footer-brand">Land Registry</div>
            <p className="footer-text">
              Decentralized land registry system powered by Ethereum blockchain. Secure, transparent, and tamper-proof property records.
            </p>
            <div className="footer-social" style={{ marginTop: '1rem' }}>
              <a href="https://github.com/rishi1508/land-registry-blockchain" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <FaGithub size={16} />
              </a>
              <a href="https://www.linkedin.com/in/rishimishra1508" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FaLinkedin size={16} />
              </a>
              <a href="mailto:rishimishra1508@gmail.com" aria-label="Email">
                <FaEnvelope size={16} />
              </a>
            </div>
          </div>

          <div>
            <h6 className="footer-heading">Quick Links</h6>
            <a href="/land-registry-blockchain/" className="footer-link">Home</a>
            <a href="/land-registry-blockchain/manage-land" className="footer-link">Manage Land</a>
            <a href="/land-registry-blockchain/search" className="footer-link">Property Search</a>
            <a href="/land-registry-blockchain/admin" className="footer-link">Admin Panel</a>
          </div>

          <div>
            <h6 className="footer-heading">Technology</h6>
            <span className="footer-link" style={{ cursor: 'default' }}>Solidity Smart Contracts</span>
            <span className="footer-link" style={{ cursor: 'default' }}>Ethereum (Sepolia Testnet)</span>
            <span className="footer-link" style={{ cursor: 'default' }}>React.js + Web3.js</span>
            <span className="footer-link" style={{ cursor: 'default' }}>Truffle Framework</span>
          </div>

          <div>
            <h6 className="footer-heading">Contact</h6>
            <a href="mailto:rishimishra1508@gmail.com" className="footer-link">rishimishra1508@gmail.com</a>
            <a href="https://github.com/rishi1508" target="_blank" rel="noopener noreferrer" className="footer-link">github.com/rishi1508</a>
          </div>
        </div>

        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Land Registry Blockchain. Built by Rishi Mishra.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
