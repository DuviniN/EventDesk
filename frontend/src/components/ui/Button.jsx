export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#6a317f] text-white hover:bg-[#58276a] shadow-lg shadow-[#6a317f]/40',
    secondary: 'bg-white text-[#6a317f] hover:bg-white/80 shadow-lg shadow-[#6a317f]/20 border border-[#6a317f]/30',
    outline: 'border-2 border-[#6a317f] text-[#6a317f] hover:bg-[#6a317f] hover:text-white',
    ghost: 'text-[#6a317f] hover:text-white hover:bg-[#6a317f]/15 border border-[#6a317f]/30',
    danger: 'bg-[#6a317f] text-white hover:bg-[#58276a] shadow-lg shadow-[#6a317f]/40'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
