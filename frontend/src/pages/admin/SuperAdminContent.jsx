import React, { useState, useMemo } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import { formatDate } from '../../utils/dateUtils';

// Mock Data for Content
const MOCK_CONTENT = [
  { id: '1', title: 'Terms of Service', type: 'Legal', status: 'Published', author: 'System', updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
  { id: '2', title: 'Privacy Policy', type: 'Legal', status: 'Published', author: 'System', updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString() },
  { id: '3', title: 'Welcome Banner 2026', type: 'Banner', status: 'Active', author: 'Marketing Team', updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: '4', title: 'How to use Codovate (Student Guide)', type: 'FAQ', status: 'Draft', author: 'Support', updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: '5', title: 'Mentorship Guidelines', type: 'Resource', status: 'Archived', author: 'John Doe', updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString() },
];

const SuperAdminContent = () => {
  const [content] = useState(MOCK_CONTENT);
  const [filterTab, setFilterTab] = useState('all');

  const filteredContent = useMemo(() => {
    if (filterTab === 'published') return content.filter(c => c.status === 'Published' || c.status === 'Active');
    if (filterTab === 'drafts') return content.filter(c => c.status === 'Draft');
    return content;
  }, [content, filterTab]);

  const columns = [
    { 
      header: 'Content Title', 
      render: (row) => (
        <div>
          <p className="font-bold text-white">{row.title}</p>
          <p className="text-[10px] text-[#2015FF] font-bold tracking-wide uppercase mt-0.5">{row.type}</p>
        </div>
      )
    },
    { 
      header: 'Status', 
      render: (row) => {
        const sc = {
          'Published': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          'Active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          'Draft': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
          'Archived': 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        };
        const colorClass = sc[row.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase border ${colorClass}`}>
            {row.status}
          </span>
        );
      }
    },
    { 
      header: 'Author', 
      render: (row) => (
        <p className="text-sm font-semibold text-gray-300">{row.author}</p>
      )
    },
    { 
      header: 'Last Updated', 
      render: (row) => (
        <p className="text-xs text-gray-500 font-mono">
          {formatDate(row.updated_at, { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-[#2015FF]/10 hover:bg-[#2015FF]/20 text-[#6060FF] border border-[#2015FF]/20 rounded-lg text-xs font-bold transition-colors">
            Edit
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto">
      
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white mb-2">Content Management System</h1>
          <p className="text-sm text-gray-400">Manage global platform content, legal documents, FAQs, and banners.</p>
        </div>
        <button className="px-4 py-2 bg-[#2015FF] hover:bg-[#2015FF]/80 text-white rounded-xl text-sm font-bold shadow-lg shadow-[#2015FF]/20 transition-all">
          + Create Content
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterTab === 'all' ? 'bg-[#2015FF] text-white shadow-lg shadow-[#2015FF]/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          All Content
        </button>
        <button
          onClick={() => setFilterTab('published')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterTab === 'published' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          Published
        </button>
        <button
          onClick={() => setFilterTab('drafts')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterTab === 'drafts' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          Drafts
        </button>
      </div>

      <AdminDataTable 
        title="Published Pages & Resources"
        data={filteredContent}
        columns={columns}
        loading={false}
        searchPlaceholder="Search by title, author, or type..."
        searchableKeys={['title', 'author', 'type']}
      />
    </div>
  );
};

export default SuperAdminContent;
