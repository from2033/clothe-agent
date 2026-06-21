import { useEffect, useState } from "react";
import { Camera, Check, LoaderCircle, Save, ShieldCheck, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import { api } from "../api";
import type { ProfileData } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const emptyProfile: ProfileData = {
  name: "", height: "", weight: "", bust: "", waist: "", hips: "", photoFileId: "",
};

export function Profile() {
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [preview, setPreview] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getProfile()
      .then((saved) => {
        if (saved) {
          setProfile(saved);
          setPreview(saved.photoTempUrl || "");
        }
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  function choosePhoto(file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("照片不能超过 10MB");
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function save() {
    if (!preview) return toast.error("请先上传正面全身照");
    if (!profile.height || !profile.weight) return toast.error("请填写身高和体重");
    setSaving(true);
    try {
      const photoFileId = photo
        ? (await api.uploadProfilePhoto(photo)).fileId
        : profile.photoFileId;
      const saved = await api.saveProfile({ ...profile, photoFileId });
      setProfile(saved);
      setPhoto(null);
      setPreview(saved.photoTempUrl || preview);
      toast.success("资料已保存", { icon: <Check className="w-4 h-4" /> });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function clearAll() {
    if (!confirm("将删除个人资料、照片和全部试穿记录，且无法恢复。确定继续吗？")) return;
    try {
      await api.clearUserData();
      localStorage.removeItem("clothApiToken");
      setProfile(emptyProfile);
      setPreview("");
      setPhoto(null);
      toast.success("全部数据已清空");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "清理失败");
    }
  }

  const update = (key: keyof ProfileData, value: string) =>
    setProfile((current) => ({ ...current, [key]: value }));

  if (loading) {
    return <div className="page-loading"><LoaderCircle className="animate-spin" />正在加载资料</div>;
  }

  return (
    <div className="pb-6">
      <section className="mobile-section flex flex-col items-center py-7">
        <label className="relative block cursor-pointer">
          <div className="w-28 h-36 rounded-2xl overflow-hidden bg-gray-100 border-4 border-white shadow-sm">
            {preview ? <img src={preview} className="w-full h-full object-cover" alt="个人全身照" /> :
              <div className="w-full h-full flex items-center justify-center"><User className="w-12 h-12 text-gray-300" /></div>}
          </div>
          <span className="absolute -right-2 -bottom-2 w-9 h-9 rounded-full bg-[#07c160] text-white flex items-center justify-center shadow-lg">
            <Camera className="w-4 h-4" />
          </span>
          <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp"
            onChange={(event) => choosePhoto(event.target.files?.[0])} />
        </label>
        <p className="text-xs text-gray-500 mt-4 text-center leading-5">上传正面全身照<br />光线充足、无遮挡、背景简洁</p>
      </section>

      <section className="mobile-section space-y-4">
        <h2 className="section-heading">基本信息</h2>
        <Field label="姓名（选填）"><Input value={profile.name} maxLength={30} onChange={(e) => update("name", e.target.value)} placeholder="请输入姓名" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="身高 (cm)"><Input inputMode="decimal" value={profile.height} onChange={(e) => update("height", e.target.value)} placeholder="170" /></Field>
          <Field label="体重 (kg)"><Input inputMode="decimal" value={profile.weight} onChange={(e) => update("weight", e.target.value)} placeholder="55" /></Field>
        </div>
      </section>

      <section className="mobile-section space-y-4">
        <h2 className="section-heading">三围数据（选填）</h2>
        {(["bust", "waist", "hips"] as const).map((key, index) => (
          <Field key={key} label={`${["胸围", "腰围", "臀围"][index]} (cm)`}>
            <Input inputMode="decimal" value={profile[key]} onChange={(e) => update(key, e.target.value)} placeholder={["85", "65", "90"][index]} />
          </Field>
        ))}
      </section>

      <div className="px-4 space-y-3">
        <Button onClick={save} disabled={saving} className="app-primary">
          {saving ? <LoaderCircle className="animate-spin" /> : <Save />}保存信息
        </Button>
        <Link to="/privacy" className="app-secondary"><ShieldCheck />隐私与照片使用说明</Link>
        <Button variant="outline" onClick={clearAll} className="w-full h-11 text-red-600 border-red-200"><Trash2 />清空全部数据</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-sm text-gray-700">{label}</Label>{children}</div>;
}
