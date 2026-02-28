import React, { useState, useEffect, useContext, useCallback } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { WalletContext } from './WalletContext';
import config from '../config';

const ADMIN_ADDRESS = config.ADMIN_ADDRESS;

const AdminPanel = () => {
  const { isConnected, contract, account, connectWallet } = useContext(WalletContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allLands, setAllLands] = useState([]);
  const [pastOwners, setPastOwners] = useState([]);
  const [landIdForHistory, setLandIdForHistory] = useState('');
  const [activeSection, setActiveSection] = useState('show');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const checkAdminStatus = useCallback(() => {
    if (!account) return;
    const isAdminAccount = account.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
    setIsAdmin(isAdminAccount);
  }, [account]);

  useEffect(() => {
    if (isConnected && account) checkAdminStatus();
  }, [isConnected, account, checkAdminStatus]);

  const fetchAllLands = useCallback(async () => {
    if (!contract || !isAdmin) return;
    setIsLoading(true);
    setError('');
    try {
      const allLandsData = await contract.methods.getAllLands().call({ from: account });
      setAllLands(allLandsData);
      if (allLandsData.length === 0) setError('No lands registered yet.');
    } catch (err) {
      console.error('Error fetching lands:', err);
      setError('Failed to fetch lands: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [contract, isAdmin, account]);

  const fetchPastOwners = useCallback(async () => {
    if (!landIdForHistory || !contract || !isAdmin) return;
    setIsLoading(true);
    setError('');
    try {
      const land = await contract.methods.lands(landIdForHistory).call();
      if (land.id === '0' || land.owner === '0x0000000000000000000000000000000000000000') {
        setError('Land ID does not exist.');
        setIsLoading(false);
        return;
      }
      const history = await contract.methods.getPastOwnershipDetails(landIdForHistory).call({ from: account });
      setPastOwners(history.map(item => ({ owner: item.owner, timestamp: Number(item.timestamp) })));
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to fetch ownership history.');
    } finally {
      setIsLoading(false);
    }
  }, [contract, isAdmin, landIdForHistory, account]);

  return (
    <div>
      <Navbar />
      <div className="page-wrapper">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">Admin Panel</h1>
            <p className="page-description">Administrative tools for managing the land registry</p>
          </div>

          {!isConnected || !isAdmin ? (
            <div className="empty-state">
              <div className="empty-icon">&#128272;</div>
              <div className="empty-title">Administrator Access Required</div>
              <p className="empty-desc">
                {!isConnected
                  ? 'Connect your wallet to access the admin panel.'
                  : `Connected: ${config.shortenAddress(account)} - This is not the admin account.`}
              </p>
              {!isConnected ? (
                <button className="btn-gradient" onClick={connectWallet} style={{ marginTop: '1rem' }}>Connect Wallet</button>
              ) : (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>Admin address:</div>
                  <div className="address-badge">{ADMIN_ADDRESS}</div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="alert-dark alert-success-dark">
                <span>&#10003;</span> Connected as Admin: {config.shortenAddress(account)}
              </div>

              <div className="section-tabs">
                <button className={`section-tab ${activeSection === 'show' ? 'active' : ''}`} onClick={() => { setActiveSection('show'); setError(''); }}>
                  All Lands
                </button>
                <button className={`section-tab ${activeSection === 'history' ? 'active' : ''}`} onClick={() => { setActiveSection('history'); setError(''); setPastOwners([]); }}>
                  Ownership History
                </button>
              </div>

              {/* All Lands */}
              {activeSection === 'show' && (
                <div className="fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>All Registered Lands</h3>
                    <button className="btn-gradient btn-sm-custom" onClick={fetchAllLands} disabled={isLoading}>
                      {isLoading ? <><span className="spinner-dark" style={{ marginRight: 6 }}></span>Loading...</> : 'Fetch All Lands'}
                    </button>
                  </div>

                  {error && <div className="alert-dark alert-error-dark">{error}</div>}

                  {allLands.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table-dark-custom">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Plot #</th>
                            <th>Area</th>
                            <th>District</th>
                            <th>City</th>
                            <th>State</th>
                            <th>Size (sq.yd)</th>
                            <th>Owner</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allLands.map(land => (
                            <tr key={land.id}>
                              <td>{Number(land.id)}</td>
                              <td>{land.plotNumber}</td>
                              <td>{land.area}</td>
                              <td>{land.district}</td>
                              <td>{land.city}</td>
                              <td>{land.state}</td>
                              <td>{Number(land.areaSqYd).toLocaleString()}</td>
                              <td><span className="address-badge">{config.shortenAddress(land.owner)}</span></td>
                              <td><span className={`sale-badge ${land.isForSale ? 'for-sale' : 'not-for-sale'}`}>{land.isForSale ? 'For Sale' : 'Held'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {allLands.length === 0 && !error && !isLoading && (
                    <div className="empty-state">
                      <div className="empty-icon">&#128196;</div>
                      <div className="empty-title">No Data Loaded</div>
                      <p className="empty-desc">Click "Fetch All Lands" to load all registered properties from the blockchain.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Ownership History */}
              {activeSection === 'history' && (
                <div className="fade-in">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Past Ownership Details</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', maxWidth: 400, marginBottom: '1.5rem' }}>
                    <input className="form-input" type="number" placeholder="Enter Land ID" value={landIdForHistory} onChange={e => setLandIdForHistory(e.target.value)} style={{ background: 'var(--bg-input)' }} />
                    <button className="btn-gradient btn-sm-custom" onClick={fetchPastOwners} disabled={isLoading} style={{ whiteSpace: 'nowrap' }}>
                      {isLoading ? <span className="spinner-dark"></span> : 'Search'}
                    </button>
                  </div>

                  {error && <div className="alert-dark alert-error-dark">{error}</div>}

                  {pastOwners.length > 0 && (
                    <div className="dark-card">
                      <div className="card-header-custom">
                        <span style={{ fontWeight: 600 }}>Ownership History for Land #{landIdForHistory}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pastOwners.length} record(s)</span>
                      </div>
                      <div className="card-body-custom">
                        <div className="timeline">
                          {pastOwners.map((owner, index) => (
                            <div key={index} className="timeline-item">
                              <div className="timeline-label">
                                {index === 0 ? 'Original Registration' : `Transfer #${index}`}
                              </div>
                              <div className="timeline-address">{owner.owner}</div>
                              <div className="timeline-date">{new Date(owner.timestamp * 1000).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPanel;
