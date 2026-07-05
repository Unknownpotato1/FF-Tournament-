"use client";

import { motion } from "framer-motion";

export function TopBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full pt-16 md:pt-18"
    >
      <div className="relative w-full overflow-hidden">
        <img
          src="/banner.png?v=2"
          alt="FF Tournament Banner"
          className="w-full h-auto object-cover"
          style={{
            width: "100%",
            display: "block",
          }}
        />
        {/* Subtle gradient overlay at bottom for smooth transition into hero */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#050507] to-transparent pointer-events-none" />
      </div>
    </motion.section>
  );
}
