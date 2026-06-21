import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Download, ImagePlus, Link2, LoaderCircle, RotateCcw, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { api } from "../api";
import type { Product, ProfileData, TryOnTask } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const garmentTypes = [["upper", "上装"], ["lower", "下装"], ["dress", "连衣裙"]] as const;
const models = [["aitryon", "标准"], ["aitryon-plus", "高清·更准"]] as const;

export function TryOn() {
  const navigate = useNavigate();
  const timer = useRef<number>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [preview, setPreview] = useState("");
  const [garmentType, setGarmentType] = useState("upper");
  const [model, setModel] = useState("aitryon");
  const [task, setTask] = useState<TryOnTask | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getProfile().then(setProfile).catch(() => setProfile(null));
    const pending = sessionStorage.getItem("pendingProductUrl");
    if (pending && !pending.startsWith("upload://")) {
      setUrl(pending);
      sessionStorage.removeItem("pendingProductUrl");
    }
    return () => window.clearTimeout(timer.current);
  }, []);

  function poll(id: string) {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const next = await api.getTask(id);
        setTask(next);
        if (next.status === "pending" || next.status === "processing") poll(id);
        else if (next.status === "succeeded") toast.success("试穿效果已生成");
        else toast.error(next.failureReason || "生成失败");
      } catch {
        poll(id);
      }
    }, 2500);
  }

  async function uploadGarment(file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("图片不能超过 10MB");
    setBusy(true);
    try {
      const uploaded = await api.uploadGarment(file);
      setProduct(uploaded);
      setPreview(URL.createObjectURL(file));
      setUrl("");
      setTask(null);
      toast.success("服装图已上传");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setBusy(false);
    }
  }

  async function paste() {
    try {
      setUrl((await navigator.clipboard.readText()).trim());
      setProduct(null);
    } catch {
      toast.error("请长按输入框粘贴链接");
    }
  }

  async function start() {
    if (!profile?.photoFileId) {
      toast.error("请先上传个人全身照");
      navigate("/profile");
      return;
    }
    if (!product && !url.trim()) return toast.error("请上传服装图或粘贴商品链接");
    if (!localStorage.getItem("privacyAccepted") &&
      !confirm("你的人像和商品图将发送给 AI 服务生成试穿效果，并保存在云端至你主动删除。是否同意继续？")) return;
    localStorage.setItem("privacyAccepted", "true");
    setBusy(true);
    try {
      const item = product || await api.parseProduct(url.trim());
      setProduct(item);
      const created = await api.createTask(item.id, model, garmentType);
      setTask(created);
      poll(created.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建试穿失败");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    window.clearTimeout(timer.current);
    setProduct(null); setPreview(""); setTask(null); setUrl("");
  }

  const processing = task?.status === "pending" || task?.status === "processing";
  const resultImage = task?.resultImageTempUrl || task?.productImageTempUrl || preview;

  if (task) {
    return (
      <div className="pb-6">
        <section className="mobile-section">
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[3/4]">
            {resultImage && <img src={resultImage} alt="试穿结果" className="w-full h-full object-cover" />}
            <div className={`absolute top-3 left-3 status-pill status-${task.status}`}>
              {processing ? <LoaderCircle className="animate-spin" /> : task.status === "succeeded" ? <Check /> : <AlertCircle />}
              {processing ? "AI 正在生成" : task.status === "succeeded" ? "试穿完成" : "生成失败"}
            </div>
          </div>
          {task.status === "failed" && <p className="mt-3 text-sm text-red-600">{task.failureReason || "生成失败，请重试"}</p>}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button variant="outline" onClick={reset} className="h-11"><RotateCcw />重新试穿</Button>
            {task.resultImageTempUrl ? <a className="app-primary" href={task.resultImageTempUrl} download target="_blank" rel="noreferrer"><Download />保存图片</a> :
              <Button disabled className="h-11"><LoaderCircle className={processing ? "animate-spin" : ""} />处理中</Button>}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {!profile?.photoFileId && <div className="mx-4 mt-3 warning-card"><AlertCircle /><div><b>尚未上传个人照片</b><p>先完善资料后再开始试穿。</p><button onClick={() => navigate("/profile")}>去设置</button></div></div>}
      {profile?.photoFileId && <section className="mobile-section flex items-center gap-3">
        <img className="w-14 h-14 rounded-xl object-cover bg-gray-100" src={profile.photoTempUrl} alt="" />
        <div className="flex-1"><b className="text-sm">个人资料已就绪</b><p className="text-xs text-gray-500 mt-1">AI 将使用这张照片生成效果</p></div>
        <button className="text-sm text-[#07c160]" onClick={() => navigate("/profile")}>修改</button>
      </section>}

      <section className="mobile-section">
        <h2 className="section-heading">服装图片（推荐）</h2>
        {product ? <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video">
          <img src={preview || product.imageTempUrl} className="w-full h-full object-contain" alt="服装图" />
          <label className="absolute right-2 bottom-2 mini-action"><Upload />重新选择<input className="hidden" type="file" accept="image/*" onChange={(e) => uploadGarment(e.target.files?.[0])} /></label>
        </div> :
          <label className="upload-zone"><ImagePlus /><span>上传服装图</span><small>淘宝截图 / 相册图片</small><input className="hidden" type="file" accept="image/*" onChange={(e) => uploadGarment(e.target.files?.[0])} /></label>}
        <p className="help-text">从商品页保存清晰的单件服装图后上传，成功率最高。</p>
      </section>

      <section className="mobile-section">
        <h2 className="section-heading">或粘贴商品链接</h2>
        <div className="flex gap-2"><Input value={url} onChange={(e) => { setUrl(e.target.value); setProduct(null); }} placeholder="淘宝 / 天猫商品链接" /><Button variant="outline" onClick={paste}><Link2 />粘贴</Button></div>
        <p className="help-text">平台反爬可能导致解析失败，建议优先上传服装图。</p>
      </section>

      <ChoiceSection title="服装品类" value={garmentType} onChange={setGarmentType} items={garmentTypes} />
      <ChoiceSection title="清晰度" value={model} onChange={setModel} items={models} />

      <div className="px-4">
        <Button onClick={start} disabled={busy} className="app-primary">
          {busy ? <LoaderCircle className="animate-spin" /> : <Sparkles />}一键试穿
        </Button>
      </div>
    </div>
  );
}

function ChoiceSection({ title, value, onChange, items }: { title: string; value: string; onChange: (value: string) => void; items: readonly (readonly [string, string])[] }) {
  return <section className="mobile-section"><h2 className="section-heading">{title}</h2><div className="segmented">{items.map(([key, label]) =>
    <button key={key} className={value === key ? "active" : ""} onClick={() => onChange(key)}>{label}</button>)}</div></section>;
}
