export default function Card({ children, className = '', hover = false }) {
  return (
    <div 
      className={`bg-white rounded-xl p-6 border border-[#6a317f]/25 shadow-sm ${
        hover ? 'hover:border-[#6a317f] hover:shadow-lg hover:shadow-[#6a317f]/25 transition-all duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
