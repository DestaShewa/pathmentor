import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { WeeklyGrowthReport } from "@/components/dashboard/WeeklyGrowthReport";
import { SkillGrowthChart } from "@/components/dashboard/SkillGrowthChart";
import { ProgressHeroCard } from "@/components/dashboard/ProgressHeroCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { BarChart3, TrendingUp, Zap, Sparkles, Loader2 } from "lucide-react";
import { handleSidebarNav } from "@/lib/navHelper";
import aiService from "@/services/aiService";

const ProgressPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const [courseProgress, setCourseProgress] = useState<{
        totalLessons: number;
        completedLessons: number;
        progressPercentage: number;
        xpEarned: number;
    } | null>(null);
    const [skillGapAnalysis, setSkillGapAnalysis] = useState<any>(null);
    const [loadingSkillGap, setLoadingSkillGap] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/auth"); return; }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            const profileRes = await api.get("/users/profile");
            const userData = profileRes.data.user;
            setUser(userData);

            const courseId = userData.learningProfile?.course?.id;
            if (courseId) {
                const progressRes = await api.get(`/progress/course/${courseId}`);
                if (progressRes.data.success) {
                    setCourseProgress(progressRes.data);
                }
            }
        } catch (err) {
            console.error("Failed to fetch progress data:", err);
            navigate("/auth");
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem("token");
        navigate("/auth");
    };

    const fetchSkillGap = async () => {
        setLoadingSkillGap(true);
        try {
            // Mocking scores based on their completion status to feed into AI
            const scoresObj: any = { "Overall Progress": courseProgress?.progressPercentage || 30 };
            const res = await aiService.analyzeSkillGap(scoresObj);
            setSkillGapAnalysis(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSkillGap(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-background" />;

    const userName = user?.name || "Learner";
    const userEmail = user?.email || "";
    const courseTitle = user?.learningProfile?.course?.title || "Your Course";
    const progressPercent = courseProgress?.progressPercentage || 0;
    const totalLessons = courseProgress?.totalLessons || 0;
    const completedLessons = courseProgress?.completedLessons || 0;

    return (
        <div className="min-h-screen relative bg-background text-white">
            <ParticlesBackground />
            <DashboardTopNav
                userName={userName}
                userEmail={userEmail}
                onSignOut={handleSignOut}
                onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            <DashboardSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                activeView="progress"
                onViewChange={(v) => handleSidebarNav(v, navigate)}
            />

            <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
                <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold">My Progress</h1>
                        </div>
                        <p className="text-muted-foreground">Track your learning journey and skill growth</p>
                    </motion.div>

                    {/* Stats Overview */}
                    <div className="grid sm:grid-cols-3 gap-4">
                        <GlassCard className="p-5 text-center">
                            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-2" />
                            <p className="text-3xl font-bold text-primary">{completedLessons}</p>
                            <p className="text-sm text-muted-foreground mt-1">Lessons Completed</p>
                        </GlassCard>
                        <GlassCard className="p-5 text-center">
                            <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-yellow-400">{courseProgress?.xpEarned || 0}</p>
                            <p className="text-sm text-muted-foreground mt-1">Total XP Earned</p>
                        </GlassCard>
                        <GlassCard className="p-5 text-center">
                            <BarChart3 className="w-5 h-5 text-green-400 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-green-400">{progressPercent}%</p>
                            <p className="text-sm text-muted-foreground mt-1">Overall Completion</p>
                        </GlassCard>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <WeeklyGrowthReport />
                            <ProgressHeroCard
                                stage={courseTitle}
                                progressPercent={progressPercent}
                                totalLessons={totalLessons}
                                completedLessons={completedLessons}
                                onStartLearning={() => navigate("/lessons")}
                            />
                        </div>
                        <div className="space-y-8">
                            <SkillGrowthChart />

                            <GlassCard className="p-6">
                                <h3 className="font-bold flex items-center gap-2 text-primary mb-4">
                                    <Sparkles size={18} /> AI Skill Gap Analysis
                                </h3>
                                {!skillGapAnalysis && !loadingSkillGap ? (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-muted-foreground mb-4">Let AI analyze your progress data to find weak fundamentals and suggest improvements.</p>
                                        <GlassButton variant="primary" size="sm" onClick={fetchSkillGap}>Analyze My Progress</GlassButton>
                                    </div>
                                ) : loadingSkillGap ? (
                                    <div className="flex flex-col items-center gap-3 py-6">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        <p className="text-sm text-muted-foreground">Analyzing your learning data...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="whitespace-pre-wrap text-sm text-white/90 leading-relaxed max-h-64 overflow-y-auto pr-2">
                                            {skillGapAnalysis?.analysis?.insightsString || 
                                              (typeof skillGapAnalysis?.analysis?.insights === 'string' ? 
                                                skillGapAnalysis.analysis.insights : 
                                                skillGapAnalysis?.analysis?.insights?.performanceGap || "No insights available")}
                                            
                                            {skillGapAnalysis?.analysis?.recommendations && (
                                                <div className="mt-4 pt-4 border-t border-white/10">
                                                    <p className="text-primary font-bold text-xs uppercase mb-2">Recommendations:</p>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        {skillGapAnalysis.analysis.recommendations.map((r: string, i: number) => (
                                                            <li key={i} className="text-xs opacity-80">{r}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </GlassCard>

                            <GlassCard className="p-6">
                                <h3 className="font-bold text-lg mb-4">Learning Milestones</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="flex-1">Course Enrolled</span>
                                        <span className="text-muted-foreground">Completed</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${completedLessons > 0 ? "bg-green-500" : "bg-white/20"}`} />
                                        <span className="flex-1">First Lesson Finished</span>
                                        <span className="text-muted-foreground">{completedLessons > 0 ? "Completed" : "Pending"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${progressPercent >= 50 ? "bg-green-500" : "bg-white/20"}`} />
                                        <span className="flex-1">Halfway Mark</span>
                                        <span className="text-muted-foreground">{progressPercent >= 50 ? "Completed" : "Pending"}</span>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </div>
            </main>
            <MobileBottomNav />
        </div>
    );
};

export default ProgressPage;
