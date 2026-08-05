/**
 * Placeholder while the panel is being built out. Kept as its own lazy chunk
 * from the start so the public bundle never grows as the admin does.
 */
export default function Admin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">פאנל הניהול</h1>
        <p className="mt-2 text-stone-600">בהקמה.</p>
        <a href="#/" className="btn btn-gold mt-6">
          חזרה לאתר
        </a>
      </div>
    </div>
  );
}
