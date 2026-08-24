"use client";

import { useEffect, useMemo, useState } from "react";

type SignalId = "slow" | "confused" | "repeat" | "break";

const signalDefinitions: { id: SignalId; icon: string; label: string; tone: string; response: string }[] = [
  { id: "slow", icon: "慢", label: "讲慢一点", tone: "coral", response: "收到，我会放慢速度，并留一点思考时间。" },
  { id: "confused", icon: "？", label: "我没听懂", tone: "yellow", response: "收到，我会换一种方法解释这个重点。" },
  { id: "repeat", icon: "↺", label: "请再讲一次", tone: "mint", response: "收到，我会把刚才的内容再示范一次。" },
  { id: "break", icon: "休", label: "需要短暂休息", tone: "blue", response: "收到，可以安静休息两分钟，再回来继续。" },
];

const initialCounts: Record<SignalId, number> = { slow: 3, confused: 2, repeat: 2, break: 0 };

export default function Home() {
  const [counts, setCounts] = useState(initialCounts);
  const [activeSignal, setActiveSignal] = useState<SignalId | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [selectedResponse, setSelectedResponse] = useState<SignalId>("slow");
  const [teacherNotice, setTeacherNotice] = useState<{ id: SignalId; message: string } | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [toast, setToast] = useState("");

  const totalNeed = useMemo(() => Object.values(counts).reduce((sum, count) => sum + count, 0), [counts]);
  const calmCount = Math.max(0, 32 - totalNeed);
  const calmPercent = Math.round((calmCount / 32) * 100);
  const selected = signalDefinitions.find((signal) => signal.id === selectedResponse) ?? signalDefinitions[0];

  useEffect(() => {
    if (!activeSignal || remaining <= 0) return;
    const timer = window.setInterval(() => {
      setRemaining((seconds) => {
        if (seconds > 1) return seconds - 1;
        setCounts((current) => ({ ...current, [activeSignal]: Math.max(0, current[activeSignal] - 1) }));
        setActiveSignal(null);
        setToast("你的信号已自动过期");
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeSignal, remaining]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }

  function sendSignal(id: SignalId) {
    setCounts((current) => {
      const next = { ...current };
      if (activeSignal && activeSignal !== id) next[activeSignal] = Math.max(0, next[activeSignal] - 1);
      if (activeSignal !== id) next[id] += 1;
      return next;
    });
    setActiveSignal(id);
    setRemaining(120);
    setTeacherNotice(null);
    notify(activeSignal === id ? "信号时间已更新" : "老师已收到班级信号");
  }

  function clearSignal(message = "信号已撤回") {
    if (activeSignal) setCounts((current) => ({ ...current, [activeSignal]: Math.max(0, current[activeSignal] - 1) }));
    setActiveSignal(null);
    setRemaining(0);
    notify(message);
  }

  function sendTeacherResponse() {
    setTeacherNotice({ id: selected.id, message: selected.response });
    notify("回应已经发送给全班");
  }

  function acknowledgeNotice() {
    if (activeSignal === teacherNotice?.id) clearSignal("收到老师回应，信号已结束");
    setTeacherNotice(null);
  }

  function resetClassroom() {
    setCounts({ slow: 0, confused: 0, repeat: 0, break: 0 });
    setActiveSignal(null);
    setRemaining(0);
    setTeacherNotice(null);
    notify("本轮信号已清除");
  }

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" aria-label="轻声首页" onClick={() => window.location.reload()}>
          <span className="brand-mark"><i />轻</span>
          <span><strong>轻声</strong><small>SEN 课堂信号</small></span>
        </button>
        <div className="top-actions">
          <button className="privacy-button" type="button" onClick={() => setPrivacyOpen(true)}>隐私设计</button>
          <div className="class-chip"><span />五年级数学 · 32 人在线</div>
        </div>
      </header>

      <section className="intro">
        <div><p className="eyebrow">低压力课堂沟通</p><h1>不必举手，<em>也能让老师知道。</em></h1></div>
        <p className="intro-copy">学生低调发出需要，老师只看班级整体趋势。<br />没有摄像头，没有行为评分。</p>
      </section>

      <section className="demo-grid">
        <article className="student-wrap">
          <div className="section-label"><span>学生端</span><small>平板 / 手机 · 点击试试</small></div>
          <div className="student-device">
            <div className="device-top"><span>数学课</span><i>匿名模式</i></div>
            <div className="student-greeting">
              <span className="quiet-orbit"><i /></span>
              <div><small>下午好</small><h2>{activeSignal ? "信号已经发出" : "现在需要什么帮助？"}</h2></div>
            </div>

            {teacherNotice && (
              <div className="student-notice" role="status">
                <span>老师回应</span><p>{teacherNotice.message}</p>
                <button type="button" onClick={acknowledgeNotice}>知道了</button>
              </div>
            )}

            <div className="signal-grid">
              {signalDefinitions.map((signal) => (
                <button className={`signal-button ${signal.tone} ${activeSignal === signal.id ? "active" : ""}`} type="button" key={signal.id} aria-pressed={activeSignal === signal.id} onClick={() => sendSignal(signal.id)}>
                  <span>{activeSignal === signal.id ? "✓" : signal.icon}</span><strong>{signal.label}</strong>
                  {activeSignal === signal.id && <small>已发送 · {minutes}:{seconds}</small>}
                </button>
              ))}
            </div>
            <button className={`all-good ${!activeSignal ? "active" : ""}`} type="button" onClick={() => activeSignal ? clearSignal() : notify("目前没有发出求助信号")}><span>✓</span>我现在没问题</button>
            <p className="student-privacy">老师只会看到班级人数，不会看到你的名字</p>
          </div>
        </article>

        <article className="teacher-panel">
          <div className="panel-heading">
            <div><p className="eyebrow navy">教师端 · 与学生端同步</p><h2>课堂即时信号</h2></div>
            <div className="teacher-actions"><button type="button" onClick={resetClassroom}>清除本轮</button><div className="live-chip"><span />实时更新</div></div>
          </div>

          <div className="pulse-summary">
            <div className={`pulse-ring ${totalNeed === 0 ? "empty" : ""}`}><strong>{totalNeed}</strong><small>位学生<br />需要帮助</small></div>
            <div className="class-calm"><span>全班状态</span><strong>{totalNeed === 0 ? "暂时没有求助信号" : totalNeed <= 8 ? "大部分学生跟得上" : "建议暂停并检查理解"}</strong><div><i style={{ width: `${calmPercent}%` }} /></div><small>{calmCount} 人暂时没有困难</small></div>
          </div>

          <div className="signal-list">
            {signalDefinitions.map((signal) => (
              <div className={`signal-row ${counts[signal.id] >= 3 ? "urgent" : ""} ${selectedResponse === signal.id ? "selected" : ""}`} key={signal.id}>
                <span className={`row-icon ${signal.tone}`}>{signal.icon}</span>
                <p><strong>{signal.label}</strong><small>信号会在 2 分钟后过期</small></p>
                <b>{counts[signal.id]} 人</b>
                <button type="button" aria-pressed={selectedResponse === signal.id} onClick={() => setSelectedResponse(signal.id)}>{selectedResponse === signal.id ? "已选择" : "回应"}</button>
              </div>
            ))}
          </div>

          <div className="teacher-response">
            <div><span>准备发送给全班</span><p>“{selected.response}”</p></div>
            <button type="button" onClick={sendTeacherResponse}>发送回应 <b>→</b></button>
          </div>
        </article>
      </section>

      <footer className="trust-row"><span><b>01</b>学生默认匿名</span><i /><span><b>02</b>信号自动过期</span><i /><span><b>03</b>不记录行为分数</span></footer>

      {privacyOpen && (
        <div className="modal-backdrop">
          <button className="modal-close-layer" type="button" aria-label="关闭隐私说明" onClick={() => setPrivacyOpen(false)} />
          <section className="privacy-modal" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
            <div className="modal-heading"><div><p className="eyebrow">隐私不是附加功能</p><h2 id="privacy-title">这个原型刻意不收集什么</h2></div><button type="button" aria-label="关闭" onClick={() => setPrivacyOpen(false)}>×</button></div>
            <div className="privacy-points">
              <div><span>01</span><p><strong>不显示学生姓名</strong><small>教师端只看到每类信号的总人数。</small></p></div>
              <div><span>02</span><p><strong>不建立行为档案</strong><small>信号不会变成专注度、表现或风险分数。</small></p></div>
              <div><span>03</span><p><strong>默认两分钟过期</strong><small>系统只服务当下课堂，不长期保存求助记录。</small></p></div>
            </div>
            <button className="modal-confirm" type="button" onClick={() => setPrivacyOpen(false)}>我明白了</button>
          </section>
        </div>
      )}
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
