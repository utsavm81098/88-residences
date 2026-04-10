const StatCell = ({ icon: Icon, value, label }) => (
  <div className="flex items-start gap-2 text-white">
    <span className="text-slate-500 mt-1 shrink-0">
      {Icon}
    </span>
    <div className="flex flex-col">
      <div className="text-sm font-semibold leading-tight">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
    </div>
  </div>
);

export default StatCell;
