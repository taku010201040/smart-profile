import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  ListTodo,
  Sparkles,
  TrendingUp,
  PenSquare,
  CheckCircle2,
  Clock,
  Brain,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: recentActivities, isLoading: activitiesLoading } = trpc.dashboard.recentActivities.useQuery();
  const { data: todayTasks, isLoading: tasksLoading } = trpc.dashboard.todayTasks.useQuery();

  const chartData = useMemo(() => {
    if (!stats?.timeline) return [];
    const grouped: Record<string, number> = {};
    for (const item of stats.timeline) {
      const d = String(item.date);
      grouped[d] = (grouped[d] || 0) + Number(item.count);
    }
    return Object.entries(grouped).map(([date, count]) => ({
      date: date.slice(5),
      count,
    }));
  }, [stats?.timeline]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            おかえりなさい、{user?.name || "ユーザー"}さん
          </h1>
          <p className="text-muted-foreground mt-1">
            今日も記録を残して、あなたのプロフィールを充実させましょう
          </p>
        </div>
        <Button onClick={() => setLocation("/record")} className="gap-2">
          <PenSquare className="h-4 w-4" />
          記録する
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="総記録数"
          value={stats?.activityCount ?? 0}
          icon={<Activity className="h-4 w-4" />}
          loading={statsLoading}
          color="text-chart-1"
        />
        <StatsCard
          title="完了タスク"
          value={stats?.taskStats.completed ?? 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          loading={statsLoading}
          color="text-chart-4"
        />
        <StatsCard
          title="進行中タスク"
          value={stats?.taskStats.pending ?? 0}
          icon={<Clock className="h-4 w-4" />}
          loading={statsLoading}
          color="text-chart-2"
        />
        <StatsCard
          title="抽出インサイト"
          value={stats?.insightCounts.reduce((sum, c) => sum + Number(c.count), 0) ?? 0}
          icon={<Brain className="h-4 w-4" />}
          loading={statsLoading}
          color="text-chart-5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              活動トレンド（直近30日）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.22 270)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.55 0.22 270)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: "oklch(0.5 0.03 270)" }} />
                  <YAxis className="text-xs" tick={{ fill: "oklch(0.5 0.03 270)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      border: "1px solid oklch(0.91 0.01 270)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="oklch(0.55 0.22 270)"
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    name="記録数"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>まだ記録がありません</p>
                  <Button variant="link" onClick={() => setLocation("/record")} className="mt-1">
                    最初の記録を作成する
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-primary" />
                今日のタスク
              </span>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/tasks")}>
                すべて見る
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : todayTasks && todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${
                      task.priority === "high" ? "bg-destructive" :
                      task.priority === "medium" ? "bg-chart-2" : "bg-chart-4"
                    }`} />
                    <span className="text-sm truncate flex-1">{task.title}</span>
                    {task.isAutoGenerated && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        <Sparkles className="h-3 w-3 mr-1" />AI
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground text-sm">
                <ListTodo className="h-6 w-6 mx-auto mb-2 opacity-50" />
                タスクはありません
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              最近の記録
            </span>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/activities")}>
              すべて見る
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    activity.type === "text" ? "bg-chart-1/10 text-chart-1" :
                    activity.type === "audio" ? "bg-chart-2/10 text-chart-2" :
                    "bg-chart-5/10 text-chart-5"
                  }`}>
                    {activity.type === "text" ? "T" : activity.type === "audio" ? "A" : "I"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">
                      {activity.aiSummary || activity.content || "(メディア記録)"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {activity.category && (
                        <Badge variant="outline" className="text-xs">{activity.category}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </div>
                  {activity.aiProcessed && (
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <PenSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>まだ記録がありません</p>
              <Button variant="link" onClick={() => setLocation("/record")} className="mt-1">
                最初の記録を作成する
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({ title, value, icon, loading, color }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{value}</p>
            )}
          </div>
          <div className={`h-10 w-10 rounded-lg bg-accent flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
