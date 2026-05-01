import React from "react";

const HomePage = () => {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-10 relative">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent-yellow/5 blur-[120px] rounded-full" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="px-8 py-3 border border-white/10 rounded-full text-[14px] font-bold tracking-[0.3em] text-white/60">
          COMING SOON
        </div>
      </div>
    </div>
  );
};

export default HomePage;
