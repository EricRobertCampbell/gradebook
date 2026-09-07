import type { DisplayError } from "../../errors";
import "./ErrorDisplay.css";

type ErrorDisplayProps = {
  error: DisplayError | null;
};

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) {
    return null;
  }

  const { context, detail } = describedError(error);

  return (
    <div className="error-display" role="alert">
      <p className="error-display-context">{context}</p>
      {detail ? <p className="error-display-detail">{detail}</p> : null}
    </div>
  );
}

function describedError(error: DisplayError): { context: string; detail?: string } {
  if (typeof error === "string") {
    return { context: error };
  }

  return error;
}
