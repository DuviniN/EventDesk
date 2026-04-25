export default function Input({ label, error, required, className = '', ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 bg-white border border-[#6a317f]/30 rounded-lg text-[var(--text-primary)] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6a317f] focus:border-[#6a317f] transition-all ${
          error ? 'border-red-500 focus:ring-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
