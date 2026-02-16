import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBoard } from '../../store/slices/boardSlice';
import { updateMemberRole, removeMember } from '../../store/slices/memberSlice';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Members.css';

function Members() {
  const { id: boardId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const { currentBoardId, byId, loading } = useSelector((state) => state.board);
  const currentBoard = currentBoardId ? byId[currentBoardId] : null;
  const { user } = useSelector((state) => state.auth);
  const members = currentBoard?.members || [];
  const isOwner = currentBoard?.ownerId === user?.id;

  useEffect(() => {
    if (!boardId) return;

    const loadData = async () => {
      try {
        await dispatch(fetchBoard(boardId)).unwrap();
      } catch (error) {
        if (error?.statusCode === 403) {
          navigate('/boards');
        }
      }
    };

    loadData();
  }, [boardId, dispatch, navigate]);

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await dispatch(updateMemberRole({ boardId, memberId, role: newRole })).unwrap();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    try {
      await dispatch(removeMember({ boardId, memberId: selectedMember.id })).unwrap();
      setShowRemoveModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const openRemoveModal = (member) => {
    setSelectedMember(member);
    setShowRemoveModal(true);
  };

  if (loading || !currentBoard) {
    return (
      <div className="members-page">
        <div className="loading">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="members-page">
      <div className="members-header">
        <button className="back-btn" onClick={() => navigate(`/boards/${boardId}`)}>
          ← Back to Board
        </button>
        <h1>Board Members</h1>
        <p>{currentBoard.title}</p>
      </div>

      <div className="members-content">
        <section className="members-section">
          <h2>Members ({members.length})</h2>
          <div className="members-list">
            {members.map((member) => {
              const memberUser = member.user || {};
              const isBoardOwner = member.userId === currentBoard.ownerId;
              
              return (
                <div key={member.id} className="member-card">
                  <div className="member-avatar">
                    {memberUser.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="member-info">
                    <div className="member-name">{memberUser.name || 'Unknown'}</div>
                    <div className="member-email">{memberUser.email || ''}</div>
                  </div>
                  <div className="member-role">
                    {isOwner && !isBoardOwner ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`role-badge ${member.role}`}>
                        {member.role === 'owner' ? '👑 Owner' : member.role === 'admin' ? '⚡ Admin' : '👤 Member'}
                      </span>
                    )}
                  </div>
                  {isOwner && !isBoardOwner && (
                    <button
                      className="btn-remove"
                      onClick={() => openRemoveModal(member)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setSelectedMember(null);
        }}
        onConfirm={handleRemoveMember}
        title="Remove Member?"
        message={`Are you sure you want to remove ${selectedMember?.user?.name || 'this member'} from the board?`}
        confirmText="Remove"
        danger
      />
    </div>
  );
}

export default Members;
