import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, FileText, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

interface ApiCondition {
  name: string;
  confidence: number; // 0..1
  description?: string;
  recommendedActions?: string[];
  whenToSeekCare?: string;
}

interface ApiResultDoc {
  id: string;
  symptoms: string;
  result: {
    conditions: ApiCondition[];
    disclaimer: string;
  };
  metadata?: Record<string, unknown> | null;
  createdAt: string; // ISO
}

interface HistoryItem {
  id: string;
  date: string;
  time: string;
  symptoms: string;
  topResult: {
    name: string;
    confidence: number;
    recommendation: string;
  };
}

const History = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const classifyRecommendation = (whenToSeekCare?: string): string => {
    const t = (whenToSeekCare || "").toLowerCase();
    if (/(emergency|shortness of breath|confusion|severe|chest pain|faint)/.test(t))
      return "emergency";
    if (/(seek|consult|doctor|provider|medical advice|persist)/.test(t)) return "doctor";
    return "self-care";
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "doctor":
        return "bg-primary/20 text-primary border-primary/30";
      case "emergency":
        return "bg-destructive/20 text-destructive-foreground border-destructive/30";
      case "self-care":
        return "text-green-700 border-green-400 bg-green-100 dark:text-green-200 dark:border-green-500 dark:bg-green-800";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  const mapDocToHistoryItem = (doc: ApiResultDoc): HistoryItem | null => {
    const created = new Date(doc.createdAt);
    if (isNaN(created.getTime())) return null;

    const top =
      [...(doc.result?.conditions || [])].sort(
        (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)
      )[0] || null;

    const recommendation = top ? classifyRecommendation(top.whenToSeekCare) : "self-care";

    return {
      id: doc.id,
      date: created.toISOString().slice(0, 10),
      time: created.toTimeString().slice(0, 5),
      symptoms: doc.symptoms || "",
      topResult: {
        name: top?.name || "Unknown",
        confidence: Math.round((top?.confidence ?? 0) * 100),
        recommendation,
      },
    };
  };

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${API_BASE}/history?limit=100&skip=0`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          let detail = "Failed to load results";
          try {
            const e = await res.json();
            detail = e?.detail || detail;
          } catch { /* empty */ }
          throw new Error(`${res.status} ${res.statusText}: ${detail}`);
        }
        const docs: ApiResultDoc[] = await res.json();
        const mapped = docs
          .map(mapDocToHistoryItem)
          .filter((x): x is HistoryItem => Boolean(x));
        setItems(mapped);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErr(e?.message || "Could not load history.");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lowerTerm = searchTerm.toLowerCase();
    return items.filter((item) => item.symptoms.toLowerCase().includes(lowerTerm));
  }, [items, searchTerm]);

  const openDetails = (item: HistoryItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleRerun = (symptoms: string) => {
    navigate("/", { state: { presetSymptoms: symptoms } });
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Delete this check from history? This cannot be undone.");
    if (!ok) return;

    setItems((cur) => cur.filter((i) => i.id !== id));
    if (selectedItem?.id === id) {
      setIsDialogOpen(false);
      setSelectedItem(null);
    }

    const encodedId = encodeURIComponent(id);
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token") || null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/results/${encodedId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        toast.success("Deleted");
      } else {
        toast.error("Failed to delete from backend.");
      }
    } catch {
      toast.error("Could not reach the server for deletion.");
    }
  };

  // Export CSV
  const handleExport = () => {
    if (!filteredItems.length) {
      toast.error("No data to export");
      return;
    }
    const csvRows = [
      ["Date", "Time", "Symptoms", "Top Condition", "Confidence %", "Recommendation"],
      ...filteredItems.map(i => [
        i.date,
        i.time,
        `"${i.symptoms.replace(/"/g, '""')}"`,
        i.topResult.name,
        i.topResult.confidence.toString(),
        i.topResult.recommendation,
      ])
    ];
    const csvContent = csvRows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `symptom-check-history-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const content = useMemo(() => {
    if (loading) {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 text-center">
          Loading…
        </motion.div>
      );
    }
    if (err) {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 text-center">
          <p className="text-red-500">{err}</p>
          <Button onClick={() => location.reload()} className="mt-4">Retry</Button>
        </motion.div>
      );
    }
    if (!filteredItems.length) {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 text-center space-y-4">
          <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
            <FileText className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold">No Past Checks Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start your first symptom check to build your health history and track patterns over time.
          </p>
          <Button onClick={() => navigate("/")} size="lg" className="bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-primary-foreground mt-4">
            Start First Check
          </Button>
        </motion.div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="glass-card glass-card-hover p-6 cursor-pointer"
            onClick={() => openDetails(item)}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-center p-3 glass-card rounded-xl">
                <div className="text-2xl font-bold gradient-text">{new Date(item.date).getDate()}</div>
                <div className="text-xs text-muted-foreground uppercase">
                  {new Date(item.date).toLocaleDateString("en-US", { month: "short" })}
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{item.time}</span>
                    </div>
                    <p className="text-foreground line-clamp-2">{item.symptoms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    variant="outline"
                    className={
                      item.topResult.recommendation === "self-care"
                        ? "text-green-700 border-green-400 bg-green-100 dark:text-green-200 dark:border-green-500 dark:bg-green-800"
                        : getRecommendationColor(item.topResult.recommendation)
                    }
                  >
                    {item.topResult.name} • {item.topResult.confidence}% confidence
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRerun(item.symptoms);
                  }}
                  className="hover:bg-primary/10 hover:text-primary"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems, loading, err, navigate, selectedItem]);

  return (
    <div className="min-h-screen pb-12">
      <div className="container mx-auto px-4 pt-24 max-w-5xl space-y-6">
        {/* Header, search, export */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">Your History</h1>
          <p className="text-muted-foreground">Review your past symptom checks and analyses</p>

          <input
            type="search"
            placeholder="Search symptoms"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-4 w-full max-w-md rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <Button onClick={handleExport} className="mt-4 bg-primary text-primary-foreground hover:bg-primary-dark max-w-md">
            Export Visible History as CSV
          </Button>
        </div>

        {content}
      </div>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-card border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl gradient-text">Check Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4 p-4 glass-card rounded-xl">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(selectedItem.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedItem.time}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Symptoms Reported</p>
                <p className="p-4 glass-card rounded-xl">{selectedItem.symptoms}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Top Result</p>
                <div className="p-4 glass-card rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">{selectedItem.topResult.name}</h4>
                    <Badge
                      variant="outline"
                      className={
                        selectedItem.topResult.recommendation === "self-care"
                          ? "text-green-700 border-green-400 bg-green-100 dark:text-green-200 dark:border-green-500 dark:bg-green-800"
                          : getRecommendationColor(selectedItem.topResult.recommendation)
                      }
                    >
                      {selectedItem.topResult.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate("/", { state: { presetSymptoms: selectedItem.symptoms } })}
                className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-primary-foreground"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Re-run This Check
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History;
