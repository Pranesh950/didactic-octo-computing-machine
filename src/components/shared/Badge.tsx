import { cn } from "@/lib/utils";

interface BadgeProps {
  children: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  default: "bg-accent-500/10 text-accent-300 border-accent-500/20",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  neutral: "bg-gray-800 text-gray-300 border-gray-700",
};

export default function Badge({ children, variant = "default", size = "sm", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border font-medium font-mono",
        size === "sm" ? "px-2 py-px text-[10px] rounded" : "px-2.5 py-1 text-xs rounded-md",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
