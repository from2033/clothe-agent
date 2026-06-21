import { useEffect, useState } from "react";
import { History as HistoryIcon, LoaderCircle, RotateCcw, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { api } from "../api";
import type { TryOnTask } from "../types";
import { Button } from "./ui/button";

const labels = { pending: "等待处理", processing: "生成中", succeeded: "已完成", failed: "失败" };

export function History() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TryOnTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listTasks().then(setTasks).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  async function remove(id: string) {
    if (!confirm("删除这条试穿记录和结果图片？")) return;
    try {
      await api.deleteTask(id);
      setTasks((current) => current.filter((task) => task.id !== id));
      toast.success("已删除");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    }
  }

  function retry(task: TryOnTask) {
    sessionStorage.setItem("pendingProductUrl", task.originalUrl);
    navigate("/tryon");
  }

  if (loading) return <div className="page-loading"><LoaderCircle className="animate-spin" />正在加载记录</div>;
  if (!tasks.length) return <div className="empty-state"><HistoryIcon /><b>暂无试穿记录</b><p>创建试穿任务后，可以在这里查看进度和结果</p><Button onClick={() => navigate("/tryon")} className="app-primary"><ShoppingBag />开始试穿</Button></div>;

  const weekly = tasks.filter((task) => Date.now() - task.createdAt < 604800000).length;
  return (
    <div className="pb-6">
      <div className="stats-grid">
        <Stat value={tasks.length} label="总试穿" />
        <Stat value={weekly} label="本周" />
        <Stat value={tasks.filter((t) => t.status === "succeeded").length} label="已完成" />
      </div>
      <div className="px-4 space-y-3">
        {tasks.map((task) => <article className="history-card" key={task.id}>
          <img src={task.resultImageTempUrl || task.productImageTempUrl || task.personImageTempUrl} alt="" />
          <div className="min-w-0 flex-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{new Date(task.createdAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              <button onClick={() => remove(task.id)} aria-label="删除"><Trash2 className="w-4 h-4" /></button>
            </div>
            <h3>{task.productTitle || "上传的服装图"}</h3>
            <span className={`task-status task-${task.status}`}>{labels[task.status]}</span>
            {task.status === "failed" && <p className="text-xs text-red-500 line-clamp-2">{task.failureReason}</p>}
            <Button variant="outline" size="sm" onClick={() => retry(task)} className="w-full mt-auto"><RotateCcw />再次试穿</Button>
          </div>
        </article>)}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return <div><b>{value}</b><span>{label}</span></div>;
}
