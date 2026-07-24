import React, { useState, useEffect } from 'react';
import { aiApi } from '../../../api/aiApi';
import { BrainCircuit, Briefcase, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/admin/ui/Button';

const AiDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await aiApi.getDashboard();
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <div>Failed to load AI Recommendations.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto p-4 lg:p-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-indigo-600" />
            AI Career Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Deterministic matching based on your CGPA, Skills, and active Enterprise Jobs.
          </p>
        </div>
        <div className="text-right bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="text-sm font-medium text-gray-500 mb-1">Placement Probability</div>
           <div className="text-3xl font-bold text-green-600">{data.placementProbability}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recommended Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5" /> Top Matched Roles
          </h2>
          
          {data.recommendedJobs.length === 0 ? (
             <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500">
               No strong matches found. Try adding more skills to your profile.
             </div>
          ) : (
            data.recommendedJobs.map((job) => (
              <div key={job.jobId} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{job.jobTitle}</h3>
                    <p className="text-indigo-600 font-medium">{job.company}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${job.matchScore >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {job.matchScore}% Match
                  </div>
                </div>
                
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <span className="font-semibold block mb-1">AI Reason:</span>
                  {job.reason}
                </p>

                {job.missingSkills.length > 0 && (
                  <div className="mt-4">
                    <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Missing Skills</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {job.missingSkills.map(skill => (
                        <span key={skill} className="px-2 py-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md border border-red-100 dark:border-red-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                   <Button variant="secondary" size="sm" rightIcon={ChevronRight}>View Role</Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Skill Gap & Roadmap */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-500" /> Overall Skill Gap
              </h2>
              {data.skillGap.length === 0 ? (
                <p className="text-sm text-gray-500">Your profile is fully optimized for your target roles!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.skillGap.map(skill => (
                    <span key={skill} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
           </div>

           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-500" /> 90-Day Roadmap
              </h2>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                 {data.roadmap.map((step, idx) => (
                   <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-indigo-500 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                     <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                       <div className="font-bold text-indigo-600 text-xs mb-1">{step.timeframe}</div>
                       <div className="text-sm text-gray-700 dark:text-gray-300">{step.action}</div>
                     </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default AiDashboard;
