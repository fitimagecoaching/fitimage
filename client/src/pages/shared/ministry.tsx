import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, Upload, Download, Trash2, Plus, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Resource } from "@shared/schema";

const CATEGORIES = ["teaching", "devotional", "nutrition", "other"];
const CAT_COLORS: Record<string, string> = {
  teaching: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  devotional: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  nutrition: "bg-green-500/15 text-green-600 dark:text-green-400",
  other: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
};

export default function MinistryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "teaching" });
  const [fileData, setFileData] = useState<{ name: string; data: string; size: number } | null>(null);
  const [filterCat, setFilterCat] = useState("all");

  const { data: resources = [], isLoading } = useQuery<Omit<Resource, "fileData">[]>({
    queryKey: ["/api/resources"]
  });

  const uploadMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/resources", {
      ...form, coachId: user?.id,
      fileName: fileData?.name, fileData: fileData?.data, fileSize: fileData?.size
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/resources"] });
      setShowUpload(false);
      setForm({ title: "", description: "", category: "teaching" });
      setFileData(null);
      toast({ title: "Resource uploaded" });
    },
    onError: () => toast({ title: "Upload failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/resources/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/resources"] }),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFileData({ name: file.name, data: (reader.result as string).split(",")[1], size: file.size });
    reader.readAsDataURL(file);
  };

  const handleDownload = async (resource: Omit<Resource, "fileData">) => {
    const res = await fetch(`/api/resources/${resource.id}/data`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = resource.fileName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const filtered = filterCat === "all" ? resources : resources.filter(r => r.category === filterCat);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ministry Resources</h1>
          <p className="text-muted-foreground text-sm">Teachings, devotionals, and nutrition guides</p>
        </div>
        {user?.role === "coach" && (
          <Button onClick={() => setShowUpload(true)} data-testid="button-upload-resource">
            <Upload className="h-4 w-4 mr-2" />Upload
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", ...CATEGORIES].map(cat => (
          <Button key={cat} variant={filterCat === cat ? "default" : "outline"} size="sm" onClick={() => setFilterCat(cat)} data-testid={`filter-${cat}`}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold">No resources yet</h3>
          {user?.role === "coach" && <p className="text-muted-foreground text-sm">Upload teachings, devotionals, and guides for your clients</p>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <Card key={r.id} className="hover:border-primary/30 transition-colors group" data-testid={`resource-card-${r.id}`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm leading-tight line-clamp-2">{r.title}</div>
                    <Badge className={`text-[10px] mt-1 ${CAT_COLORS[r.category || "other"]}`}>{r.category}</Badge>
                  </div>
                </div>
                {r.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{r.description}</p>}
                <div className="text-xs text-muted-foreground mb-3">
                  {r.fileSize ? `${Math.round(r.fileSize / 1024)}KB · ` : ""}
                  {format(r.uploadedAt, "MMM d, yyyy")}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDownload(r)} data-testid={`download-${r.id}`}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />Download
                  </Button>
                  {user?.role === "coach" && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteMutation.mutate(r.id)} data-testid={`delete-resource-${r.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Resource</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input data-testid="input-resource-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Week 1 Devotional" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger data-testid="select-resource-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea data-testid="input-resource-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>File (PDF, DOCX, etc.)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()} data-testid="dropzone-file">
                {fileData ? (
                  <div className="text-sm"><FileText className="h-5 w-5 mx-auto mb-1 text-primary" />{fileData.name}</div>
                ) : (
                  <div className="text-sm text-muted-foreground"><Upload className="h-5 w-5 mx-auto mb-1" />Click to select file</div>
                )}
              </div>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.mp4,.mp3" onChange={handleFile} data-testid="input-file" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button onClick={() => uploadMutation.mutate()} disabled={!form.title || !fileData || uploadMutation.isPending} data-testid="button-confirm-upload">
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
