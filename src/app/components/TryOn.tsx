import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Link2, Sparkles, User, AlertCircle, Save, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

interface TryOnResult {
  id: string;
  clothingUrl: string;
  timestamp: number;
  userPhoto: string;
}

export function TryOn() {
  const navigate = useNavigate();
  const [clothingUrl, setClothingUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [userPhoto, setUserPhoto] = useState("");
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const profile = localStorage.getItem("userProfile");
    if (profile) {
      const parsed = JSON.parse(profile);
      setUserPhoto(parsed.photo);
      setHasProfile(!!parsed.photo);
    }
  }, []);

  const handleTryOn = async () => {
    if (!clothingUrl.trim()) {
      toast.error("请输入商品链接");
      return;
    }

    if (!hasProfile) {
      toast.error("请先完善个人信息");
      return;
    }

    setIsProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      const newResult: TryOnResult = {
        id: Date.now().toString(),
        clothingUrl,
        timestamp: Date.now(),
        userPhoto,
      };

      setResult(newResult);
      setIsProcessing(false);
      toast.success("试穿完成", {
        icon: <Check className="w-4 h-4" />,
      });
    }, 2000);
  };

  const handleSaveHistory = () => {
    if (!result) return;

    const history = JSON.parse(localStorage.getItem("tryOnHistory") || "[]");
    history.unshift(result);
    localStorage.setItem("tryOnHistory", JSON.stringify(history));
    toast.success("已保存到试穿记录", {
      icon: <Check className="w-4 h-4" />,
    });
  };

  const handleReset = () => {
    setResult(null);
    setClothingUrl("");
  };

  return (
    <div className="pb-4">
      {!hasProfile && (
        <div className="px-4 pt-3 pb-3">
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-orange-900 mb-2">
                  请先设置个人信息，上传照片和身体数据
                </p>
                <Button
                  onClick={() => navigate("/profile")}
                  size="sm"
                  className="h-8 bg-orange-600 hover:bg-orange-700 text-xs"
                >
                  去设置
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result ? (
        <>
          {/* User Info Preview */}
          {hasProfile && (
            <div className="bg-white px-4 py-3 mb-2">
              <button
                onClick={() => navigate("/profile")}
                className="w-full flex items-center gap-3 active:bg-gray-50 transition-colors rounded-lg p-2 -m-2"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {userPhoto ? (
                    <img src={userPhoto} alt="我的照片" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-7 h-7 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[15px] font-medium mb-0.5">个人信息已完善</p>
                  <p className="text-xs text-gray-500">点击可修改信息</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="bg-white px-4 pt-4 pb-5 mb-2">
            <h3 className="text-[15px] font-medium mb-4">商品链接</h3>
            <div className="space-y-3">
              <Input
                id="clothing-url"
                placeholder="粘贴淘宝、天猫商品链接..."
                value={clothingUrl}
                onChange={(e) => setClothingUrl(e.target.value)}
                className="h-11 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#07C160]"
              />
              <p className="text-xs text-gray-500">
                支持淘宝、天猫、京东等电商平台
              </p>
            </div>
          </div>

          <div className="px-4 mb-4">
            <Button
              onClick={handleTryOn}
              disabled={isProcessing || !hasProfile}
              className="w-full gap-2 h-11 bg-[#07C160] hover:bg-[#06AD56] disabled:bg-gray-300"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  AI 处理中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  一键试穿
                </>
              )}
            </Button>
          </div>

          {/* Tips */}
          <div className="px-4">
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <h4 className="text-sm font-medium text-purple-900 mb-2">使用提示</h4>
              <ul className="text-xs text-purple-800 space-y-1.5 leading-relaxed">
                <li>• 支持上衣、裤子、裙子、外套等品类</li>
                <li>• AI 会根据您的身材自动调整衣服尺寸</li>
                <li>• 处理时间约 2-5 秒，请耐心等待</li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Result Display */}
          <div className="bg-white px-4 pt-4 pb-5 mb-2">
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[3/4] mb-4">
              {userPhoto && (
                <img
                  src={userPhoto}
                  alt="试穿效果"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-3 left-3">
                <div className="bg-[#07C160] text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg">
                  <Check className="w-3.5 h-3.5" />
                  AI 试穿完成
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <p className="text-white text-sm">
                  基于您的身材数据生成
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <Link2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">商品链接</p>
                  <p className="text-sm text-gray-700 break-all leading-relaxed">
                    {result.clothingUrl}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="h-11"
              >
                重新试穿
              </Button>
              <Button
                onClick={handleSaveHistory}
                className="gap-2 h-11 bg-[#07C160] hover:bg-[#06AD56]"
              >
                <Save className="w-4 h-4" />
                保存记录
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}