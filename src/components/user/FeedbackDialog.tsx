import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FeedbackForm } from "@/components/user/FeedbackForm";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  onSubmitted?: () => void;
}

export function FeedbackDialog({ open, onOpenChange, placeholder, onSubmitted }: FeedbackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <FeedbackForm
            placeholder={placeholder}
            onSubmitted={() => {
              onSubmitted?.();
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
