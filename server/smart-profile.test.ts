import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createUnauthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.name).toBe("Test User 1");
    expect(result?.email).toBe("test1@example.com");
  });

  it("returns null when not authenticated", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("task procedures", () => {
  it("task.create requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.task.create({ title: "Test Task" })
    ).rejects.toThrow();
  });

  it("task.list requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.task.list()).rejects.toThrow();
  });

  it("task.stats requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.task.stats()).rejects.toThrow();
  });
});

describe("activity procedures", () => {
  it("activity.create requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activity.create({ type: "text", content: "test" })
    ).rejects.toThrow();
  });

  it("activity.list requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.activity.list()).rejects.toThrow();
  });

  it("activity.count requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.activity.count()).rejects.toThrow();
  });
});

describe("user profile procedures", () => {
  it("user.getProfile requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.user.getProfile()).rejects.toThrow();
  });

  it("user.updateProfile requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.user.updateProfile({ name: "New Name" })
    ).rejects.toThrow();
  });
});

describe("ai procedures", () => {
  it("ai.generateProfile requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.ai.generateProfile()).rejects.toThrow();
  });

  it("ai.analyzeActivity requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ai.analyzeActivity({ activityId: 1 })
    ).rejects.toThrow();
  });
});

describe("insight procedures", () => {
  it("insight.list requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.insight.list()).rejects.toThrow();
  });

  it("insight.counts requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.insight.counts()).rejects.toThrow();
  });
});

describe("match procedures", () => {
  it("match.recommendations requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.match.recommendations()).rejects.toThrow();
  });

  it("match.connections requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.match.connections()).rejects.toThrow();
  });
});

describe("dashboard procedures", () => {
  it("dashboard.stats requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.stats()).rejects.toThrow();
  });

  it("dashboard.recentActivities requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.recentActivities()).rejects.toThrow();
  });

  it("dashboard.todayTasks requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.todayTasks()).rejects.toThrow();
  });
});

describe("card procedures", () => {
  it("card.generate requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.card.generate()).rejects.toThrow();
  });
});

describe("input validation", () => {
  it("activity.create rejects invalid type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activity.create({ type: "invalid" as any, content: "test" })
    ).rejects.toThrow();
  });

  it("task.update rejects invalid status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.task.update({ id: 1, status: "invalid" as any })
    ).rejects.toThrow();
  });

  it("task.update rejects invalid priority", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.task.update({ id: 1, priority: "invalid" as any })
    ).rejects.toThrow();
  });

  it("match.action rejects invalid action", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.match.action({ id: 1, action: "invalid" as any })
    ).rejects.toThrow();
  });
});
