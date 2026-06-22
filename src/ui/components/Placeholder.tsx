interface PlaceholderProps {
  milestone: string;
  title: string;
  children: React.ReactNode;
}

/** מסך-זמני לאבן דרך שטרם מומשה. נמחק כשהמסך האמיתי נכנס. */
export function Placeholder({ milestone, title, children }: PlaceholderProps) {
  return (
    <div className="card placeholder">
      <span className="badge">{milestone}</span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
