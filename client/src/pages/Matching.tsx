import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users,
  Heart,
  Briefcase,
  Star,
  Sparkles,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

export default function Matching() {
  const [tab, setTab] = useState("all");
  const utils = trpc.useUtils();

  const { data: recommendations, isLoading } = trpc.match.recommendations.useQuery(
    tab === "all" ? {} : { type: tab }
  );
  const { data: connections } = trpc.match.connections.useQuery();
  const generateMatches = trpc.ai.generateMatches.useMutation({
    onSuccess: (data) => {
      utils.match.recommendations.invalidate();
      if (data.recommendations.length > 0) {
        toast.success(`${data.recommendations.length}件のマッチングを生成しました`);
      } else {
        toast.info(data.message || "マッチング候補が見つかりませんでした");
      }
    },
    onError: () => toast.error("マッチング生成に失敗しました"),
  });
  const matchAction = trpc.match.action.useMutation({
    onSuccess: () => utils.match.recommendations.invalidate(),
  });

  const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
    friend: { label: "友人", icon: Users, color: "bg-chart-1/10 text-chart-1" },
    romantic: { label: "恋人", icon: Heart, color: "bg-chart-5/10 text-chart-5" },
    career: { label: "キャリア", icon: Briefcase, color: "bg-chart-3/10 text-chart-3" },
    role_model: { label: "ロールモデル", icon: Star, color: "bg-chart-2/10 text-chart-2" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">マッチング</h1>
          <p className="text-muted-foreground mt-1">AIがあなたに合う人をレコメンド</p>
        </div>
        <Button
          onClick={() => generateMatches.mutate({})}
          disabled={generateMatches.isPending}
          className="gap-2"
        >
          {generateMatches.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          マッチング生成
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">すべて</TabsTrigger>
          <TabsTrigger value="friend" className="gap-1">
            <Users className="h-3.5 w-3.5" />友人
          </TabsTrigger>
          <TabsTrigger value="romantic" className="gap-1">
            <Heart className="h-3.5 w-3.5" />恋人
          </TabsTrigger>
          <TabsTrigger value="career" className="gap-1">
            <Briefcase className="h-3.5 w-3.5" />キャリア
          </TabsTrigger>
          <TabsTrigger value="role_model" className="gap-1">
            <Star className="h-3.5 w-3.5" />ロールモデル
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map(rec => {
                const config = typeConfig[rec.type] || typeConfig.friend;
                const Icon = config.icon;
                const reasons = rec.reasons as string[] | null;
                return (
                  <Card key={rec.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className={`h-2 ${config.color.replace("/10", "")}`} />
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${config.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-medium">ユーザー #{rec.targetUserId}</p>
                            <Badge variant="outline" className="text-xs mt-0.5">
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {Math.round(rec.score * 100)}
                          </p>
                          <p className="text-xs text-muted-foreground">相性スコア</p>
                        </div>
                      </div>

                      {reasons && reasons.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">マッチング理由</p>
                          <div className="space-y-1">
                            {reasons.slice(0, 3).map((reason: string, i: number) => (
                              <p key={i} className="text-sm flex items-start gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                {reason}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => matchAction.mutate({ id: rec.id, action: "reject" })}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          スキップ
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => {
                            matchAction.mutate({ id: rec.id, action: "accept" });
                            toast.success("接続リクエストを送信しました");
                          }}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          興味あり
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">マッチング候補がありません</p>
                <p className="text-sm text-muted-foreground mt-1">「マッチング生成」ボタンでAIにレコメンドを依頼してください</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Connections */}
      {connections && connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              接続済み ({connections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {connections.map(conn => (
                <div key={conn.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">接続 #{conn.id}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">{conn.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
