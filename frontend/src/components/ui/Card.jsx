export default function Card({ children, className = '', hover = false }) {
  return (
    <div 
      className={`bg-gray-900 rounded-xl p-6 border border-gray-800 ${
        hover ? 'hover:border-purple-600 hover:shadow-2xl hover:shadow-purple-600/20 transition-all duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
