export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <span className="loader"></span>
      <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">
        Loading Store...
      </p>
    </div>
  );
}
