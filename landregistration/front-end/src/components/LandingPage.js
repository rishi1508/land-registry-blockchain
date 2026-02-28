import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { WalletContext } from './WalletContext';
import config from '../config';

const LandingPage = () => {
  const { isConnected, contract, account, connectWallet } = useContext(WalletContext);
  const [stats, setStats] = useState({ totalLands: 0, myLands: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!contract) return;
      try {
        const total = await contract.methods.landCount().call();
        setStats(prev => ({ ...prev, totalLands: Number(total) }));

        if (account) {
          const myLandIds = await contract.methods.getLandsByOwner(account).call();
          setStats(prev => ({ ...prev, myLands: myLandIds.length }));
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, [contract, account]);

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-content fade-in-up">
          <div className="hero-tag">
            <span>&#9670;</span> Powered by Ethereum Blockchain
          </div>
          <h1 className="hero-title">
            Secure Land Registry<br />
            on the <span className="gradient-text">Blockchain</span>
          </h1>
          <p className="hero-subtitle">
            A decentralized system for transparent, tamper-proof land ownership records. Register, verify, and transfer property ownership with the security of smart contracts.
          </p>
          <div className="hero-actions">
            {isConnected ? (
              <Link to="/manage-land" className="btn-gradient">
                Manage Properties &rarr;
              </Link>
            ) : (
              <button className="btn-gradient" onClick={connectWallet}>
                Connect MetaMask Wallet
              </button>
            )}
            <a href="#how-it-works" className="btn-outline-custom">
              Learn How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Testnet Notice */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="testnet-banner">
          <span style={{ fontSize: '1.2rem' }}>&#9888;</span>
          <div>
            <strong>Sepolia Testnet</strong> &mdash; This application runs on the Ethereum Sepolia test network. No real assets are involved. Get free test ETH from a{' '}
            <a href="https://www.alchemy.com/faucets/ethereum-sepolia" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-amber)', textDecoration: 'underline' }}>
              Sepolia faucet
            </a>.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="stats-grid">
          <div className="stat-card fade-in-up">
            <div className="stat-icon blue">&#9632;</div>
            <div className="stat-value">{stats.totalLands}</div>
            <div className="stat-label">Registered Properties</div>
          </div>
          <div className="stat-card fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon purple">&#9733;</div>
            <div className="stat-value">{stats.myLands}</div>
            <div className="stat-label">Your Properties</div>
          </div>
          <div className="stat-card fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon green">&#10003;</div>
            <div className="stat-value">Sepolia</div>
            <div className="stat-label">Network</div>
          </div>
          <div className="stat-card fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="stat-icon cyan">&#9830;</div>
            <div className="stat-value">{isConnected ? 'Active' : 'Disconnected'}</div>
            <div className="stat-label">Wallet Status</div>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <section id="how-it-works" className="how-it-works">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Four simple steps to register and manage land ownership on the blockchain
          </p>

          <div className="steps-grid">
            <div className="step-card fade-in-up">
              <div className="step-number">1</div>
              <div className="step-icon">&#128274;</div>
              <h3 className="step-title">Connect Your Wallet</h3>
              <p className="step-desc">
                Install MetaMask, switch to Sepolia testnet, and connect your wallet to authenticate your identity on the blockchain.
              </p>
            </div>

            <div className="step-card fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="step-number">2</div>
              <div className="step-icon">&#128221;</div>
              <h3 className="step-title">Register Property</h3>
              <p className="step-desc">
                Submit land details including plot number, area, district, and city. A unique hash prevents duplicate registrations.
              </p>
            </div>

            <div className="step-card fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="step-number">3</div>
              <div className="step-icon">&#128269;</div>
              <h3 className="step-title">Verify Ownership</h3>
              <p className="step-desc">
                Anyone can verify land ownership by looking up the Land ID. All records are immutable and publicly auditable.
              </p>
            </div>

            <div className="step-card fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="step-number">4</div>
              <div className="step-icon">&#128257;</div>
              <h3 className="step-title">Transfer Ownership</h3>
              <p className="step-desc">
                List land for sale, receive transfer requests, and approve or deny them. Every transfer is recorded on-chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
          <h2 className="section-title">Key Features</h2>
          <p className="section-subtitle">
            Built with security, transparency, and ease of use in mind
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: '&#128274;', title: 'Immutable Records', desc: 'Once registered, land records cannot be tampered with. The blockchain ensures permanent, verifiable ownership history.' },
              { icon: '&#128269;', title: 'Public Verification', desc: 'Anyone can verify land ownership using the Land ID. Full transparency with no intermediaries required.' },
              { icon: '&#128176;', title: 'Smart Contract Automation', desc: 'Transfer workflows are enforced by Solidity smart contracts - request, approve, or deny transfers trustlessly.' },
              { icon: '&#128272;', title: 'Duplicate Prevention', desc: 'A cryptographic hash of plot details prevents the same land from being registered twice.' },
              { icon: '&#128101;', title: 'Role-Based Access', desc: 'Admin controls for oversight, owner-only operations for property management, and public read access for verification.' },
              { icon: '&#128200;', title: 'Ownership History', desc: 'Complete chain of ownership with timestamps, providing an auditable trail for every property.' },
            ].map((f, i) => (
              <div key={i} className="feature-card-dark fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon-dark" dangerouslySetInnerHTML={{ __html: f.icon }} />
                <h3 className="feature-title-dark">{f.title}</h3>
                <p className="feature-desc-dark">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contract Info */}
      <section style={{ padding: '4rem 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
          <div className="dark-card">
            <div className="card-header-custom">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Smart Contract Details</h3>
              <span className="sale-badge for-sale">Deployed on Sepolia</span>
            </div>
            <div className="card-body-custom">
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Contract Address</div>
                  <a
                    href={`${config.BLOCK_EXPLORER}/address/${config.CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="address-badge"
                    style={{ textDecoration: 'none' }}
                  >
                    {config.CONTRACT_ADDRESS}
                  </a>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Admin Address</div>
                  <a
                    href={`${config.BLOCK_EXPLORER}/address/${config.ADMIN_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="address-badge"
                    style={{ textDecoration: 'none' }}
                  >
                    {config.ADMIN_ADDRESS}
                  </a>
                </div>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Network</div>
                    <span style={{ fontWeight: 500 }}>Sepolia Testnet (Chain ID: {config.NETWORK_ID})</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Solidity Version</div>
                    <span style={{ fontWeight: 500 }}>^0.8.9</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
