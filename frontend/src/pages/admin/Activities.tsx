import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { ArrowLeft, Activity, ChevronLeft, ChevronRight } from "lucide-react";

const Activities = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadActivities = async (pageNumber = 1) => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/admin/activities/all", {
        params: { page: pageNumber, limit: 20 },
      });

      setActivities(res.data.activities || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || pageNumber);
      setPages(res.data.pages || 1);
    } catch (err: any) {
      console.error("Failed to load activities", err);
      setError(err?.response?.data?.message || err?.message || "Unable to load activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities(page);
  }, [page]);

  return (
    <div className="space-y-6 pb-10 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-cyan-300 font-semibold uppercase tracking-[0.35em] text-xs mb-2">
            <Activity size={16} /> Activity
          </div>
          <h1 className="text-4xl font-extrabold">All Activity Logs</h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Review all admin and mentor activity records. These are powered by the backend activity API and update in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <ArrowLeft size={16} /> Back to dashboard
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <p className="text-sm text-slate-400">Showing all system activity with pagination.</p>
          </div>
          <div className="text-sm text-slate-400">Total records: {total}</div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100 mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] divide-y divide-white/10 text-left text-sm">
            <thead className="border-b border-white/10 text-slate-400 uppercase tracking-[0.18em] text-[11px]">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Target</th>
                <th className="px-5 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-300">
                    Loading activity...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-300">
                    No activity records found.
                  </td>
                </tr>
              ) : (
                activities.map((activity: any) => (
                  <tr key={activity._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-semibold text-white">
                      {activity.user?.name || "Unknown User"}
                    </td>
                    <td className="px-5 py-4 text-slate-300">{activity.user?.email || "—"}</td>
                    <td className="px-5 py-4 text-slate-200">{activity.message || "-"}</td>
                    <td className="px-5 py-4 text-slate-300">{activity.target || "-"}</td>
                    <td className="px-5 py-4 text-slate-400">
                      {new Date(activity.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-300">
          <p>Page {page} of {pages}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronLeft size={18} /> Prev
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10 disabled:opacity-50"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Activities;
