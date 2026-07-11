import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, X, FileJson, Loader2, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import { showAlert } from '../../utils/uiUtils';

const REQUIRED_FIELDS = [
  'title', 'company', 'category', 'domain', 'location', 'workMode',
  'duration', 'stipend', 'jobType', 'vacancies', 'experience', 'summary',
  'skills', 'keywords', 'source', 'applyUrl', 'status'
];

const ImportJsonModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('upload'); // upload, preview, uploading, summary
  const [file, setFile] = useState(null);
  const [validRecords, setValidRecords] = useState([]);
  const [invalidRecords, setInvalidRecords] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setValidRecords([]);
    setInvalidRecords([]);
    setUploadProgress(0);
    setMetrics(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateRecords = (data) => {
    if (!Array.isArray(data)) {
      showAlert("Invalid JSON format. Expected an array of objects.");
      return;
    }

    if (data.length === 0) {
      showAlert("No internship records found.");
      return;
    }

    const valid = [];
    const invalid = [];

    data.forEach((record, index) => {
      const missingFields = REQUIRED_FIELDS.filter(field => !record[field] && record[field] !== 0 && record[field] !== false);
      if (missingFields.length > 0) {
        invalid.push({ ...record, _index: index, _error: `Missing: ${missingFields.join(', ')}` });
      } else {
        valid.push(record);
      }
    });

    setValidRecords(valid);
    setInvalidRecords(invalid);
    setStep('preview');
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
      showAlert("Please upload a valid .json file");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        validateRecords(jsonData);
      } catch (err) {
        showAlert("Invalid JSON format.");
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (validRecords.length === 0) {
      showAlert("No valid records to import.");
      return;
    }

    setStep('uploading');
    
    // Simulate progress while uploading
    const interval = setInterval(() => {
      setUploadProgress(p => p >= 90 ? 90 : p + 10);
    }, 500);

    try {
      const response = await api.post('/admin/opportunities/bulk-import', {
        records: validRecords,
        fileName: file.name,
        skippedCount: invalidRecords.length
      });
      clearInterval(interval);
      setUploadProgress(100);
      setMetrics(response.data.metrics);
      setTimeout(() => setStep('summary'), 500);
    } catch (err) {
      clearInterval(interval);
      setStep('preview');
      showAlert("Import failed. Please try again.");
    }
  };

  const renderUpload = () => (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#2a2a35] rounded-xl bg-[#1a1a24] hover:bg-[#20202c] transition-colors cursor-pointer"
         onClick={() => fileInputRef.current?.click()}
         onDragOver={(e) => e.preventDefault()}
         onDrop={(e) => {
           e.preventDefault();
           handleFileUpload({ target: { files: e.dataTransfer.files } });
         }}>
      <UploadCloud className="w-16 h-16 text-blue-500 mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">Upload JSON File</h3>
      <p className="text-gray-400 text-sm mb-6 text-center max-w-sm">
        Drag and drop your opportunities JSON file here, or click to browse.
      </p>
      <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
        Select File
      </button>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
    </div>
  );

  const renderPreview = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Data Preview</h3>
          <p className="text-sm text-gray-400 mt-1">
            <span className="text-emerald-500 font-bold">{validRecords.length} Valid</span> &nbsp;•&nbsp; 
            <span className="text-red-500 font-bold">{invalidRecords.length} Invalid</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setStep('upload')} className="px-4 py-2 border border-[#2a2a35] hover:bg-[#2a2a35] text-white rounded-lg text-sm font-bold transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleImport} 
            disabled={validRecords.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
          >
            Confirm Import <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-[#2a2a35] rounded-xl bg-[#12121a]">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="text-xs uppercase bg-[#1a1a24] text-gray-400 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Source</th>
            </tr>
          </thead>
          <tbody>
            {invalidRecords.map((rec) => (
              <tr key={`inv-${rec._index}`} className="border-b border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-red-500 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" /> Error
                  </div>
                  <p className="text-[10px] text-red-400 mt-1 max-w-[150px] truncate" title={rec._error}>{rec._error}</p>
                </td>
                <td className="px-4 py-3 font-medium text-white">{rec.title || 'N/A'}</td>
                <td className="px-4 py-3">{rec.company || 'N/A'}</td>
                <td className="px-4 py-3">{rec.category || 'N/A'}</td>
                <td className="px-4 py-3">{rec.location || 'N/A'}</td>
                <td className="px-4 py-3">{rec.source || 'N/A'}</td>
              </tr>
            ))}
            {validRecords.map((rec, i) => (
              <tr key={`val-${i}`} className="border-b border-[#2a2a35] hover:bg-[#1a1a24] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Ready
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-white">{rec.title}</td>
                <td className="px-4 py-3">{rec.company}</td>
                <td className="px-4 py-3">{rec.category}</td>
                <td className="px-4 py-3">{rec.location}</td>
                <td className="px-4 py-3">{rec.source}</td>
              </tr>
            ))}
            {validRecords.length === 0 && invalidRecords.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUploading = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
      <h3 className="text-xl font-bold text-white mb-2">Importing Records...</h3>
      <div className="w-full max-w-md bg-[#2a2a35] rounded-full h-2.5 mt-4">
        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
      </div>
      <p className="text-gray-400 text-sm mt-3">{uploadProgress}% Complete</p>
    </div>
  );

  const renderSummary = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <h3 className="text-2xl font-black text-white mb-6">Import Complete!</h3>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
        <div className="bg-[#1a1a24] border border-[#2a2a35] p-4 rounded-xl text-center">
          <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total</p>
          <p className="text-2xl font-black text-white">{metrics?.total || 0}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center">
          <p className="text-emerald-500 text-xs font-bold uppercase mb-1">Imported</p>
          <p className="text-2xl font-black text-emerald-500">{metrics?.imported || 0}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-center">
          <p className="text-blue-500 text-xs font-bold uppercase mb-1">Updated</p>
          <p className="text-2xl font-black text-blue-500">{metrics?.updated || 0}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
          <p className="text-red-500 text-xs font-bold uppercase mb-1">Failed/Skipped</p>
          <p className="text-2xl font-black text-red-500">{(metrics?.failed || 0) + (metrics?.skipped || 0)}</p>
        </div>
      </div>

      <button 
        onClick={() => {
          onSuccess();
          handleClose();
        }}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors w-full max-w-md"
      >
        Done
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`bg-[#0a0a0f] border border-[#2a2a35] rounded-2xl w-full flex flex-col overflow-hidden transition-all duration-300 shadow-2xl
        ${step === 'preview' ? 'max-w-5xl h-[80vh]' : 'max-w-2xl'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a35]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <FileJson className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import JSON</h2>
              <p className="text-xs text-gray-400 mt-0.5">Bulk import opportunities</p>
            </div>
          </div>
          {step !== 'uploading' && (
            <button onClick={handleClose} className="p-2 hover:bg-[#2a2a35] rounded-lg transition-colors text-gray-400">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className={`p-6 flex-1 ${step === 'preview' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {step === 'upload' && renderUpload()}
          {step === 'preview' && renderPreview()}
          {step === 'uploading' && renderUploading()}
          {step === 'summary' && renderSummary()}
        </div>
      </div>
    </div>
  );
};

export default ImportJsonModal;
