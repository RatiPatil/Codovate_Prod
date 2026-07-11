import { useState } from 'react';
import TeamsHome from './TeamsHome';
import FindTeammates from './FindTeammates';
import MyConnections from './MyConnections';
import MyTeams from './MyTeams';
import ChatInterface from './ChatInterface';

const TeamsLayout = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [activeChatId, setActiveChatId] = useState(null);

  const tabs = [
    { id: 'home', label: 'Discover Teams', icon: '🔍' },
    { id: 'teammates', label: 'Find Teammates', icon: '👥' },
    { id: 'my_teams', label: 'My Teams', icon: '💼' },
    { id: 'connections', label: 'My Connections', icon: '🤝' },
    { id: 'chat', label: 'Messages', icon: '💬' }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Teams & Networking</h1>
          <p className="text-gray-400 mt-1">Connect with peers, join projects, and collaborate.</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && <TeamsHome />}
        {activeTab === 'teammates' && <FindTeammates />}
        {activeTab === 'my_teams' && <MyTeams />}
        {activeTab === 'connections' && <MyConnections onOpenChat={(chatId) => {
          setActiveChatId(chatId);
          setActiveTab('chat');
        }} />}
        {activeTab === 'chat' && (
          <ChatInterface 
            initialChatId={activeChatId} 
            onChatSelect={setActiveChatId} 
          />
        )}
      </div>
    </div>
  );
};

export default TeamsLayout;
