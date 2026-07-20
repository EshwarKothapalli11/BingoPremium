"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function FuturisticBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#F8FAFC]">
      {/* Soft gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#EEF4FF]" />
      
      {/* Parallax Blobs */}
      <motion.div
        animate={{
          x: mousePosition.x * -50,
          y: mousePosition.y * -50,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
        className="absolute inset-0"
      >
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-40 blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(147,197,253,0.8) 0%, rgba(255,255,255,0) 70%)" }} /* Soft blue */
        />
        <div
          className="absolute top-1/4 -right-48 w-[800px] h-[800px] rounded-full opacity-30 blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(196,181,253,0.6) 0%, rgba(255,255,255,0) 70%)" }} /* Soft purple */
        />
        <div
          className="absolute -bottom-64 left-1/4 w-[700px] h-[700px] rounded-full opacity-30 blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(103,232,249,0.7) 0%, rgba(255,255,255,0) 70%)" }} /* Soft cyan */
        />
      </motion.div>

      {/* Floating Glass Shapes */}
      <div className="absolute inset-0 perspective-1000">
        <FloatingShape type="cube" top="10%" left="15%" size={80} delay={0} mousePosition={mousePosition} />
        <FloatingShape type="sphere" top="20%" left="80%" size={120} delay={1.5} mousePosition={mousePosition} />
        <FloatingShape type="ring" top="70%" left="10%" size={150} delay={0.8} mousePosition={mousePosition} />
        <FloatingShape type="cube" top="80%" left="75%" size={60} delay={2.2} mousePosition={mousePosition} />
        <FloatingShape type="sphere" top="40%" left="50%" size={40} delay={3.5} mousePosition={mousePosition} />
      </div>
    </div>
  );
}

function FloatingShape({ 
  type, top, left, size, delay, mousePosition 
}: { 
  type: "cube" | "sphere" | "ring", top: string, left: string, size: number, delay: number, mousePosition: {x: number, y: number} 
}) {
  const shapeStyle = {
    cube: "rounded-2xl rotate-45",
    sphere: "rounded-full",
    ring: "rounded-full border-[8px] border-[#3B82F6]/20 bg-transparent",
  };

  const isRing = type === "ring";

  return (
    <motion.div
      className="absolute"
      style={{ top, left, width: size, height: size }}
      animate={{
        y: ["0%", "-30%", "0%"],
        rotateX: ["0deg", "180deg", "360deg"],
        rotateY: ["0deg", "180deg", "360deg"],
        x: mousePosition.x * 30 * (size / 50),
      }}
      transition={{
        y: { duration: 15 + delay * 2, repeat: Infinity, ease: "easeInOut", delay },
        rotateX: { duration: 25, repeat: Infinity, ease: "linear" },
        rotateY: { duration: 30, repeat: Infinity, ease: "linear" },
        x: { type: "spring", stiffness: 40, damping: 20 },
      }}
    >
      <div 
        className={`w-full h-full backdrop-blur-md ${isRing ? shapeStyle.ring : shapeStyle[type] + ' bg-white/40 border border-white/60 shadow-xl'}`}
        style={{
          boxShadow: isRing ? 'none' : 'inset 0 0 20px rgba(255,255,255,0.8), 0 8px 32px rgba(15,23,42,0.05)',
        }}
      />
    </motion.div>
  );
}
