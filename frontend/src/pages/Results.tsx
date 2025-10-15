import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Home as HomeIcon, 
  Stethoscope, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Save
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ---- API result types (from your backend) ----
interface ApiCondition {
  name: string;
  confidence: number; // 0..1
  description: string;
  recommendedActions?: string[];
  whenToSeekCare?: string;
}
interface ApiResult {
  conditions: ApiCondition[];
  disclaimer: string;
}

// ---- UI card type (your existing UI expects this) ----
interface ConditionCard {
  name: string;
  confidence: number; // 0..100 (percent)
  explanation: string;
  recommendation: "self-care" | "doctor" | "emergency";
  reasoning: string;
  redFlag: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const symptoms: string | undefined = location.state?.symptoms;
  const apiResult: ApiResult | undefined = location.state?.result;

  // If user lands directly on /results without state, send them back
  useEffect(() => {
    if (!symptoms || !apiResult) {
      // You can show a toast if you want:
      // toast.error("No results to display. Please analyze symptoms first.");
      navigate("/", { replace: true });
    }
  }, [symptoms, apiResult, navigate]);

  // Map backend result -> UI cards
  const cards: ConditionCard[] = useMemo(() => {
    if (!apiResult?.conditions?.length) return [];

    const classifyRecommendation = (whenToSeekCare?: string): ConditionCard["recommendation"] => {
      const text = (whenToSeekCare || "").toLowerCase();
      // very naive heuristics; tweak as you like
      if (/(emergency|shortness of breath|confusion|severe|chest pain|faint)/.test(text)) return "emergency";
      if (/(seek|consult|doctor|provider|medical advice|persist)/.test(text)) return "doctor";
      return "self-care";
    };

    return apiResult.conditions.slice(0, 3).map((c) => {
      const rec = classifyRecommendation(c.whenToSeekCare);
      const reasoningBits: string[] = [];
      if (c.recommendedActions?.length) {
        reasoningBits.push(`Recommended actions: ${c.recommendedActions.join(", ")}.`);
      }
      if (c.whenToSeekCare) {
        reasoningBits.push(`When to seek care: ${c.whenToSeekCare}`);
      }

      return {
        name: c.name || "Unknown",
        confidence: Math.round((Number.isFinite(c.confidence) ? c.confidence : 0) * 100),
        explanation: c.description || "No description available.",
        recommendation: rec,
        reasoning: reasoningBits.join(" ") || "Follow standard self-care and monitor symptoms.",
        redFlag: rec === "emergency",
      };
    });
  }, [apiResult]);

  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case "self-care":
        return <HomeIcon className="h-5 w-5" />;
      case "doctor":
        return <Stethoscope className="h-5 w-5" />;
      case "emergency":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "self-care":
        return "from-secondary to-secondary-glow";
      case "doctor":
        return "from-primary to-primary-glow";
      case "emergency":
        return "from-destructive to-destructive";
      default:
        return "from-primary to-primary-glow";
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case "self-care":
        return "Self-Care Recommended";
      case "doctor":
        return "Consult Doctor";
      case "emergency":
        return "Seek Emergency Care";
      default:
        return "";
    }
  };

const handleSave = async () => {
  if (!apiResult || !symptoms) {
    toast.error("Nothing to save.");
    return;
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20_000); // 20s timeout

  try {
    const res = await fetch(`${API_BASE}/results`, 
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          symptoms,
          result: apiResult,
          metadata: {
            source: "web",
            ua: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
          },
        }),
      }
    );

    if (!res.ok) {
      let detail = "Failed to save result";
      try {
        const err = await res.json();
        detail = err?.detail || detail;
      } catch { /* empty */ }
      throw new Error(`${res.status} ${res.statusText}: ${detail}`);
    }

    // Saved doc from backend (includes id + createdAt)
    const saved = await res.json(); 
    // Optional: keep a small local cache as well
    try {
      const key = "symptom_results_history";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.unshift({
        savedAt: new Date().toISOString(),
        symptoms,
        result: apiResult,
        backendId: saved?.id,
        createdAt: saved?.createdAt,
      });
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));
    } catch { /* empty */ }

    toast.success("Results saved!");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err?.name === "AbortError") {
      toast.error("Save timed out. Please try again.");
    } else {
      toast.error(err?.message || "Could not save results.");
    }
  } finally {
    clearTimeout(t);
  }
};


  return (
    <div className="min-h-screen pb-12">
      <div className="container mx-auto px-4 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              Analysis Results
            </h1>
            <div className="glass-card p-4 rounded-xl inline-block">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Your symptoms:</strong> {symptoms || "—"}
              </p>
            </div>
          </div>

          {/* Red Flag Alert */}
          {cards.some(r => r.redFlag) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card border-destructive/50 bg-destructive/10 p-6 rounded-xl"
            >
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-destructive">
                    Urgent Attention Needed
                  </h3>
                  <p className="text-sm text-foreground">
                    Your symptoms may require immediate medical attention. Please consult a healthcare 
                    provider promptly or visit an emergency facility if symptoms are severe.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Cards */}
          <div className="space-y-4">
            {cards.map((condition, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card glass-card-hover p-6 space-y-4"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-2xl font-semibold text-foreground">
                        {condition.name}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={`bg-gradient-to-r ${getRecommendationColor(condition.recommendation)} text-primary-foreground border-0`}
                      >
                        {getRecommendationIcon(condition.recommendation)}
                        <span className="ml-2">{getRecommendationText(condition.recommendation)}</span>
                      </Badge>
                    </div>
                    
                    {/* Confidence Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Confidence Level</span>
                        <span className="font-semibold text-primary">{condition.confidence}%</span>
                      </div>
                      <Progress value={condition.confidence} className="h-2 bg-muted" />
                    </div>

                    <p className="text-muted-foreground">{condition.explanation}</p>
                  </div>
                </div>

                {/* Expandable Reasoning */}
                <div className="border-t border-border/50 pt-4">
                  <button
                    onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                    className="flex items-center justify-between w-full text-left hover:text-primary transition-colors"
                  >
                    <span className="text-sm font-medium">Explain reasoning</span>
                    {expandedCard === index ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expandedCard === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 p-4 glass-card rounded-xl"
                    >
                      <p className="text-sm text-muted-foreground">{condition.reasoning}</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 flex-wrap justify-center">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              size="lg"
              className="border-primary/30 hover:bg-primary/10"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Check Again
            </Button>
            <Button
              onClick={handleSave}
              size="lg"
              className="bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-primary-foreground"
              disabled={!apiResult}
            >
              <Save className="mr-2 h-5 w-5" />
              Save Results
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 glass-card p-4 rounded-xl">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {apiResult?.disclaimer ||
                "These results are for educational purposes only and do not constitute medical advice. Always consult a qualified healthcare professional."}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;
