import { useEffect, useState } from "react";
import { Users, RefreshCw, Zap, CheckCircle2, AlertCircle, UserPlus, Search } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface MentorCapacity {
  _id: string;
  name: string;
  email: string;
  skillTrack: string;
  studentCount: number;
  capacity: number;
  available: boolean;
  fillPercent: number;
}

interface UnassignedStudent {
  _id: string;
  name: string;
  email: string;
  learningProfile?: { skillTrack?: string; experienceLevel?: string };
  createdAt: string;
}

const MentorPerformance = () => {
  const { toast } = useToast();
  const [mentors, setMentors]           = useState<MentorCapacity[]>([]);
  const [unassigned, setUnassigned]     = useState<UnassignedStudent[]>([]);
  const [loading, setLoading]           = useState(true);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [search, setSearch]             = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedMentor, setSelectedMentor]   = useState("");
  const [assigning, setAssigning]       = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [capRes, unRes] = await Promise.all([
        api.get("/admin/mentor-capacity"),
        api.get("/admin/unassigned-students")
      ]);
      setMentors(capRes.data.mentors || []);
      setUnassigned(unRes.data.data || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to load", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      const res = await api.post("/admin/auto-assign-mentors");
      toast({ title: "Auto-assignment complete!", description: `${res.data.assigned} students assigned, ${res.data.failed} could not be assigned.` });
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    } finally { setAutoAssigning(false); }
  };

  const handleManualAssign = async () => {
    if (!selectedStudent || !selectedMentor) {
      toast({ title: "Error", description: "Select both a student and a mentor", variant: "destructive" });
      return;
    }
    setAssigning(true);
    try {
      const res = await api.put("/admin/assign-mentor", { studentId: selectedStudent, mentorId: selectedMentor });
      toast({ title: "Assigned!", description: res.data.message });
      setSelectedStudent(""); setSelectedMentor("");
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    } finally { setAssigning(false); }
  };

  const filteredMentors = mentors.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.skillTrack.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents  = mentors.reduce((s, m) => s + m.studentCount, 0);
  const totalCapacity  = mentors.reduce((s, m) => s + m.capacity, 0);
  const fullMentors    = mentors.filter(m => !m.available).length;
  const avgFill        = mentors.length ? Math.round(mentors.reduce((s, m) => s + m.fillPercent, 0) / mentors.length) : 0;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mentor Capacity & Assignment</h1>
          <p className="text-slate-400 text-sm mt-1">Auto-assign students to mentors based on skill track and availability</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          {unassigned.length > 0 && (
            <button onClick={handleAutoAssign} disabled={autoAssigning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 disabled:opacity-60 transition-all">
              <Zap size={15} /> {autoAssigning ? "Assigning..." : `Auto-Assign ${unassigned.length} Students`}
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Mentors",      value: mentors.length,    color: "text-blue-400" },
          { label: "Students Assigned",  value: totalStudents,     color: "text-emerald-400" },
          { label: "Unassigned Students",value: unassigned.length, color: unassigned.length > 0 ? "text-orange-400" : "text-emerald-400" },
          { label: "Avg Fill Rate",      value: `${avgFill}%`,     color: avgFill > 80 ? "text-red-400" : "text-blue-400" },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Manual assignment */}
      {unassigned.length > 0 && (
        <div className="bg-white/[0.02] border border-amber-500/20 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <UserPlus size={16} className="text-amber-400" /> Manual Assignment
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Student</label>
              <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select student...</option>
                {unassigned.map(s => (
                  <option key={s._id} value={s._id}>{s.name} — {s.learningProfile?.skillTrack || "No track"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Mentor</label>
              <select value={selectedMentor} onChange={e => setSelectedMentor(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select mentor...</option>
                {mentors.filter(m => m.available).map(m => (
                  <option key={m._id} value={m._id}>{m.name} — {m.skillTrack} ({m.studentCount}/{m.capacity})</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleManualAssign} disabled={assigning}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 disabled:opacity-60 transition-all">
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mentors..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50" />
      </div>

      {/* Mentor capacity table */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            <tr>
              <th className="px-5 py-4">Mentor</th>
              <th className="px-5 py-4">Skill Track</th>
              <th className="px-5 py-4">Students</th>
              <th className="px-5 py-4">Capacity</th>
              <th className="px-5 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">Loading...</td></tr>
            ) : filteredMentors.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">No mentors found.</td></tr>
            ) : (
              filteredMentors.map(m => (
                <tr key={m._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {m.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{m.skillTrack}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${m.fillPercent >= 90 ? "bg-red-500" : m.fillPercent >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${m.fillPercent}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-white">{m.studentCount}/{m.capacity}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">{m.fillPercent}% full</td>
                  <td className="px-5 py-4">
                    {m.available ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <CheckCircle2 size={13} /> Available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                        <AlertCircle size={13} /> Full
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Unassigned students */}
      {unassigned.length > 0 && (
        <div className="bg-white/[0.02] border border-orange-500/20 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle size={15} className="text-orange-400" /> Unassigned Students ({unassigned.length})
            </h3>
            <p className="text-xs text-slate-500">These students need a mentor</p>
          </div>
          <div className="divide-y divide-white/5">
            {unassigned.slice(0, 10).map(s => (
              <div key={s._id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {s.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.learningProfile?.skillTrack || "No track"} · {s.learningProfile?.experienceLevel || "—"}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
            {unassigned.length > 10 && (
              <div className="px-5 py-3 text-xs text-slate-500 text-center">
                +{unassigned.length - 10} more students
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorPerformance;
