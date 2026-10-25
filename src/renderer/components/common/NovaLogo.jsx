export function NovaLogo({ size = 'md' }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-lg'
  };
  return (
    <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-nova-400 via-nova-500 to-purple-600 flex items-center justify-center shadow-lg shadow-nova-500/30 flex-shrink-0`}>
      <span className="font-bold text-white">N</span>
    </div>
  );
}

export function NovaBrand({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <NovaLogo size="md" />
      <span className="text-xl font-semibold text-white tracking-tight lowercase">nova</span>
    </div>
  );
}

export default NovaLogo;
