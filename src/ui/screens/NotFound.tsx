import { Link } from 'react-router-dom';
import { Placeholder } from '../components/Placeholder';

export function NotFound() {
  return (
    <Placeholder milestone="404" title="הדף לא נמצא">
      הכתובת שביקשת לא קיימת. <Link to="/">חזרה למשחקים</Link>.
    </Placeholder>
  );
}
