const StatCell = ({ icon, value, label }) => (
  <div className="flex items-start gap-2">
    <span className="text-slate-500 mt-0.5 shrink-0">{icon}</span>
    <div className="flex flex-col">
      <div className="text-sm font-semibold leading-tight text-white/90">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
    </div>
  </div>
);

export default StatCell;
