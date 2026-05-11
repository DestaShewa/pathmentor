import { useState, useEffect } from "react";
import { Trophy, Zap, Medal, Crown } from "lucide-react";
import api from "@/services/api";

const rankColors = ["text-yellow-400", "text-slate-300", "text-amber-600"];
const rankBg = ["bg-yellow-400/20", "bg-slate-300/20", "bg-amber-600/20"];
const rankIcons = [Crown, Medal, Medal];

const AdminLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get("/leaderboard");
      setLeaderboard(res.data.leaderboard || []);
    } catch {
      console.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="text-yellow-400" /> Leaderboard
        </h1>
        <p className="text-sm text-slate-400">Top students ranked by XP earned</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <div className="p-12 text-center text-slate-400">No leaderboard data yet.</div>
      ) : (
        <>
          {/* Top 3 podium */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
                const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                const heights = ["h-28", "h-36", "h-24"];
                const Icon = rankIcons[actualRank - 1];
                return (
                  <div key={entry.rank} className={`flex flex-col items-center justify-end ${heights[i]}`}>
                    <div className={`w-12 h-12 rounded-2xl ${rankBg[actualRank - 1]} flex items-center justify-center mb-2`}>
                      <Icon className={`w-6 h-6 ${rankColors[actualRank - 1]}`} />
                    </div>
                    <p className="text-sm font-bold truncate max-w-full px-1 text-center">{entry.user?.name}</p>
                    <p className={`text-xs font-bold ${rankColors[actualRank - 1]}`}>{entry.totalXP} XP</p>
                    <div className={`w-full mt-2 rounded-t-xl ${rankBg[actualRank - 1]} border border-white/10 flex items-center justify-center py-2`}>
                      <span className={`text-lg font-black ${rankColors[actualRank - 1]}`}>#{actualRank}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full list */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-xs uppercase text-muted-foreground font-bold">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-right">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.map((entry, idx) => {
                  const Icon = idx < 3 ? rankIcons[idx] : null;
                  return (
                    <tr key={entry.rank} className="hover:bg-white/5">
                      <td className="p-4">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${idx < 3 ? rankBg[idx] : "bg-white/5"}`}>
                          {Icon ? <Icon className={`w-4 h-4 ${rankColors[idx]}`} /> : (
                            <span className="text-sm font-bold text-muted-foreground">{entry.rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-white">{entry.user?.name}</td>
                      <td className="p-4 text-slate-400 text-sm">{entry.user?.email}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className="font-bold text-yellow-400">{entry.totalXP.toLocaleString()}</span>
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

export default AdminLeaderboard;
