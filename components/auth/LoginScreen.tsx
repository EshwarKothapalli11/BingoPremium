import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";
import { motion } from "framer-motion";

interface LoginScreenProps {
  onLogin: (name: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    
    if (!trimmed) {
      setError("Name cannot be empty");
      return;
    }
    if (trimmed.length < 3) {
      setError("Name must be at least 3 characters");
      return;
    }
    if (trimmed.length > 20) {
      setError("Name must be less than 20 characters");
      return;
    }
    
    setError("");
    onLogin(trimmed);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 text-center backdrop-blur-2xl">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-4xl font-extrabold shadow-lg shadow-primary/30">
              B
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
            BINGO
          </h1>
          <p className="text-slate-500 mb-8 font-medium">Enter your name to start playing</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Your Name (e.g. Eshwar)"
                className="w-full px-5 py-4 rounded-xl bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg placeholder-slate-400 text-slate-800 font-medium shadow-sm"
                autoFocus
              />
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-6 left-2 text-sm text-red-500 font-medium"
                >
                  {error}
                </motion.p>
              )}
            </div>
            
            <BingoButton type="submit" className="w-full py-4 text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40">
              Start Playing
            </BingoButton>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
