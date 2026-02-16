import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as invitationApi from '../../api/invitation';
import './InviteModal.css';

function InviteModal({ boardId, onClose }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const { byId } = useSelector((state) => state.board);
  const board = byId[boardId];
  const members = board?.members || [];

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await invitationApi.createInvitation(boardId, email.trim());
      setMessage({ type: 'success', text: `Invitation sent to ${email}` });
      setEmail('');
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to send invitation' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-modal-overlay" onClick={onClose}>
      <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
        <div className="invite-modal-header">
          <h3>Share Board</h3>
          <button className="invite-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="invite-modal-body">
          <form className="invite-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                disabled={loading}
              />
            </div>

            <button type="submit" className="invite-btn" disabled={loading || !email.trim()}>
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>

            {message.text && (
              <div className={`invite-message ${message.type}`}>
                {message.text}
              </div>
            )}
          </form>

          <div className="members-section">
            <h4>Board Members ({members.length})</h4>
            <div className="members-list">
              {members.map((member) => (
                <div key={member.id} className="member-item">
                  <div className="member-avatar">
                    {member.user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="member-info">
                    <div className="member-name">{member.user?.name || 'Unknown'}</div>
                    <div className="member-email">{member.user?.email}</div>
                  </div>
                  <span className={`member-role ${member.role}`}>{member.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InviteModal;
