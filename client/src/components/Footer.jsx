export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 bg-white/95 p-3 text-xs text-gray-500 flex items-center justify-between">
      <div>© 2026 Dabub Connect • Arba Minch Transport Management System</div>
      <div className="flex items-center gap-3">
        <a href="/" className="hover:underline">Home</a>
        <a href="/booking" className="hover:underline">Booking</a>
        <a href="/reports" className="hover:underline">Reports</a>
      </div>
    </footer>
  );
}
