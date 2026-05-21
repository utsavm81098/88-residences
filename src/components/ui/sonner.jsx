import { Toaster as Sonner } from "sonner";
import { CheckCircle2, XCircle, Info, AlertTriangle, Loader2 } from "lucide-react";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="h-5 w-5 !text-emerald-500 flex-shrink-0" />,
        error: <XCircle className="h-5 w-5 !text-rose-500 flex-shrink-0" />,
        info: <Info className="h-5 w-5 !text-blue-500 flex-shrink-0" />,
        warning: <AlertTriangle className="h-5 w-5 !text-amber-500 flex-shrink-0" />,
        loading: <Loader2 className="h-5 w-5 !text-zinc-500 animate-spin flex-shrink-0" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-white !text-zinc-900 !border-zinc-200 !shadow-lg flex items-center gap-3 p-4 rounded-lg",
          description: "!text-zinc-500",
          actionButton:
            "!bg-zinc-900 !text-white",
          cancelButton:
            "!bg-zinc-100 !text-zinc-500",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

