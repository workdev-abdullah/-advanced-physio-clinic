import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { Sun, Moon, Menu, X, ChevronDown } from "lucide-react";
import api from "../api/api";

export default function Header() {
  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  /* ================= AUTH STATE ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          await api.get("/admin/check");
          setIsAdmin(true);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsub();
  }, [auth]);

  /* ================= DARK MODE ================= */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  /* ================= LOGOUT ================= */
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    navigate("/");
  };

  const NavItem = ({ to, label }) => (
    <Link
      to={to}
      onClick={() => setMobileMenu(false)}
      className={`block px-4 py-3 text-sm font-medium
        ${
          location.pathname === to
            ? "text-green-600 dark:text-green-400"
            : "text-gray-700 dark:text-gray-300"
        }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
      {/* ================= MAIN BAR ================= */}
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">

        {/* LEFT */}
        <div className="flex items-center gap-2">
          {/* MOBILE MENU */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>

          {/* LOGO */}
          <Link
            to="/"
            className="text-lg font-bold text-green-700 dark:text-green-400"
          >
            APC
          </Link>
        </div>

        {/* CENTER (DESKTOP ONLY) */}
        <div className="hidden md:block text-xl font-bold text-green-700 dark:text-green-400">
          Advance Physiotherapy Clinic
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {/* DARK MODE */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-gray-100 dark:bg-slate-800"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {!user && (
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold"
            >
              Login
            </Link>
          )}

          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1 px-3 py-2 rounded-full bg-green-600 text-white text-sm"
              >
                {user.phoneNumber?.slice(-2)}
                <ChevronDown size={14} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border rounded-xl shadow-lg overflow-hidden">
                  <NavItem to="/profile" label="My Profile" />
                  {isAdmin && <NavItem to="/admin" label="Admin Dashboard" />}
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-3 text-sm text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}
      {mobileMenu && (
        <div className="md:hidden border-t bg-white dark:bg-slate-900">
          <NavItem to="/" label="Home" />
          {user && <NavItem to="/profile" label="Profile" />}
          {user && isAdmin && <NavItem to="/admin" label="Admin" />}
        </div>
      )}
    </header>
  );
}
