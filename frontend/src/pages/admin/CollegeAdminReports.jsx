import React from 'react';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const CollegeAdminReports = () => {
  const handleGenerateCSV = async () => {
    try {
      // In a real app, you would probably trigger a blob download from the API
      const response = await api.get('/college-admin/reports/csv', { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_outcomes_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      showAlert("Failed to generate report");
    }
  };

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto">
      <div className="bg-[#080812] border border-white/5 rounded-3xl p-8 max-w-2xl">
        <h2 className="text-2xl font-black text-white mb-2">College Data Reports</h2>
        <p className="text-gray-500 mb-8">Export comprehensive data on your students' performance, project submissions, and certifications.</p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-emerald-500/50 transition-colors">
            <div>
              <h3 className="text-lg font-bold text-white">Student Outcomes Report</h3>
              <p className="text-sm text-gray-400">Includes student status, registered emails, and basic metrics.</p>
            </div>
            <button 
              onClick={handleGenerateCSV}
              className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Download CSV
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 opacity-50">
            <div>
              <h3 className="text-lg font-bold text-white">Placement Readiness Export</h3>
              <p className="text-sm text-gray-400">Detailed AI evaluation metrics. (Coming Soon)</p>
            </div>
            <button disabled className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg cursor-not-allowed">
              Locked
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeAdminReports;
