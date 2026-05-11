import { useEffect, useState } from "react";
import { Star, TrendingUp, BarChart3, RefreshCw, Award, Users } from "lucide-react";
import api from "@/services/api";

interface RatingsData {
  avgRating: number;
  distribution: Record<string, number>;
  totalRatings: number;
  categoryRatings: { name: string; rating: number; count: number }[];
}

const StarRow = ({ stars, count, total }: { stars: number; count: number; total: number }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-14 font-bold shrink-0">{stars} Stars</span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-10 text-right shrink-0">{pct}%</span>
      <span className="text-xs text-slate-600 w-8 text-right shrink-0">({count})</span>
    </div>
  );
};

const Ratings = () => {
  const [data, setData]     = useState<RatingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/ratings-overview");
      setData(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load ratings");
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">{error}</div>;
  }

  if (!data) return null;

  const { avgRating, distribution, totalRatings, categoryRatings } = data;
  const fiveStarPct = totalRatings > 0 ? Math.round(((distribution["5"] || 0) / totalRatings) * 100) : 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Ratings</h1>
          <p className="text-slate-400 text-sm mt-1">Aggregated from {totalRatings} session reviews</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {totalRatings === 0 ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-16 text-center">
          <Star size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-bold text-white mb-2">No Ratings Yet</h3>
          <p className="text-slate-400 text-sm">Ratings appear after students complete and rate mentor sessions.</p>
        </div>
      ) : (
        <>
          {/* Top cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average rating */}
            <div className="p-8 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 rounded-3xl text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Platform Average</p>
              <h2 className="text-6xl font-black text-white mb-2">{avgRating}</h2>
              <div className="flex justify-center gap-0.5 mb-3">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={20} className={i <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-slate-600"} />
                ))}
              </div>
              <p className="text-slate-400 text-xs">{totalRatings} total reviews</p>
              {fiveStarPct > 0 && (
                <p className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-1 mt-2">
                  <TrendingUp size={12} /> {fiveStarPct}% five-star
                </p>
              )}
            </div>

            {/* Distribution */}
            <div className="md:col-span-2 p-8 bg-slate-900/40 border border-white/10 rounded-3xl">
              <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Rating Distribution</h3>
              <div className="space-y-4">
                {[5,4,3,2,1].map(stars => (
                  <StarRow
                    key={stars}
                    stars={stars}
                    count={distribution[String(stars)] || 0}
                    total={totalRatings}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Per-track ratings */}
          {categoryRatings.length > 0 && (
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-400" /> Ratings by Mentor Track
                </h3>
                <span className="text-xs text-slate-500">{categoryRatings.length} tracks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryRatings.map((item, i) => (
                  <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition-all">
                    <div className="p-3 bg-slate-800 rounded-xl shrink-0">
                      <Award size={18} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={10} className={s <= Math.round(item.rating) ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
                          ))}
                        </div>
                        <span className="text-sm font-black text-amber-400">{item.rating}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Users size={9} /> {item.count} review{item.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary table */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Rating Breakdown</h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                <tr>
                  <th className="px-5 py-3">Stars</th>
                  <th className="px-5 py-3">Count</th>
                  <th className="px-5 py-3">Percentage</th>
                  <th className="px-5 py-3">Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[5,4,3,2,1].map(stars => {
                  const count = distribution[String(stars)] || 0;
                  const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                  return (
                    <tr key={stars} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={12} className={s <= stars ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm font-bold text-white">{count}</td>
                      <td className="px-5 py-3 text-sm text-slate-300">{pct}%</td>
                      <td className="px-5 py-3">
                        <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Ratings;
