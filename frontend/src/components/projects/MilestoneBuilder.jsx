import { useState } from 'react';

const MilestoneBuilder = ({ milestones = [], onChange }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const addMilestone = () => {
    if (!newTitle.trim()) return;
    onChange([...milestones, { title: newTitle.trim(), date: newDate, done: false }]);
    setNewTitle('');
    setNewDate('');
  };

  const toggleDone = (idx) => {
    const updated = milestones.map((m, i) => i === idx ? { ...m, done: !m.done } : m);
    onChange(updated);
  };

  const remove = (idx) => {
    onChange(milestones.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
        Project Milestones
      </label>

      <div className="space-y-2 mb-3">
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <button type="button" onClick={() => toggleDone(i)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${m.done ? 'bg-green-500 border-green-500 text-white' : 'border-white/30'}`}>
              {m.done && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${m.done ? 'line-through text-gray-500' : 'text-white'}`}>{m.title}</p>
              {m.date && <p className="text-[10px] text-gray-500">{m.date}</p>}
            </div>
            <button type="button" onClick={() => remove(i)} className="text-gray-600 hover:text-red-400 transition-colors text-xs">✕</button>
          </div>
        ))}
        {milestones.length === 0 && (
          <p className="text-xs text-gray-600 italic text-center py-2">No milestones yet. Add one below.</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
          placeholder="e.g. MVP completed"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
        />
        <input
          type="month"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-400 focus:outline-none focus:border-primary/50"
        />
        <button type="button" onClick={addMilestone}
          className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary text-sm font-bold rounded-xl border border-primary/30 transition-all">
          Add
        </button>
      </div>
    </div>
  );
};

export default MilestoneBuilder;
