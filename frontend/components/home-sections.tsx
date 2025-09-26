"use client";

import Link from "next/link";
import { motion, Variants, Transition } from "framer-motion";

// 🔹 Framer Motion Base Variants

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const springTransition: Transition = { type: "spring", stiffness: 100 };

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: springTransition },
};

// 🔹 Categories Row (Interactive Buttons)
export function CategoriesRow() {
  const cats = [
    { k: "city", label: "City Stays" },
    { k: "beach", label: "Beachfront" },
    { k: "mountain", label: "Mountain" },
    { k: "work", label: "Work Remote" },
    { k: "family", label: "Family" },
  ];

  return (
    <div className="flex justify-center py-8 md:py-12">
      <motion.div
        className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-7xl"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {cats.map((c) => (
          <motion.button
            key={c.k}
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 8px 30px rgba(6, 182, 212, 0.4)",
            }}
            whileTap={{ scale: 0.98 }}
            className="
              rounded-full 
              border border-slate-700/50
              bg-slate-800
              px-6 py-3 
              text-sm font-medium text-white
              shadow-xl shadow-slate-900/50
              transition-all duration-300 ease-in-out 
              hover:border-teal-400
              hover:bg-gradient-to-r hover:from-teal-600 hover:to-emerald-700
            "
          >
            {c.label}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

// 🔹 How It Works (Process Flow)
export function HowItWorks() {
  const steps = [
    { t: "1. Search & Discover", d: "Find verified stays with escrowed deposits for guaranteed security." },
    { t: "2. Pre-Book & Lock-in", d: "Reserve your stay with a small fee, granting you the option to re-rent the NFT key." },
    { t: "3. Final Book & Check-In", d: "Complete your payment, receive your unique NFT key, and enjoy a seamless check-in experience." },
  ];

  return (
    <motion.div
      className="py-12 md:py-20 px-4 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {steps.map((s, i) => (
        <motion.div
          key={s.t}
          variants={itemVariants}
          whileHover={{ y: -6, scale: 1.01, boxShadow: "0 10px 40px rgba(20, 250, 150, 0.2)" }}
          className="
            rounded-3xl 
            bg-slate-900/70 
            p-8 shadow-2xl shadow-slate-950 
            border-t border-teal-500/30
            transition-all duration-300
          "
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold text-xl shadow-lg shadow-emerald-500/30">
            {i + 1}
          </div>
          <div className="font-bold text-white text-xl mt-3 tracking-tight">{s.t}</div>
          <div className="text-base text-slate-300 mt-2 leading-relaxed">{s.d}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// 🔹 CTA Banner (Hero Style)
export function CtaBanner() {
  return (
    <div className="flex justify-center my-12 md:my-24 px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 50 }}
        className="rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-800 text-white shadow-3xl shadow-emerald-900/50 py-16 px-8 mx-auto max-w-6xl w-full"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              Become a Rebnb Host
            </h2>
            <p className="text-xl opacity-90 font-light">
              Earn more with decentralized escrow, secure vaults, and the revolutionary re-rent market.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="
              inline-block
              rounded-full bg-white text-teal-800 
              px-10 py-4 text-lg font-bold shadow-lg 
              transition-all duration-300 
              hover:bg-teal-50 hover:shadow-xl hover:scale-[1.02]
              w-fit
            "
          >
            Get Started Today
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// 🔹 Full Hero Section Layout
export function HomeHeroSection() {
  return (
    <section className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/90 overflow-hidden relative">
      <div className="pt-20">
        <CategoriesRow />
      </div>
      {/* StatsStrip component should be imported and used here if needed */}
      <HowItWorks />
      <CtaBanner />
      {/* Optional: Add a subtle background glow for extra effect */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-teal-900/10 mix-blend-lighten pointer-events-none"></div>
    </section>
  );
}
