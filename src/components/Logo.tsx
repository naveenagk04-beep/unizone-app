import mark from "@/assets/unizone-mark.svg";
import { cn } from "@/lib/utils";

export function Logo({
  size = "md",
  showWordmark = true,
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
}) {
  const img = { sm: "size-8", md: "size-10", lg: "size-14", xl: "size-20" }[size];
  const text = {
    sm: "text-lg",
    md: "text-[1.35rem]",
    lg: "text-3xl",
    xl: "text-5xl",
  }[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img src={mark} alt="UniZone logo" className={cn(img, "shrink-0")} />
      {showWordmark && (
        <span
          className={cn(
            "uz-gradient-text font-display font-extrabold tracking-[-0.045em]",
            text,
          )}
        >
          UniZone
        </span>
      )}
    </span>
  );
}
