import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}

export function Card({ children, className, accent = false }: CardProps) {
  return (
    <div
      className={cn(
        "relative bg-[#111827] rounded-xl border border-white/5 p-5 overflow-hidden",
        accent && "border-l-0 pl-5",
        className
      )}
    >
      {accent && (
        <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[#06b6d4] to-[#8b5cf6] rounded-l-xl" />
      )}
      {children}
    </div>
  );
}
