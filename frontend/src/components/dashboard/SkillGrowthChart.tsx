import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface ChartData {
  day: string;
  progress: number;
  hours: number;
}

interface SkillGrowthChartProps {
  data?: ChartData[];
}

const defaultData: ChartData[] = [
  { day: "Mon", progress: 10, hours: 1.5 },
  { day: "Tue", progress: 25, hours: 2 },
  { day: "Wed", progress: 35, hours: 1 },
  { day: "Thu", progress: 50, hours: 2.5 },
  { day: "Fri", progress: 62, hours: 1.8 },
  { day: "Sat", progress: 75, hours: 3 },
  { day: "Sun", progress: 85, hours: 2 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-premium p-3 rounded-xl text-sm">
        <p className="font-medium mb-1">{label}</p>
        <p className="text-primary">Progress: {payload[0].value}%</p>
        <p className="text-secondary">Hours: {payload[1]?.value || 0}h</p>
      </div>
    );
  }
  return null;
};

export const SkillGrowthChart = ({ data = defaultData }: SkillGrowthChartProps) => {
  const totalHours = data.reduce((acc, d) => acc + d.hours, 0);
  const avgProgress = Math.round(data.reduce((acc, d) => acc + d.progress, 0) / data.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="glass-premium p-6 rounded-3xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold">Weekly Progress</h3>
        </div>
        <div className="flex gap-4">
          <div className="glass-inner-glow px-4 py-2 rounded-xl">
            <span className="text-lg font-bold text-primary">{totalHours.toFixed(1)}h</span>
            <span className="text-xs text-muted-foreground ml-1">This week</span>
          </div>
          <div className="glass-inner-glow px-4 py-2 rounded-xl">
            <span className="text-lg font-bold text-secondary">{avgProgress}%</span>
            <span className="text-xs text-muted-foreground ml-1">Avg progress</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(200, 100%, 60%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(200, 100%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(270, 80%, 65%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(270, 80%, 65%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="rgba(255,255,255,0.4)"
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.4)"
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="progress"
              stroke="hsl(200, 100%, 60%)"
              strokeWidth={2}
              fill="url(#progressGradient)"
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="hsl(270, 80%, 65%)"
              strokeWidth={2}
              fill="url(#hoursGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary" />
          <span className="text-sm text-muted-foreground">Hours</span>
        </div>
      </div>
    </motion.div>
  );
};
