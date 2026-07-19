import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { showAlert } from '../utils/uiUtils';
import PostCard from '../components/community/PostCard';
import { Hash, Sparkles, MessageCircle, BarChart2, FileText, Plus, Search } from 'lucide-react';
import SkeletonLoader from '../components/common/SkeletonLoader';

const CATEGORIES = ['All', 'College', 'Technology', 'Career Goals', 'Hackathons', 'Open Source', 'Startups'];

const Community = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({
    type: 'discussion',
    category: 'Technology',
    title: '',
    content: '',
    resourceUrl: '',
    pollOptions: ['', '']
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/community/posts', {
        params: { category: activeCategory }
      });
      setPosts(res.data);
    } catch (err) {
      console.error(err);
      showAlert('Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.content) return;
    
    // Filter out empty poll options
    const finalPost = { ...newPost };
    if (finalPost.type === 'poll') {
      finalPost.pollOptions = finalPost.pollOptions.filter(o => o.trim() !== '');
      if (finalPost.pollOptions.length < 2) {
        return showAlert('Polls require at least 2 options');
      }
    }

    try {
      setCreating(true);
      const res = await api.post('/community/posts', finalPost);
      // Prepend to current feed if category matches
      if (activeCategory === 'All' || activeCategory === newPost.category) {
        setPosts([res.data, ...posts]);
      }
      setShowCreateModal(false);
      setNewPost({ type: 'discussion', category: 'Technology', title: '', content: '', resourceUrl: '', pollOptions: ['', ''] });
      showAlert('Post created!', 'success');
    } catch (err) {
      showAlert('Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const updatePollOption = (index, value) => {
    const newOptions = [...newPost.pollOptions];
    newOptions[index] = value;
    setNewPost({ ...newPost, pollOptions: newOptions });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-5xl mx-auto px-4 lg:px-8 py-6 fade-in overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="text-primary" size={28} /> Community
          </h1>
          <p className="text-gray-400 mt-1">Connect, discuss, and learn from peers worldwide.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus size={20} /> Create Post
        </button>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-white/10 shrink-0 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 border ${
              activeCategory === cat 
                ? 'bg-primary/10 text-primary border-primary/30' 
                : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat !== 'All' && <Hash size={14} />}
            {cat}
          </button>
        ))}
      </div>

      {/* Feed Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
        {loading ? (
          <SkeletonLoader type="card" count={3} />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageCircle size={48} className="text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No posts here yet</h3>
            <p className="text-gray-400 max-w-sm">Be the first to start a discussion in the {activeCategory} community!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 min-h-[120%]" onClick={() => !creating && setShowCreateModal(false)} />
          <div className="relative z-10 w-full max-w-2xl bg-[#0f0f11] border border-white/10 rounded-2xl shadow-2xl p-6 my-10">
            <h2 className="text-2xl font-bold text-white mb-6">Create Post</h2>
            
            <form onSubmit={handleCreatePost} className="space-y-5">
              {/* Type Selection */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'discussion', icon: MessageCircle, label: 'Discussion' },
                  { id: 'question', icon: Sparkles, label: 'Question' },
                  { id: 'poll', icon: BarChart2, label: 'Poll' },
                  { id: 'resource', icon: FileText, label: 'Resource' }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setNewPost({ ...newPost, type: type.id })}
                    className={`p-3 rounded-xl flex flex-col items-center justify-center gap-2 border transition-all ${
                      newPost.type === type.id 
                        ? 'bg-primary/20 border-primary text-primary' 
                        : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <type.icon size={20} />
                    <span className="text-xs font-bold uppercase tracking-wider">{type.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    value={newPost.category}
                    onChange={e => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full bg-[#12121A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary [color-scheme:dark]"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Title <span className="text-gray-600">(Optional)</span></label>
                <input 
                  type="text"
                  value={newPost.title}
                  onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Summarize your post..."
                  className="w-full bg-[#12121A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Content *</label>
                <textarea 
                  required
                  rows={4}
                  value={newPost.content}
                  onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder={newPost.type === 'question' ? 'What do you want to ask?' : 'Share your thoughts...'}
                  className="w-full bg-[#12121A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {newPost.type === 'poll' && (
                <div className="space-y-3 bg-[#12121A] p-4 rounded-xl border border-white/5">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Poll Options</label>
                  {newPost.pollOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input 
                        type="text"
                        value={opt}
                        onChange={e => updatePollOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 bg-[#0A0A10] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                  {newPost.pollOptions.length < 5 && (
                    <button 
                      type="button" 
                      onClick={() => setNewPost({ ...newPost, pollOptions: [...newPost.pollOptions, ''] })}
                      className="text-xs font-bold text-primary hover:text-primary/80"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              )}

              {newPost.type === 'resource' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Resource URL *</label>
                  <input 
                    type="url"
                    required
                    value={newPost.resourceUrl}
                    onChange={e => setNewPost({ ...newPost, resourceUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-[#12121A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50">
                  {creating ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Community;
