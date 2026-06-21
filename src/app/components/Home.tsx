import { Link } from "react-router";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { User, Shirt, History, Camera, ImagePlus, Sparkles, ChevronRight, Smartphone } from "lucide-react";

export function Home() {
  const features = [
    {
      icon: Camera,
      title: "上传照片",
      description: "拍摄全身照",
      path: "/profile",
      color: "bg-blue-500",
    },
    {
      icon: ImagePlus,
      title: "上传衣服",
      description: "截图或相册",
      path: "/tryon",
      color: "bg-purple-500",
    },
    {
      icon: Sparkles,
      title: "智能试穿",
      description: "AI生成效果",
      path: "/tryon",
      color: "bg-orange-500",
    },
  ];

  const quickActions = [
    { icon: Shirt, title: "开始试穿", path: "/tryon" },
    { icon: User, title: "个人信息", path: "/profile" },
    { icon: History, title: "试穿记录", path: "/history" },
  ];

  return (
    <div className="pb-4">
      {/* Hero Banner */}
      <div className="bg-white px-4 py-6 mb-2">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-[#07C160] rounded-xl flex items-center justify-center flex-shrink-0">
            <Shirt className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-1">智能虚拟试衣</h2>
            <p className="text-sm text-gray-500">AI 驱动 · 手机也能随时试衣</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/profile">
            <Button variant="outline" className="w-full h-10 border-[#07C160] text-[#07C160] hover:bg-[#07C160]/5">
              设置信息
            </Button>
          </Link>
          <Link to="/tryon">
            <Button className="w-full h-10 bg-[#07C160] hover:bg-[#06AD56]">
              开始试穿
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white px-4 py-4 mb-2">
        <h3 className="text-[15px] font-medium mb-3">快速入口</h3>
        <div className="space-y-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.path} to={action.path}>
                <div className="flex items-center justify-between py-2.5 px-3 rounded-lg active:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <span className="text-[15px]">{action.title}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* How to use */}
      <div className="bg-white px-4 py-4 mb-2">
        <h3 className="text-[15px] font-medium mb-3">使用步骤</h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#07C160] text-white flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="text-[15px] font-medium mb-0.5">完善个人信息</p>
              <p className="text-sm text-gray-500">上传正面全身照，填写身高三围数据</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#07C160] text-white flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="text-[15px] font-medium mb-0.5">粘贴商品链接</p>
              <p className="text-sm text-gray-500">上传商品图，或粘贴淘宝、天猫链接</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#07C160] text-white flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="text-[15px] font-medium mb-0.5">查看试穿效果</p>
              <p className="text-sm text-gray-500">AI 自动生成上身效果，保存记录</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white px-4 py-4">
        <h3 className="text-[15px] font-medium mb-3">功能特色</h3>
        <div className="grid grid-cols-3 gap-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="text-center">
                <div className={`w-12 h-12 mx-auto rounded-xl ${feature.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-medium mb-0.5">{feature.title}</p>
                <p className="text-xs text-gray-500">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Tips */}
      <div className="px-4 py-3">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-medium mb-1">AI 智能试衣</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                支持上衣、裤子、裙子、外套等品类，AI 会根据您的身材数据自动调整衣服尺寸，生成逼真的试穿效果
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="bg-green-50 rounded-xl p-3 border border-green-100 flex gap-2">
          <Smartphone className="w-4 h-4 text-green-700 mt-0.5 shrink-0" />
          <p className="text-xs text-green-800 leading-5">点击右上角安装按钮，可把智能试衣添加到手机主屏幕，像 App 一样使用。</p>
        </div>
      </div>
    </div>
  );
}
