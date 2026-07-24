import { motion, useAnimationControls } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useEffect, type ReactNode } from "react";

type Tone = "primary" | "success" | "critical" | "medium";

const toneRing: Record<Tone, string> = {
  primary: "ring-primary/40 bg-primary/15",
  success: "ring-success/40 bg-success/15",
  critical: "ring-critical/40 bg-critical/15",
  medium: "ring-medium/40 bg-medium/15",
};
const toneText: Record<Tone, string> = {
  primary: "text-primary",
  success: "text-success",
  critical: "text-critical",
  medium: "text-medium",
};
const toneBlob: Record<Tone, string> = {
  primary: "bg-primary/40",
  success: "bg-success/40",
  critical: "bg-critical/40",
  medium: "bg-medium/40",
};

const sizeMap = {
  sm: { box: "h-8 w-8 rounded-md", icon: "h-4 w-4" },
  md: { box: "h-10 w-10 rounded-lg", icon: "h-5 w-5" },
  lg: { box: "h-12 w-12 rounded-xl", icon: "h-6 w-6" },
};

/**
 * Cuberto-style animated icon tile.
 * - Springy bounce on hover
 * - Icon flips + wobbles, tinted blob expands behind it
 * - `autoplay` triggers the same effect on mount (for scroll-in reveals)
 */
export function AnimatedIcon({
  icon: Icon,
  tone = "primary",
  size = "md",
  autoplay = false,
  trigger,
  className = "",
  children,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: keyof typeof sizeMap;
  autoplay?: boolean;
  /** change this value to replay the animation (e.g. on data update) */
  trigger?: string | number;
  className?: string;
  children?: ReactNode;
}) {
  const controls = useAnimationControls();
  const blob = useAnimationControls();
  const s = sizeMap[size];

  const play = async () => {
    blob.start({
      scale: [0, 1.4, 1],
      opacity: [0, 0.9, 0],
      transition: { duration: 0.6, ease: "easeOut" },
    });
    await controls.start({
      scale: [1, 0.7, 1.15, 1],
      rotate: [0, -18, 12, 0],
      y: [0, -3, 1, 0],
      transition: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] },
    });
  };

  useEffect(() => {
    if (autoplay || trigger !== undefined) void play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, trigger]);

  return (
    <motion.div
      onHoverStart={() => void play()}
      onTap={() => void play()}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
      className={`relative grid ${s.box} place-items-center ring-1 ${toneRing[tone]} ${className}`}
    >
      <motion.span
        animate={blob}
        initial={{ scale: 0, opacity: 0 }}
        className={`pointer-events-none absolute inset-0 rounded-[inherit] ${toneBlob[tone]} blur-md`}
      />
      <motion.div animate={controls} className="relative">
        <Icon className={`${s.icon} ${toneText[tone]}`} />
      </motion.div>
      {children}
    </motion.div>
  );
}
