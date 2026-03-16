import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="group inline-flex items-center gap-2.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all backdrop-blur-xl shadow-[0_10px_35px_-22px_rgba(0,0,0,0.7)] bg-[var(--surface-bg)] text-[var(--text-primary)] border-[var(--border-color)] hover:scale-[1.02]"
    >
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 border border-white/15">
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </span>
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
