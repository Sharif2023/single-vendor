export default function ProductDetailsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 bg-white rounded-[28px] border border-gray-100 p-12 shadow-xs">
        <span className="loader"></span>
        <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">
          Loading Product Details...
        </p>
      </div>
    </div>
  );
}
