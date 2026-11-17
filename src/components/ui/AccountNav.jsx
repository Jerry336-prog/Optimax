import { Link } from "react-router-dom";
export default function AccountNav({ to, onNavigate, className, children }) {
  return onNavigate ? (
    <button type="button" className={className} onClick={() => onNavigate(to)}>
      {children}
    </button>
  ) : (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}
