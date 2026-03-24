import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Sparkles,
  TrendingUp,
  PenSquare,
  Brain,
  User,
  Users,
  CreditCard,
  ArrowRight,
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

  const profileSkills = useMemo(() => {
    if (!stats?.profile?.skills) return [];
    const skills = stats.profile.skills as string[];
    return skills.slice(0, 6);
  }, [stats?.profile]);

  const profileInterests = useMemo(() => {
    if (!stats?.profile?.interests) return [];
    const interests = stats.profile.interests as string[];
    return interests.slice(0, 6);
  }, [stats?.profile]);

  const profileStrengths = useMemo(() => {
    if (!stats?.profile?.strengths) return [];
    const strengths = stats.profile.strengths as string[];
    return strengths.slice(0, 4);
  }, [stats?.profile]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            おかえりなさい、{user?.name || "ユーザー"}さん
          </h1>
          <p className="text-muted-foreground mt-1">
            記録を残して、あなたのプロフィールをAIで充実させましょう
          </p>
        </div>
        <Button onClick={() => setLocation("/record")} className="gap-2">
          <PenSquare className="h-4 w-4" />
          記録する
        </Button>
      </div>

      {/* Profile Completeness - MAIN HERO */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-accent/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">AIプロフィール</h2>
              </div>
              {statsLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : stats?.profile?.generatedBio ? (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {stats.profile.generatedBio}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  記録を追加すると、AIがあなたのプロフィールを自動生成します
                </p>
              )}
              <div className="flex items-center gap-3">
                <Progress value={stats?.completeness ?? 0} className="flex-1 h-2" />
                <span className="text-sm font-medium text-primary whitespace-nowrap">
                  {statsLoading ? "..." : `${stats?.completeness ?? 0}%`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                プロフィール充実度 — 記録を増やすとAIがより正確にあなたを分析します
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button onClick={() => setLocation("/profile")} variant="default" className="gap-2">
                <User className="h-4 w-4" />
                プロフィールを見る
              </Button>
              <Button onClick={() => setLocation("/record")} variant="outline" className="gap-2">
                <PenSquare className="h-4 w-4" />
                記録を追加
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Interests Tags */}
      {(profileSkills.length > 0 || profileInterests.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profileSkills.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AI抽出スキル
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profileSkills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {(stats?.profile?.skills as string[])?.length > 6 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground cursor-pointer" onClick={() => setLocation("/profile")}>
                      +{(stats?.profile?.skills as string[]).length - 6}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {profileInterests.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-chart-2" />
                  興味・関心
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profileInterests.map((interest, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                  {(stats?.profile?.interests as string[])?.length > 6 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground cursor-pointer" onClick={() => setLocation("/profile")}>
                      +{(stats?.profile?.interests as string[]).length - 6}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat
          title="総記録数"
          value={stats?.activityCount ?? 0}
          icon={<Activity className="h-3.5 w-3.5" />}
          loading={statsLoading}
        />
        <MiniStat
          title="抽出インサイト"
          value={stats?.insightCounts.reduce((sum, c) => sum + Number(c.count), 0) ?? 0}
          icon={<Brain className="h-3.5 w-3.5" />}
          loading={statsLoading}
        />
        <MiniStat
          title="マッチング候補"
          value={stats?.taskStats.completed ?? 0}
          icon={<Users className="h-3.5 w-3.5" />}
          loading={statsLoading}
        />
        <MiniStat
          title="名刺生成"
          value={stats?.profile?.generatedBio ? 1 : 0}
          icon={<CreditCard className="h-3.5 w-3.5" />}
          loading={statsLoading}
        />
      </div>

      {/* Activity Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">クイックアクション</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAction
              icon={<PenSquare className="h-4 w-4" />}
              label="新しい記録を追加"
              description="テキスト・音声・画像で記録"
              onClick={() => setLocation("/record")}
            />
            <QuickAction
              icon={<Sparkles className="h-4 w-4" />}
              label="AIプロフィール生成"
              description="記録からプロフィールを自動作成"
              onClick={() => setLocation("/profile")}
            />
            <QuickAction
              icon={<Users className="h-4 w-4" />}
              label="マッチングを探す"
              description="AIがあなたに合う人をレコメンド"
              onClick={() => setLocation("/matching")}
            />
            <QuickAction
              icon={<CreditCard className="h-4 w-4" />}
              label="デジタル名刺を作成"
              description="QRコード付き名刺を生成"
              onClick={() => setLocation("/card")}
            />
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

function MiniStat({ title, value, icon, loading }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-5 w-8 mt-0.5" />
            ) : (
              <p className="text-lg font-bold leading-none mt-0.5">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon, label, description, onClick }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 hover:border-primary/20 transition-all text-left group"
    >
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </button>
  );
}
