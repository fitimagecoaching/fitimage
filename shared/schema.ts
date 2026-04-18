import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("client"), // "coach" | "client"
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  goals: text("goals"),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── PROGRAMS ────────────────────────────────────────────────────────────────
export const programs = sqliteTable("programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  coachId: integer("coach_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  durationWeeks: integer("duration_weeks").notNull().default(4),
  isTemplate: integer("is_template", { mode: "boolean" }).default(false),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

export const insertProgramSchema = createInsertSchema(programs).omit({ id: true, createdAt: true });
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

// ─── CLIENT PROGRAM ASSIGNMENTS ──────────────────────────────────────────────
export const clientPrograms = sqliteTable("client_programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  programId: integer("program_id").notNull(),
  startDate: text("start_date").notNull(), // ISO date string
  status: text("status").notNull().default("active"), // "active" | "completed" | "paused"
  assignedAt: integer("assigned_at").notNull().$defaultFn(() => Date.now()),
});

export const insertClientProgramSchema = createInsertSchema(clientPrograms).omit({ id: true, assignedAt: true });
export type InsertClientProgram = z.infer<typeof insertClientProgramSchema>;
export type ClientProgram = typeof clientPrograms.$inferSelect;

// ─── WORKOUTS ────────────────────────────────────────────────────────────────
// type: "traditional" | "wod" | "emom" | "amrap" | "tabata"
// dayOfWeek: 0=Sun, 1=Mon, ... 5=Fri
export const workouts = sqliteTable("workouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  programId: integer("program_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("traditional"),
  dayOfWeek: integer("day_of_week").notNull(), // 0-5 (Sun-Fri)
  weekNumber: integer("week_number").notNull().default(1),
  notes: text("notes"),
  // Timed workout settings (EMOM/AMRAP/Tabata)
  timeCap: integer("time_cap"), // seconds
  roundCount: integer("round_count"),
  workInterval: integer("work_interval"), // seconds (Tabata)
  restInterval: integer("rest_interval"), // seconds (Tabata)
  // WOD scoring
  scoreType: text("score_type"), // "time" | "reps" | "rounds" | "weight" | "none"
  // JSON blocks for complex structures
  blocks: text("blocks"), // JSON: [{blockName, exercises:[...]}] for traditional; exercise list for others
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true, createdAt: true });
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;

// ─── WORKOUT LOGS ─────────────────────────────────────────────────────────────
export const workoutLogs = sqliteTable("workout_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  workoutId: integer("workout_id").notNull(),
  completedAt: integer("completed_at").notNull().$defaultFn(() => Date.now()),
  duration: integer("duration"), // seconds
  score: text("score"), // WOD score: time string, reps count, rounds count etc
  notes: text("notes"),
  setLogs: text("set_logs"), // JSON: [{exerciseName, sets:[{weight,reps,completed}]}]
  rating: integer("rating"), // 1-5
});

export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({ id: true, completedAt: true });
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type WorkoutLog = typeof workoutLogs.$inferSelect;

// ─── MESSAGES ────────────────────────────────────────────────────────────────
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromId: integer("from_id").notNull(),
  toId: integer("to_id").notNull(),
  body: text("body").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  sentAt: integer("sent_at").notNull().$defaultFn(() => Date.now()),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, sentAt: true, isRead: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// ─── COMMUNITY POSTS ─────────────────────────────────────────────────────────
export const communityPosts = sqliteTable("community_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorId: integer("author_id").notNull(),
  type: text("type").notNull().default("post"), // "post" | "challenge"
  title: text("title"),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  likesJson: text("likes_json").default("[]"), // JSON array of user IDs
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({ id: true, createdAt: true, likesJson: true });
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;

// ─── COMMUNITY COMMENTS ──────────────────────────────────────────────────────
export const communityComments = sqliteTable("community_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  authorId: integer("author_id").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({ id: true, createdAt: true });
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;
export type CommunityComment = typeof communityComments.$inferSelect;

// ─── MINISTRY RESOURCES ──────────────────────────────────────────────────────
export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  coachId: integer("coach_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").default("teaching"), // "teaching" | "devotional" | "nutrition" | "other"
  fileName: text("file_name").notNull(),
  fileData: text("file_data").notNull(), // base64 encoded
  fileSize: integer("file_size"),
  uploadedAt: integer("uploaded_at").notNull().$defaultFn(() => Date.now()),
});

export const insertResourceSchema = createInsertSchema(resources).omit({ id: true, uploadedAt: true });
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

// ─── HABIT LOGS ──────────────────────────────────────────────────────────────
export const habitLogs = sqliteTable("habit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  date: text("date").notNull(), // ISO date
  water: integer("water"), // cups
  sleep: real("sleep"), // hours
  nutrition: integer("nutrition"), // 1-5 rating
  stress: integer("stress"), // 1-5 rating
  notes: text("notes"),
  loggedAt: integer("logged_at").notNull().$defaultFn(() => Date.now()),
});

export const insertHabitLogSchema = createInsertSchema(habitLogs).omit({ id: true, loggedAt: true });
export type InsertHabitLog = z.infer<typeof insertHabitLogSchema>;
export type HabitLog = typeof habitLogs.$inferSelect;
