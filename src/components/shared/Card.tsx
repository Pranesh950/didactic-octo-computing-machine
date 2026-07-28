import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export default function Card({ children, className, hover = false, padding = "md", onClick }: CardProps) {
  const paddings = { sm: "p-3.5", md: "p-4", lg: "p-5" };
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-gray-900 border border-gray-800 rounded-lg",
        paddings[padding],
        hover && "card-hover cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}
