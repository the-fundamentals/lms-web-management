import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClassroomRow } from "../lib/classroom-api";
import { ClassroomRename } from "./classroom-rename";

type ClassroomSettingsProps = {
  classroom: ClassroomRow;
  onRenamed: (next: ClassroomRow) => void;
};

/** General settings pane — classroom name. */
export function ClassroomSettings({ classroom, onRenamed }: ClassroomSettingsProps) {
  const [renaming, setRenaming] = useState(false);

  return (
    <div className="flex flex-col gap-5" data-testid="settings-general">
      <header className="flex flex-col gap-1">
        <p className="font-medium text-foreground">General</p>
        <p className="type-secondary text-muted-foreground">
          Name and basic classroom identity.
        </p>
      </header>

      <section className="flex flex-col gap-3" data-testid="settings-rename">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="type-secondary text-muted-foreground">Classroom name</p>
            <p className="font-medium text-foreground">{classroom.name}</p>
          </div>
          <Button
            data-testid="classroom-rename-entry"
            onClick={() => setRenaming((open) => !open)}
            size="sm"
            type="button"
            variant={renaming ? "secondary" : "outline"}
          >
            <Pencil aria-hidden />
            {renaming ? "Close" : "Rename"}
          </Button>
        </div>
        {renaming ? (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <ClassroomRename
              classroom={classroom}
              onRenamed={(next) => {
                onRenamed(next);
                setRenaming(false);
              }}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
