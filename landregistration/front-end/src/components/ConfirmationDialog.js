import React from 'react';

const ConfirmationDialog = ({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel'
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dark" onClick={e => e.stopPropagation()}>
        <div className="modal-header-dark">
          <h3>{title}</h3>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            &times;
          </button>
        </div>
        <div className="modal-body-dark">
          <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{message}</p>
        </div>
        <div className="modal-footer-dark">
          <button className="btn-outline-custom btn-sm-custom" onClick={onCancel}>
            {cancelButtonText}
          </button>
          <button className="btn-gradient btn-sm-custom" onClick={onConfirm}>
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
