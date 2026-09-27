import React, { useState, useEffect } from 'react';
import { History, X, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { showAlert } from '../../utils/uiUtils';

const ImportHistoryModal = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/opportunities/import-history');
      setHistory(res.data);
    } catch (err) {
      showAlert("Failed to load import history.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0f] border border-[#2a2a35] rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a35]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import History</h2>
              <p className="text-xs text-gray-400 mt-0.5">Logs of all JSON bulk imports</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#2a2a35] rounded-lg transition-colors text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : (
            <div className="flex-1 overflow-auto border border-[#2a2a35] rounded-xl bg-[#12121a]">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs uppercase bg-[#1a1a24] text-gray-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">File Name</th>
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3 text-center">Total</th>
                    <th className="px-4 py-3 text-center text-emerald-500">Imported</th>
                    <th className="px-4 py-3 text-center text-blue-500">Updated</th>
                    <th className="px-4 py-3 text-center text-red-500">Failed/Skipped</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-500">
                        No import history found.
                      </td>
                    </tr>
                  ) : (
                    history.map((record) => (
                      <tr key={record.id} className="border-b border-[#2a2a35] hover:bg-[#1a1a24] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">
                          {new Date(record.created_at?._seconds * 1000 || record.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">{record.file_name}</td>
                        <td className="px-4 py-3">{record.imported_by}</td>
                        <td className="px-4 py-3 text-center font-bold">{record.total_records}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-500">{record.imported}</td>
                        <td className="px-4 py-3 text-center font-bold text-blue-500">{record.updated}</td>
                        <td className="px-4 py-3 text-center font-bold text-red-500">{(record.failed || 0) + (record.skipped || 0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportHistoryModal;
