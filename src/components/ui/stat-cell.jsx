import { memo } from "react";

const StatCell = memo(({ icon: Icon, value, label }) => (
  <div className="flex flex-col items-start gap-0.5 text-current">
    <div className="flex items-center gap-1.5">
      <span className="text-slate-500 shrink-0">{Icon}</span>
      <div className="text-sm font-semibold leading-tight">{value}</div>
    </div>
    <div className="text-[11px] text-slate-500 font-medium normal-case">
      {label}
    </div>
  </div>
));

export default StatCell;
