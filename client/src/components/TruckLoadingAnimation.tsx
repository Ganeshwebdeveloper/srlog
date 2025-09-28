import { Truck, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface TruckLoadingAnimationProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TruckLoadingAnimation({ 
  text = "Loading...", 
  size = "md",
  className 
}: TruckLoadingAnimationProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)} data-testid="truck-loading-animation">
      <div className="relative flex items-center justify-center">
        {/* Road line */}
        <div className="absolute bottom-0 h-0.5 w-24 bg-gradient-to-r from-transparent via-muted-foreground to-transparent opacity-50">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
        </div>
        
        {/* Animated truck */}
        <div className="relative animate-bounce">
          <Truck 
            className={cn(
              sizeClasses[size], 
              "text-primary animate-pulse"
            )} 
            data-testid="truck-icon"
          />
          
          {/* Cargo packages */}
          <div className="absolute -top-1 -right-1 flex space-x-0.5">
            <Package className="w-2 h-2 text-muted-foreground animate-pulse delay-100" />
            <Package className="w-2 h-2 text-muted-foreground animate-pulse delay-200" />
          </div>
        </div>
        
        {/* Loading dots */}
        <div className="absolute -bottom-4 flex space-x-1">
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce delay-100" />
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce delay-200" />
        </div>
      </div>
      
      {/* Loading text */}
      <div className={cn(
        "text-muted-foreground font-medium animate-pulse",
        textSizeClasses[size]
      )} data-testid="loading-text">
        {text}
      </div>
    </div>
  );
}

// Compact version for inline loading states
interface TruckSpinnerProps {
  size?: "sm" | "md";
  className?: string;
}

export function TruckSpinner({ size = "sm", className }: TruckSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6"
  };

  return (
    <div className={cn("inline-flex items-center", className)} data-testid="truck-spinner">
      <Truck 
        className={cn(
          sizeClasses[size], 
          "text-primary animate-spin"
        )}
        data-testid="spinner-truck-icon"
      />
    </div>
  );
}

// Page-level loading component
interface TruckPageLoadingProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function TruckPageLoading({ 
  title = "Loading Transportation Data", 
  subtitle = "Please wait while we fetch your logistics information...",
  className 
}: TruckPageLoadingProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[60vh] p-8",
      className
    )} data-testid="truck-page-loading">
      <TruckLoadingAnimation size="lg" text="" />
      
      <div className="mt-6 text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground" data-testid="loading-title">
          {title}
        </h2>
        <p className="text-muted-foreground max-w-md" data-testid="loading-subtitle">
          {subtitle}
        </p>
      </div>
      
      {/* Progress indicator */}
      <div className="mt-8 w-48 h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full" 
             style={{ 
               animation: 'loadingProgress 2s ease-in-out infinite'
             }} />
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes loadingProgress {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `
      }} />
    </div>
  );
}