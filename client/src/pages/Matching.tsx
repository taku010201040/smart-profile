import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  GraduationCap,
  MapPin,
  Zap,
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
    onSuccess: () => {
      utils.match.recommendations.invalidate();
      utils.match.connections.invalidate();
    },
  });

  const typeConfig: Record<string, { label: string; icon: any; color: string; gradient: string }> = {
    friend: { label: "友人", icon: Users, color: "bg-blue-100 text-blue-600", gradient: "from-blue-500 to-blue-600" },
    romantic: { label: "恋人", icon: Heart, color: "bg-pink-100 text-pink-600", gradient: "from-pink-500 to-rose-500" },
    career: { label: "キャリア", icon: Briefcase, color: "bg-emerald-100 text-emerald-600", gradient: "from-emerald-500 to-teal-500" },
    role_model: { label: "ロールモデル", icon: Star, color: "bg-amber-100 text-amber-600", gradient: "from-amber-500 to-orange-500" },
  };

  function getInitials(name: string | null | undefined): string {
    if (!name) return "?";
    return name.slice(0, 2);
  }

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-80 rounded-xl" />)}
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {recommendations.map((rec: any) => {
                const config = typeConfig[rec.type] || typeConfig.friend;
                const Icon = config.icon;
                const reasons = rec.reasons as string[] | null;
                const targetUser = rec.targetUser;
                const targetProfile = rec.targetProfile;
                const skills = (targetProfile?.skills as string[] | null) || [];
                const interests = (targetProfile?.interests as string[] | null) || [];
                const strengths = (targetProfile?.strengths as string[] | null) || [];

                return (
                  <Card key={rec.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                    {/* Header gradient */}
                    <div className={`h-24 bg-gradient-to-r ${config.gradient} relative`}>
                      <div className="absolute -bottom-8 left-5">
                        <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
                          {targetUser?.avatarUrl && <AvatarImage src={targetUser.avatarUrl} />}
                          <AvatarFallback className="text-lg font-bold bg-white text-gray-700">
                            {getInitials(targetUser?.name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-center">
                          <p className="text-xl font-bold leading-tight">{Math.round(rec.score * 100)}</p>
                          <p className="text-[10px] opacity-80">相性</p>
                        </div>
                      </div>
                    </div>

                    <CardContent className="pt-10 pb-4 space-y-3">
                      {/* Name & School */}
                      <div>
                        <h3 className="text-lg font-bold">
                          {targetUser?.name || `ユーザー #${rec.targetUserId}`}
                        </h3>
                        {targetUser?.school && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {targetUser.school}
                            {targetUser.grade && ` ${targetUser.grade}`}
                          </p>
                        )}
                      </div>

                      {/* Bio */}
                      {(targetProfile?.generatedBio || targetUser?.bio) && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {targetProfile?.generatedBio || targetUser?.bio}
                        </p>
                      )}

                      {/* Skills */}
                      {skills.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                            <Zap className="h-3 w-3" />スキル
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {skills.slice(0, 4).map((skill: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs font-normal">
                                {skill}
                              </Badge>
                            ))}
                            {skills.length > 4 && (
                              <Badge variant="outline" className="text-xs font-normal">
                                +{skills.length - 4}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Interests */}
                      {interests.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />興味・関心
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {interests.slice(0, 4).map((interest: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs font-normal bg-primary/5">
                                {interest}
                              </Badge>
                            ))}
                            {interests.length > 4 && (
                              <Badge variant="outline" className="text-xs font-normal">
                                +{interests.length - 4}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Match reasons */}
                      {reasons && reasons.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">マッチング理由</p>
                          <div className="space-y-1">
                            {reasons.slice(0, 3).map((reason: string, i: number) => (
                              <p key={i} className="text-xs flex items-start gap-1.5 text-foreground/80">
                                <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                                {reason}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          disabled={matchAction.isPending}
                          onClick={() => {
                            matchAction.mutate({ id: rec.id, action: "reject" });
                            toast.info("スキップしました");
                          }}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          スキップ
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 gap-1"
                          disabled={matchAction.isPending}
                          onClick={() => {
                            matchAction.mutate({ id: rec.id, action: "accept" });
                            toast.success(`${targetUser?.name || "ユーザー"}に接続リクエストを送信しました`);
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
              {connections.map((conn: any) => (
                <div key={conn.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                      {conn.userId1 === conn.id ? "U" : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <span className="text-sm font-medium">接続 #{conn.id}</span>
                    {conn.matchedReason && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{conn.matchedReason}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">{conn.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
