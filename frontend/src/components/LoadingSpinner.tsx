import { Activity } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner = ({ text = "Analyzing symptoms..." }: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-xl opacity-50 animate-pulse-glow"></div>
        <div className="relative p-6 rounded-full bg-gradient-to-br from-primary via-secondary to-accent animate-spin-slow">
          <Activity className="h-12 w-12 text-primary-foreground animate-pulse" />
        </div>
      </div>
      <p className="text-lg font-medium gradient-text animate-pulse">
        {text}
      </p>
    </div>
  );
};

export default LoadingSpinner;
