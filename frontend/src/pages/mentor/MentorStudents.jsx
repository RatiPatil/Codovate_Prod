import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, ExternalLink, Download } from 'lucide-react';

const MentorStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/mentor-interactions/students');
        setStudents(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.college?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Students</h1>
          <p className="text-gray-400">Students who have reached out to you for guidance.</p>
        </div>
        
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search students..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-white/5 rounded-2xl"></div>)}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-gray-400 text-lg">No students have contacted you yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(student => (
            <div key={student.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl">
                  {student.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{student.name}</h3>
                  <p className="text-sm text-gray-400">{student.college}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">Top Skills</p>
                <div className="flex flex-wrap gap-2">
                  {student.skills?.slice(0, 3).map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-white/5 text-gray-300 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                  {student.skills?.length > 3 && (
                    <span className="px-2 py-1 bg-white/5 text-gray-500 rounded text-xs">
                      +{student.skills.length - 3}
                    </span>
                  )}
                  {(!student.skills || student.skills.length === 0) && (
                    <span className="text-sm text-gray-600">No skills listed</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-center border-y border-white/10 py-4">
                <div>
                  <p className="text-xl font-bold text-white">{student.projects_count}</p>
                  <p className="text-xs text-gray-500 uppercase">Projects</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{student.certificates_count}</p>
                  <p className="text-xs text-gray-500 uppercase">Certificates</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                {student.resume_url ? (
                  <a 
                    href={student.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    <Download size={16} /> View Resume
                  </a>
                ) : (
                  <span className="text-sm text-gray-600 italic">No Resume Uploaded</span>
                )}
                
                <a 
                  href={`/public-portfolio/${student.id}`} 
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Full Profile <ExternalLink size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorStudents;
