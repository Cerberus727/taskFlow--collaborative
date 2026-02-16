# Quick Start Guide - New Features

## 🚀 Getting Started

### 1. Run Database Migration
```bash
cd backend
npx prisma migrate dev
```

This will apply the new `priority` field to the Task table.

---

## 📋 Feature Guide

### Priority System
**Where to find it:**
- Open any task card → Task Detail Modal
- Look for "🎯 Priority" dropdown in the right sidebar

**How it works:**
- LOW (⚪): Gray badge on cards
- MEDIUM (🔵): Default, hidden on cards
- HIGH (🔴): Red badge on cards
- Priority saves automatically on change

---

### Due Date Filtering
**Where to find it:**
- Board page → Toolbar (top)
- Dropdown next to "Star" button

**Filter Options:**
- **All Tasks**: Show everything (default)
- **📅 Due Today**: Only tasks due today
- **🔴 Overdue**: Only past-due tasks

**Note:** Filtering is client-side and instant

---

### Light/Dark Mode
**Where to find it:**
- Top-right navbar
- Sun (☀️) or Moon (🌙) button

**How it works:**
- Click to toggle between themes
- Preference saved automatically
- Applies to entire app instantly

---

### Enhanced Members Tab
**Where to find it:**
- Board page → "👥 Members" button
- Or navigate to `/boards/:id/members`

**New Features:**
- Search bar to filter members
- Task count per member
- Clean layout with member stats

---

### Comments (Real-Time)
**Already Working:**
- Open any task → Comments section at bottom
- Type and post comments
- See real-time updates from other users
- Delete your own comments

---

### Activity Log
**Already Working:**
- Board page → Activity Sidebar (if implemented in UI)
- Or via API: `GET /api/activities?boardId=xxx`

---

## 🎨 UI/UX Improvements

### Color System
**Priority Colors:**
- High: `#eb5a46` (Red)
- Medium: `#5ba4cf` (Blue)
- Low: `#dfe1e6` (Gray)

**Theme Colors:**
Both light and dark themes use consistent color variables for easy theming.

---

## 🔧 Developer Notes

### Backend Changes
```javascript
// Task creation now supports priority
POST /api/tasks
{
  "listId": "...",
  "title": "...",
  "priority": "HIGH" // NEW (optional, defaults to MEDIUM)
}

// Task update now supports priority
PUT /api/tasks/:id
{
  "priority": "LOW" // NEW (optional)
}
```

### Frontend State
```javascript
// Theme context
import { useTheme } from './context/ThemeContext';
const { theme, toggleTheme } = useTheme();

// Task filters in Board component
const [taskFilter, setTaskFilter] = useState('all');
// Options: 'all', 'dueToday', 'overdue'
```

---

## ⚠️ Important Notes

1. **Database Migration Required**
   - Run `npx prisma migrate dev` in backend folder
   - Adds `priority` field with default value "MEDIUM"

2. **Backward Compatibility**
   - All existing tasks get default priority: MEDIUM
   - Old API calls work without priority parameter
   - No breaking changes to existing features

3. **Real-Time Updates**
   - Socket.io handles all real-time features
   - Comments update instantly across all users
   - Priority changes reflect immediately

4. **State Management**
   - Redux handles board/task/comment state
   - Theme uses React Context + localStorage
   - Filter state is component-local

---

## 🐛 Troubleshooting

### Priority not showing?
- Check database migration ran successfully
- Verify task has priority field (default: MEDIUM)
- MEDIUM priority hidden by design (only shows HIGH/LOW)

### Theme not persisting?
- Check browser localStorage
- Key: `theme`, Value: `dark` or `light`
- Clear cache if switching doesn't work

### Filter not working?
- Ensure tasks have `dueDate` set
- Check browser console for errors
- Filter only shows tasks with due dates

### Member task count wrong?
- Task count only includes non-deleted tasks
- Assigned tasks must have valid assigneeId
- Counts update on board data refresh

---

## 📊 Performance

- **Theme Toggle**: Instant (CSS variables)
- **Task Filter**: Client-side, no API calls
- **Member Search**: Client-side filtering
- **Priority Update**: Optimistic UI + API call
- **Comments**: Socket.io real-time

All features optimized for minimal performance impact.

---

## 🎯 Next Steps

Want to extend these features?

1. **Add Subtasks**: Extend Task model with parent-child relationship
2. **Recurring Tasks**: Add recurrence pattern to Task
3. **Task Templates**: Create template system for common tasks
4. **Advanced Filters**: Combine multiple filters (priority + due date)
5. **Bulk Actions**: Select and update multiple tasks at once

---

**Happy Collaborating! 🚀**
