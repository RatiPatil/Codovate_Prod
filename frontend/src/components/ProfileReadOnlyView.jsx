import React from 'react';

const ProfileReadOnlyView = ({ 
  user, 
  isOwner = false,
  onAvatarChange,
  getMissingItems,
  onEditClick,
  onShareClick,
  linking,
  onLinkGoogle,
  theme,
  toggleTheme
}) => {
  if (!user) return null;

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto scrollbar-hide pr-2">
      {/* Top Identity Card */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 text-center relative overflow-hidden w-full">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none" />
        
        {isOwner && (
          <input 
            type="file" 
            id="avatar-upload" 
            accept="image/*" 
            className="hidden" 
            onChange={onAvatarChange} 
          />
        )}
        
        {isOwner ? (
          <label htmlFor="avatar-upload">
            <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(32,21,255,0.2)] backdrop-blur-md relative z-10 overflow-hidden cursor-pointer group">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover group-hover:opacity-50 transition-all" />
              ) : (
                <span className="text-4xl font-bold text-primary group-hover:opacity-50 transition-all">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <span className="text-[10px] uppercase font-bold text-white tracking-widest text-center">Edit<br/>Picture</span>
              </div>
            </div>
          </label>
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(32,21,255,0.2)] backdrop-blur-md relative z-10 overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-primary">{user.name ? user.name.charAt(0).toUpperCase() : 'ðŸ‘¤'}</span>
            )}
          </div>
        )}
        
        <h2 className="text-gray-900 dark:text-white font-bold text-2xl tracking-tight relative z-10">{user.name?.toUpperCase() || 'UNKNOWN USER'}</h2>
        {isOwner && <p className="text-gray-400 text-sm mt-1 relative z-10">{user.email}</p>}
        
        {/* Desired Roles */}
        {user.desired_roles && user.desired_roles.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5 relative z-10">
            {user.desired_roles.map(role => (
              <span
                key={role}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-primary/10 border border-primary/25 text-primary"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                {role}
              </span>
            ))}
          </div>
        )}

        {/* Education Details */}
        {(user.college || user.year || user.branch || user.degree) && (
          <div className="mt-4 flex flex-wrap justify-center gap-2 relative z-10">
            {user.college && <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-300">ðŸŽ“ {user.college}</span>}
            {user.year && <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-300">ðŸ“… Year {user.year}</span>}
            {(user.branch || user.degree) && <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-300">ðŸ“š {[user.degree, user.branch].filter(Boolean).join(' â€¢ ')}</span>}
          </div>
        )}

        {/* Location */}
        {(user.district || user.state || user.city || user.country) && (
          <p className="text-gray-400 text-xs mt-3 relative z-10 font-medium">
            ðŸ“ {[user.city || user.district, user.state, user.country].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Private Mobile Number */}
        {isOwner && user.phone && (
          <div className="mt-4 flex justify-center relative z-10">
            <div className="bg-black/40 border border-white/10 px-3 py-2 rounded-lg text-left inline-flex flex-col">
              <span className="text-gray-200 text-sm font-semibold flex items-center gap-2">ðŸ“± {user.phone}</span>
              <span className="text-gray-500 text-[9px] uppercase tracking-wider mt-0.5">ðŸ”’ Only you can see this</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center text-center">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Activity Score</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{user.activity_score || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center text-center">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Points</p>
          <p className="text-2xl font-black text-primary">{user.points || 0}</p>
        </div>
      </div>

      {/* External Links */}
      {(user.github_url || user.linkedin_url || user.portfolio_url || user.resume_url) && (
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden w-full flex flex-wrap gap-3">
          {user.github_url && (
            <a href={user.github_url} target="_blank" rel="noreferrer" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-[#24292e] text-white py-2 rounded-lg text-xs font-bold hover:bg-black transition">
              <i className="fab fa-github text-sm"></i> GitHub
            </a>
          )}
          {user.linkedin_url && (
            <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-[#0077b5] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#005582] transition">
              <i className="fab fa-linkedin text-sm"></i> LinkedIn
            </a>
          )}
          {user.portfolio_url && (
            <a href={user.portfolio_url} target="_blank" rel="noreferrer" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg text-xs font-bold hover:opacity-90 transition">
              <i className="fas fa-globe text-sm"></i> Portfolio
            </a>
          )}
          {user.resume_url && (
            <a href={user.resume_url} target="_blank" rel="noreferrer" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-white/10 text-white py-2 rounded-lg text-xs font-bold hover:bg-white/20 transition">
              <i className="fas fa-file-alt text-sm"></i> Resume
            </a>
          )}
        </div>
      )}

      {/* About Me */}
      {user.bio && (
        <div className="glass-panel rounded-2xl p-6 relative w-full">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><span className="text-xl">ðŸ‘‹</span> About Me</h3>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{user.bio}</p>
        </div>
      )}

      {/* Skills */}
      {user.skills && user.skills.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden w-full">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />
          <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2 relative z-10"><span className="text-xl">âš¡</span> All Skills</h3>
          <div className="flex flex-wrap gap-2 relative z-10">
            {user.skills.map(skill => (
              <span key={skill} className="px-3 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-white text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Achievements & Badges */}
      {((user.achievements && user.achievements.length > 0) || (user.badges && user.badges.length > 0)) && (
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden w-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-bl-[100px] pointer-events-none" />
          <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2 relative z-10"><span className="text-xl">ðŸ†</span> Achievements & Badges</h3>
          
          {user.achievements && user.achievements.length > 0 && (
            <div className="flex flex-wrap gap-2 relative z-10 mb-4">
              {user.achievements.map(achievement => (
                <span key={achievement} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/25 text-yellow-300 rounded-xl text-xs font-bold">
                  <span>ðŸ…</span>
                  {achievement}
                </span>
              ))}
            </div>
          )}
          
          {user.badges && user.badges.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 mb-2">Platform Badges</p>
              <div className="flex flex-wrap gap-2 relative z-10">
                {user.badges.map(badge => (
                  <div key={badge} className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-xl">
                    <span className="text-sm">ðŸ†</span>
                    <span className="text-xs font-bold text-yellow-400">{badge}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Seeking */}
      {user.seeking && user.seeking.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden w-full">
          <div className="absolute top-0 left-0 w-28 h-28 bg-emerald-500/10 rounded-br-[100px] pointer-events-none" />
          <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2 relative z-10"><span className="text-xl">ðŸ¤</span> Seeking</h3>
          <div className="flex flex-wrap gap-2 relative z-10">
            {user.seeking.map(item => (
              <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 rounded-xl text-xs font-bold">
                <span>ðŸ¤</span>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Passionate About */}
      {user.passionate_about && user.passionate_about.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden w-full">
          <div className="absolute bottom-0 right-0 w-28 h-28 bg-rose-500/10 rounded-tl-[100px] pointer-events-none" />
          <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2 relative z-10"><span className="text-xl">ðŸš€</span> Passionate About</h3>
          <div className="flex flex-wrap gap-2 relative z-10">
            {user.passionate_about.map(item => (
              <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-xl text-xs font-bold">
                <span>ðŸš€</span>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Profile Strength */}
      <div className="glass-panel rounded-2xl p-6 w-full mt-4">
        <div className="flex justify-between items-end mb-3">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Profile Strength</span>
          <span className="text-xl text-primary font-black">{user.profile_completion || 0}%</span>
        </div>
        <div className="h-2.5 bg-black/50 rounded-full overflow-hidden shadow-inner border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_10px_rgba(32,21,255,0.5)]"
            style={{ width: `${user.profile_completion || 0}%` }}
          />
        </div>
        
        {isOwner && getMissingItems && getMissingItems().length > 0 && (
          <div className="mt-4 space-y-2 text-left">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Boost your profile</p>
            {getMissingItems().slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-600 dark:text-gray-300 text-xs">{item.label}</span>
                <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">+{item.boost}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwner && (
        <>
          {/* Action Buttons */}
          <div className="flex gap-4 relative z-20">
            <button
              type="button"
              onClick={onEditClick}
              className="flex-1 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-primary font-bold text-sm transition-all dark:bg-white/10 dark:hover:bg-white/15 dark:border-white/20 dark:text-white"
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={onShareClick}
              className="flex-1 py-3 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-xl text-primary font-bold text-sm transition-all"
            >
              Share Profile
            </button>
          </div>

          {/* Linked Accounts & Preferences */}
          <div className="glass-panel rounded-2xl p-5 md:p-6 w-full space-y-6">
            <div>
              <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2"><span className="text-xl">ðŸ”—</span> Linked Accounts</h3>
              <div className="space-y-3">
                {user.providers?.includes('google') ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                      <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">Google Connected</span>
                    </div>
                    <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">Linked</span>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={onLinkGoogle}
                    disabled={linking}
                    className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-20"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">{linking ? 'Linking...' : 'Link Google Account'}</span>
                  </button>
                )}
                
                {user.providers?.includes('phone') && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">ðŸ“±</span>
                      <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">Phone Connected</span>
                    </div>
                    <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">Linked</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2"><span className="text-xl">âš™ï¸</span> Preferences</h3>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{theme === 'dark' ? 'ðŸŒ™' : 'â˜€ï¸'}</span>
                  <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">App Theme</span>
                </div>
                <button 
                  type="button"
                  onClick={toggleTheme}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 bg-primary border-primary text-white hover:bg-primary-light relative z-20"
                >
                  Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileReadOnlyView;

