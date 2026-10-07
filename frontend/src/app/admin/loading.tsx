export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <span className="loader"></span>
      <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">
        Loading Admin Panel...
      </p>
    </div>
  );
}
