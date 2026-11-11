/** Photo de profil, ou initiales sur un fond de couleur stable (calculée depuis le nom). */
const COLORS = ['#136f47', '#c8553d', '#2f5d8a', '#8a5a2f', '#6b4c9a', '#0f766e', '#b45309'];

function initialsOf(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function colorOf(name = '') {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export default function UserAvatar({ name, photoURL, size = 40, className = '' }) {
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt=""
        width={size}
        height={size}
        className={`user-avatar ${className}`}
        style={style}
      />
    );
  }
  return (
    <span
      className={`user-avatar user-avatar--initials ${className}`}
      style={{ ...style, background: colorOf(name) }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}
