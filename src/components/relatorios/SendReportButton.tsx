import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { PlanGateButton } from "@/components/plan/PlanGateButton";
import { SendReportDialog, ReportPayloadBase } from "./SendReportDialog";

interface Props {
  payload: ReportPayloadBase;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function SendReportButton({ payload, label = "Enviar", variant = "outline", size = "sm" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PlanGateButton module="financeiro" action="export">
        <Button variant={variant} size={size} onClick={() => setOpen(true)} className="gap-2">
          <Send className="w-3.5 h-3.5" />
          {label}
        </Button>
      </PlanGateButton>
      {open && <SendReportDialog open={open} onOpenChange={setOpen} payload={payload} />}
    </>
  );
}
