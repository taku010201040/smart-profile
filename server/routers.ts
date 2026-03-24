import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== User Profile =====
  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      const profile = await db.getOrCreateProfile(user.id);
      return { user, profile };
    }),
    updateProfile: protectedProcedure.input(z.object({
      name: z.string().optional(),
      school: z.string().optional(),
      grade: z.string().optional(),
      bio: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),
  }),

  // ===== Activities =====
  activity: router({
    create: protectedProcedure.input(z.object({
      type: z.enum(["text", "audio", "image"]),
      content: z.string().optional(),
      mediaUrl: z.string().optional(),
      mediaKey: z.string().optional(),
      category: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const activity = await db.createActivity({
        userId: ctx.user.id,
        type: input.type,
        content: input.content ?? null,
        mediaUrl: input.mediaUrl ?? null,
        mediaKey: input.mediaKey ?? null,
        category: input.category ?? null,
      });
      return activity;
    }),

    list: protectedProcedure.input(z.object({
      type: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.getUserActivities(ctx.user.id, input);
    }),

    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const activity = await db.getActivityById(input.id);
      if (!activity || activity.userId !== ctx.user.id) return null;
      return activity;
    }),

    count: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserActivityCount(ctx.user.id);
    }),

    // Upload audio/image file
    uploadMedia: protectedProcedure.input(z.object({
      fileName: z.string(),
      fileBase64: z.string(),
      contentType: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const ext = input.fileName.split('.').pop() || 'bin';
      const key = `activities/${ctx.user.id}/${nanoid()}.${ext}`;
      const buffer = Buffer.from(input.fileBase64, 'base64');
      const { url } = await storagePut(key, buffer, input.contentType);
      return { url, key };
    }),

    // Transcribe audio
    transcribe: protectedProcedure.input(z.object({
      audioUrl: z.string(),
      language: z.string().optional(),
    })).mutation(async ({ input }) => {
      const result = await transcribeAudio({
        audioUrl: input.audioUrl,
        language: input.language || "ja",
      });
      if ('error' in result) {
        throw new Error((result as any).error || "Transcription failed");
      }
      return { text: result.text, language: result.language };
    }),
  }),

  // ===== AI Analysis =====
  ai: router({
    analyzeActivity: protectedProcedure.input(z.object({
      activityId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const activity = await db.getActivityById(input.activityId);
      if (!activity || activity.userId !== ctx.user.id) throw new Error("Activity not found");

      const textContent = activity.content || activity.transcription || "";
      if (!textContent.trim()) {
        await db.updateActivity(activity.id, { aiProcessed: true, aiSummary: "（テキストなし）" });
        return { summary: "（テキストなし）", insights: [], tasks: [] };
      }

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `あなたは日常記録を分析するAIアシスタントです。ユーザーの記録からスキル、興味関心、経験、達成、目標を抽出し、タスクも自動生成してください。

以下のJSON形式で回答してください:
{
  "summary": "活動の要約（1-2文）",
  "category": "カテゴリ（学業/仕事/趣味/運動/社交/その他）",
  "insights": [
    {"type": "skill|interest|experience|achievement|goal", "label": "ラベル", "confidence": 0.0-1.0, "context": "根拠"}
  ],
  "tasks": [
    {"title": "タスク名", "description": "説明", "priority": "low|medium|high"}
  ]
}`
          },
          { role: "user", content: `以下の記録を分析してください:\n\n${textContent}` }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "activity_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                category: { type: "string" },
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      label: { type: "string" },
                      confidence: { type: "number" },
                      context: { type: "string" },
                    },
                    required: ["type", "label", "confidence", "context"],
                    additionalProperties: false,
                  }
                },
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "string" },
                    },
                    required: ["title", "description", "priority"],
                    additionalProperties: false,
                  }
                },
              },
              required: ["summary", "category", "insights", "tasks"],
              additionalProperties: false,
            }
          }
        }
      });

      const parsed = JSON.parse(String(response.choices[0].message.content) || "{}");

      // Save summary and category
      await db.updateActivity(activity.id, {
        aiProcessed: true,
        aiSummary: parsed.summary,
        category: parsed.category,
      });

      // Save insights
      if (parsed.insights?.length > 0) {
        const insightData = parsed.insights.map((i: any) => ({
          activityId: activity.id,
          userId: ctx.user.id,
          type: i.type as any,
          label: i.label,
          confidence: i.confidence,
          context: i.context,
        }));
        await db.createInsightsBatch(insightData);
      }

      // Auto-create tasks
      const createdTasks = [];
      if (parsed.tasks?.length > 0) {
        for (const t of parsed.tasks) {
          const task = await db.createTask({
            userId: ctx.user.id,
            title: t.title,
            description: t.description,
            priority: t.priority as any,
            sourceActivityId: activity.id,
            isAutoGenerated: true,
          });
          if (task) createdTasks.push(task);
        }
      }

      return { summary: parsed.summary, category: parsed.category, insights: parsed.insights, tasks: createdTasks };
    }),

    generateProfile: protectedProcedure.mutation(async ({ ctx }) => {
      const insights = await db.getUserInsights(ctx.user.id);
      const recentActivities = await db.getUserActivities(ctx.user.id, { limit: 20 });
      const user = ctx.user;

      if (insights.length === 0 && recentActivities.length === 0) {
        return { message: "分析するデータがまだありません。日常の記録を追加してください。" };
      }

      const insightsSummary = insights.map(i => `[${i.type}] ${i.label} (信頼度: ${i.confidence})`).join("\n");
      const activitiesSummary = recentActivities.map(a => `- ${a.aiSummary || a.content || "(メディア記録)"}`).join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `あなたはプロフィール生成AIです。ユーザーの活動記録と抽出されたインサイトから、魅力的なプロフィールを自動生成してください。

以下のJSON形式で回答してください:
{
  "bio": "自己紹介文（100-200文字）",
  "skills": ["スキル1", "スキル2", ...],
  "interests": ["興味1", "興味2", ...],
  "experiences": ["経験1", "経験2", ...],
  "strengths": ["強み1", "強み2", ...],
  "personalityTraits": ["特性1", "特性2", ...]
}`
          },
          {
            role: "user",
            content: `ユーザー名: ${user.name || "未設定"}\n学校: ${(user as any).school || "未設定"}\n\n=== 抽出されたインサイト ===\n${insightsSummary}\n\n=== 最近の活動 ===\n${activitiesSummary}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "profile_generation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                bio: { type: "string" },
                skills: { type: "array", items: { type: "string" } },
                interests: { type: "array", items: { type: "string" } },
                experiences: { type: "array", items: { type: "string" } },
                strengths: { type: "array", items: { type: "string" } },
                personalityTraits: { type: "array", items: { type: "string" } },
              },
              required: ["bio", "skills", "interests", "experiences", "strengths", "personalityTraits"],
              additionalProperties: false,
            }
          }
        }
      });

      const parsed = JSON.parse(String(response.choices[0].message.content) || "{}");

      await db.updateProfile(ctx.user.id, {
        generatedBio: parsed.bio,
        skills: parsed.skills,
        interests: parsed.interests,
        experiences: parsed.experiences,
        strengths: parsed.strengths,
        personalityTraits: parsed.personalityTraits,
        lastGeneratedAt: new Date(),
      });

      return parsed;
    }),

    generateMatches: protectedProcedure.input(z.object({
      type: z.enum(["friend", "romantic", "career", "role_model"]).optional(),
    }).optional()).mutation(async ({ ctx }) => {
      const allUsers = await db.getAllUsers();
      const otherUsers = allUsers.filter(u => u.id !== ctx.user.id);
      if (otherUsers.length === 0) {
        return { recommendations: [], message: "他のユーザーがまだいません。" };
      }

      const myProfile = await db.getOrCreateProfile(ctx.user.id);
      const myInsights = await db.getUserInsights(ctx.user.id);

      const recommendations = [];
      for (const other of otherUsers.slice(0, 10)) {
        const otherProfile = await db.getOrCreateProfile(other.id);
        const otherInsights = await db.getUserInsights(other.id);

        if (otherInsights.length === 0 && !otherProfile?.generatedBio) continue;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `2人のユーザーの相性を分析してください。JSON形式で回答:
{"score": 0.0-1.0, "type": "friend|romantic|career|role_model", "reasons": ["理由1", "理由2"]}`
            },
            {
              role: "user",
              content: `ユーザーA: ${JSON.stringify({ name: ctx.user.name, skills: myProfile?.skills, interests: myProfile?.interests })}\nユーザーB: ${JSON.stringify({ name: other.name, skills: otherProfile?.skills, interests: otherProfile?.interests })}`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "match_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  type: { type: "string" },
                  reasons: { type: "array", items: { type: "string" } },
                },
                required: ["score", "type", "reasons"],
                additionalProperties: false,
              }
            }
          }
        });

        const parsed = JSON.parse(String(response.choices[0].message.content) || "{}");
        const recId = await db.createMatchRecommendation({
          userId: ctx.user.id,
          targetUserId: other.id,
          type: parsed.type as any || "friend",
          score: parsed.score || 0.5,
          reasons: parsed.reasons || [],
        });
        recommendations.push({ id: recId, targetUser: other, ...parsed });
      }

      return { recommendations };
    }),
  }),

  // ===== Tasks =====
  task: router({
    list: protectedProcedure.input(z.object({
      status: z.string().optional(),
      priority: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.getUserTasks(ctx.user.id, input);
    }),

    create: protectedProcedure.input(z.object({
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      dueDate: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createTask({
        userId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? "medium",
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        isAutoGenerated: false,
      });
    }),

    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      dueDate: z.string().nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const task = await db.getTaskById(input.id);
      if (!task || task.userId !== ctx.user.id) throw new Error("Task not found");
      const { id, dueDate, ...rest } = input;
      const updateData: any = { ...rest };
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      await db.updateTask(id, updateData);
      return db.getTaskById(id);
    }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const task = await db.getTaskById(input.id);
      if (!task || task.userId !== ctx.user.id) throw new Error("Task not found");
      await db.deleteTask(input.id);
      return { success: true };
    }),

    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserTaskStats(ctx.user.id);
    }),
  }),

  // ===== Insights =====
  insight: router({
    list: protectedProcedure.input(z.object({
      type: z.string().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.getUserInsights(ctx.user.id, input?.type);
    }),
    counts: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserInsightCounts(ctx.user.id);
    }),
  }),

  // ===== Matching =====
  match: router({
    recommendations: protectedProcedure.input(z.object({
      type: z.string().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.getUserRecommendations(ctx.user.id, input?.type);
    }),
    action: protectedProcedure.input(z.object({
      id: z.number(),
      action: z.enum(["accept", "reject", "save"]),
    })).mutation(async ({ ctx, input }) => {
      await db.updateMatchRecommendation(input.id, { isActedUpon: true });
      if (input.action === "accept") {
        // Create connection
        const rec = await db.getUserRecommendations(ctx.user.id);
        const target = rec.find(r => r.id === input.id);
        if (target) {
          await db.createConnection({
            userId1: ctx.user.id,
            userId2: target.targetUserId,
            status: "pending",
            matchedReason: JSON.stringify(target.reasons),
            compatibilityScore: target.score,
          });
        }
      }
      return { success: true };
    }),
    connections: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserConnections(ctx.user.id);
    }),
  }),

  // ===== Dashboard =====
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const [activityCount, taskStats, insightCounts, timeline, profile] = await Promise.all([
        db.getUserActivityCount(ctx.user.id),
        db.getUserTaskStats(ctx.user.id),
        db.getUserInsightCounts(ctx.user.id),
        db.getUserActivityTimeline(ctx.user.id, 30),
        db.getOrCreateProfile(ctx.user.id),
      ]);
      // Calculate profile completeness
      let completeness = 0;
      const checks = [
        !!ctx.user.name,
        !!(ctx.user as any).school,
        !!(ctx.user as any).bio,
        !!profile?.generatedBio,
        Array.isArray(profile?.skills) && (profile.skills as string[]).length > 0,
        Array.isArray(profile?.interests) && (profile.interests as string[]).length > 0,
        Array.isArray(profile?.strengths) && (profile.strengths as string[]).length > 0,
        activityCount > 0,
      ];
      completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);
      return { activityCount, taskStats, insightCounts, timeline, profile, completeness };
    }),
    recentActivities: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserActivities(ctx.user.id, { limit: 5 });
    }),
    todayTasks: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserTasks(ctx.user.id, { status: "pending", limit: 10 });
    }),
  }),

  // ===== Digital Card =====
  card: router({
    generate: protectedProcedure.mutation(async ({ ctx }) => {
      const user = ctx.user;
      const profile = await db.getOrCreateProfile(user.id);
      return {
        name: user.name || "未設定",
        school: (user as any).school || "",
        grade: (user as any).grade || "",
        bio: profile?.generatedBio || (user as any).bio || "",
        skills: (profile?.skills as string[]) || [],
        interests: (profile?.interests as string[]) || [],
        strengths: (profile?.strengths as string[]) || [],
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
