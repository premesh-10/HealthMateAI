import { motion } from "framer-motion";
import { Shield, Brain, Lock, ExternalLink, Zap, Heart } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

const About = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning models trained on medical literature to provide accurate symptom assessments.",
    },
    {
      icon: Shield,
      title: "Educational Purpose",
      description: "Designed to help you understand your symptoms better, not replace professional medical advice.",
    },
    {
      icon: Lock,
      title: "Privacy First",
      description: "No personal information stored. Your health data remains anonymous and secure.",
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get comprehensive analysis in seconds, helping you make informed decisions about your health.",
    },
  ];

  const trustedSources = [
    { name: "Centers for Disease Control (CDC)", url: "https://www.cdc.gov" },
    { name: "World Health Organization (WHO)", url: "https://www.who.int" },
    { name: "National Health Service (NHS)", url: "https://www.nhs.uk" },
    { name: "Mayo Clinic", url: "https://www.mayoclinic.org" },
  ];

  return (
    <div className="min-h-screen pb-12">
      <div className="container mx-auto px-4 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto space-y-16"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 mb-4"
            >
              <img src={logo} alt="Logo" className="h-16 w-16 rounded-2xl" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              About HealthMate AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your intelligent companion for understanding health symptoms through the power of artificial intelligence
            </p>
          </div>

          {/* Mission Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-8 text-center space-y-4"
          >
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              We believe everyone deserves access to reliable health information. HealthMate AI uses cutting-edge 
              artificial intelligence to help you understand your symptoms, recognize warning signs, and make 
              informed decisions about when to seek medical care. We're here to educate and empower, never to replace 
              the vital relationship between you and your healthcare provider.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="glass-card glass-card-hover p-6 space-y-4"
              >
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card p-8 space-y-6"
          >
            <h2 className="text-2xl font-semibold text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground font-bold text-lg">
                  1
                </div>
                <h3 className="font-semibold">Describe Symptoms</h3>
                <p className="text-sm text-muted-foreground">
                  Tell us what you're experiencing in your own words
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-secondary-glow text-primary-foreground font-bold text-lg">
                  2
                </div>
                <h3 className="font-semibold">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes patterns and medical knowledge
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-glow text-primary-foreground font-bold text-lg">
                  3
                </div>
                <h3 className="font-semibold">Get Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Receive possible conditions and next steps
                </p>
              </div>
            </div>
          </motion.div>

          {/* Animated Infographic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="glass-card p-12 relative overflow-hidden"
          >
            <div className="relative z-10 text-center space-y-6">
              <Heart className="h-16 w-16 text-primary mx-auto animate-pulse" />
              <h3 className="text-2xl font-semibold">Your Health, Your Data</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We take your privacy seriously. All analyses are performed anonymously, and we never store 
                personally identifiable information. Your health journey stays between you and your healthcare providers.
              </p>
            </div>
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
              />
            </div>
          </motion.div>

          {/* Trusted Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="glass-card p-8 space-y-6"
          >
            <h2 className="text-2xl font-semibold text-center">Built on Trusted Medical Sources</h2>
            <p className="text-muted-foreground text-center">
              Our AI is trained on data from world-renowned health organizations
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {trustedSources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-4 hover:border-primary/40 transition-all duration-300 flex items-center justify-between group"
                >
                  <span className="font-medium">{source.name}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Important Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="glass-card border-primary/30 p-8 space-y-4"
          >
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Important Safety Information</h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Not a Medical Diagnosis:</strong> HealthMate AI is an educational 
                    tool and does not provide medical diagnoses. Results should never replace professional medical advice.
                  </p>
                  <p>
                    <strong className="text-foreground">When to Seek Help:</strong> If you experience severe symptoms, 
                    sudden changes, or life-threatening conditions, always seek immediate medical attention.
                  </p>
                  <p>
                    <strong className="text-foreground">Consult Healthcare Providers:</strong> Always discuss your symptoms 
                    and health concerns with qualified medical professionals who can perform proper examinations and tests.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={() => window.location.href = "/"}
              size="lg"
              className="bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-primary-foreground"
            >
              Try Symptom Checker
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
