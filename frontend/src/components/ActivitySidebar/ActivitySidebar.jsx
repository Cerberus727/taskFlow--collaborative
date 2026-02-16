import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecentActivities } from '../../store/slices/activitySlice';
import './ActivitySidebar.css';

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getActivityIcon = (action) => {
  switch (action) {
    case 'created':
      return '➕';
    case 'updated':
      return '✏️';
    case 'deleted':
      return '🗑️';
    case 'moved':
      return '↔️';
    case 'assigned':
      return '👤';
    case 'member_added':
      return '👥';
    case 'member_removed':
      return '👤❌';
    default:
      return '📝';
  }
};

const formatActivityMessage = (activity) => {
  const { action, entity, metadata } = activity;
  const userName = activity.user?.name || 'Someone';
  let parsedMetadata = {};
  
  try {
    parsedMetadata = metadata ? JSON.parse(metadata) : {};
  } catch {
    parsedMetadata = {};
  }

  switch (action) {
    case 'created':
      return `${userName} created ${entity} "${parsedMetadata.title || ''}"`;
    case 'updated':
      return `${userName} updated ${entity}`;
    case 'deleted':
      return `${userName} deleted ${entity}`;
    case 'moved':
      return `${userName} moved ${entity}`;
    case 'assigned':
      return `${userName} assigned ${entity}`;
    case 'member_added':
      return `${userName} added a member to the board`;
    case 'member_removed':
      return `${userName} removed a member from the board`;
    default:
      return `${userName} ${action} ${entity}`;
  }
};

const ActivitySidebar = ({ boardId, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { recentActivities, loading } = useSelector((state) => state.activity);

  useEffect(() => {
    if (isOpen && boardId) {
      dispatch(fetchRecentActivities({ boardId, limit: 15 }));
    }
  }, [dispatch, boardId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="activity-sidebar">
      <div className="activity-sidebar-header">
        <h3>Activity</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="activity-sidebar-content">
        {loading ? (
          <div className="activity-loading">Loading activities...</div>
        ) : recentActivities.length === 0 ? (
          <div className="activity-empty">No recent activity</div>
        ) : (
          <ul className="activity-list">
            {recentActivities.map((activity) => (
              <li key={activity.id} className="activity-item">
                <span className="activity-icon">{getActivityIcon(activity.action)}</span>
                <div className="activity-details">
                  <p className="activity-message">{formatActivityMessage(activity)}</p>
                  <span className="activity-time">{formatTime(activity.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ActivitySidebar;
