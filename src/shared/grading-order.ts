export type CategoryChildKind = "subcategory" | "work";

export type OrderedItem = {
  id: number;
  sortOrder: number;
};

export function nextSortOrder(orders: Array<number>): number {
  if (orders.length === 0) {
    return 0;
  }

  return Math.max(...orders) + 1;
}

export function moveItem<T>(items: Array<T>, fromIndex: number, toIndex: number): Array<T> {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const next = [...items];
  const [removed] = next.splice(fromIndex, 1);

  if (removed === undefined) {
    return items;
  }

  next.splice(toIndex, 0, removed);
  return next;
}

export function sameIdSet(left: Array<number>, right: Array<number>): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const remaining = [...right];

  for (const id of left) {
    const index = remaining.indexOf(id);

    if (index < 0) {
      return false;
    }

    remaining.splice(index, 1);
  }

  return remaining.length === 0;
}

export function categoryChildToken(kind: CategoryChildKind, id: number): string {
  return `${kind}:${id}`;
}

export function categoryChildTokens<Subcategory extends OrderedItem, Work extends OrderedItem>(
  subcategories: Array<Subcategory>,
  works: Array<Work>,
): Array<string> {
  return sortCategoryChildren(subcategories, works).map((child) =>
    categoryChildToken(child.kind, child.item.id),
  );
}

export function parseCategoryChildToken(token: string): {
  kind: CategoryChildKind;
  id: number;
} {
  const [kind, rawId] = token.split(":");
  const id = Number(rawId);

  if ((kind !== "subcategory" && kind !== "work") || !Number.isInteger(id)) {
    throw new Error("Those items could not be reordered.");
  }

  return { kind, id };
}

export function sortCategoryChildren<Subcategory extends OrderedItem, Work extends OrderedItem>(
  subcategories: Array<Subcategory>,
  works: Array<Work>,
): Array<{ kind: "subcategory"; item: Subcategory } | { kind: "work"; item: Work }> {
  return [
    ...subcategories.map((item) => ({
      kind: "subcategory" as const,
      item,
      sortOrder: item.sortOrder,
    })),
    ...works.map((item) => ({
      kind: "work" as const,
      item,
      sortOrder: item.sortOrder,
    })),
  ]
    .sort((left, right) => compareOrderedItems(left, right))
    .map((child) =>
      child.kind === "subcategory"
        ? { kind: "subcategory" as const, item: child.item }
        : { kind: "work" as const, item: child.item },
    );
}

function compareOrderedItems(
  left: { kind: CategoryChildKind; sortOrder: number; item: OrderedItem },
  right: { kind: CategoryChildKind; sortOrder: number; item: OrderedItem },
): number {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  if (left.kind !== right.kind) {
    return left.kind === "subcategory" ? -1 : 1;
  }

  return left.item.id - right.item.id;
}
