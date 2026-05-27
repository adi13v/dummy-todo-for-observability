import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Goal } from '../services/api';
import { Calendar, Trash2, Plus, Loader2, Clock, AlertTriangle, AlertCircle, X, RefreshCw } from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [goalTitle, setGoalTitle] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [addedTasks, setAddedTasks] = useState<string[]>([]);

  // Fetch Goals
  const fetchGoals = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const data = await api.getGoals();
      setGoals(data);
    } catch (err) {
      console.error(err);
      setError('Unable to sync goals with API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // Form Sub-handlers
  const handleAddStagedTask = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    const cleanTask = taskInput.trim();
    if (!cleanTask) {
      setError('Sub-task item title cannot be empty.');
      return;
    }
    if (addedTasks.includes(cleanTask)) {
      setError('This sub-task is already added.');
      return;
    }
    setAddedTasks([...addedTasks, cleanTask]);
    setTaskInput('');
    setError(null);
  };

  const handleRemoveStagedTask = (index: number) => {
    setAddedTasks(addedTasks.filter((_, i) => i !== index));
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) {
      setError('Please provide a goal title.');
      return;
    }
    if (!targetTime) {
      setError('Please select a target date and time.');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      // Send target time as ISO string
      const isoTargetTime = new Date(targetTime).toISOString();
      await api.createGoal(goalTitle.trim(), isoTargetTime, addedTasks);
      
      // Reset form
      setGoalTitle('');
      setTargetTime('');
      setAddedTasks([]);
      setTaskInput('');
      
      await fetchGoals(false);
    } catch (err) {
      console.error(err);
      setError('Failed to create goal.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleTask = async (goalId: string, taskId: string, currentCompleted: boolean) => {
    setActionLoadingId(`${goalId}-${taskId}`);
    setError(null);
    try {
      await api.toggleGoalTask(goalId, taskId, !currentCompleted);
      await fetchGoals(false);
    } catch (err) {
      console.error(err);
      setError('Failed to update sub-task status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    setActionLoadingId(goalId);
    setError(null);
    try {
      await api.deleteGoal(goalId);
      await fetchGoals(false);
    } catch (err) {
      console.error(err);
      setError('Failed to delete goal.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper: Format human friendly distance to time
  const getProximityText = (targetTimeStr: string): { text: string; status: 'overdue' | 'soon' | 'future' } => {
    const diffMs = new Date(targetTimeStr).getTime() - Date.now();
    const isOverdue = diffMs < 0;
    const absDiff = Math.abs(diffMs);
    
    const minutes = Math.floor(absDiff / (1000 * 60));
    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

    let text = '';
    if (days > 0) {
      text = `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      text = `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      text = `${minutes} min${minutes !== 1 ? 's' : ''}`;
    }

    if (isOverdue) {
      return { text: `${text} overdue`, status: 'overdue' };
    }
    
    // If within 24 hours, count as soon
    if (diffMs < 1000 * 60 * 60 * 24) {
      return { text: `In ${text}`, status: 'soon' };
    }
    
    return { text: `In ${text}`, status: 'future' };
  };

  // Sort Goals: Closest target time first.
  // Past goals (overdue) will stay at the top because their target time has passed (earliest time).
  const sortedGoals = [...goals].sort((a, b) => {
    return new Date(a.targetTime).getTime() - new Date(b.targetTime).getTime();
  });

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Goal Tracker</h1>
          <p style={styles.subtitle}>Track checkpoints sorted by absolute proximity</p>
        </div>
        <button 
          onClick={() => fetchGoals(true)} 
          style={styles.refreshBtn} 
          disabled={loading}
          title="Force Sync"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Layout: Create Goal on Left, List on Right */}
      <div style={styles.grid}>
        
        {/* Left Column: Form Card */}
        <div style={styles.formCard} className="glass-panel">
          <h2 style={styles.sectionTitle}>Set New Goal</h2>
          <form onSubmit={handleCreateGoal} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Goal Title</label>
              <input
                type="text"
                placeholder="e.g. Launch Beta Site"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                disabled={isCreating}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Target Deadline</label>
              <input
                type="datetime-local"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                disabled={isCreating}
              />
            </div>

            {/* Staging Nested Tasks */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Checklist Items</label>
              <div style={styles.stagedInputRow}>
                <input
                  type="text"
                  placeholder="Add item..."
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  disabled={isCreating}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddStagedTask(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddStagedTask()}
                  style={styles.inlineAddBtn}
                  className="btn-secondary"
                  disabled={isCreating}
                >
                  <Plus size={16} />
                </button>
              </div>

              {addedTasks.length > 0 && (
                <div style={styles.stagedList}>
                  {addedTasks.map((t, idx) => (
                    <div key={idx} style={styles.stagedItem}>
                      <span style={styles.stagedText}>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStagedTask(idx)}
                        style={styles.stagedRemoveBtn}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="btn-primary"
              style={styles.submitBtn}
            >
              {isCreating ? <Loader2 size={16} style={styles.spinner} /> : <Calendar size={16} />}
              Initialize Goal
            </button>
          </form>
        </div>

        {/* Right Column: Goal Checklist Cards */}
        <div style={styles.goalsListColumn}>
          <h2 style={styles.sectionTitle}>Timeline</h2>
          
          {loading ? (
            <div style={styles.goalsStack}>
              {[1, 2].map((n) => (
                <div key={n} style={styles.skeletonGoal} className="skeleton" />
              ))}
            </div>
          ) : sortedGoals.length === 0 ? (
            <div style={styles.emptyState}>
              <Clock size={44} style={styles.emptyIcon} />
              <h3 style={styles.emptyTitle}>No scheduled goals</h3>
              <p style={styles.emptySubtitle}>All clear! Create a goal on the left panel to begin mapping progress.</p>
            </div>
          ) : (
            <div style={styles.goalsStack}>
              {sortedGoals.map((goal) => {
                const proximity = getProximityText(goal.targetTime);
                const completedCount = goal.tasks.filter(t => t.completed).length;
                const totalCount = goal.tasks.length;
                const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                // Color code proximity borders / badges
                let badgeStyle = styles.badgeFuture;
                let cardBorderStyle = {};
                if (proximity.status === 'overdue') {
                  badgeStyle = styles.badgeOverdue;
                  cardBorderStyle = styles.cardOverdue;
                } else if (proximity.status === 'soon') {
                  badgeStyle = styles.badgeSoon;
                  cardBorderStyle = styles.cardSoon;
                }

                return (
                  <div 
                    key={goal.id} 
                    style={{
                      ...styles.goalCard,
                      ...cardBorderStyle
                    }}
                  >
                    {/* Header */}
                    <div style={styles.cardHeader}>
                      <div style={styles.titleArea}>
                        <h3 style={styles.goalCardTitle}>{goal.title}</h3>
                        <span style={styles.dateLabel}>
                          Deadline: {new Date(goal.targetTime).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <div style={styles.badgeArea}>
                        <span style={{ ...styles.proxBadge, ...badgeStyle }}>
                          {proximity.status === 'overdue' && <AlertTriangle size={12} style={{ marginRight: '4px' }} />}
                          {proximity.text}
                        </span>
                        
                        {actionLoadingId === goal.id ? (
                          <Loader2 size={16} style={styles.itemSpinner} />
                        ) : (
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="btn-icon danger"
                            title="Remove Goal"
                            style={styles.deleteCardBtn}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {totalCount > 0 && (
                      <div style={styles.progressContainer}>
                        <div style={styles.progressText}>
                          <span>Progress</span>
                          <span>{completedCount}/{totalCount} tasks ({Math.round(progressPct)}%)</span>
                        </div>
                        <div style={styles.progressBarBg}>
                          <div style={{ ...styles.progressBarFill, width: `${progressPct}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Nested Task List */}
                    {totalCount > 0 ? (
                      <div style={styles.taskList}>
                        {goal.tasks.map((task) => (
                          <div key={task.id} style={styles.taskItem}>
                            <label className="custom-checkbox">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => handleToggleTask(goal.id, task.id, task.completed)}
                                disabled={actionLoadingId === `${goal.id}-${task.id}`}
                              />
                              <span className="checkmark"></span>
                            </label>
                            
                            <span style={{
                              ...styles.taskTitle,
                              ...(task.completed ? styles.taskCompleted : {})
                            }}>
                              {task.title}
                            </span>
                            
                            {actionLoadingId === `${goal.id}-${task.id}` && (
                              <Loader2 size={12} style={styles.nestedSpinner} />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={styles.noTasksMessage}>
                        No tasks associated with this goal.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
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
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto 32px auto',
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
    marginBottom: '24px',
    maxWidth: '1200px',
    margin: '0 auto 24px auto',
    width: '100%',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gap: '32px',
    alignItems: 'start',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
  },
  formCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    position: 'sticky',
    top: '0',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
    marginBottom: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    letterSpacing: '0.5px',
  },
  stagedInputRow: {
    display: 'flex',
    gap: '8px',
  },
  inlineAddBtn: {
    padding: '0 12px',
  },
  stagedList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '8px',
    maxHeight: '120px',
    overflowY: 'auto',
    padding: '4px',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-primary)',
  },
  stagedItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '0.8rem',
  },
  stagedText: {
    color: 'var(--text-primary)',
  },
  stagedRemoveBtn: {
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    padding: '0',
  },
  submitBtn: {
    marginTop: '10px',
    justifyContent: 'center',
  },
  goalsListColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  goalsStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  goalCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'var(--transition-smooth)',
  },
  cardOverdue: {
    borderLeft: '4px solid var(--danger)',
  },
  cardSoon: {
    borderLeft: '4px solid var(--warning)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
  },
  titleArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flexGrow: 1,
  },
  goalCardTitle: {
    fontSize: '1.15rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  dateLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  badgeArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  proxBadge: {
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '20px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  badgeOverdue: {
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  badgeSoon: {
    backgroundColor: 'var(--warning-bg)',
    color: 'var(--warning)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
  },
  badgeFuture: {
    backgroundColor: 'var(--accent-light)',
    color: 'var(--accent)',
    border: '1px solid var(--accent-border)',
  },
  deleteCardBtn: {
    width: '32px',
    height: '32px',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'var(--accent-gradient)',
    borderRadius: '10px',
    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '14px',
  },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  taskTitle: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    transition: 'var(--transition-smooth)',
  },
  taskCompleted: {
    textDecoration: 'line-through',
    color: 'var(--text-muted)',
  },
  noTasksMessage: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    paddingTop: '8px',
    borderTop: '1px solid var(--border-color)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
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
    maxWidth: '340px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  itemSpinner: {
    animation: 'spin 1s linear infinite',
    color: 'var(--text-muted)',
  },
  nestedSpinner: {
    animation: 'spin 1s linear infinite',
    color: 'var(--text-muted)',
  },
  skeletonGoal: {
    height: '180px',
    width: '100%',
  }
};
