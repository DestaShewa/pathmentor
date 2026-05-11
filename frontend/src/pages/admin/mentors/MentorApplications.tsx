import React, { useEffect, useState } from 'react';
import { Check, X, FileText } from 'lucide-react';
import api from '../../../services/api';

interface MentorApplication {
  _id: string;
  name: string;
  email?: string;
  createdAt?: string;
  learningProfile?: { skillTrack?: string };
  mentorVerification?: { status?: string; documents?: string[] };
}

const MentorApplications = () => {
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/admin/pending-mentors');
      const data = res.data;
      setApplications(Array.isArray(data) ? data : data.mentors || []);
    } catch (err: any) {
      console.error('Failed to load mentor applications', err);
      setError(err?.response?.data?.message || 'Unable to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const approveApplication = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/mentor/${id}/approve`);
      setApplications((prev) => prev.filter((app) => app._id !== id));
    } catch (err) {
      console.error('Approve failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  const rejectApplication = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/mentor/${id}/reject`);
      setApplications((prev) => prev.filter((app) => app._id !== id));
    } catch (err) {
      console.error('Reject failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Mentor Applications</h2>
          <p className="text-slate-400 text-sm mt-1">Review mentor onboarding requests and view uploaded CV document links.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-3xl shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="p-6">Applicant</th>
              <th className="p-6">Expertise</th>
              <th className="p-6">Submission Date</th>
              <th className="p-6">CV</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">Loading applications...</td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">No pending mentor applications found.</td>
              </tr>
            ) : (
              applications.map((app) => {
                const status = app.mentorVerification?.status || 'Pending';
                const primaryDoc = app.mentorVerification?.documents?.[0];
                const formattedDate = app.createdAt
                  ? new Date(app.createdAt).toLocaleDateString()
                  : 'Unknown';

                return (
                  <tr key={app._id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                          {app.name?.charAt(0) || 'M'}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{app.name || 'Mentor'}</div>
                          <div className="text-sm text-slate-500">{app.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-sm">{app.learningProfile?.skillTrack || 'General Mentor'}</td>
                    <td className="p-6 text-sm text-slate-500">{formattedDate}</td>
                    <td className="p-6 text-sm">
                      {primaryDoc ? (
                        <a
                          href={primaryDoc}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-100 transition"
                        >
                          <FileText size={16} />
                          View CV
                        </a>
                      ) : (
                        <span className="text-slate-500">No CV uploaded</span>
                      )}
                    </td>
                    <td className="p-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          status.toLowerCase() === 'pending'
                            ? 'bg-orange-500/10 text-orange-400'
                            : status.toLowerCase() === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : status.toLowerCase() === 'rejected'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-cyan-500/10 text-cyan-400'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={actionLoading === app._id}
                          onClick={() => approveApplication(app._id)}
                          className="rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          disabled={actionLoading === app._id}
                          onClick={() => rejectApplication(app._id)}
                          className="rounded-lg bg-red-500/10 px-3 py-2 text-red-400 hover:bg-red-500/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MentorApplications;
