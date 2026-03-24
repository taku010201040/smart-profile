import { eq, desc, and, sql, like, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  activities, InsertActivity, Activity,
  extractedInsights, InsertExtractedInsight,
  profiles, InsertProfile,
  tasks, InsertTask,
  connections, InsertConnection,
  matchRecommendations, InsertMatchRecommendation,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== Users =====
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(id: number, data: { school?: string; grade?: string; bio?: string; name?: string; avatarUrl?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

// ===== Activities =====
export async function createActivity(data: InsertActivity) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(activities).values(data);
  const id = result[0].insertId;
  return getActivityById(id);
}

export async function getActivityById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
  return result[0];
}

export async function getUserActivities(userId: number, opts?: { type?: string; category?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(activities.userId, userId)];
  if (opts?.type) conditions.push(eq(activities.type, opts.type as any));
  if (opts?.category) conditions.push(eq(activities.category, opts.category));

  const query = db.select().from(activities)
    .where(and(...conditions))
    .orderBy(desc(activities.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
  return query;
}

export async function getUserActivityCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(activities).where(eq(activities.userId, userId));
  return result[0]?.count ?? 0;
}

export async function updateActivity(id: number, data: Partial<InsertActivity>) {
  const db = await getDb();
  if (!db) return;
  await db.update(activities).set(data).where(eq(activities.id, id));
}

export async function getUnprocessedActivities(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activities)
    .where(and(eq(activities.userId, userId), eq(activities.aiProcessed, false)))
    .orderBy(desc(activities.createdAt));
}

// ===== Extracted Insights =====
export async function createInsight(data: InsertExtractedInsight) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(extractedInsights).values(data);
  return result[0].insertId;
}

export async function createInsightsBatch(data: InsertExtractedInsight[]) {
  const db = await getDb();
  if (!db) return;
  if (data.length === 0) return;
  await db.insert(extractedInsights).values(data);
}

export async function getUserInsights(userId: number, type?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(extractedInsights.userId, userId)];
  if (type) conditions.push(eq(extractedInsights.type, type as any));
  return db.select().from(extractedInsights)
    .where(and(...conditions))
    .orderBy(desc(extractedInsights.confidence));
}

// ===== Profiles =====
export async function getOrCreateProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(profiles).values({ userId });
  const created = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return created[0];
}

export async function updateProfile(userId: number, data: Partial<InsertProfile>) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(profiles).values({ userId, ...data });
  } else {
    await db.update(profiles).set(data).where(eq(profiles.userId, userId));
  }
}

// ===== Tasks =====
export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(tasks).values(data);
  const id = result[0].insertId;
  return getTaskById(id);
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

export async function getUserTasks(userId: number, opts?: { status?: string; priority?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(tasks.userId, userId)];
  if (opts?.status) conditions.push(eq(tasks.status, opts.status as any));
  if (opts?.priority) conditions.push(eq(tasks.priority, opts.priority as any));
  return db.select().from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(tasks).where(eq(tasks.id, id));
}

export async function getUserTaskStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, inProgress: 0, completed: 0 };
  const all = await db.select({ status: tasks.status, count: sql<number>`count(*)` })
    .from(tasks).where(eq(tasks.userId, userId)).groupBy(tasks.status);
  const stats = { total: 0, pending: 0, inProgress: 0, completed: 0 };
  for (const row of all) {
    const c = Number(row.count);
    stats.total += c;
    if (row.status === "pending") stats.pending = c;
    if (row.status === "in_progress") stats.inProgress = c;
    if (row.status === "completed") stats.completed = c;
  }
  return stats;
}

// ===== Connections =====
export async function createConnection(data: InsertConnection) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(connections).values(data);
  return result[0].insertId;
}

export async function getUserConnections(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(connections)
    .where(and(
      or(eq(connections.userId1, userId), eq(connections.userId2, userId)),
      eq(connections.status, "accepted")
    ));
}

export async function updateConnection(id: number, data: Partial<InsertConnection>) {
  const db = await getDb();
  if (!db) return;
  await db.update(connections).set(data).where(eq(connections.id, id));
}

// ===== Match Recommendations =====
export async function createMatchRecommendation(data: InsertMatchRecommendation) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(matchRecommendations).values(data);
  return result[0].insertId;
}

export async function getUserRecommendations(userId: number, type?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(matchRecommendations.userId, userId), eq(matchRecommendations.isActedUpon, false)];
  if (type) conditions.push(eq(matchRecommendations.type, type as any));
  return db.select().from(matchRecommendations)
    .where(and(...conditions))
    .orderBy(desc(matchRecommendations.score));
}

export async function updateMatchRecommendation(id: number, data: Partial<InsertMatchRecommendation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(matchRecommendations).set(data).where(eq(matchRecommendations.id, id));
}

// ===== Analytics / Dashboard =====
export async function getUserActivityTimeline(userId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    date: sql<string>`DATE(${activities.createdAt})`.as('date'),
    count: sql<number>`count(*)`.as('cnt'),
    type: activities.type,
  }).from(activities)
    .where(and(
      eq(activities.userId, userId),
      sql`${activities.createdAt} >= DATE_SUB(NOW(), INTERVAL ${sql.raw(String(days))} DAY)`
    ))
    .groupBy(sql`DATE(${activities.createdAt})`, activities.type)
    .orderBy(sql`DATE(${activities.createdAt})`);
  return result;
}

export async function getUserInsightCounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    type: extractedInsights.type,
    count: sql<number>`count(*)`,
  }).from(extractedInsights)
    .where(eq(extractedInsights.userId, userId))
    .groupBy(extractedInsights.type);
}
