export type ChartColours = {
  belowCutoff: string;
  atOrAboveCutoff: string;
  belowCutoffHighlight: string;
  atOrAboveCutoffHighlight: string;
  density: string;
  cutoff: string;
  goal: string;
  text: string;
  grid: string;
  tooltip: string;
};

export function chartColours(root: HTMLElement = document.documentElement): ChartColours {
  const styles = getComputedStyle(root);

  return {
    belowCutoff: cssColour(styles, "--error"),
    atOrAboveCutoff: cssColour(styles, "--success"),
    belowCutoffHighlight: mixedCssColour(root, "--error"),
    atOrAboveCutoffHighlight: mixedCssColour(root, "--success"),
    density: cssColour(styles, "--accent"),
    cutoff: cssColour(styles, "--error"),
    goal: cssColour(styles, "--colour-warning"),
    text: cssColour(styles, "--ink"),
    grid: cssColour(styles, "--paper-dark"),
    tooltip: cssColour(styles, "--paper-light"),
  };
}

function cssColour(styles: CSSStyleDeclaration, name: string): string {
  return styles.getPropertyValue(name).trim() || "#000";
}

function mixedCssColour(root: HTMLElement, name: string): string {
  const probe = document.createElement("span");
  probe.style.color = `color-mix(in srgb, var(${name}) 52%, var(--paper-light))`;
  root.append(probe);
  const colour = getComputedStyle(probe).color.trim();
  probe.remove();
  return colour || "#000";
}
