import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.97] touch-action-manipulation select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-glow",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        game: "gradient-primary text-primary-foreground shadow-md hover:shadow-glow hover:scale-[1.02] font-bold",
        accent: "gradient-accent text-accent-foreground shadow-md hover:shadow-accent-glow hover:scale-[1.02] font-bold",
        success: "bg-success text-success-foreground hover:bg-success/90 hover:shadow-glow",
        section: "bg-card border-2 border-border hover:border-primary hover:shadow-md text-card-foreground transition-all",
        icon: "bg-secondary/50 hover:bg-secondary text-foreground rounded-full",
      },
      size: {
        default: "h-11 px-5 py-2 text-sm [&_svg]:size-4",
        sm: "h-10 rounded-xl px-4 text-sm [&_svg]:size-4",
        lg: "h-12 rounded-xl px-6 text-base [&_svg]:size-5",
        xl: "h-14 rounded-2xl px-8 text-lg font-bold [&_svg]:size-6",
        // Mobile-optimized sizes with larger touch targets
        "mobile": "h-12 px-5 text-base rounded-xl [&_svg]:size-5",
        "mobile-lg": "h-14 px-6 text-lg rounded-2xl font-bold [&_svg]:size-6",
        icon: "h-11 w-11 [&_svg]:size-5",
        "icon-sm": "h-10 w-10 [&_svg]:size-4",
        "icon-lg": "h-12 w-12 [&_svg]:size-6",
        "icon-xl": "h-14 w-14 [&_svg]:size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
