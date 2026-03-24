import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Sparkles, FileText, Mic, ImageIcon, PenSquare } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Activities() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [, setLocation] = useLocation();

  const { data: activities, isLoading } = trpc.activity.list.useQuery(
    typeFilter === "all" ? {} : { type: typeFilter }
  );

  const typeIcon = (type: string) => {
    switch (type) {
      case "text": return <FileText className="h-4 w-4" />;
      case "audio": return <Mic className="h-4 w-4" />;
      case "image": return <ImageIcon className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "text": return "テキスト";
      case "audio": return "音声";
      case "image": return "画像";
      default: return type;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "text": return "bg-chart-1/10 text-chart-1";
      case "audio": return "bg-chart-2/10 text-chart-2";
      case "image": return "bg-chart-5/10 text-chart-5";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">アクティビティログ</h1>
          <p className="text-muted-foreground mt-1">過去の記録を閲覧・管理</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="text">テキスト</SelectItem>
              <SelectItem value="audio">音声</SelectItem>
              <SelectItem value="image">画像</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setLocation("/record")} className="gap-2">
            <PenSquare className="h-4 w-4" />
            新規記録
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : activities && activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map(activity => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${typeColor(activity.type)}`}>
                    {typeIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {activity.aiSummary && (
                          <p className="text-sm font-medium">{activity.aiSummary}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {activity.content || activity.transcription || "(メディア記録)"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(activity.createdAt).toLocaleDateString("ja-JP", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs gap-1">
                        {typeIcon(activity.type)}
                        {typeLabel(activity.type)}
                      </Badge>
                      {activity.category && (
                        <Badge variant="secondary" className="text-xs">{activity.category}</Badge>
                      )}
                      {activity.aiProcessed && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI分析済み
                        </Badge>
                      )}
                    </div>

                    {activity.mediaUrl && activity.type === "image" && (
                      <img
                        src={activity.mediaUrl}
                        alt="記録画像"
                        className="mt-2 max-h-40 rounded-lg object-cover"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">まだ記録がありません</p>
            <Button variant="link" onClick={() => setLocation("/record")} className="mt-2">
              最初の記録を作成する
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
