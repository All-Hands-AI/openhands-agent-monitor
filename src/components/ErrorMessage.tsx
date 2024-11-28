interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-message">
      <p>{message}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  );
}