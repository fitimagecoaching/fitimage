import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { User, Message } from "@shared/schema";
import { format } from "date-fns";

export default function MessagesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: user?.role === "coach" ? ["/api/clients"] : ["/api/clients"],
    queryFn: async () => {
      if (user?.role === "coach") {
        const r = await fetch("/api/clients"); return r.json();
      } else {
        // Client: get coach (id=1)
        const r = await fetch("/api/users/1"); const d = await r.json(); return [d];
      }
    }
  });

  const contacts = allUsers.filter(u => u.id !== user?.id);

  const { data: conversation = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages/conversation", user?.id, selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const r = await fetch(`/api/messages/conversation/${user?.id}/${selectedUserId}`);
      return r.json();
    },
    enabled: !!selectedUserId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const sendMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/messages", { fromId: user?.id, toId: selectedUserId, body: text }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["/api/messages/conversation", user?.id, selectedUserId] });
    },
  });

  return (
    <div className="h-full flex" style={{ height: "calc(100vh - 56px)" }}>
      {/* Contact list */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Messages</h2>
        </div>
        <ScrollArea className="flex-1">
          {contacts.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">No contacts yet</div>
          ) : contacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => setSelectedUserId(contact.id)}
              className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors ${selectedUserId === contact.id ? "bg-muted" : ""}`}
              data-testid={`contact-${contact.id}`}
            >
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                {contact.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{contact.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{contact.role}</div>
              </div>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!selectedUserId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {contacts.find(c => c.id === selectedUserId)?.name.charAt(0)}
              </div>
              <span className="font-semibold">{contacts.find(c => c.id === selectedUserId)?.name}</span>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {conversation.map(msg => {
                  const isMe = msg.fromId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`} data-testid={`message-${msg.id}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p>{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {format(msg.sentAt, "h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t flex gap-2">
              <Input
                data-testid="input-message"
                placeholder="Message..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && text.trim() && sendMutation.mutate()}
              />
              <Button onClick={() => sendMutation.mutate()} disabled={!text.trim() || sendMutation.isPending} data-testid="button-send-message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
