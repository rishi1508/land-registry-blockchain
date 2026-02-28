import React, { useState, useEffect, useContext, useCallback } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { WalletContext } from './WalletContext';
import ConfirmationDialog from './ConfirmationDialog';
import config from '../config';

const ManageLandPage = () => {
  const { isConnected, contract, account, connectWallet, getAccountName } = useContext(WalletContext);
  const [plotNumber, setPlotNumber] = useState('');
  const [area, setArea] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [areaSqYd, setAreaSqYd] = useState('');
  const [landIdToVerify, setLandIdToVerify] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationError, setVerificationError] = useState('');
  const [userLands, setUserLands] = useState([]);
  const [landsForSale, setLandsForSale] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeSection, setActiveSection] = useState('register');
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: () => {}, confirmButtonText: 'Confirm' });
  const [isLoading, setIsLoading] = useState(false);
  const [sectionLoading, setSectionLoading] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [txStatus, setTxStatus] = useState(null);

  const fetchUserLands = useCallback(async (userAccount) => {
    if (!contract || !userAccount) return;
    try {
      setSectionLoading(prev => ({ ...prev, show: true }));
      const landIds = await contract.methods.getLandsByOwner(userAccount).call();
      const lands = await Promise.all(
        landIds.map(async (id) => {
          const land = await contract.methods.lands(id).call();
          return { id: Number(id), plotNumber: land.plotNumber, area: land.area, district: land.district, city: land.city, state: land.state, areaSqYd: Number(land.areaSqYd), owner: land.owner, isForSale: land.isForSale };
        })
      );
      setUserLands(lands);
    } catch (error) {
      console.error('Error fetching user lands:', error);
    } finally {
      setSectionLoading(prev => ({ ...prev, show: false }));
    }
  }, [contract]);

  const fetchLandsForSale = useCallback(async () => {
    if (!contract) return;
    try {
      setSectionLoading(prev => ({ ...prev, explore: true }));
      const totalLands = await contract.methods.landCount().call();
      const lands = [];
      for (let i = 1; i <= Number(totalLands); i++) {
        const land = await contract.methods.lands(i).call();
        if (land.isForSale) {
          lands.push({ id: i, plotNumber: land.plotNumber, area: land.area, district: land.district, city: land.city, state: land.state, areaSqYd: Number(land.areaSqYd), owner: land.owner });
        }
      }
      setLandsForSale(lands);
    } catch (error) {
      console.error('Error fetching lands for sale:', error);
    } finally {
      setSectionLoading(prev => ({ ...prev, explore: false }));
    }
  }, [contract]);

  const fetchPendingRequests = useCallback(async (userAccount) => {
    if (!contract || !userAccount) return;
    try {
      setSectionLoading(prev => ({ ...prev, approve: true }));
      const pendingIds = await contract.methods.getPendingTransferRequests(userAccount).call();
      const requests = await Promise.all(
        pendingIds.map(async (id) => {
          const land = await contract.methods.lands(id).call();
          return { id: Number(id), plotNumber: land.plotNumber, area: land.area, district: land.district, city: land.city, state: land.state, areaSqYd: Number(land.areaSqYd), owner: land.owner, requester: land.transferRequest };
        })
      );
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setSectionLoading(prev => ({ ...prev, approve: false }));
    }
  }, [contract]);

  useEffect(() => {
    if (isConnected && account) {
      fetchUserLands(account);
      fetchLandsForSale();
      fetchPendingRequests(account);
    }
  }, [isConnected, account, contract, fetchUserLands, fetchLandsForSale, fetchPendingRequests]);

  const validateForm = () => {
    const errors = {};
    if (!plotNumber.trim()) errors.plotNumber = 'Required';
    if (!area.trim()) errors.area = 'Required';
    if (!district.trim()) errors.district = 'Required';
    if (!city.trim()) errors.city = 'Required';
    if (!state.trim()) errors.state = 'Required';
    if (!areaSqYd || areaSqYd <= 0) errors.areaSqYd = 'Must be > 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterLand = () => {
    if (!validateForm()) return;
    setConfirmDialog({
      show: true,
      title: 'Confirm Registration',
      message: `Register land with plot number "${plotNumber}" in ${area}, ${district}, ${city}, ${state} (${areaSqYd} sq. yd)?`,
      onConfirm: performRegisterLand,
      confirmButtonText: 'Register'
    });
  };

  const performRegisterLand = async () => {
    setConfirmDialog({ ...confirmDialog, show: false });
    if (!contract || !account) return;
    try {
      setIsLoading(true);
      setTxStatus({ type: 'pending', message: 'Registering land... Please confirm in MetaMask.' });
      const tx = await contract.methods.registerLand(plotNumber, area, district, city, state, areaSqYd).send({ from: account, gas: 3000000 });
      setTxStatus({ type: 'success', message: 'Land registered successfully!', hash: tx.transactionHash });
      setPlotNumber(''); setArea(''); setDistrict(''); setCity(''); setState(''); setAreaSqYd(''); setFormErrors({});
      fetchUserLands(account);
    } catch (error) {
      console.error('Error registering land:', error);
      setTxStatus({ type: 'error', message: extractErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePutForSale = (landId, plotNum) => {
    setConfirmDialog({
      show: true,
      title: 'List for Sale',
      message: `List Land #${landId} (Plot: ${plotNum}) for sale? Other users will be able to request transfer.`,
      onConfirm: () => performAction(() => contract.methods.putLandForSale(landId).send({ from: account }), `Land #${landId} listed for sale!`),
      confirmButtonText: 'List for Sale'
    });
  };

  const handleRequestTransfer = (landId, plotNum, owner) => {
    setConfirmDialog({
      show: true,
      title: 'Request Transfer',
      message: `Request ownership transfer for Land #${landId} (Plot: ${plotNum}) from ${getAccountName(owner)}?`,
      onConfirm: () => performAction(() => contract.methods.requestTransfer(landId).send({ from: account }), `Transfer request sent for Land #${landId}!`),
      confirmButtonText: 'Request'
    });
  };

  const handleApproveTransfer = (landId, requester) => {
    setConfirmDialog({
      show: true,
      title: 'Approve Transfer',
      message: `Approve ownership transfer of Land #${landId} to ${getAccountName(requester)}? This action is irreversible.`,
      onConfirm: () => performAction(() => contract.methods.approveTransfer(landId).send({ from: account }), `Transfer approved for Land #${landId}!`),
      confirmButtonText: 'Approve'
    });
  };

  const performAction = async (action, successMsg) => {
    setConfirmDialog({ ...confirmDialog, show: false });
    if (!contract || !account) return;
    try {
      setIsLoading(true);
      setTxStatus({ type: 'pending', message: 'Processing... Please confirm in MetaMask.' });
      const tx = await action();
      setTxStatus({ type: 'success', message: successMsg, hash: tx.transactionHash });
      fetchUserLands(account);
      fetchLandsForSale();
      fetchPendingRequests(account);
    } catch (error) {
      console.error('Transaction error:', error);
      setTxStatus({ type: 'error', message: extractErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDenyTransfer = async (landId) => {
    try {
      setIsLoading(true);
      setTxStatus({ type: 'pending', message: 'Denying transfer...' });
      const tx = await contract.methods.denyTransfer(landId).send({ from: account });
      setTxStatus({ type: 'success', message: `Transfer denied for Land #${landId}.`, hash: tx.transactionHash });
      fetchPendingRequests(account);
      fetchLandsForSale();
    } catch (error) {
      setTxStatus({ type: 'error', message: extractErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyLand = async () => {
    if (!contract || !landIdToVerify) {
      setVerificationError('Please enter a valid Land ID');
      return;
    }
    try {
      setSectionLoading(prev => ({ ...prev, verify: true }));
      setVerificationError('');
      setVerificationResult(null);
      const result = await contract.methods.verifyLand(landIdToVerify).call();
      if (result[6] === '0x0000000000000000000000000000000000000000') {
        setVerificationError('No land found with this ID.');
      } else {
        setVerificationResult({
          plotNumber: result[0], area: result[1], district: result[2], city: result[3], state: result[4], areaSqYd: Number(result[5]), owner: result[6]
        });
      }
    } catch (error) {
      setVerificationError('Failed to verify. Please check the Land ID.');
    } finally {
      setSectionLoading(prev => ({ ...prev, verify: false }));
    }
  };

  const extractErrorMessage = (error) => {
    if (error.message && error.message.includes('User denied')) return 'Transaction rejected by user.';
    if (error.message && error.message.includes('already registered')) return 'This land is already registered.';
    return 'Transaction failed: ' + (error.reason || error.message || 'Unknown error');
  };

  const sections = [
    { key: 'register', label: 'Register Land' },
    { key: 'verify', label: 'Verify' },
    { key: 'show', label: 'My Properties' },
    { key: 'explore', label: 'For Sale' },
    { key: 'approve', label: 'Transfers' },
  ];

  return (
    <div>
      <Navbar />
      <div className="page-wrapper">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">Manage Land</h1>
            <p className="page-description">Register, verify, and manage your land properties on the blockchain</p>
          </div>

          {!isConnected ? (
            <div className="empty-state">
              <div className="empty-icon">&#128274;</div>
              <div className="empty-title">Wallet Not Connected</div>
              <p className="empty-desc">Connect your MetaMask wallet to manage land properties on the blockchain.</p>
              <button className="btn-gradient" onClick={connectWallet} style={{ marginTop: '1rem' }}>
                Connect MetaMask Wallet
              </button>
            </div>
          ) : (
            <>
              {/* Testnet Banner */}
              <div className="testnet-banner">
                <span>&#9888;</span>
                Running on <strong>&nbsp;Sepolia Testnet&nbsp;</strong> &mdash; No real assets involved
              </div>

              {/* Transaction Status */}
              {txStatus && (
                <div className={`alert-dark ${txStatus.type === 'success' ? 'alert-success-dark' : txStatus.type === 'error' ? 'alert-error-dark' : 'alert-warning-dark'}`}>
                  <div>
                    <div>{txStatus.message}</div>
                    {txStatus.hash && (
                      <a href={`${config.BLOCK_EXPLORER}/tx/${txStatus.hash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontSize: '0.8rem', opacity: 0.8 }}>
                        View on Etherscan &rarr;
                      </a>
                    )}
                  </div>
                  <button onClick={() => setTxStatus(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 'auto', fontSize: '1.1rem' }}>&times;</button>
                </div>
              )}

              {/* Section Tabs */}
              <div className="section-tabs">
                {sections.map(s => (
                  <button
                    key={s.key}
                    className={`section-tab ${activeSection === s.key ? 'active' : ''}`}
                    onClick={() => { setActiveSection(s.key); setTxStatus(null); setVerificationResult(null); setVerificationError(''); }}
                    disabled={isLoading}
                  >
                    {s.label}
                    {s.key === 'approve' && pendingRequests.length > 0 && (
                      <span style={{ marginLeft: 6, background: 'var(--accent-red)', color: 'white', borderRadius: '50%', padding: '1px 6px', fontSize: '0.7rem' }}>{pendingRequests.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Register Land */}
              {activeSection === 'register' && (
                <div className="form-dark fade-in">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>Register New Property</h3>
                  {[
                    { label: 'Plot Number', value: plotNumber, setter: setPlotNumber, key: 'plotNumber', placeholder: 'e.g., PLT-2024-001' },
                    { label: 'Area / Locality', value: area, setter: setArea, key: 'area', placeholder: 'e.g., Andheri West' },
                    { label: 'District', value: district, setter: setDistrict, key: 'district', placeholder: 'e.g., Mumbai Suburban' },
                    { label: 'City', value: city, setter: setCity, key: 'city', placeholder: 'e.g., Mumbai' },
                    { label: 'State', value: state, setter: setState, key: 'state', placeholder: 'e.g., Maharashtra' },
                    { label: 'Area (sq. yards)', value: areaSqYd, setter: setAreaSqYd, key: 'areaSqYd', placeholder: 'e.g., 500', type: 'number' },
                  ].map(field => (
                    <div className="form-group" key={field.key}>
                      <label>{field.label}</label>
                      <input
                        className={`form-input ${formErrors[field.key] ? 'is-invalid' : ''}`}
                        type={field.type || 'text'}
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={e => { field.setter(e.target.value); setFormErrors(prev => ({ ...prev, [field.key]: '' })); }}
                        disabled={isLoading}
                      />
                      {formErrors[field.key] && <div className="form-error">{formErrors[field.key]}</div>}
                    </div>
                  ))}
                  <button className="btn-gradient" onClick={handleRegisterLand} disabled={isLoading} style={{ width: '100%', justifyContent: 'center' }}>
                    {isLoading ? <><span className="spinner-dark" style={{ marginRight: 8 }}></span> Processing...</> : 'Register Property'}
                  </button>
                </div>
              )}

              {/* Verify Land */}
              {activeSection === 'verify' && (
                <div className="form-dark fade-in">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>Verify Land Ownership</h3>
                  <div className="form-group">
                    <label>Land ID</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="form-input" type="number" placeholder="Enter Land ID" value={landIdToVerify} onChange={e => setLandIdToVerify(e.target.value)} disabled={sectionLoading.verify} />
                      <button className="btn-gradient" onClick={verifyLand} disabled={sectionLoading.verify} style={{ whiteSpace: 'nowrap' }}>
                        {sectionLoading.verify ? <span className="spinner-dark"></span> : 'Verify'}
                      </button>
                    </div>
                  </div>
                  {verificationResult && (
                    <div className="property-card fade-in" style={{ marginTop: '1rem' }}>
                      <div className="property-id">Land #{landIdToVerify}</div>
                      {[
                        ['Plot Number', verificationResult.plotNumber],
                        ['Area', verificationResult.area],
                        ['District', verificationResult.district],
                        ['City', verificationResult.city],
                        ['State', verificationResult.state],
                        ['Size (sq. yd)', verificationResult.areaSqYd],
                        ['Owner', getAccountName(verificationResult.owner)],
                      ].map(([label, value]) => (
                        <div className="property-detail" key={label}>
                          <span className="label">{label}</span>
                          <span className="value">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {verificationError && <div className="alert-dark alert-error-dark" style={{ marginTop: '1rem' }}>{verificationError}</div>}
                </div>
              )}

              {/* My Properties */}
              {activeSection === 'show' && (
                <div className="fade-in">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>My Properties ({userLands.length})</h3>
                  {sectionLoading.show ? (
                    <div className="loading-container"><span className="spinner-dark spinner-blue medium"></span><span>Loading properties...</span></div>
                  ) : userLands.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                      {userLands.map(land => (
                        <div key={land.id} className="property-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div className="property-id">Land #{land.id}</div>
                            <span className={`sale-badge ${land.isForSale ? 'for-sale' : 'not-for-sale'}`}>
                              {land.isForSale ? 'For Sale' : 'Not Listed'}
                            </span>
                          </div>
                          {[
                            ['Plot', land.plotNumber],
                            ['Area', land.area],
                            ['District', land.district],
                            ['City', land.city],
                            ['State', land.state],
                            ['Size', `${land.areaSqYd.toLocaleString()} sq. yd`],
                          ].map(([label, value]) => (
                            <div className="property-detail" key={label}>
                              <span className="label">{label}</span>
                              <span className="value">{value}</span>
                            </div>
                          ))}
                          {!land.isForSale && (
                            <button className="btn-gradient btn-sm-custom" onClick={() => handlePutForSale(land.id, land.plotNumber)} disabled={isLoading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}>
                              {isLoading ? <span className="spinner-dark"></span> : 'List for Sale'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">&#127968;</div>
                      <div className="empty-title">No Properties Found</div>
                      <p className="empty-desc">You haven't registered any land yet. Switch to "Register Land" to add your first property.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Explore Lands for Sale */}
              {activeSection === 'explore' && (
                <div className="fade-in">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>Properties for Sale ({landsForSale.length})</h3>
                  {sectionLoading.explore ? (
                    <div className="loading-container"><span className="spinner-dark spinner-blue medium"></span><span>Loading marketplace...</span></div>
                  ) : landsForSale.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                      {landsForSale.map(land => (
                        <div key={land.id} className="property-card">
                          <div className="property-id" style={{ marginBottom: '0.75rem' }}>Land #{land.id}</div>
                          {[
                            ['Plot', land.plotNumber],
                            ['Area', land.area],
                            ['District', land.district],
                            ['City', `${land.city}, ${land.state}`],
                            ['Size', `${land.areaSqYd.toLocaleString()} sq. yd`],
                            ['Owner', getAccountName(land.owner)],
                          ].map(([label, value]) => (
                            <div className="property-detail" key={label}>
                              <span className="label">{label}</span>
                              <span className="value">{value}</span>
                            </div>
                          ))}
                          {land.owner.toLowerCase() !== account.toLowerCase() && (
                            <button className="btn-gradient btn-sm-custom" onClick={() => handleRequestTransfer(land.id, land.plotNumber, land.owner)} disabled={isLoading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}>
                              {isLoading ? <span className="spinner-dark"></span> : 'Request Transfer'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">&#128722;</div>
                      <div className="empty-title">No Properties for Sale</div>
                      <p className="empty-desc">No land is currently listed for sale. Check back later or list your own property.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Approve Transfers */}
              {activeSection === 'approve' && (
                <div className="fade-in">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>Pending Transfer Requests ({pendingRequests.length})</h3>
                  {sectionLoading.approve ? (
                    <div className="loading-container"><span className="spinner-dark spinner-blue medium"></span><span>Loading requests...</span></div>
                  ) : pendingRequests.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                      {pendingRequests.map(req => (
                        <div key={req.id} className="property-card">
                          <div className="property-id" style={{ marginBottom: '0.75rem' }}>Land #{req.id}</div>
                          {[
                            ['Plot', req.plotNumber],
                            ['Location', `${req.area}, ${req.district}`],
                            ['City', `${req.city}, ${req.state}`],
                            ['Size', `${req.areaSqYd.toLocaleString()} sq. yd`],
                          ].map(([label, value]) => (
                            <div className="property-detail" key={label}>
                              <span className="label">{label}</span>
                              <span className="value">{value}</span>
                            </div>
                          ))}
                          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(59,130,246,0.05)', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Transfer requested by</div>
                            <div className="address-badge">{getAccountName(req.requester)}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                            <button className="btn-success-custom" onClick={() => handleApproveTransfer(req.id, req.requester)} disabled={isLoading} style={{ flex: 1 }}>
                              {isLoading ? <span className="spinner-dark"></span> : 'Approve'}
                            </button>
                            <button className="btn-danger-custom" onClick={() => handleDenyTransfer(req.id)} disabled={isLoading} style={{ flex: 1 }}>
                              {isLoading ? <span className="spinner-dark"></span> : 'Deny'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">&#128233;</div>
                      <div className="empty-title">No Pending Requests</div>
                      <p className="empty-desc">You don't have any pending transfer requests for your properties.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
      <ConfirmationDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, show: false })}
        confirmButtonText={confirmDialog.confirmButtonText}
      />
    </div>
  );
};

export default ManageLandPage;
