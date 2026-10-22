export default function Loading() {
  return (
    <div className="container-page py-10" aria-busy="true" aria-label="Loading">
      <div className="skeleton mb-4 h-10 w-64" />
      <div className="skeleton mb-8 h-5 w-96 max-w-full" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-72" />
        ))}
      </div>
    </div>
  );
}
