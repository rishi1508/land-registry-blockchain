import React, { useState, useContext } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { WalletContext } from './WalletContext';
import config from '../config';

const PropertySearch = () => {
  const { contract, getAccountName } = useContext(WalletContext);
  const [searchType, setSearchType] = useState('id');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);

  const searchById = async (id) => {
    const result = await contract.methods.verifyLand(id).call();
    if (result[6] === '0x0000000000000000000000000000000000000000') return [];
    return [{
      id: Number(id),
      plotNumber: result[0], area: result[1], district: result[2],
      city: result[3], state: result[4], areaSqYd: Number(result[5]), owner: result[6]
    }];
  };

  const searchByOwner = async (address) => {
    const landIds = await contract.methods.getLandsByOwner(address).call();
    if (landIds.length === 0) return [];
    return Promise.all(landIds.map(async (id) => {
      const land = await contract.methods.lands(id).call();
      return {
        id: Number(id), plotNumber: land.plotNumber, area: land.area,
        district: land.district, city: land.city, state: land.state,
        areaSqYd: Number(land.areaSqYd), owner: land.owner
      };
    }));
  };

  const handleSearch = async () => {
    if (!contract) { setError('Contract not loaded. Connect wallet first.'); return; }
    if (!searchValue.trim()) { setError('Please enter a search value.'); return; }
    setIsLoading(true); setError(''); setResults([]); setSelectedProperty(null); setHistory([]);
    try {
      let found;
      if (searchType === 'id') {
        found = await searchById(searchValue);
      } else {
        if (!/^0x[a-fA-F0-9]{40}$/.test(searchValue)) { setError('Invalid Ethereum address format.'); setIsLoading(false); return; }
        found = await searchByOwner(searchValue);
      }
      if (found.length === 0) setError(`No properties found for this ${searchType === 'id' ? 'Land ID' : 'address'}.`);
      setResults(found);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please check your input.');
    } finally {
      setIsLoading(false);
    }
  };

  const viewDetails = async (property) => {
    setSelectedProperty(property);
    setHistory([]);
    try {
      // Try getPropertyHistory first (new function), fall back to getPastOwnershipDetails (admin)
      let hist;
      try {
        hist = await contract.methods.getPropertyHistory(property.id).call();
      } catch {
        try {
          hist = await contract.methods.getPastOwnershipDetails(property.id).call();
        } catch {
          hist = [];
        }
      }
      setHistory(hist.map(h => ({ owner: h.owner, timestamp: Number(h.timestamp) })));
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  const generateQRData = (property) => {
    const data = `Land Registry Verification\nID: ${property.id}\nPlot: ${property.plotNumber}\nLocation: ${property.area}, ${property.district}, ${property.city}, ${property.state}\nOwner: ${property.owner}\nContract: ${config.CONTRACT_ADDRESS}\nNetwork: Sepolia`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  };

  const printCertificate = () => {
    setShowCertificate(true);
    setTimeout(() => { window.print(); setShowCertificate(false); }, 500);
  };

  return (
    <div>
      <Navbar />
      <div className="page-wrapper">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">Property Search</h1>
            <p className="page-description">Search for properties by Land ID or owner address</p>
          </div>

          {/* Search Form */}
          <div className="dark-card no-print" style={{ marginBottom: '2rem' }}>
            <div className="card-body-custom">
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button className={`section-tab ${searchType === 'id' ? 'active' : ''}`} onClick={() => { setSearchType('id'); setSearchValue(''); setResults([]); setError(''); }}>
                  Search by ID
                </button>
                <button className={`section-tab ${searchType === 'owner' ? 'active' : ''}`} onClick={() => { setSearchType('owner'); setSearchValue(''); setResults([]); setError(''); }}>
                  Search by Owner
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="form-input"
                  type={searchType === 'id' ? 'number' : 'text'}
                  placeholder={searchType === 'id' ? 'Enter Land ID (e.g., 1)' : 'Enter Ethereum address (0x...)'}
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  style={{ background: 'var(--bg-input)' }}
                />
                <button className="btn-gradient" onClick={handleSearch} disabled={isLoading} style={{ whiteSpace: 'nowrap' }}>
                  {isLoading ? <span className="spinner-dark"></span> : 'Search'}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="alert-dark alert-error-dark no-print">{error}</div>}

          {/* Search Results */}
          {results.length > 0 && !selectedProperty && (
            <div className="no-print">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                Found {results.length} propert{results.length === 1 ? 'y' : 'ies'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {results.map(r => (
                  <div key={r.id} className="property-card" style={{ cursor: 'pointer' }} onClick={() => viewDetails(r)}>
                    <div className="property-id" style={{ marginBottom: '0.75rem' }}>Land #{r.id}</div>
                    {[['Plot', r.plotNumber], ['Location', `${r.area}, ${r.district}`], ['City', `${r.city}, ${r.state}`], ['Size', `${r.areaSqYd.toLocaleString()} sq. yd`], ['Owner', getAccountName(r.owner)]].map(([l, v]) => (
                      <div className="property-detail" key={l}><span className="label">{l}</span><span className="value">{v}</span></div>
                    ))}
                    <div style={{ marginTop: '0.75rem', textAlign: 'center', color: 'var(--accent-blue)', fontSize: '0.85rem', fontWeight: 500 }}>
                      Click for details &rarr;
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Property Detail View */}
          {selectedProperty && (
            <div className="fade-in">
              <button className="btn-outline-custom btn-sm-custom no-print" onClick={() => { setSelectedProperty(null); setHistory([]); }} style={{ marginBottom: '1.5rem' }}>
                &larr; Back to results
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Property Info */}
                <div className="dark-card no-print" style={{ gridColumn: window.innerWidth < 768 ? '1 / -1' : undefined }}>
                  <div className="card-header-custom">
                    <span style={{ fontWeight: 600 }}>Property Details</span>
                    <div className="property-id">Land #{selectedProperty.id}</div>
                  </div>
                  <div className="card-body-custom">
                    {[
                      ['Plot Number', selectedProperty.plotNumber],
                      ['Area / Locality', selectedProperty.area],
                      ['District', selectedProperty.district],
                      ['City', selectedProperty.city],
                      ['State', selectedProperty.state],
                      ['Size (sq. yards)', selectedProperty.areaSqYd.toLocaleString()],
                    ].map(([l, v]) => (
                      <div className="property-detail" key={l}><span className="label">{l}</span><span className="value">{v}</span></div>
                    ))}
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Current Owner</div>
                      <a href={`${config.BLOCK_EXPLORER}/address/${selectedProperty.owner}`} target="_blank" rel="noopener noreferrer" className="address-badge" style={{ textDecoration: 'none', fontSize: '0.8rem' }}>
                        {selectedProperty.owner}
                      </a>
                    </div>
                  </div>
                </div>

                {/* QR Code & Actions */}
                <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="dark-card">
                    <div className="card-header-custom">
                      <span style={{ fontWeight: 600 }}>Verification QR Code</span>
                    </div>
                    <div className="card-body-custom" style={{ textAlign: 'center' }}>
                      <div className="qr-container">
                        <img src={generateQRData(selectedProperty)} alt="Property QR Code" width={180} height={180} />
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                        Scan to verify property details
                      </p>
                    </div>
                  </div>

                  <div className="dark-card">
                    <div className="card-header-custom">
                      <span style={{ fontWeight: 600 }}>Actions</span>
                    </div>
                    <div className="card-body-custom" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button className="btn-gradient btn-sm-custom" onClick={printCertificate} style={{ justifyContent: 'center' }}>
                        Export Ownership Certificate (PDF)
                      </button>
                      <a href={`${config.BLOCK_EXPLORER}/address/${config.CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="btn-outline-custom btn-sm-custom" style={{ textAlign: 'center', textDecoration: 'none' }}>
                        View on Etherscan
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ownership History */}
              {history.length > 0 && (
                <div className="dark-card no-print" style={{ marginTop: '1.5rem' }}>
                  <div className="card-header-custom">
                    <span style={{ fontWeight: 600 }}>Ownership History</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{history.length} record(s)</span>
                  </div>
                  <div className="card-body-custom">
                    <div className="timeline">
                      {history.map((h, i) => (
                        <div key={i} className="timeline-item">
                          <div className="timeline-label">{i === 0 ? 'Original Registration' : `Transfer #${i}`}</div>
                          <div className="timeline-address">{h.owner}</div>
                          <div className="timeline-date">{new Date(h.timestamp * 1000).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Printable Certificate */}
              {showCertificate && (
                <div className="print-certificate" style={{ display: 'none' }}>
                  <div className="cert-border" style={{ border: '3px double #1a365d', padding: '2rem', margin: '1rem 0', textAlign: 'center', background: 'white', color: 'black' }}>
                    <h1 style={{ color: '#1a365d', fontSize: '2rem', marginBottom: '0.5rem' }}>Land Ownership Certificate</h1>
                    <p style={{ color: '#666', marginBottom: '2rem' }}>Blockchain-Verified Property Record</p>
                    <hr />
                    <div style={{ textAlign: 'left', padding: '1rem 2rem', lineHeight: 2 }}>
                      <p><strong>Land ID:</strong> {selectedProperty.id}</p>
                      <p><strong>Plot Number:</strong> {selectedProperty.plotNumber}</p>
                      <p><strong>Area:</strong> {selectedProperty.area}</p>
                      <p><strong>District:</strong> {selectedProperty.district}</p>
                      <p><strong>City:</strong> {selectedProperty.city}</p>
                      <p><strong>State:</strong> {selectedProperty.state}</p>
                      <p><strong>Size:</strong> {selectedProperty.areaSqYd.toLocaleString()} sq. yards</p>
                      <p><strong>Current Owner:</strong> {selectedProperty.owner}</p>
                    </div>
                    <hr />
                    <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                      <p>Verified on Ethereum Sepolia Testnet</p>
                      <p>Contract: {config.CONTRACT_ADDRESS}</p>
                      <p>Generated: {new Date().toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              <style>{`
                @media (max-width: 768px) {
                  div[style*="grid-template-columns: 1fr 1fr"] {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}</style>
            </div>
          )}

          {/* Empty initial state */}
          {results.length === 0 && !error && !isLoading && (
            <div className="empty-state no-print">
              <div className="empty-icon">&#128269;</div>
              <div className="empty-title">Search for Properties</div>
              <p className="empty-desc">Enter a Land ID or Ethereum address above to find property records on the blockchain.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PropertySearch;
