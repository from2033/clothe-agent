import { useState } from "react";
import { Shirt, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { authenticate } from "../api";

export function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError("");
    try {
      await authenticate(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 pb-safe pt-safe"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #0bd373 0%, #07c160 38%, #048a45 100%)",
      }}
    >
      {/* 顶部品牌 */}
      <div className="mb-8 flex flex-col items-center text-white">
        <div
          className="mb-4 flex h-20 w-20 items-center justify-center rounded-[22px] bg-white/15 backdrop-blur"
          style={{ boxShadow: "0 10px 30px rgba(0,0,0,.18)" }}
        >
          <Shirt className="h-10 w-10" strokeWidth={1.8} />
        </div>
        <h1 className="text-[22px] font-semibold tracking-wide">试衣间</h1>
        <p className="mt-1 text-sm text-white/80">AI 一键试穿 · 在线衣橱</p>
      </div>

      {/* 卡片 */}
      <div
        className="w-full max-w-sm rounded-[24px] bg-white px-7 py-8"
        style={{ boxShadow: "0 18px 50px rgba(0,0,0,.22)" }}
      >
        <div className="mb-5 flex items-center gap-2 text-gray-800">
          <Lock className="h-[18px] w-[18px] text-[#07c160]" />
          <span className="text-[15px] font-semibold">请输入访问密码</span>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="访问密码"
              className="h-12 w-full rounded-xl bg-[#f5f6f7] pl-4 pr-11 text-[15px] text-gray-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#07c160]/60"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600"
              tabIndex={-1}
              aria-label={show ? "隐藏密码" : "显示密码"}
            >
              {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>

          {error && (
            <p className="-mt-1 text-[13px] text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl text-[15px] font-semibold text-white transition disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, #0bd373, #07c160)" }}
          >
            {loading ? (
              <>
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
                验证中…
              </>
            ) : (
              <>
                进入
                <ArrowRight className="h-[18px] w-[18px]" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-white/70">未经授权请勿使用</p>
    </div>
  );
}
