import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Todo } from '../services/api';
import { Plus, Trash2, Loader2, Inbox, AlertCircle, RefreshCw } from 'lucide-react';

export const TodoPage: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Load Todos on mount
  const fetchTodos = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const data = await api.getTodos();
      setTodos(data);
    } catch (err) {
      console.error(err);
      setError('Unable to sync with tasks API. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // Handlers
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError('Task title cannot be empty.');
      return;
    }

    setIsAdding(true);
    setError(null);
    try {
      await api.createTodo(newTitle.trim());
      setNewTitle('');
      await fetchTodos(false); // Silent reload after addition
    } catch (err) {
      console.error(err);
      setError('Failed to create task. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleTodo = async (id: string, currentCompleted: boolean) => {
    setActionLoadingId(id);
    setError(null);
    try {
      await api.toggleTodo(id, !currentCompleted);
      await fetchTodos(false); // Silent reload
    } catch (err) {
      console.error(err);
      setError('Failed to update task state.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    setActionLoadingId(id);
    setError(null);
    try {
      await api.deleteTodo(id);
      await fetchTodos(false); // Silent reload
    } catch (err) {
      console.error(err);
      setError('Failed to delete task.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter computation
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Task Board</h1>
          <p style={styles.subtitle}>Streamline your day-to-day operations</p>
        </div>
        <button
          onClick={() => fetchTodos(true)}
          style={styles.refreshBtn}
          disabled={loading}
          title="Force Sync"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={styles.errorAlert}>
          <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleAddTodo} style={styles.form}>
        <input
          type="text"
          placeholder="What needs to be done?"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={isAdding || loading}
          style={styles.input}
          required
          pattern="\s*\S.*"
          title="Task title cannot be empty or just spaces"
        />
        <button
          type="submit"
          disabled={isAdding || loading}
          className="btn-primary"
          style={styles.addBtn}
        >
          {isAdding ? <Loader2 size={16} style={styles.spinner} /> : <Plus size={16} />}
          Add Task
        </button>
      </form>

      {/* Filter Tabs */}
      <div style={styles.filterRow}>
        <div style={styles.tabs}>
          {(['all', 'active', 'completed'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                ...styles.tab,
                ...(filter === t ? styles.activeTab : {})
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span style={{
                ...styles.tabBadge,
                ...(filter === t ? styles.activeTabBadge : {})
              }}>
                {t === 'all' && todos.length}
                {t === 'active' && todos.filter(x => !x.completed).length}
                {t === 'completed' && todos.filter(x => x.completed).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={styles.todoList}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={styles.skeletonItem} className="skeleton" />
          ))}
        </div>
      ) : filteredTodos.length === 0 ? (
        <div style={styles.emptyState}>
          <Inbox size={48} style={styles.emptyIcon} />
          <h3 style={styles.emptyTitle}>No tasks found</h3>
          <p style={styles.emptySubtitle}>
            {filter === 'all'
              ? "You're all caught up! Add a new task to get started."
              : `No ${filter} tasks found matching the filter.`}
          </p>
        </div>
      ) : (
        <div style={styles.todoList}>
          {filteredTodos.map((todo) => (
            <div
              key={todo.id}
              style={{
                ...styles.todoItem,
                ...(todo.completed ? styles.completedTodoItem : {})
              }}
            >
              {/* Checkbox */}
              <label className="custom-checkbox" style={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id, todo.completed)}
                  disabled={actionLoadingId === todo.id}
                />
                <span className="checkmark"></span>
              </label>

              {/* Title & Date */}
              <div style={styles.todoDetails}>
                <span style={{
                  ...styles.todoTitle,
                  ...(todo.completed ? styles.completedTodoTitle : {})
                }}>
                  {todo.title}
                </span>
                <span style={styles.todoDate}>
                  Created {new Date(todo.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={styles.actions}>
                {actionLoadingId === todo.id ? (
                  <Loader2 size={16} style={styles.itemSpinner} />
                ) : (
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="btn-icon danger"
                    title="Delete Task"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Internal inline styles for CSS flex layout
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 24px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    height: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  refreshBtn: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--danger-bg)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  input: {
    flexGrow: 1,
  },
  addBtn: {
    flexShrink: 0,
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  itemSpinner: {
    animation: 'spin 1s linear infinite',
    color: 'var(--text-muted)',
    marginRight: '10px',
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
    marginBottom: '20px',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  activeTab: {
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
  },
  tabBadge: {
    fontSize: '0.75rem',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    padding: '1px 6px',
    borderRadius: '10px',
    fontWeight: '600',
  },
  activeTabBadge: {
    backgroundColor: 'var(--accent)',
    color: '#ffffff',
  },
  todoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  todoItem: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '14px 18px',
    transition: 'var(--transition-smooth)',
  },
  completedTodoItem: {
    borderColor: 'transparent',
    backgroundColor: 'rgba(18, 18, 21, 0.4)',
  },
  checkboxContainer: {
    marginRight: '16px',
    flexShrink: 0,
  },
  todoDetails: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    overflow: 'hidden',
  },
  todoTitle: {
    color: 'var(--text-primary)',
    fontSize: '0.98rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    transition: 'var(--transition-smooth)',
  },
  completedTodoTitle: {
    textDecoration: 'line-through',
    color: 'var(--text-muted)',
  },
  todoDate: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    border: '1px dashed var(--border-color)',
    borderRadius: 'var(--radius-lg)',
  },
  emptyIcon: {
    color: 'var(--text-muted)',
    marginBottom: '16px',
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  emptySubtitle: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    maxWidth: '320px',
  },
  skeletonItem: {
    height: '66px',
    width: '100%',
  }
};
