import { useState } from "react";
import { Lock } from "lucide-react";
import { authenticate } from "../api";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-5 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold">试衣服小程序</h1>
            <p className="mt-1 text-sm text-gray-500">请输入访问密码</p>
          </div>
          <form onSubmit={submit} className="flex w-full flex-col gap-3">
            <Input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="访问密码"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={loading || !password} className="w-full">
              {loading ? "验证中…" : "进入"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
