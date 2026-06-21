import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { User, Shirt, History, Home, ChevronLeft, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

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
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (installPrompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
    } else {
      setShowIosTip(true);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f8fa] max-w-lg mx-auto shadow-[0_0_40px_rgba(0,0,0,.06)]">
      {/* WeChat-style Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="h-12 flex items-center justify-center relative px-4 pt-safe">
          {!isHomePage && (
            <button
              onClick={() => navigate(-1)}
              className="absolute left-4 flex items-center text-gray-700 active:opacity-60 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-[15px] font-medium">
            {location.pathname === "/privacy" ? "隐私说明" : currentPage?.label || "智能试衣间"}
          </h1>
          {isHomePage && <button onClick={install} className="absolute right-4 text-[#07c160]" aria-label="安装到主屏幕"><Download className="w-5 h-5" /></button>}
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100dvh-7rem)] pb-[calc(58px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      {/* Bottom Tab Bar with safe area */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white/95 backdrop-blur border-t border-gray-100 z-50 pb-safe">
        <div className="grid grid-cols-4 h-[56px]">
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
      {showIosTip && <div className="install-sheet" onClick={() => setShowIosTip(false)}>
        <div onClick={(e) => e.stopPropagation()}><Download /><b>添加到主屏幕</b><p>在 Safari 底部点“分享”，再选择“添加到主屏幕”，之后就能像 App 一样打开。</p><Button onClick={() => setShowIosTip(false)}>知道了</Button></div>
      </div>}
    </div>
  );
}
