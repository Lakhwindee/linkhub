import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(4px)",
  },
  in: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  out: {
    opacity: 0,
    scale: 1.02,
    filter: "blur(4px)",
  },
};

const pageTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  duration: 0.3,
};

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ width: "100%", willChange: "opacity, transform, filter" }}
    >
      {children}
    </motion.div>
  );
}
