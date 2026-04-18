import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Heart, MessageCircle, Plus, Trophy, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { CommunityPost, CommunityComment, User } from "@shared/schema";

type PostWithMeta = CommunityPost & { authorName?: string };

export default function CommunityPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: "post" });
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  const { data: posts = [], isLoading } = useQuery<CommunityPost[]>({ queryKey: ["/api/community"] });
  const { data: clients = [] } = useQuery<User[]>({ queryKey: ["/api/clients"] });

  const getUserName = (id: number) => {
    if (id === user?.id) return user.name;
    return clients.find(c => c.id === id)?.name || `User ${id}`;
  };

  const createPost = useMutation({
    mutationFn: () => apiRequest("POST", "/api/community", { ...form, authorId: user?.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/community"] });
      setShowCreate(false);
      setForm({ title: "", body: "", type: "post" });
    },
  });

  const likeMutation = useMutation({
    mutationFn: (postId: number) => apiRequest("POST", `/api/community/${postId}/like`, { userId: user?.id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/community"] }),
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community</h1>
          <p className="text-muted-foreground text-sm">Challenges, wins, and encouragement</p>
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-post">
          <Plus className="h-4 w-4 mr-2" />Post
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold">No posts yet</h3>
          <p className="text-muted-foreground text-sm">Be the first to post a challenge or win</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => {
            const likes: number[] = JSON.parse(post.likesJson || "[]");
            const liked = likes.includes(user?.id || 0);
            const isExpanded = expandedPost === post.id;
            return (
              <PostCard
                key={post.id}
                post={post}
                authorName={getUserName(post.authorId)}
                liked={liked}
                likesCount={likes.length}
                isExpanded={isExpanded}
                onLike={() => likeMutation.mutate(post.id)}
                onExpand={() => setExpandedPost(isExpanded ? null : post.id)}
                currentUserId={user?.id || 0}
                getUserName={getUserName}
              />
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Post</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger data-testid="select-post-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">General Post</SelectItem>
                  <SelectItem value="challenge">Challenge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === "challenge" && (
              <div className="space-y-1.5">
                <Label>Challenge Title</Label>
                <Input data-testid="input-post-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. 30-Day Water Challenge" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea data-testid="input-post-body" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Share a win, word of encouragement, or challenge..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createPost.mutate()} disabled={!form.body || createPost.isPending} data-testid="button-submit-post">
              {createPost.isPending ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PostCard({ post, authorName, liked, likesCount, isExpanded, onLike, onExpand, currentUserId, getUserName }: {
  post: CommunityPost; authorName: string; liked: boolean; likesCount: number;
  isExpanded: boolean; onLike: () => void; onExpand: () => void;
  currentUserId: number; getUserName: (id: number) => string;
}) {
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: comments = [] } = useQuery<CommunityComment[]>({
    queryKey: ["/api/community", post.id, "comments"],
    queryFn: async () => { const r = await fetch(`/api/community/${post.id}/comments`); return r.json(); },
    enabled: isExpanded,
  });

  const commentMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community/${post.id}/comments`, { authorId: currentUserId, body: commentText }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/community", post.id, "comments"] });
      setCommentText("");
    },
  });

  return (
    <Card data-testid={`post-card-${post.id}`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
            {authorName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{authorName}</span>
              {post.type === "challenge" && <Badge className="bg-primary/15 text-primary text-[10px]"><Trophy className="h-2.5 w-2.5 mr-1" />Challenge</Badge>}
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(post.createdAt, { addSuffix: true })}</span>
            </div>
            {post.title && <div className="font-semibold text-sm mt-0.5">{post.title}</div>}
          </div>
        </div>
        <p className="text-sm mb-4 leading-relaxed">{post.body}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <button onClick={onLike} className={`flex items-center gap-1.5 hover:text-primary transition-colors ${liked ? "text-primary" : ""}`} data-testid={`like-post-${post.id}`}>
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />{likesCount}
          </button>
          <button onClick={onExpand} className="flex items-center gap-1.5 hover:text-foreground transition-colors" data-testid={`comment-toggle-${post.id}`}>
            <MessageCircle className="h-4 w-4" />{comments.length || ""} {isExpanded ? "Hide" : "Comment"}
          </button>
        </div>
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-2" data-testid={`comment-${c.id}`}>
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {getUserName(c.authorId).charAt(0)}
                </div>
                <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                  <span className="text-xs font-semibold">{getUserName(c.authorId)} </span>
                  <span className="text-xs">{c.body}</span>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..." className="h-8 text-sm" onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMutation.mutate()} data-testid={`input-comment-${post.id}`} />
              <Button size="sm" onClick={() => commentMutation.mutate()} disabled={!commentText.trim()} data-testid={`submit-comment-${post.id}`}>Post</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
