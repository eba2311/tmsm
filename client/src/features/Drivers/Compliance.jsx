import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { 
  FileCheck, Shield, Award, Clock, 
  AlertTriangle, CheckCircle, Search,
  Download, Plus, Eye, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverCompliance() {
  const [activeTab, setActiveTab] = useState('documents');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({
    driver: '',
    documentType: 'LICENSE',
    documentNumber: '',
    expiryDate: '',
    file: null,
  });
  const qc = useQueryClient();

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['driver-documents'],
    queryFn: async () => (await api.get('/driver-documents')).data.data || [],
  });

  const { data: ratings = [], isLoading: ratingsLoading } = useQuery({
    queryKey: ['driver-ratings'],
    queryFn: async () => (await api.get('/driver-ratings')).data.data || [],
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-list'],
    queryFn: async () => (await api.get('/drivers')).data.data || [],
  });

  const uploadMut = useMutation({
    mutationFn: async (formData) => {
      return api.post('/driver-documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-documents'] });
      toast.success('Document uploaded successfully');
      setIsModalOpen(false);
      setNewDoc({ driver: '', documentType: 'LICENSE', documentNumber: '', expiryDate: '', file: null });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  });

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Compliance & Performance
          </h1>
          <p className="page-subtitle">Manage driver certifications, safety records, and passenger feedback</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-gradient-to-br from-sidebar to-sidebar/90 text-white border-none">
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Compliance Score</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black">98.4<span className="text-xl">%</span></p>
              <p className="text-xs text-etgreen font-bold mt-1">Excellent Standing</p>
            </div>
            <Award className="w-12 h-12 text-gold opacity-20" />
          </div>
        </div>
        <div className="card p-6">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Expired Docs</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black text-red-500">2</p>
              <p className="text-xs text-gray-500 font-bold mt-1">Requires Attention</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500 opacity-10" />
          </div>
        </div>
        <div className="card p-6">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Avg Rating</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black text-sidebar">4.85</p>
              <div className="flex text-gold mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < 4 ? 'fill-gold' : 'fill-gray-200 text-gray-200'}`} />
                ))}
              </div>
            </div>
            <Star className="w-12 h-12 text-gold opacity-10" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-8 py-4 text-sm font-bold transition-all border-b-2 
            ${activeTab === 'documents' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-sidebar'}`}
        >
          DRIVER DOCUMENTS
        </button>
        <button
          onClick={() => setActiveTab('ratings')}
          className={`px-8 py-4 text-sm font-bold transition-all border-b-2 
            ${activeTab === 'ratings' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-sidebar'}`}
        >
          PASSENGER FEEDBACK
        </button>
      </div>

      {activeTab === 'documents' ? (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by driver or ID..." className="input pl-10" />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Upload Document
            </button>
          </div>

          {/* Upload Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
                  <h2 className="text-xl font-bold">Upload Driver Document</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData();
                    fd.append('driver', newDoc.driver);
                    fd.append('documentType', newDoc.documentType);
                    fd.append('documentNumber', newDoc.documentNumber);
                    fd.append('expiryDate', newDoc.expiryDate);
                    if (newDoc.file) fd.append('file', newDoc.file);
                    uploadMut.mutate(fd);
                  }}
                  className="p-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Driver</label>
                    <select 
                      className="input"
                      value={newDoc.driver}
                      onChange={(e) => setNewDoc({ ...newDoc, driver: e.target.value })}
                      required
                    >
                      <option value="">Select a driver...</option>
                      {drivers.map(d => (
                        <option key={d._id} value={d._id}>{d.user?.name} ({d.licenseNumber})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Document Type</label>
                      <select 
                        className="input"
                        value={newDoc.documentType}
                        onChange={(e) => setNewDoc({ ...newDoc, documentType: e.target.value })}
                      >
                        <option value="LICENSE">Driver License</option>
                        <option value="INSURANCE">Insurance Policy</option>
                        <option value="ID_CARD">Fayda ID / National ID</option>
                        <option value="CERTIFICATION">Health Certification</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Doc Number</label>
                      <input 
                        type="text"
                        className="input"
                        placeholder="e.g. DL-123456"
                        value={newDoc.documentNumber}
                        onChange={(e) => setNewDoc({ ...newDoc, documentNumber: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Expiry Date</label>
                    <input 
                      type="date"
                      className="input"
                      value={newDoc.expiryDate}
                      onChange={(e) => setNewDoc({ ...newDoc, expiryDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Document File (PDF/Image)</label>
                    <input 
                      type="file"
                      className="input py-2"
                      onChange={(e) => setNewDoc({ ...newDoc, file: e.target.files[0] })}
                      required
                    />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={uploadMut.isPending}
                      className="flex-1 btn-primary"
                    >
                      {uploadMut.isPending ? 'Uploading...' : 'Upload Now'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Document Type</th>
                  <th>Status</th>
                  <th>Expiry Date</th>
                  <th>Verified By</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {docsLoading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading documents...</td></tr>
                ) : documents.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">No documents found.</td></tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc._id}>
                      <td>
                        <p className="font-bold text-sidebar">{doc.driver?.user?.name}</p>
                        <p className="text-[10px] text-gray-400">{doc.driver?.licenseNumber}</p>
                      </td>
                      <td className="font-medium text-gray-600">{doc.type.replace('_', ' ')}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase
                          ${doc.status === 'VERIFIED' ? 'bg-etgreen/10 text-etgreen' : 'bg-red-100 text-red-600'}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className={`text-xs font-bold ${new Date(doc.expiryDate) < new Date() ? 'text-red-500' : 'text-gray-500'}`}>
                        {new Date(doc.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="text-xs text-gray-500 italic">{doc.verifiedBy?.name || 'Pending'}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          {doc.fileUrl && (
                            <>
                              <a 
                                href={doc.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-gray-100 rounded-lg text-primary"
                                title="View Document"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              <a 
                                href={doc.fileUrl} 
                                download 
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                                title="Download Document"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ratingsLoading ? (
             <div className="col-span-2 text-center py-12 text-gray-400">Loading feedback...</div>
          ) : ratings.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-gray-400">No feedback yet.</div>
          ) : (
            ratings.map((rate) => (
              <div key={rate._id} className="card p-6 border-l-4 border-l-gold relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                      {rate.rating}
                    </div>
                    <div>
                      <p className="font-bold text-sidebar">{rate.driver?.user?.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Trip #{rate.booking?.ticketNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex text-gold">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < rate.rating ? 'fill-gold' : 'fill-gray-100 text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 italic leading-relaxed">
                  "{rate.comment || 'No comment provided.'}"
                </p>
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(rate.createdAt).toLocaleDateString()}</span>
                  <button className="font-bold text-primary hover:underline uppercase">Flag Concern</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
