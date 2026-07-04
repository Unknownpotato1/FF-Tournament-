export const TOURNAMENT_TYPES = {
  "1v1": "1 vs 1 Clash Squad",
  "2v2": "2 vs 2 Clash Squad",
} as const;

export const PAYMENT_STATUS = {
  pending: "Pending Verification",
  approved: "Approved",
  rejected: "Rejected",
} as const;

export const TOURNAMENT_STATUS = {
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export const NOTIFICATION_TYPES = {
  payment_approved: "Payment Approved",
  payment_rejected: "Payment Rejected",
  tournament_registered: "Tournament Registered",
  room_published: "Room Details Published",
  match_starting: "Match Starting Soon",
  tournament_completed: "Tournament Completed",
} as const;

// Default UPI ID for demo - replace via /admin/settings in production
export const DEFAULT_UPI_ID = "fftournament@upi";
export const DEFAULT_PAYEE_NAME = "FF Tournament";

// Demo announcements shown on homepage marquee
export const DEFAULT_ANNOUNCEMENTS = [
  "🔥 Registrations Open Now",
  "🏆 Daily Free Fire Clash Squad Tournaments",
  "🎮 New 2v2 Tournament Available",
  "⭐ Winners Paid Daily",
  "💰 Entry Fee Only ₹20",
];

// Trust cards content
export const TRUST_CARDS = [
  {
    icon: "ShieldCheck",
    title: "Secure Google Login",
    description:
      "Authenticate safely with Google OAuth. We never store passwords — your account stays protected with industry-grade encryption.",
  },
  {
    icon: "Zap",
    title: "Fast Verification",
    description:
      "Our admin team verifies payment screenshots within 15-30 minutes so you can join matches quickly without long waits.",
  },
  {
    icon: "Scale",
    title: "Fair Play Rules",
    description:
      "Strict anti-cheat policies ensure every tournament is balanced. Hackers are banned instantly and prizes redistributed fairly.",
  },
  {
    icon: "Wallet",
    title: "Transparent Prize Distribution",
    description:
      "Winners receive cash prizes directly via UPI within 24 hours of match completion. Full payment history available in dashboard.",
  },
  {
    icon: "Trophy",
    title: "Trusted Tournament Hosts",
    description:
      "Experienced Free Fire tournament hosts manage every match with professionalism. Join 10,000+ players who trust FF Tournament.",
  },
  {
    icon: "Headphones",
    title: "Quick Support",
    description:
      "24/7 Telegram & Instagram support for any issues. Average response time under 10 minutes during tournament hours.",
  },
];

// How It Works steps
export const HOW_IT_WORKS_STEPS = [
  { step: 1, title: "Login with Google", icon: "LogIn", description: "Sign in securely using your Google account. No password needed." },
  { step: 2, title: "Choose Tournament", icon: "Gamepad2", description: "Browse active 1v1 or 2v2 Clash Squad tournaments and pick one." },
  { step: 3, title: "Pay Entry Fee", icon: "CreditCard", description: "Scan the UPI QR code and pay the entry fee to the official account." },
  { step: 4, title: "Upload Screenshot & UTR", icon: "Upload", description: "Submit your payment screenshot and UTR number for verification." },
  { step: 5, title: "Wait for Verification", icon: "Clock", description: "Admin verifies your payment within 15-30 minutes. Status: Pending." },
  { step: 6, title: "Receive Room ID & Password", icon: "Key", description: "Once approved, room ID and password are unlocked in your dashboard." },
  { step: 7, title: "Play Match", icon: "Swords", description: "Join the custom room with the provided credentials and play your match." },
  { step: 8, title: "Winner Gets Prize", icon: "Trophy", description: "Winner receives cash prize via UPI within 24 hours. Leaderboard updated!" },
];

// FAQ content
export const FAQS = [
  {
    q: "How does payment verification work?",
    a: "After you pay the entry fee via UPI and submit the screenshot + UTR number, our admin team manually reviews the submission. Verification typically takes 15-30 minutes during tournament hours. You'll receive a notification once your payment is approved or rejected. Approved players automatically receive room credentials in their dashboard.",
  },
  {
    q: "How are room details shared?",
    a: "Room ID and Password are only visible to players whose payment has been approved. Once the admin publishes room details (usually 15 minutes before match start), approved players can view the credentials in their User Dashboard under 'Upcoming Matches'. Never share these credentials with non-registered players.",
  },
  {
    q: "What is the prize distribution process?",
    a: "After the tournament is marked completed by admin, the winner is selected and the prize amount is entered. The winner receives the cash prize via UPI within 24 hours. The leaderboard and prize history are updated automatically. You can view all your winnings in the 'Prize History' section of your dashboard.",
  },
  {
    q: "What are the tournament rules?",
    a: "All tournaments follow strict fair-play rules: no hacking, no teaming in solo modes, no emulator players in mobile-only tournaments, and no account sharing. Players must join the room 5 minutes before start time. Violations result in immediate disqualification without refund. Full rules are displayed on each tournament details page.",
  },
  {
    q: "How can I contact support?",
    a: "You can reach our support team 24/7 via Telegram (@fftournament_support) or Instagram (@ff.tournament.india). For urgent match-related issues, message us on Telegram for the fastest response. You can also use the Contact Support link in the footer to send us an email.",
  },
  {
    q: "Can I get a refund if I lose?",
    a: "Entry fees are non-refundable once your payment is approved and you've been assigned a slot. Refunds are only issued if a tournament is cancelled by the admin, in which case all approved players receive a full refund to their original UPI account within 48 hours.",
  },
];

// Stats for the homepage counters (these are demo values, real counts come from API)
export const DEMO_STATS = {
  registeredPlayers: 12480,
  matchesPlayed: 3420,
  winners: 1280,
  prizePool: 285000,
};
