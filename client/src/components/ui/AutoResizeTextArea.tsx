"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea, TextareaProps } from "@/components/ui/textarea";

// Modified Textarea component with auto-resize functionality
const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Handle auto-resize logic
    const adjustHeight = React.useCallback(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, []);

    React.useEffect(() => {
      adjustHeight();
      // Add resize listener for edge cases
      window.addEventListener("resize", adjustHeight);
      return () => window.removeEventListener("resize", adjustHeight);
    }, [adjustHeight, value]);

    return (
      <Textarea
        ref={(node) => {
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
          if (node) textareaRef.current = node;
        }}
        className={cn(
          "resize-none overflow-hidden", // Disable manual resize and hide overflow
          "min-h-[20px]", // Match original Input component height (h-9 = 36px)
          className
        )}
        value={value}
        onChange={(e) => {
          adjustHeight();
          onChange?.(e);
        }}
        {...props}
      />
    );
  }
);

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export { AutoResizeTextarea };