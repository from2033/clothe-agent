import { LockKeyhole, Server, Sparkles, Trash2 } from "lucide-react";

export function Privacy() {
  return <div className="pb-6">
    <section className="mobile-section">
      <h2 className="text-xl font-semibold">照片与隐私说明</h2>
      <p className="text-sm text-gray-500 mt-2 leading-6">我们只收集完成虚拟试穿所需的信息，并把控制权留给你。</p>
    </section>
    <section className="mobile-section privacy-list">
      <Item icon={<Sparkles />} title="用途" text="人像照片、服装图会发送给 AI 试衣服务，仅用于生成你发起的试穿效果。" />
      <Item icon={<Server />} title="保存" text="资料和结果保存在自建服务器中，方便你跨页面查看任务与历史记录。" />
      <Item icon={<LockKeyhole />} title="访问" text="每台设备使用独立身份，其他普通用户无法查看你的资料和试穿记录。" />
      <Item icon={<Trash2 />} title="删除" text="你可以删除单条记录，也可以在“我的”页面清空全部资料、照片和结果。" />
    </section>
  </div>;
}

function Item({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div><span>{icon}</span><div><b>{title}</b><p>{text}</p></div></div>;
}
