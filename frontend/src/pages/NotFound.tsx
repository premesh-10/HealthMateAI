import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8 max-w-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring", delay: 0.2 }}
          className="inline-flex p-8 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20"
        >
          <Search className="h-24 w-24 text-primary" />
        </motion.div>

        <div className="space-y-4">
          <h1 className="text-8xl font-bold gradient-text">404</h1>
          <h2 className="text-3xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground text-lg">
            Looks like this page doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <Button
            onClick={() => window.location.href = "/"}
            size="lg"
            className="bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-primary-foreground"
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
          <Button
            onClick={() => window.location.href = "/about"}
            variant="outline"
            size="lg"
            className="border-primary/30 hover:bg-primary/10"
          >
            Learn More
          </Button>
        </div>

        <div className="glass-card p-6 rounded-xl">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact support or try refreshing the page.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
