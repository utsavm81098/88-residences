import { cn } from "@/lib/utils";

const Icon = ({ icon, className }) => {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: icon || "" }}
      className={cn("flex text-black size-4", className)}
    />
  );
};

export default Icon;
