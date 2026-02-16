import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { searchTasks, clearSearchResults } from '../../store/slices/taskSlice';
import './SearchBox.css';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function SearchBox() {
  const dispatch = useDispatch();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);

  const { searchResults, searchLoading: loading } = useSelector((state) => state.task);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      dispatch(searchTasks({ q: debouncedQuery.trim() }));
    } else if (debouncedQuery.trim().length === 0) {
      dispatch(clearSearchResults());
    }
  }, [debouncedQuery, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    dispatch(clearSearchResults());
  }, [dispatch]);

  const handleResultClick = () => {
    setFocused(false);
    setQuery('');
    dispatch(clearSearchResults());
  };

  const showResults = focused && query.trim().length >= 2;

  return (
    <div className={`search-box ${focused ? 'focused' : ''}`} ref={containerRef}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
        />
        {query && (
          <button className="search-clear" onClick={handleClear}>
            ×
          </button>
        )}
      </div>

      {showResults && (
        <div className="search-results">
          {loading ? (
            <div className="search-loading">Searching...</div>
          ) : searchResults.length === 0 ? (
            <div className="search-empty">No tasks found</div>
          ) : (
            searchResults.map((task) => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
              return (
                <Link
                  key={task.id}
                  to={`/boards/${task.list?.boardId}`}
                  className="search-result-item"
                  onClick={handleResultClick}
                >
                  <h4 className="search-result-title">
                    {task.title}
                    {isOverdue && <span className="search-result-overdue">Overdue</span>}
                  </h4>
                  <p className="search-result-board">
                    {task.list?.board?.title || 'Board'} → {task.list?.title || 'List'}
                  </p>
                  {task.taskLabels?.length > 0 && (
                    <div className="search-result-labels">
                      {task.taskLabels.map((tl) => (
                        <span
                          key={tl.labelId}
                          className="search-result-label"
                          style={{ backgroundColor: tl.label?.color || '#61bd4f' }}
                        />
                      ))}
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBox;
