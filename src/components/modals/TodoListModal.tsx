import React, { useState, useEffect, useRef } from 'react';
import { OfficeTask, TaskCategory } from '../../types/task';
import { CheckCircle2, Circle, Plus, Trash2, X, ClipboardList, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tasks: OfficeTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string, category: TaskCategory) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TodoListModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tasks = [],
  onToggleTask,
  onAddTask,
  onDeleteTask,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Project');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const doneCount = safeTasks.filter((t) => t.completed).length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), newCategory);
    setNewTitle('');
    setIsAdding(false);
  };

  const getCategoryBadge = (cat: TaskCategory) => {
    switch (cat) {
      case 'Meeting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Development':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Operations':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Collaboration':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-sand text-ink border-[#c4b8a1]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Papan agenda dan tugas kantor"
        tabIndex={-1}
        className="w-full max-w-lg bg-cream border-2 border-wood rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-wood text-soft border-b border-wood-dark flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-soft/10 flex items-center justify-center text-soft">
              <ClipboardList className="w-4 h-4 text-ochre" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-soft font-serif">Papan Agenda Kerja Kantor</h2>
              <p className="text-[11px] text-soft/80">
                {doneCount} dari {safeTasks.length} agenda selesai diproses
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Papan Agenda"
            className="text-soft/80 hover:text-soft p-1 rounded-lg hover:bg-soft/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task List Content */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-parchment/40">
          {/* Quick Add Bar */}
          {!isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2 px-3 border border-dashed border-[#b5aa94] hover:border-teal rounded-xl text-xs font-semibold text-teal hover:bg-teal/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Agenda Kerja Baru</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="p-3 bg-cream border border-[#b5aa94] rounded-xl space-y-2.5 shadow-xs">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Tuliskan nama agenda / tugas kantor..."
                autoFocus
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#c4b8a1] rounded-lg text-ink focus:outline-none focus:border-teal"
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                  className="px-2.5 py-1 text-xs bg-white border border-[#c4b8a1] rounded-lg text-ink focus:outline-none focus:border-teal"
                >
                  <option value="Meeting">Meeting</option>
                  <option value="Project">Project</option>
                  <option value="Development">Development</option>
                  <option value="Operations">Operations</option>
                  <option value="Collaboration">Collaboration</option>
                </select>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setIsAdding(false); setNewTitle(''); }}
                    className="px-3 py-1 text-xs text-ink-muted hover:text-ink cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-bold bg-teal text-soft rounded-lg hover:bg-teal-dark transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Task Items */}
          <div className="space-y-2 pt-1">
            {safeTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs ${
                  task.completed
                    ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                    : 'bg-cream border-[#d1c7b5] hover:border-teal text-ink'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                    className="flex-shrink-0 cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-ink-muted group-hover:text-teal" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${task.completed ? 'line-through text-ink-muted' : 'text-ink'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-ink-muted">
                      <span>{task.zone}</span>
                      {task.assignedTo && <span>• {task.assignedTo}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${getCategoryBadge(task.category)}`}>
                    {task.category}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                    title="Hapus Agenda"
                    className="opacity-0 group-hover:opacity-100 p-1 text-ink-muted hover:text-red-600 rounded transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-sand/60 border-t border-[#d1c7b5] flex items-center justify-between text-[11px] text-ink-muted flex-shrink-0">
          <span>Tekan <kbd className="px-1.5 py-0.5 bg-cream border border-[#c4b8a1] rounded font-mono text-[10px]">ESC</kbd> untuk menutup</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-teal hover:underline cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
