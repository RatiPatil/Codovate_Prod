import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, Bookmark, Share2, Link as LinkIcon, BarChart2 } from 'lucide-react';
import api from '../../api/axios';
import { formatTime } from '../../utils/dateUtils';
import { showAlert } from '../../utils/uiUtils';

const PostCard = ({ post, onUpdate }) => {
  const [isUpvoted, setIsUpvoted] = useState(post.isUpvoted);
  const [upvotes, setUpvotes] = useState(post.upvotes || 0);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [voting, setVoting] = useState(false);
  const [pollData, setPollData] = useState(post.poll_options || []);
  const [totalVotes, setTotalVotes] = useState(post.total_votes || 0);
  const [hasVoted, setHasVoted] = useState(false); // In real app, fetch from backend if user voted

  const handleUpvote = async () => {
    try {
      setIsUpvoted(!isUpvoted);
      setUpvotes(prev => isUpvoted ? prev - 1 : prev + 1);
      await api.post(`/community/posts/${post.id}/upvote`);
    } catch (err) {
      // Revert on error
      setIsUpvoted(!isUpvoted);
      setUpvotes(prev => isUpvoted ? prev + 1 : prev - 1);
      showAlert('Failed to upvote');
    }
  };

  const handleBookmark = async () => {
    try {
      setIsBookmarked(!isBookmarked);
      await api.post(`/community/posts/${post.id}/bookmark`);
    } catch (err) {
      setIsBookmarked(!isBookmarked);
      showAlert('Failed to bookmark');
    }
  };

  const handleVote = async (optionIndex) => {
    if (hasVoted) return;
    setVoting(true);
    try {
      await api.post(`/community/posts/${post.id}/vote`, { optionIndex });
      setHasVoted(true);
      setTotalVotes(prev => prev + 1);
      setPollData(prev => {
        const newData = [...prev];
        newData[optionIndex].votes += 1;
        return newData;
      });
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  const getBadgeColor = (category) => {
    switch (category) {
      case 'Hackathons': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Technology': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Open Source': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Startups': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Career Goals': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default: return 'bg-white/5 text-gray-300 border-white/10';
    }
  };

  return (
    <div className="bg-[#0A0A10] border border-white/5 rounded-2xl p-5 mb-6 transition-all hover:border-white/10">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary overflow-hidden">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              post.author_name?.charAt(0) || 'U'
            )}
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">{post.author_name}</h4>
            <p className="text-xs text-gray-500">{post.author_headline} • {formatTime(post.created_at)}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeColor(post.category)}`}>
          {post.category}
        </span>
      </div>

      {/* Content */}
      <div className="mb-4">
        {post.title && <h3 className="text-lg font-bold text-white mb-2">{post.title}</h3>}
        <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>

      {/* Render based on Type */}
      {post.type === 'poll' && (
        <div className="bg-[#12121A] border border-white/5 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3 text-gray-400 text-xs font-bold uppercase tracking-widest">
            <BarChart2 size={14} /> Poll • {totalVotes} votes
          </div>
          <div className="space-y-2">
            {pollData.map((opt, idx) => {
              const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
              return (
                <button 
                  key={idx}
                  onClick={() => handleVote(idx)}
                  disabled={hasVoted || voting}
                  className="w-full relative bg-white/5 border border-white/10 rounded-lg p-3 text-left overflow-hidden group hover:border-primary/50 transition-colors disabled:cursor-default"
                >
                  <div 
                    className="absolute inset-y-0 left-0 bg-primary/20 transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative z-10 flex justify-between items-center text-sm font-medium">
                    <span className="text-gray-200">{opt.text}</span>
                    {hasVoted && <span className="text-gray-400">{percentage}%</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {post.type === 'resource' && post.resource_url && (
        <a 
          href={post.resource_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-[#12121A] border border-white/10 hover:border-primary/50 p-4 rounded-xl mb-4 group transition-colors"
        >
          <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
            <LinkIcon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">Shared Resource Link</p>
            <p className="text-xs text-gray-500 truncate">{post.resource_url}</p>
          </div>
        </a>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-4 border-t border-white/5">
        <button 
          onClick={handleUpvote}
          className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
            isUpvoted ? 'text-primary' : 'text-gray-500 hover:text-white'
          }`}
        >
          <ThumbsUp size={18} className={isUpvoted ? 'fill-primary' : ''} />
          {upvotes}
        </button>
        <button className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-white transition-colors">
          <MessageCircle size={18} />
          {post.reply_count || 0}
        </button>
        <div className="flex-1" />
        <button 
          onClick={handleBookmark}
          className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
            isBookmarked ? 'text-yellow-500' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Bookmark size={18} className={isBookmarked ? 'fill-yellow-500' : ''} />
        </button>
        <button className="text-gray-500 hover:text-white transition-colors">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default PostCard;
