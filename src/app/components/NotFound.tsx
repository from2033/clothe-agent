import { Link } from "react-router";
import { Button } from "./ui/button";
import { Home } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">页面未找到</h2>
      <p className="text-gray-600 mb-8">抱歉，您访问的页面不存在</p>
      <Link to="/">
        <Button className="gap-2">
          <Home className="w-4 h-4" />
          返回首页
        </Button>
      </Link>
    </div>
  );
}
