import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

const LINKS = [
  { label: "How it works", id: "how" },
  { label: "Features", id: "features" },
  { label: "Glimpse", id: "showcase" },
];

export function LandingNav({
  signedIn,
  onCta,
}: {
  signedIn: boolean | null;
  onCta: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <div
        className={cn(
          "flex w-full max-w-6xl items-center justify-between rounded-full px-3 py-2.5 transition-all duration-500",
          scrolled ? "glass-dark pl-5" : "border border-transparent",
        )}
      >
        <Link to="/" aria-label="Hearth home" className="pl-1">
          <span className="inline-flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[oklch(0.72_0.18_288)] shadow-[0_0_12px_oklch(0.66_0.2_288/0.9)]" />
            <span className="text-lg font-semibold tracking-tight text-foreground">Hearth</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {signedIn ? (
              <MagneticButton
                key="open"
                onClick={onCta}
                className="btn-glow inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-semibold"
              >
                Open Hearth <ArrowRight className="h-4 w-4" />
              </MagneticButton>
            ) : (
              <>
                <button
                  onClick={onCta}
                  className="hidden rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                >
                  Sign in
                </button>
                <MagneticButton
                  key="start"
                  onClick={onCta}
                  className="btn-glow inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-semibold"
                >
                  Get started <ArrowRight className="h-4 w-4" />
                </MagneticButton>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
