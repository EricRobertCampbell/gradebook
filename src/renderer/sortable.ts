import type { DragEvent } from "react";
import { moveItem } from "../shared/grading-order";

export function setSortDragToken(event: DragEvent, scope: string, token: string): void {
  event.dataTransfer.setData("text/plain", `${scope}:${token}`);
  event.dataTransfer.effectAllowed = "move";
}

export function readSortDragToken(event: DragEvent, scope: string): string | null {
  const raw = event.dataTransfer.getData("text/plain");
  const prefix = `${scope}:`;

  if (!raw.startsWith(prefix)) {
    return null;
  }

  return raw.slice(prefix.length);
}

export function reorderTokens(
  tokens: Array<string>,
  fromToken: string,
  toToken: string,
): Array<string> | null {
  const fromIndex = tokens.indexOf(fromToken);
  const toIndex = tokens.indexOf(toToken);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return null;
  }

  return moveItem(tokens, fromIndex, toIndex);
}

export function sortableListProps(
  scope: string,
  token: string,
  tokens: Array<string>,
  onReorder: (tokens: Array<string>) => void,
) {
  return {
    draggable: true,
    onDragStart: (event: DragEvent<HTMLElement>) => {
      if (isInteractiveDragSource(event)) {
        event.preventDefault();
        return;
      }

      event.stopPropagation();
      setSortDragToken(event, scope, token);
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      const fromToken = readSortDragToken(event, scope);

      if (!fromToken) {
        return;
      }

      event.stopPropagation();
      const next = reorderTokens(tokens, fromToken, token);

      if (!next) {
        return;
      }

      onReorder(next);
    },
  };
}

function isInteractiveDragSource(event: DragEvent): boolean {
  const target = event.target;

  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest("button, a, input, textarea, select"));
}
