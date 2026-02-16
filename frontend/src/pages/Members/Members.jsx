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
  const [searchQuery, setSearchQuery] = useState('');

  const { currentBoardId, byId, loading } = useSelector((state) => state.board);
  const currentBoard = currentBoardId ? byId[currentBoardId] : null;
  const { user } = useSelector((state) => state.auth);
  const members = currentBoard?.members || [];
  const isOwner = currentBoard?.ownerId === user?.id;

  // Filter members based on search query
  const filteredMembers = members.filter((member) => {
    const memberUser = member.user || {};
    const name = memberUser.name?.toLowerCase() || '';
    const email = memberUser.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  // Count tasks assigned to each member
  const getMemberTaskCount = (userId) => {
    if (!currentBoard?.lists) return 0;
    let count = 0;
    currentBoard.lists.forEach((list) => {
      if (list.tasks) {
        count += list.tasks.filter((task) => task.assigneeId === userId && !task.deletedAt).length;
      }
    });
    return count;
  };

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
          <div className="section-toolbar">
            <h2>Members ({filteredMembers.length})</h2>
            <input
              type="text"
              className="search-input"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="members-list">
            {filteredMembers.map((member) => {
              const memberUser = member.user || {};
              const isBoardOwner = member.userId === currentBoard.ownerId;
              const taskCount = getMemberTaskCount(member.userId);
              
              return (
                <div key={member.id} className="member-card">
                  <div className="member-avatar">
                    {memberUser.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="member-info">
                    <div className="member-name">{memberUser.name || 'Unknown'}</div>
                    <div className="member-email">{memberUser.email || ''}</div>
                    <div className="member-stats">
                      <span className="stat-badge">📋 {taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                    </div>
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
            {filteredMembers.length === 0 && (
              <div className="no-results">No members found</div>
            )}
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
