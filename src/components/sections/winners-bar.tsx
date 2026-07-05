"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";

// Pool of common Indian first names + match types + prize amounts
const INDIAN_NAMES = [
  "Rahul", "Amit", "Vikram", "Arjun", "Karan", "Rohit", "Suresh", "Deepak",
  "Sanjay", "Rajesh", "Anil", "Vivek", "Manoj", "Pradeep", "Arun", "Mohit",
  "Priya", "Sneha", "Pooja", "Anjali", "Kavya", "Nisha", "Ritu", "Divya",
  "Ankita", "Shreya", "Meera", "Bhavna", "Kiran", "Sunita", "Ravi", "Ajay",
  "Sachin", "Vijay", "Naveen", "Harish", "Gaurav", "Nikhil", "Varun", "Akash",
  "Faizan", "Imran", "Aryan", "Sameer", "Tariq", "Zubair", "Shoaib", "Aslam",
  "Daniel", "Rinku", "Sonu", "Monu", "Bunty", "Chintu", "Pappu", "Bablu",
];

const MATCH_TYPES = [
  "Clash Squad Solo Showdown",
  "Clash Squad Fatal War",
];

const PRIZE_AMOUNTS = [40, 70];

const STATES = [
  "Delhi", "Mumbai", "Pune", "Bangalore", "Hyderabad", "Chennai", "Kolkata",
  "Jaipur", "Lucknow", "Patna", "Surat", "Kanpur", "Bhopal", "Indore",
  "Nagpur", "Ranchi", "Rajkot", "Vadodara", "Coimbatore", "Vizag",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateWinnerMessage(): { name: string; amount: number; match: string; state: string } {
  return {
    name: pick(INDIAN_NAMES),
    amount: pick(PRIZE_AMOUNTS),
    match: pick(MATCH_TYPES),
    state: pick(STATES),
  };
}

export function WinnersBar() {
  const [winner, setWinner] = useState(() => generateWinnerMessage());
  const [key, setKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setWinner(generateWinnerMessage());
      setKey((k) => k + 1);
    }, 3000); // change every 3 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="relative border-y border-[#00ff9d]/20 bg-gradient-to-r from-[#00ff9d]/8 via-[#0c0c12] to-[#ff6b1a]/8 overflow-hidden">
      {/* Decorative glow strip on left/right */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00ff9d] to-[#ff6b1a]" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#ff6b1a] to-[#00ff9d]" />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center gap-3 py-2.5">
          {/* Icon */}
          <div className="flex-shrink-0 flex items-center gap-1.5">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ffd700] to-[#ff6b1a] flex items-center justify-center glow-orange"
            >
              <Trophy className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
            </motion.div>
            <span className="hidden sm:inline text-[10px] font-black text-[#ffd700] uppercase tracking-[0.2em]">
              Winner
            </span>
          </div>

          {/* Animated winner text */}
          <div className="flex-1 overflow-hidden min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-sm sm:text-base font-semibold text-white truncate flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00ff9d] flex-shrink-0" />
                <span className="text-[#00ff9d] font-bold">{winner.name}</span>
                <span className="text-muted-foreground hidden sm:inline">from {winner.state}</span>
                <span className="text-muted-foreground">won</span>
                <span className="text-[#ff6b1a] font-black">₹{winner.amount.toLocaleString("en-IN")}</span>
                <span className="text-muted-foreground">in {winner.match}</span>
                <span className="text-[#00ff9d] hidden sm:inline">🎉</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Live dot indicator */}
          <div className="flex-shrink-0 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff9d] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff9d]" />
            </span>
            <span className="text-[9px] text-[#00ff9d] font-bold uppercase tracking-wider hidden sm:inline">
              Live
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
