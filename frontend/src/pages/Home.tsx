import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-network.jpg";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"; // e.g., http://localhost:8000

const Home = () => {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;

    setIsAnalyzing(true);
    setErrorMsg(null);

    // Optional: timeout/abort for slow networks
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 30_000); // 30s

    try {
      const res = await fetch(`${API_BASE}/symptom-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // Try to read backend error detail
        let detail = "Request failed";
        try {
          const err = await res.json();
          detail = err?.detail || detail;
        } catch (_) { /* empty */ }
        throw new Error(`${res.status} ${res.statusText}: ${detail}`);
      }

      const data = await res.json();

      // Navigate to results page with both input & output
      navigate("/results", {
        state: {
          symptoms,
          result: data, // { conditions: [...], disclaimer: "..." }
        },
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setErrorMsg("The request took too long and was aborted. Please try again.");
      } else {
        setErrorMsg(err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      clearTimeout(t);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background"></div>
        </div>

        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/3 w-72 h-72 bg-secondary/20 rounded-full blur-3xl"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full mb-6"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium gradient-text">
                AI-Powered Medical Insights
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="gradient-text">Understand Your Symptoms</span>
              <br />
              <span className="text-foreground">Smarter & Safer</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Describe what you're experiencing and get AI-powered insights about possible conditions,
              recommended actions, and when to seek medical care.
            </p>

            {/* Symptom Input Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="glass-card p-8 space-y-6 max-w-2xl mx-auto"
            >
              <div className="space-y-2">
                <label htmlFor="symptoms" className="text-sm font-medium text-foreground">
                  Describe your symptoms
                </label>
                <Textarea
                  id="symptoms"
                  placeholder="e.g., headache, sore throat, mild fever, fatigue for 2 days..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="min-h-[150px] bg-background/50 border-primary/20 focus:border-primary/40 resize-none text-base"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={!symptoms.trim() || isAnalyzing}
                size="lg"
                className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-primary-foreground font-semibold text-lg h-14 rounded-xl shadow-[0_0_30px_hsla(210,100%,68%,0.4)] hover:shadow-[0_0_40px_hsla(210,100%,68%,0.6)] transition-all duration-300"
              >
                {isAnalyzing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                    </motion.div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Check Symptoms
                  </>
                )}
              </Button>

              {errorMsg && (
                <div className="text-left text-sm text-red-500 mt-2">
                  {errorMsg}
                </div>
              )}
            </motion.div>

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex items-start gap-3 glass-card p-4 rounded-xl max-w-2xl mx-auto"
            >
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground text-left">
                <strong className="text-foreground">Educational purposes only.</strong> This tool is not a medical diagnosis.
                Always consult a healthcare professional for medical advice.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
