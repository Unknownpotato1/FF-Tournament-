"use client";

import { DEFAULT_ANNOUNCEMENTS } from "@/lib/constants";

export function AnnouncementBar() {
  // Duplicate the list so the marquee loops seamlessly
  const items = [...DEFAULT_ANNOUNCEMENTS, ...DEFAULT_ANNOUNCEMENTS];

  return (
    <div className="relative border-y border-[#00ff9d]/20 bg-gradient-to-r from-[#00ff9d]/5 via-transparent to-[#ff6b1a]/5 overflow-hidden">
      <div className="marquee-container relative">
        <div className="flex whitespace-nowrap animate-marquee py-2.5">
          {items.map((text, i) => (
            <span
              key={i}
              className="text-sm font-semibold text-white/90 mx-6 inline-flex items-center gap-2"
            >
              <span className="w-1 h-1 rounded-full bg-[#00ff9d]" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
