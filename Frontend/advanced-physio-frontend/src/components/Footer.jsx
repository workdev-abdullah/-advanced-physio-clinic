export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-600">
        <p className="font-medium text-gray-800">
          Advance Physiotherapy Clinic
        </p>

        <p className="mt-1">
          © {new Date().getFullYear()} All rights reserved
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Built with ❤️ using React, Node.js, MongoDB & Razorpay
        </p>
      </div>
    </footer>
  );
}
