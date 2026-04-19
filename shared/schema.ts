import { z } from "zod";

// ─── USERS ───────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  goals: string | null;
  createdAt: number;
}
export const insertUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: z.string().default("client"),
  avatarUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  goals: z.string().nullable().optional(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;

// ─── PROGRAMS ────────────────────────────────────────────────────────────────
export interface Program {
  id: number;
  coachId: number;
  name: string;
  description: string | null;
  durationWeeks: number;
  isTemplate: boolean | null;
  createdAt: number;
}
export const insertProgramSchema = z.object({
  coachId: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  durationWeeks: z.number().default(4),
  isTemplate: z.boolean().nullable().optional(),
});
export type InsertProgram = z.infer<typeof insertProgramSchema>;

// ─── CLIENT PROGRAM ASSIGNMENTS ──────────────────────────────────────────────
export interface ClientProgram {
  id: number;
  clientId: number;
  programId: number;
  startDate: string;
  status: string;
  assignedAt: number;
}
export const insertClientProgramSchema = z.object({
  clientId: z.number(),
  programId: z.number(),
  startDate: z.string(),
  status: z.string().default("active"),
});
export type InsertClientProgram = z.infer<typeof insertClientProgramSchema>;

// ─── WORKOUTS ────────────────────────────────────────────────────────────────
export interface Workout {
  id: number;
  programId: number;
  name: string;
  type: string;
  dayOfWeek: number;
  weekNumber: number;
  notes: string | null;
  timeCap: number | null;
  roundCount: number | null;
  workInterval: number | null;
  restInterval: number | null;
  scoreType: string | null;
  blocks: string | null;
  createdAt: number;
}
export const insertWorkoutSchema = z.object({
  programId: z.number(),
  name: z.string(),
  type: z.string().default("traditional"),
  dayOfWeek: z.number(),
  weekNumber: z.number().default(1),
  notes: z.string().nullable().optional(),
  timeCap: z.number().nullable().optional(),
  roundCount: z.number().nullable().optional(),
  workInterval: z.number().nullable().optional(),
  restInterval: z.number().nullable().optional(),
  scoreType: z.string().nullable().optional(),
  blocks: z.string().nullable().optional(),
});
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

// ─── WORKOUT LOGS ─────────────────────────────────────────────────────────────
export interface WorkoutLog {
  id: number;
  clientId: number;
  workoutId: number;
  completedAt: number;
  duration: number | null;
  score: string | null;
  notes: string | null;
  setLogs: string | null;
  rating: number | null;
}
export const insertWorkoutLogSchema = z.object({
  clientId: z.number(),
  workoutId: z.number(),
  duration: z.number().nullable().optional(),
  score: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  setLogs: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
});
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;

// ─── MESSAGES ────────────────────────────────────────────────────────────────
export interface Message {
  id: number;
  fromId: number;
  toId: number;
  body: string;
  isRead: boolean | null;
  sentAt: number;
}
export const insertMessageSchema = z.object({
  fromId: z.number(),
  toId: z.number(),
  body: z.string(),
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// ─── COMMUNITY POSTS ─────────────────────────────────────────────────────────
export interface CommunityPost {
  id: number;
  authorId: number;
  type: string;
  title: string | null;
  body: string;
  imageUrl: string | null;
  likesJson: string | null;
  createdAt: number;
}
export const insertCommunityPostSchema = z.object({
  authorId: z.number(),
  type: z.string().default("post"),
  title: z.string().nullable().optional(),
  body: z.string(),
  imageUrl: z.string().nullable().optional(),
});
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;

// ─── COMMUNITY COMMENTS ──────────────────────────────────────────────────────
export interface CommunityComment {
  id: number;
  postId: number;
  authorId: number;
  body: string;
  createdAt: number;
}
export const insertCommunityCommentSchema = z.object({
  postId: z.number(),
  authorId: z.number(),
  body: z.string(),
});
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;

// ─── MINISTRY RESOURCES ──────────────────────────────────────────────────────
export interface Resource {
  id: number;
  coachId: number;
  title: string;
  description: string | null;
  category: string | null;
  fileName: string;
  fileData: string;
  fileSize: number | null;
  uploadedAt: number;
}
export const insertResourceSchema = z.object({
  coachId: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  fileName: z.string(),
  fileData: z.string(),
  fileSize: z.number().nullable().optional(),
});
export type InsertResource = z.infer<typeof insertResourceSchema>;

// ─── HABIT LOGS ──────────────────────────────────────────────────────────────
export interface HabitLog {
  id: number;
  clientId: number;
  date: string;
  water: number | null;
  sleep: number | null;
  nutrition: number | null;
  stress: number | null;
  notes: string | null;
  loggedAt: number;
}
export const insertHabitLogSchema = z.object({
  clientId: z.number(),
  date: z.string(),
  water: z.number().nullable().optional(),
  sleep: z.number().nullable().optional(),
  nutrition: z.number().nullable().optional(),
  stress: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type InsertHabitLog = z.infer<typeof insertHabitLogSchema>;
