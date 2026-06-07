export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.15] blur-3xl"
        style={{ background: "#3b82f6" }}
      />
      <div
        className="absolute top-1/3 -right-48 w-[600px] h-[600px] rounded-full opacity-[0.12] blur-3xl"
        style={{ background: "#6366f1" }}
      />
      <div
        className="absolute -bottom-32 left-1/3 w-[550px] h-[550px] rounded-full opacity-[0.10] blur-3xl"
        style={{ background: "#4f46e5" }}
      />
    </div>
  );
}
