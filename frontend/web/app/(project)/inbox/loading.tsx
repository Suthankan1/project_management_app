export default function InboxLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-3">
      {[1, 2, 3].map((row) => (
        <div key={row} className="bg-cu-bg border border-cu-border rounded-2xl p-4 animate-pulse shadow-cu-sm">
          <div className="h-4 w-48 bg-cu-bg-tertiary rounded" />
          <div className="h-3 w-32 bg-cu-bg-tertiary rounded mt-2" />
          <div className="h-12 w-full bg-cu-bg-secondary rounded-xl mt-4" />
        </div>
      ))}
    </div>
  );
}
