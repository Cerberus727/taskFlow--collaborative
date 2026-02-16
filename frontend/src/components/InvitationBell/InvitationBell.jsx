import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchInvitations, acceptInvitation, rejectInvitation } from '../../store/slices/invitationSlice';
import { invitationReceived } from '../../store/slices/invitationSlice';
import { boardAccepted } from '../../store/slices/boardSlice';
import socketService from '../../sockets/socket';
import './InvitationBell.css';

function InvitationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const { items: invitations, loading } = useSelector((state) => state.invitations);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchInvitations());
      
      const socket = socketService.connect();
      socketService.joinUserRoom(user.id);

      socket.on('invitation:received', (invitation) => {
        dispatch(invitationReceived(invitation));
      });

      return () => {
        socket.off('invitation:received');
      };
    }
  }, [user, dispatch]);

  const handleAccept = async (invitationId) => {
    try {
      setAccepting(invitationId);
      const result = await dispatch(acceptInvitation(invitationId)).unwrap();
      dispatch(boardAccepted(result.board));
      setShowDropdown(false);
      navigate(`/boards/${result.board.id}`);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    } finally {
      setAccepting(null);
    }
  };

  const handleReject = async (invitationId) => {
    await dispatch(rejectInvitation(invitationId));
  };

  return (
    <div className="invitation-bell">
      <button 
        className="bell-icon" 
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {invitations.length > 0 && (
          <span className="badge">{invitations.length}</span>
        )}
      </button>
      
      {showDropdown && (
        <div className="invitation-dropdown">
          <h3>Invitations</h3>
          {invitations.length === 0 ? (
            <p className="no-invitations">No pending invitations</p>
          ) : (
            <div className="invitation-list">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="invitation-item">
                  <div className="invitation-info">
                    <strong>{invitation.board?.title}</strong>
                    <span>from {invitation.inviter?.name}</span>
                  </div>
                  <div className="invitation-actions">
                    <button 
                      className="btn-accept"
                      onClick={() => handleAccept(invitation.id)}
                      disabled={accepting === invitation.id}
                    >
                      {accepting === invitation.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => handleReject(invitation.id)}
                      disabled={accepting === invitation.id}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InvitationBell;
