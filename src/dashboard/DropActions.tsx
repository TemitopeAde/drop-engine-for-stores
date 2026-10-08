import { IconButton, PopoverMenu } from "@wix/design-system";
import { More } from "@wix/wix-ui-icons-common/lazy";
import { useRef } from "react";
import type { Drop } from "../domain/drop";
import { t } from "../locales/en";
import type { Command } from "./api";

interface Props {
  drop: Drop;
  busy: boolean;
  edit: () => void;
  action: (command: Command["action"]) => void;
}

export function DropActions({ drop, busy, edit, action }: Props) {
  const closeMenu = useRef<(() => void) | null>(null);
  function run(callback: () => void) {
    closeMenu.current?.();
    callback();
  }
  const statusAction =
    drop.status === "PUBLISHED"
      ? "cancel"
      : drop.status === "ARCHIVED"
        ? "restore"
        : "archive";

  return (
    <PopoverMenu
      placement="bottom-end"
      appendTo="window"
      showArrow={false}
      triggerElement={({ toggle, close }) => (
        <IconButton
          ariaLabel={`${t("actions")}: ${drop.name}`}
          disabled={busy}
          onClick={() => {
            closeMenu.current = close;
            toggle();
          }}
        >
          <More />
        </IconButton>
      )}
    >
      <PopoverMenu.MenuItem
        text={t("edit")}
        disabled={busy}
        onClick={() => run(edit)}
      />
      <PopoverMenu.MenuItem
        text={t("duplicate")}
        disabled={busy}
        onClick={() => run(() => action("duplicate"))}
      />
      <PopoverMenu.MenuItem
        text={t(statusAction)}
        disabled={busy}
        skin={statusAction === "cancel" ? "destructive" : "standard"}
        onClick={() => run(() => action(statusAction))}
      />
    </PopoverMenu>
  );
}
