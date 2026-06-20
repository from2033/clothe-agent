import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { History as HistoryIcon, Trash2, ShoppingBag, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

interface TryOnRecord {
  id: string;
  clothingUrl: string;
  timestamp: number;
  userPhoto: string;
}

export function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<TryOnRecord[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const saved = localStorage.getItem("tryOnHistory");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  };

  const handleDelete = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("tryOnHistory", JSON.stringify(updated));
    toast.success("已删除");
  };

  const handleClearAll = () => {
    if (confirm("确定要清空所有记录吗？")) {
      setHistory([]);
      localStorage.removeItem("tryOnHistory");
      toast.success("已清空所有记录");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "今天 " + date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "昨天 " + date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    } else if (days < 7) {
      return days + " 天前";
    } else {
      return date.toLocaleDateString("zh-CN");
    }
  };

  const thisWeekCount = history.filter((item) => {
    const diff = Date.now() - item.timestamp;
    return diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="pb-4">
      {/* Statistics */}
      {history.length > 0 && (
        <div className="bg-white px-4 pt-4 pb-5 mb-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center py-3 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-2xl font-bold text-purple-600 mb-0.5">
                {history.length}
              </p>
              <p className="text-xs text-purple-700">总试穿</p>
            </div>
            <div className="text-center py-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-2xl font-bold text-blue-600 mb-0.5">
                {thisWeekCount}
              </p>
              <p className="text-xs text-blue-700">本周</p>
            </div>
            <div className="text-center py-3 bg-pink-50 rounded-xl border border-pink-100">
              <p className="text-lg font-bold text-pink-600 mb-0.5">
                {history.length > 0 ? formatDate(history[0].timestamp).split(" ")[0] : "-"}
              </p>
              <p className="text-xs text-pink-700">最近</p>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white px-4 py-3 mb-2 flex justify-between items-center">
          <h3 className="text-[15px] font-medium">试穿记录</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            清空
          </Button>
        </div>
      )}

      {history.length === 0 ? (
        <div className="bg-white mx-4 rounded-xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <HistoryIcon className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-1">暂无试穿记录</p>
            <p className="text-xs text-gray-400 mb-4">开始试穿后会自动保存记录</p>
            <Button 
              onClick={() => navigate("/tryon")} 
              className="gap-2 bg-[#07C160] hover:bg-[#06AD56] h-10"
            >
              <ShoppingBag className="w-4 h-4" />
              开始试穿
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 px-4">
          {history.map((record) => (
            <div key={record.id} className="bg-white rounded-xl overflow-hidden">
              <div className="p-3">
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-20 h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {record.userPhoto && (
                      <img
                        src={record.userPhoto}
                        alt="试穿效果"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(record.timestamp)}
                      </div>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-gray-400 hover:text-red-600 active:text-red-700 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mb-1">商品链接</p>
                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed mb-3">
                      {record.clothingUrl}
                    </p>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/tryon")}
                      className="w-full h-9 mt-auto"
                    >
                      再次试穿
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}