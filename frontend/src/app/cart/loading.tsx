export default function CartLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>
      <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <span className="loader"></span>
        <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">
          Loading Cart...
        </p>
      </div>
    </main>
  );
}
