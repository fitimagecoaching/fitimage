import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, or, desc } from "drizzle-orm";
import {
  users, programs, clientPrograms, workouts, workoutLogs,
  messages, communityPosts, communityComments, resources, habitLogs,
  type User, type InsertUser,
  type Program, type InsertProgram,
  type ClientProgram, type InsertClientProgram,
  type Workout, type InsertWorkout,
  type WorkoutLog, type InsertWorkoutLog,
  type Message, type InsertMessage,
  type CommunityPost, type InsertCommunityPost,
  type CommunityComment, type InsertCommunityComment,
  type Resource, type InsertResource,
  type HabitLog, type InsertHabitLog,
} from "@shared/schema";

const sqlite = new Database("fitimage.db");
export const db = drizzle(sqlite);

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client',
    avatar_url TEXT,
    bio TEXT,
    goals TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    is_template INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE TABLE IF NOT EXISTS client_programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    program_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    assigned_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'traditional',
    day_of_week INTEGER NOT NULL,
    week_number INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    time_cap INTEGER,
    round_count INTEGER,
    work_interval INTEGER,
    rest_interval INTEGER,
    score_type TEXT,
    blocks TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE TABLE IF NOT EXISTS workout_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    workout_id INTEGER NOT NULL,
    completed_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    duration INTEGER,
    score TEXT,
    notes TEXT,
    set_logs TEXT,
    rating INTEGER
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_id INTEGER NOT NULL,
    to_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    sent_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'post',
    title TEXT,
    body TEXT NOT NULL,
    image_url TEXT,
    likes_json TEXT DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE TABLE IF NOT EXISTS community_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'teaching',
    file_name TEXT NOT NULL,
    file_data TEXT NOT NULL,
    file_size INTEGER,
    uploaded_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    water INTEGER,
    sleep REAL,
    nutrition INTEGER,
    stress INTEGER,
    notes TEXT,
    logged_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
`);

// Seed coach account if not exists
const existingCoach = sqlite.prepare("SELECT id FROM users WHERE role = 'coach' LIMIT 1").get();
if (!existingCoach) {
  sqlite.prepare(`
    INSERT INTO users (name, email, password, role, bio)
    VALUES ('FitImage Coach', 'coach@fitimage.com', 'fitimage2024', 'coach', 'NASM Certified · Precision Nutrition L1 · Behavior Change Coach')
  `).run();
}

export interface IStorage {
  // Users
  getUserById(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  createUser(data: InsertUser): User;
  updateUser(id: number, data: Partial<InsertUser>): User | undefined;
  getAllClients(): User[];

  // Programs
  getPrograms(coachId: number): Program[];
  getProgramById(id: number): Program | undefined;
  createProgram(data: InsertProgram): Program;
  updateProgram(id: number, data: Partial<InsertProgram>): Program | undefined;
  deleteProgram(id: number): void;

  // Client Programs
  assignProgram(data: InsertClientProgram): ClientProgram;
  getClientPrograms(clientId: number): ClientProgram[];
  getActiveClientProgram(clientId: number): ClientProgram | undefined;
  updateClientProgram(id: number, data: Partial<InsertClientProgram>): ClientProgram | undefined;

  // Workouts
  getWorkoutsByProgram(programId: number): Workout[];
  getWorkoutById(id: number): Workout | undefined;
  createWorkout(data: InsertWorkout): Workout;
  updateWorkout(id: number, data: Partial<InsertWorkout>): Workout | undefined;
  deleteWorkout(id: number): void;

  // Workout Logs
  createWorkoutLog(data: InsertWorkoutLog): WorkoutLog;
  getWorkoutLogs(clientId: number): WorkoutLog[];
  getWorkoutLogsByWorkout(workoutId: number): WorkoutLog[];

  // Messages
  sendMessage(data: InsertMessage): Message;
  getConversation(userId1: number, userId2: number): Message[];
  getInbox(userId: number): Message[];
  markRead(messageId: number): void;

  // Community
  getCommunityPosts(): CommunityPost[];
  createCommunityPost(data: InsertCommunityPost): CommunityPost;
  toggleLike(postId: number, userId: number): CommunityPost | undefined;
  getComments(postId: number): CommunityComment[];
  createComment(data: InsertCommunityComment): CommunityComment;

  // Resources
  getResources(): Resource[];
  createResource(data: InsertResource): Resource;
  deleteResource(id: number): void;

  // Habit Logs
  createHabitLog(data: InsertHabitLog): HabitLog;
  getHabitLogs(clientId: number): HabitLog[];
  getHabitLogByDate(clientId: number, date: string): HabitLog | undefined;
}

export class Storage implements IStorage {
  getUserById(id: number) {
    return db.select().from(users).where(eq(users.id, id)).get();
  }
  getUserByEmail(email: string) {
    return db.select().from(users).where(eq(users.email, email)).get();
  }
  createUser(data: InsertUser) {
    return db.insert(users).values(data).returning().get();
  }
  updateUser(id: number, data: Partial<InsertUser>) {
    return db.update(users).set(data).where(eq(users.id, id)).returning().get();
  }
  getAllClients() {
    return db.select().from(users).where(eq(users.role, "client")).all();
  }

  getPrograms(coachId: number) {
    return db.select().from(programs).where(eq(programs.coachId, coachId)).all();
  }
  getProgramById(id: number) {
    return db.select().from(programs).where(eq(programs.id, id)).get();
  }
  createProgram(data: InsertProgram) {
    return db.insert(programs).values(data).returning().get();
  }
  updateProgram(id: number, data: Partial<InsertProgram>) {
    return db.update(programs).set(data).where(eq(programs.id, id)).returning().get();
  }
  deleteProgram(id: number) {
    db.delete(programs).where(eq(programs.id, id)).run();
  }

  assignProgram(data: InsertClientProgram) {
    return db.insert(clientPrograms).values(data).returning().get();
  }
  getClientPrograms(clientId: number) {
    return db.select().from(clientPrograms).where(eq(clientPrograms.clientId, clientId)).all();
  }
  getActiveClientProgram(clientId: number) {
    return db.select().from(clientPrograms)
      .where(and(eq(clientPrograms.clientId, clientId), eq(clientPrograms.status, "active")))
      .get();
  }
  updateClientProgram(id: number, data: Partial<InsertClientProgram>) {
    return db.update(clientPrograms).set(data).where(eq(clientPrograms.id, id)).returning().get();
  }

  getWorkoutsByProgram(programId: number) {
    return db.select().from(workouts).where(eq(workouts.programId, programId)).all();
  }
  getWorkoutById(id: number) {
    return db.select().from(workouts).where(eq(workouts.id, id)).get();
  }
  createWorkout(data: InsertWorkout) {
    return db.insert(workouts).values(data).returning().get();
  }
  updateWorkout(id: number, data: Partial<InsertWorkout>) {
    return db.update(workouts).set(data).where(eq(workouts.id, id)).returning().get();
  }
  deleteWorkout(id: number) {
    db.delete(workouts).where(eq(workouts.id, id)).run();
  }

  createWorkoutLog(data: InsertWorkoutLog) {
    return db.insert(workoutLogs).values(data).returning().get();
  }
  getWorkoutLogs(clientId: number) {
    return db.select().from(workoutLogs).where(eq(workoutLogs.clientId, clientId))
      .orderBy(desc(workoutLogs.completedAt)).all();
  }
  getWorkoutLogsByWorkout(workoutId: number) {
    return db.select().from(workoutLogs).where(eq(workoutLogs.workoutId, workoutId)).all();
  }

  sendMessage(data: InsertMessage) {
    return db.insert(messages).values(data).returning().get();
  }
  getConversation(userId1: number, userId2: number) {
    return db.select().from(messages)
      .where(or(
        and(eq(messages.fromId, userId1), eq(messages.toId, userId2)),
        and(eq(messages.fromId, userId2), eq(messages.toId, userId1))
      ))
      .orderBy(messages.sentAt).all();
  }
  getInbox(userId: number) {
    return db.select().from(messages)
      .where(or(eq(messages.fromId, userId), eq(messages.toId, userId)))
      .orderBy(desc(messages.sentAt)).all();
  }
  markRead(messageId: number) {
    db.update(messages).set({ isRead: true }).where(eq(messages.id, messageId)).run();
  }

  getCommunityPosts() {
    return db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt)).all();
  }
  createCommunityPost(data: InsertCommunityPost) {
    return db.insert(communityPosts).values(data).returning().get();
  }
  toggleLike(postId: number, userId: number) {
    const post = db.select().from(communityPosts).where(eq(communityPosts.id, postId)).get();
    if (!post) return undefined;
    const likes: number[] = JSON.parse(post.likesJson || "[]");
    const idx = likes.indexOf(userId);
    if (idx === -1) likes.push(userId); else likes.splice(idx, 1);
    return db.update(communityPosts).set({ likesJson: JSON.stringify(likes) })
      .where(eq(communityPosts.id, postId)).returning().get();
  }
  getComments(postId: number) {
    return db.select().from(communityComments).where(eq(communityComments.postId, postId))
      .orderBy(communityComments.createdAt).all();
  }
  createComment(data: InsertCommunityComment) {
    return db.insert(communityComments).values(data).returning().get();
  }

  getResources() {
    return db.select().from(resources).orderBy(desc(resources.uploadedAt)).all();
  }
  createResource(data: InsertResource) {
    return db.insert(resources).values(data).returning().get();
  }
  deleteResource(id: number) {
    db.delete(resources).where(eq(resources.id, id)).run();
  }
  getResourceFull(id: number) {
    return db.select().from(resources).where(eq(resources.id, id)).get();
  }

  createHabitLog(data: InsertHabitLog) {
    return db.insert(habitLogs).values(data).returning().get();
  }
  getHabitLogs(clientId: number) {
    return db.select().from(habitLogs).where(eq(habitLogs.clientId, clientId))
      .orderBy(desc(habitLogs.date)).all();
  }
  getHabitLogByDate(clientId: number, date: string) {
    return db.select().from(habitLogs)
      .where(and(eq(habitLogs.clientId, clientId), eq(habitLogs.date, date))).get();
  }
}

export const storage = new Storage();
