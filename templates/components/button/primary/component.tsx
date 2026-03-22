import { type ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Button({
  children,
  onClick,
  href,
  variant = "solid",
  size = "md",
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97]";

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  const variants = {
    solid:
      "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-600",
    outline:
      "border border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus-visible:ring-indigo-600",
  };

  const classes = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
