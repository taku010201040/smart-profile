import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  Sparkles,
  Loader2,
  Save,
  Brain,
  Target,
  Star,
  Lightbulb,
  GraduationCap,
  Edit3,
} from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const { user } = useAuth();
  const { data, isLoading, refetch } = trpc.user.getProfile.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation();
  const generateProfile = trpc.ai.generateProfile.useMutation();
  const { data: insights } = trpc.insight.list.useQuery();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", school: "", grade: "", bio: "" });

  const startEdit = () => {
    setForm({
      name: user?.name || "",
      school: (data?.user as any)?.school || "",
      grade: (data?.user as any)?.grade || "",
      bio: (data?.user as any)?.bio || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(form);
      toast.success("プロフィールを更新しました");
      setEditing(false);
      refetch();
    } catch {
      toast.error("更新に失敗しました");
    }
  };

  const handleGenerate = async () => {
    try {
      await generateProfile.mutateAsync();
      toast.success("AIプロフィールを生成しました");
      refetch();
    } catch {
      toast.error("生成に失敗しました");
    }
  };

  const profile = data?.profile;

  // Group insights by type
  const insightsByType: Record<string, typeof insights> = {};
  if (insights) {
    for (const i of insights) {
      if (!insightsByType[i.type]) insightsByType[i.type] = [];
      insightsByType[i.type]!.push(i);
    }
  }

  const insightTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
    skill: { label: "スキル", icon: Star, color: "bg-chart-1/10 text-chart-1 border-chart-1/30" },
    interest: { label: "興味関心", icon: Lightbulb, color: "bg-chart-2/10 text-chart-2 border-chart-2/30" },
    experience: { label: "経験", icon: GraduationCap, color: "bg-chart-3/10 text-chart-3 border-chart-3/30" },
    achievement: { label: "達成", icon: Target, color: "bg-chart-4/10 text-chart-4 border-chart-4/30" },
    goal: { label: "目標", icon: Brain, color: "bg-chart-5/10 text-chart-5 border-chart-5/30" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">マイプロフィール</h1>
          <p className="text-muted-foreground mt-1">AIが自動生成したあなたのプロフィール</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <Button variant="outline" onClick={startEdit} className="gap-2">
              <Edit3 className="h-4 w-4" />
              編集
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generateProfile.isPending}
            className="gap-2"
          >
            {generateProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI生成
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          {/* Basic Info */}
          <Card>
            <CardContent className="pt-6">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>名前</Label>
                      <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>学校</Label>
                      <Input value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>学年</Label>
                      <Input value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>自己紹介</Label>
                    <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={updateProfile.isPending} className="gap-2">
                      {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      保存
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>キャンセル</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold">{user?.name || "未設定"}</h2>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {(data?.user as any)?.school && <span>{(data?.user as any).school}</span>}
                      {(data?.user as any)?.grade && <span>{(data?.user as any).grade}</span>}
                    </div>
                    {(data?.user as any)?.bio && (
                      <p className="text-sm mt-2">{(data?.user as any).bio}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Generated Profile */}
          {profile?.generatedBio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI生成プロフィール
                  {profile.lastGeneratedAt && (
                    <span className="text-xs text-muted-foreground font-normal ml-auto">
                      最終生成: {new Date(profile.lastGeneratedAt).toLocaleDateString("ja-JP")}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{profile.generatedBio}</p>

                <Separator />

                {(() => {
                  const skills = profile.skills as string[] | null;
                  if (!skills || skills.length === 0) return null;
                  return (
                    <div>
                      <p className="text-sm font-medium mb-2">スキル</p>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s, i) => (
                          <Badge key={i} className="bg-chart-1/10 text-chart-1 border border-chart-1/30 hover:bg-chart-1/20">{String(s)}</Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const interests = profile.interests as string[] | null;
                  if (!interests || interests.length === 0) return null;
                  return (
                    <div>
                      <p className="text-sm font-medium mb-2">興味関心</p>
                      <div className="flex flex-wrap gap-1.5">
                        {interests.map((s, i) => (
                          <Badge key={i} className="bg-chart-2/10 text-chart-2 border border-chart-2/30 hover:bg-chart-2/20">{String(s)}</Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const strengths = profile.strengths as string[] | null;
                  if (!strengths || strengths.length === 0) return null;
                  return (
                    <div>
                      <p className="text-sm font-medium mb-2">強み</p>
                      <div className="flex flex-wrap gap-1.5">
                        {strengths.map((s, i) => (
                          <Badge key={i} className="bg-chart-4/10 text-chart-4 border border-chart-4/30 hover:bg-chart-4/20">{String(s)}</Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const traits = profile.personalityTraits as string[] | null;
                  if (!traits || traits.length === 0) return null;
                  return (
                    <div>
                      <p className="text-sm font-medium mb-2">パーソナリティ</p>
                      <div className="flex flex-wrap gap-1.5">
                        {traits.map((s, i) => (
                          <Badge key={i} variant="outline">{String(s)}</Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Insights Tag Cloud */}
          {insights && insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  抽出されたインサイト
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(insightsByType).map(([type, items]) => {
                  const config = insightTypeConfig[type] || { label: type, icon: Brain, color: "bg-muted text-muted-foreground" };
                  const Icon = config.icon;
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{config.label}</span>
                        <Badge variant="secondary" className="text-xs">{items!.length}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {items!.map((item, i) => (
                          <Badge key={i} variant="outline" className={`text-xs ${config.color}`} title={item.context || ""}>
                            {item.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {!profile?.generatedBio && (!insights || insights.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">まだAIプロフィールが生成されていません</p>
                <p className="text-sm text-muted-foreground mt-1">日常の記録を追加してから「AI生成」ボタンを押してください</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
