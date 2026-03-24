import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  PenSquare,
  Mic,
  MicOff,
  ImagePlus,
  Send,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";

export default function Record() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">記録する</h1>
        <p className="text-muted-foreground mt-1">
          テキスト、音声、画像で日常を記録しましょう。AIが自動で分析します。
        </p>
      </div>

      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text" className="gap-2">
            <PenSquare className="h-4 w-4" />
            テキスト
          </TabsTrigger>
          <TabsTrigger value="audio" className="gap-2">
            <Mic className="h-4 w-4" />
            音声
          </TabsTrigger>
          <TabsTrigger value="image" className="gap-2">
            <ImagePlus className="h-4 w-4" />
            画像
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <TextRecorder />
        </TabsContent>
        <TabsContent value="audio">
          <AudioRecorder />
        </TabsContent>
        <TabsContent value="image">
          <ImageRecorder />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TextRecorder() {
  const [content, setContent] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const utils = trpc.useUtils();

  const createActivity = trpc.activity.create.useMutation();
  const analyzeActivity = trpc.ai.analyzeActivity.useMutation();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      const activity = await createActivity.mutateAsync({
        type: "text",
        content: content.trim(),
      });
      toast.success("記録を保存しました");

      if (activity?.id) {
        setAnalyzing(true);
        const analysis = await analyzeActivity.mutateAsync({ activityId: activity.id });
        setResult(analysis);
        toast.success("AI分析が完了しました");
        setAnalyzing(false);
      }

      setContent("");
      utils.dashboard.stats.invalidate();
      utils.dashboard.recentActivities.invalidate();
      utils.activity.list.invalidate();
    } catch (err) {
      toast.error("記録の保存に失敗しました");
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PenSquare className="h-4 w-4 text-primary" />
          テキストで記録
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="今日あったこと、学んだこと、感じたことを自由に書いてください..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={6}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{content.length} 文字</span>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || createActivity.isPending || analyzing}
            className="gap-2"
          >
            {createActivity.isPending || analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {analyzing ? "AI分析中..." : "記録して分析"}
          </Button>
        </div>

        {result && <AnalysisResult result={result} />}
      </CardContent>
    </Card>
  );
}

function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const utils = trpc.useUtils();

  const uploadMedia = trpc.activity.uploadMedia.useMutation();
  const transcribe = trpc.activity.transcribe.useMutation();
  const createActivity = trpc.activity.create.useMutation();
  const analyzeActivity = trpc.ai.analyzeActivity.useMutation();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("録音を開始しました");
    } catch {
      toast.error("マイクへのアクセスが許可されていません");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    toast.info("録音を停止しました");
  }, []);

  const handleProcess = async () => {
    if (!audioBlob) return;
    try {
      setAnalyzing(true);

      // Upload audio
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(audioBlob);
      });

      const { url, key } = await uploadMedia.mutateAsync({
        fileName: `recording-${Date.now()}.webm`,
        fileBase64: base64,
        contentType: "audio/webm",
      });

      // Transcribe
      const { text } = await transcribe.mutateAsync({ audioUrl: url, language: "ja" });
      setTranscription(text);

      // Create activity
      const activity = await createActivity.mutateAsync({
        type: "audio",
        content: text,
        mediaUrl: url,
        mediaKey: key,
      });

      if (activity?.id) {
        const analysis = await analyzeActivity.mutateAsync({ activityId: activity.id });
        setResult(analysis);
      }

      toast.success("音声記録の処理が完了しました");
      setAudioBlob(null);
      setAnalyzing(false);
      utils.dashboard.stats.invalidate();
      utils.dashboard.recentActivities.invalidate();
    } catch (err) {
      toast.error("処理に失敗しました");
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          音声で記録
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4 py-8">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={analyzing}
            className={`h-24 w-24 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? "bg-destructive text-destructive-foreground animate-pulse shadow-lg shadow-destructive/30"
                : "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30"
            }`}
          >
            {isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
          </button>
          <p className="text-sm text-muted-foreground">
            {isRecording ? "録音中... タップして停止" : "タップして録音開始"}
          </p>
        </div>

        {audioBlob && !analyzing && (
          <div className="flex flex-col items-center gap-3">
            <audio src={URL.createObjectURL(audioBlob)} controls className="w-full max-w-md" />
            <Button onClick={handleProcess} className="gap-2">
              <Sparkles className="h-4 w-4" />
              文字起こし＆AI分析
            </Button>
          </div>
        )}

        {analyzing && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">処理中...</span>
          </div>
        )}

        {transcription && (
          <div className="p-4 rounded-lg bg-accent/50 border">
            <p className="text-xs font-medium text-muted-foreground mb-2">文字起こし結果</p>
            <p className="text-sm">{transcription}</p>
          </div>
        )}

        {result && <AnalysisResult result={result} />}
      </CardContent>
    </Card>
  );
}

function ImageRecorder() {
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const uploadMedia = trpc.activity.uploadMedia.useMutation();
  const createActivity = trpc.activity.create.useMutation();
  const analyzeActivity = trpc.ai.analyzeActivity.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    try {
      setAnalyzing(true);

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });

      const { url, key } = await uploadMedia.mutateAsync({
        fileName: file.name,
        fileBase64: base64,
        contentType: file.type,
      });

      const activity = await createActivity.mutateAsync({
        type: "image",
        content: description || "画像記録",
        mediaUrl: url,
        mediaKey: key,
      });

      if (activity?.id && description) {
        const analysis = await analyzeActivity.mutateAsync({ activityId: activity.id });
        setResult(analysis);
      }

      toast.success("画像を記録しました");
      setPreview(null);
      setFile(null);
      setDescription("");
      setAnalyzing(false);
      utils.dashboard.stats.invalidate();
      utils.dashboard.recentActivities.invalidate();
    } catch {
      toast.error("アップロードに失敗しました");
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImagePlus className="h-4 w-4 text-primary" />
          画像で記録
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!preview ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-accent/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">クリックして画像を選択</span>
          </button>
        ) : (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded-lg" />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => { setPreview(null); setFile(null); }}
            >
              変更
            </Button>
          </div>
        )}

        <Textarea
          placeholder="この画像について説明を追加（任意）"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="resize-none"
        />

        <Button
          onClick={handleSubmit}
          disabled={!file || analyzing}
          className="w-full gap-2"
        >
          {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {analyzing ? "処理中..." : "記録して分析"}
        </Button>

        {result && <AnalysisResult result={result} />}
      </CardContent>
    </Card>
  );
}

function AnalysisResult({ result }: { result: any }) {
  return (
    <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">AI分析結果</span>
      </div>

      {result.summary && (
        <p className="text-sm">{result.summary}</p>
      )}

      {result.category && (
        <Badge variant="secondary">{result.category}</Badge>
      )}

      {result.insights?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">抽出されたインサイト</p>
          <div className="flex flex-wrap gap-1.5">
            {result.insights.map((insight: any, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">
                {insight.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {result.tasks?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">自動生成されたタスク</p>
          <div className="space-y-1">
            {result.tasks.map((task: any, i: number) => (
              <div key={i} className="text-sm flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${
                  task.priority === "high" ? "bg-destructive" :
                  task.priority === "medium" ? "bg-chart-2" : "bg-chart-4"
                }`} />
                {task.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
