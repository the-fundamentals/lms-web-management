import { Receipt, XIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/shared/lib/cn";
import { InvoiceDetail } from "./invoice-detail";

type InvoiceDetailSheetProps = {
  classroomId: string;
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Invoice detail as a centered modal — list stays underneath. */
export function InvoiceDetailSheet({
  classroomId,
  invoiceId,
  open,
  onOpenChange,
}: InvoiceDetailSheetProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className={cn(
          "flex max-h-[85dvh] w-[min(100%-2rem,36rem)] min-w-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-[36rem]",
        )}
        data-testid="invoice-detail-sheet"
        onCloseAutoFocus={(event) => event.preventDefault()}
        showCloseButton={false}
      >
        <div className="relative shrink-0 border-b border-border/80 bg-muted/15">
          <DialogClose
            className="absolute top-3 right-3 z-10 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            data-testid="invoice-detail-close"
          >
            <span className="flex size-8 items-center justify-center">
              <XIcon />
            </span>
            <span className="sr-only">Close</span>
          </DialogClose>

          <DialogHeader className="gap-0 px-5 py-3 pr-14 text-left">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Receipt aria-hidden className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <DialogTitle className="type-secondary font-medium leading-none text-foreground">
                  Invoice
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Review lines, approve, mark paid, or cancel.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {open && invoiceId ? (
            <InvoiceDetail
              classroomId={classroomId}
              embedded
              invoiceId={invoiceId}
              key={invoiceId}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
