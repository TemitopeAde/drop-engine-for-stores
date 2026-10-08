import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { clsx } from "clsx";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "outline" | "ghost" | "danger";
}
// shadcn composition: a ref-forwarding button with Radix Slot support.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        ref={ref}
        className={clsx("de-button", `de-button-${variant}`, className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
