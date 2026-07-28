export default function CompanyLogo({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-6 h-6 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" };
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`${sizes[size]} rounded-md bg-brand-50 border border-brand-100 flex items-center justify-center font-semibold text-brand-700 flex-shrink-0`}
    >
      {initials}
    </div>
  );
}
