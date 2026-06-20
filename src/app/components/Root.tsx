import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { User, Shirt, History, Home, ChevronLeft } from "lucide-react";

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/", icon: Home, label: "首页" },
    { path: "/tryon", icon: Shirt, label: "试穿" },
    { path: "/history", icon: History, label: "记录" },
    { path: "/profile", icon: User, label: "我的" },
  ];

  const isHomePage = location.pathname === "/";
  const currentPage = navItems.find((item) => item.path === location.pathname);

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* WeChat-style Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="h-11 flex items-center justify-center relative px-4">
          {!isHomePage && (
            <button
              onClick={() => navigate(-1)}
              className="absolute left-4 flex items-center text-gray-700 active:opacity-60 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-[15px] font-medium">
            {currentPage?.label || "智能试衣间"}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-8.75rem)]">
        <Outlet />
      </main>

      {/* Bottom Tab Bar with safe area */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 pb-safe">
        <div className="grid grid-cols-4 h-[50px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 active:bg-gray-50 transition-colors ${
                  isActive ? "text-[#07C160]" : "text-gray-600"
                }`}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] ${isActive ? "font-medium" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}