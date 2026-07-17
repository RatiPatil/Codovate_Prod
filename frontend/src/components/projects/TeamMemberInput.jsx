import { useState } from 'react';

const TeamMemberInput = ({ members = [], onChange }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [github, setGithub] = useState('');

  const add = () => {
    if (!name.trim()) return;
    onChange([...members, { name: name.trim(), role: role.trim(), github: github.trim() }]);
    setName(''); setRole(''); setGithub('');
  };

  const remove = (idx) => onChange(members.filter((_, i) => i !== idx));

  return (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
        Team Members
      </label>

      <div className="flex flex-wrap gap-2 mb-3">
        {members.map((m, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
              {m.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">{m.name}</p>
              {m.role && <p className="text-[10px] text-gray-500">{m.role}</p>}
            </div>
            {m.github && (
              <a href={`https://github.com/${m.github}`} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline">@{m.github}</a>
            )}
            <button type="button" onClick={() => remove(i)} className="text-gray-600 hover:text-red-400 transition-colors ml-1 text-xs">✕</button>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-xs text-gray-600 italic py-1">No team members added yet.</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Full Name *"
          className="col-span-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
        <input type="text" value={role} onChange={(e) => setRole(e.target.value)}
          placeholder="Role (e.g. Backend)"
          className="col-span-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
        <input type="text" value={github} onChange={(e) => setGithub(e.target.value)}
          placeholder="GitHub username"
          className="col-span-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
      </div>
      <button type="button" onClick={add}
        className="mt-2 w-full py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold rounded-xl border border-white/10 hover:border-white/20 transition-all">
        + Add Team Member
      </button>
    </div>
  );
};

export default TeamMemberInput;
