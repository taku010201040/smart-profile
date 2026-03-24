import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CreditCard,
  Sparkles,
  Loader2,
  Download,
  Share2,
  QrCode,
  User,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";

export default function DigitalCard() {
  const generateCard = trpc.card.generate.useMutation();
  const [cardData, setCardData] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    try {
      const data = await generateCard.mutateAsync();
      setCardData(data);
      toast.success("デジタル名刺を生成しました");
    } catch {
      toast.error("名刺の生成に失敗しました");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cardData?.name}のデジタル名刺`,
          text: `${cardData?.name} - ${cardData?.bio}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("URLをコピーしました");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">デジタル名刺</h1>
          <p className="text-muted-foreground mt-1">AIプロフィールからQRコード付き名刺を自動生成</p>
        </div>
        <div className="flex items-center gap-2">
          {cardData && (
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              共有
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generateCard.isPending}
            className="gap-2"
          >
            {generateCard.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            名刺を生成
          </Button>
        </div>
      </div>

      {!cardData && !generateCard.isPending && (
        <Card>
          <CardContent className="py-16 text-center">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">デジタル名刺を作成しましょう</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              AIがあなたのプロフィール情報から自動的に名刺を生成します。
              まずは記録を追加してAIプロフィールを生成してください。
            </p>
            <Button onClick={handleGenerate} className="mt-6 gap-2">
              <Sparkles className="h-4 w-4" />
              名刺を生成する
            </Button>
          </CardContent>
        </Card>
      )}

      {generateCard.isPending && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">名刺を生成中...</p>
          </div>
        </div>
      )}

      {cardData && (
        <div className="flex justify-center">
          <div ref={cardRef} className="w-full max-w-lg">
            {/* Card Front */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground p-8 shadow-2xl shadow-primary/20">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />
              </div>

              <div className="relative space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <User className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{cardData.name}</h2>
                      <div className="flex items-center gap-2 mt-1 text-sm opacity-80">
                        {cardData.school && <span>{cardData.school}</span>}
                        {cardData.grade && <span>/ {cardData.grade}</span>}
                      </div>
                    </div>
                  </div>
                  <QrCodeCanvas text={window.location.href} size={72} />
                </div>

                {/* Bio */}
                {cardData.bio && (
                  <p className="text-sm leading-relaxed opacity-90">{cardData.bio}</p>
                )}

                {/* Skills */}
                {cardData.skills?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium opacity-60 mb-2">SKILLS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cardData.skills.slice(0, 6).map((skill: string, i: number) => (
                        <Badge key={i} className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {cardData.interests?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium opacity-60 mb-2">INTERESTS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cardData.interests.slice(0, 6).map((interest: string, i: number) => (
                        <Badge key={i} variant="outline" className="border-white/30 text-white text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {cardData.strengths?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium opacity-60 mb-2">STRENGTHS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cardData.strengths.slice(0, 4).map((s: string, i: number) => (
                        <Badge key={i} className="bg-white/10 text-white border-white/20 text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-medium">Smart Profile</span>
                  </div>
                  <span className="text-xs opacity-60">AI Generated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple QR code canvas component
function QrCodeCanvas({ text, size }: { text: string; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Simple QR-like pattern (visual placeholder)
    const cellSize = 3;
    const cells = Math.floor(size / cellSize);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "rgba(0,0,0,0.8)";

    // Generate deterministic pattern from text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }

    // Draw finder patterns (corners)
    const drawFinder = (x: number, y: number) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (i === 0 || i === 6 || j === 0 || j === 6 ||
              (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
            ctx.fillRect((x + i) * cellSize, (y + j) * cellSize, cellSize, cellSize);
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(cells - 7, 0);
    drawFinder(0, cells - 7);

    // Fill data area with pseudo-random pattern
    for (let i = 8; i < cells - 8; i++) {
      for (let j = 8; j < cells - 8; j++) {
        hash = ((hash << 5) - hash + i * j) | 0;
        if (Math.abs(hash) % 3 === 0) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [text, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-lg"
      style={{ width: size, height: size }}
    />
  );
}
