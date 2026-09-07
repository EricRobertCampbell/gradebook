type ChevronIconProps = {
  direction: "left" | "right";
};

export function ChevronIcon({ direction }: ChevronIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d={
          direction === "left"
            ? "M14.7 6.3a1 1 0 0 1 0 1.4L10.4 12l4.3 4.3a1 1 0 1 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0z"
            : "M9.3 6.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L13.6 12 9.3 7.7a1 1 0 0 1 0-1.4z"
        }
      />
    </svg>
  );
}
