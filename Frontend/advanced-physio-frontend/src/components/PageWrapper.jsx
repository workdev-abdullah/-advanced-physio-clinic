import { motion } from "framer-motion";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -12,
  },
};

const pageTransition = {
  duration: 0.25,
  ease: "easeOut",
};

export default function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="min-h-[calc(100vh-140px)]"
    >
      {children}
    </motion.div>
  );
}
