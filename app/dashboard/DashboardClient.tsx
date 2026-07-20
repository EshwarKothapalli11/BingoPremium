"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";
import { JoinRoomModal } from "@/components/lobby/JoinRoomModal";
import { useActiveRooms, usePlayerHistory } from "@/hooks/useRoom";
import type { Profile } from "@/types";
import { motion, useAnimation, animate, type Variants } from "framer-motion";

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate(val) {
        setDisplayValue(Math.round(val));
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
}

export default function DashboardClient({ profile }: { profile: Profile }) {
  const [showJoin, setShowJoin] = useState(false);
  const activeRooms = useActiveRooms();
  const history = usePlayerHistory(profile.id);

  const winRate =
    profile.games_played > 0
      ? Math.round((profile.games_won / profile.games_played) * 100)
      : 0;

  const avgMoves =
    profile.games_played > 0
      ? Math.round(profile.total_moves / profile.games_played)
      : 0;

  const stats = [
    { label: "Games Played", value: profile.games_played, delay: 0.1 },
    { label: "Games Won", value: profile.games_won, delay: 0.2 },
    { label: "Win Rate", value: winRate, suffix: "%", delay: 0.3 },
    { label: "Avg Moves", value: avgMoves, delay: 0.4 },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50, damping: 20 } },
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-6xl mx-auto relative z-10">
      <Navbar profile={profile} />

      <motion.div 
        className="text-center mt-12 mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-primary to-slate-700">
          Play Multiplayer Bingo
        </h1>
        <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto">Join your friends in real-time or create a new room to start playing.</p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants} whileHover={{ y: -5 }}>
            <GlassCard className="p-6 text-center transition-all duration-300 shadow-sm border border-white hover:shadow-md">
              <p className="text-4xl font-black text-primary mb-2">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        className="flex flex-wrap justify-center gap-6 mb-16"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Link href="/dashboard/create">
          <BingoButton size="lg" className="px-10 py-5 text-xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30">
            Create New Room
          </BingoButton>
        </Link>
        <BingoButton size="lg" variant="secondary" onClick={() => setShowJoin(true)} className="px-10 py-5 text-xl font-bold">
          Join with Code
        </BingoButton>
      </motion.div>

      <motion.div 
        className="grid lg:grid-cols-2 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <GlassCard className="p-8 h-full shadow-sm">
            <h2 className="font-extrabold text-2xl mb-6 text-slate-900">Active Rooms</h2>
            {activeRooms.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No active rooms right now. Create one!</p>
            ) : (
              <div className="space-y-4">
                {activeRooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/room/${room.code}`}
                    className="group flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">{room.name}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Code: <span className="text-slate-700 font-mono font-semibold">{room.code}</span> · {room.player_count}/{room.max_players} players
                      </p>
                    </div>
                    <span className={`text-sm font-bold px-4 py-2 rounded-xl capitalize shadow-sm border ${room.status === 'playing' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {room.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="p-8 h-full shadow-sm">
            <h2 className="font-extrabold text-2xl mb-6 text-slate-900">Your History</h2>
            {history.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No games played yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-slate-500 text-sm uppercase tracking-wider">
                      <th className="pb-4 font-semibold px-4">Room</th>
                      <th className="pb-4 font-semibold px-4">Result</th>
                      <th className="pb-4 font-semibold px-4">Moves</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <motion.tr 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className={`transition-colors rounded-xl overflow-hidden shadow-sm ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100`}
                      >
                        <td className="py-4 px-4 text-slate-800 font-medium rounded-l-xl border-y border-l border-slate-100">{h.room_name}</td>
                        <td className={`py-4 px-4 font-bold border-y border-slate-100 ${h.result === "Won" ? "text-emerald-600" : "text-slate-500"}`}>
                          {h.result}
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-mono rounded-r-xl border-y border-r border-slate-100">{h.moves}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>

      {showJoin && <JoinRoomModal onClose={() => setShowJoin(false)} />}
    </div>
  );
}
