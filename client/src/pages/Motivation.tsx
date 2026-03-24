import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Activity, Brain, Target } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useMemo } from "react";

const COLORS = [
  "oklch(0.55 0.22 270)",
  "oklch(0.65 0.2 300)",
  "oklch(0.6 0.18 200)",
  "oklch(0.7 0.15 150)",
  "oklch(0.65 0.2 340)",
];

export default function Motivation() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: insightCounts } = trpc.insight.counts.useQuery();
  const { data: taskStats } = trpc.task.stats.useQuery();

  const activityChart = useMemo(() => {
    if (!stats?.timeline) return [];
    const grouped: Record<string, Record<string, number>> = {};
    for (const item of stats.timeline) {
      const d = String(item.date);
      if (!grouped[d]) grouped[d] = {};
      grouped[d][item.type] = Number(item.count);
    }
    return Object.entries(grouped).map(([date, types]) => ({
      date: date.slice(5),
      text: types.text || 0,
      audio: types.audio || 0,
      image: types.image || 0,
      total: (types.text || 0) + (types.audio || 0) + (types.image || 0),
    }));
  }, [stats?.timeline]);

  const insightPieData = useMemo(() => {
    if (!insightCounts) return [];
    const labels: Record<string, string> = {
      skill: "スキル", interest: "興味", experience: "経験", achievement: "達成", goal: "目標",
    };
    return insightCounts.map(c => ({
      name: labels[c.type] || c.type,
      value: Number(c.count),
    }));
  }, [insightCounts]);

  const taskPieData = useMemo(() => {
    if (!taskStats) return [];
    return [
      { name: "未着手", value: taskStats.pending },
      { name: "進行中", value: taskStats.inProgress },
      { name: "完了", value: taskStats.completed },
    ].filter(d => d.value > 0);
  }, [taskStats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">モチベーショングラフ</h1>
        <p className="text-muted-foreground mt-1">活動量と達成度を可視化して成長を確認</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      ) : (
        <Tabs defaultValue="activity">
          <TabsList>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              活動量
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Brain className="h-4 w-4" />
              インサイト
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <Target className="h-4 w-4" />
              タスク達成
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  日別活動量（直近30日）
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={activityChart}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fill: "oklch(0.5 0.03 270)", fontSize: 12 }} />
                      <YAxis tick={{ fill: "oklch(0.5 0.03 270)", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(1 0 0)",
                          border: "1px solid oklch(0.91 0.01 270)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="text" stackId="a" fill={COLORS[0]} name="テキスト" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="audio" stackId="a" fill={COLORS[1]} name="音声" />
                      <Bar dataKey="image" stackId="a" fill={COLORS[2]} name="画像" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>まだデータがありません</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">累積活動トレンド</CardTitle>
              </CardHeader>
              <CardContent>
                {activityChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={activityChart}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fill: "oklch(0.5 0.03 270)", fontSize: 12 }} />
                      <YAxis tick={{ fill: "oklch(0.5 0.03 270)", fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: "oklch(1 0 0)", border: "1px solid oklch(0.91 0.01 270)", borderRadius: "8px" }} />
                      <Area type="monotone" dataKey="total" stroke={COLORS[0]} fill="url(#colorTotal)" name="合計" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">データなし</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  インサイト分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insightPieData.length > 0 ? (
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <ResponsiveContainer width={250} height={250}>
                      <PieChart>
                        <Pie
                          data={insightPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {insightPieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {insightPieData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm">{d.name}</span>
                          <Badge variant="secondary" className="text-xs">{d.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>インサイトデータがありません</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  タスク達成状況
                </CardTitle>
              </CardHeader>
              <CardContent>
                {taskPieData.length > 0 ? (
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <ResponsiveContainer width={250} height={250}>
                      <PieChart>
                        <Pie
                          data={taskPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {taskPieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {taskStats && (
                        <>
                          <div className="text-center">
                            <p className="text-3xl font-bold">{taskStats.total}</p>
                            <p className="text-sm text-muted-foreground">合計タスク</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-chart-4">
                              {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                            </p>
                            <p className="text-sm text-muted-foreground">達成率</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>タスクデータがありません</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
