"use client";

import { useEffect, useMemo, useState } from "react";

type Keyword = {
  id: string;
  term: string;
  active: boolean;
};

type ApiResponse = {
  keywords: Keyword[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function buildHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    "x-admin-token": token,
  };
}

export default function HomePage() {
  const [token, setToken] = useState("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newTerm, setNewTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [sendingLark, setSendingLark] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("adminToken");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (!token) return;
    window.localStorage.setItem("adminToken", token);
    void loadKeywords(token);
  }, [token]);

  const activeCount = useMemo(
    () => keywords.filter((k) => k.active).length,
    [keywords],
  );

  async function loadKeywords(adminToken: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/keywords`, {
        headers: buildHeaders(adminToken),
      });
      if (!res.ok) throw new Error("Unauthorized or API error");
      const data = (await res.json()) as ApiResponse;
      setKeywords(data.keywords);
    } catch (error) {
      setMessage("키워드를 불러오지 못했습니다. 토큰을 확인하세요.");
    } finally {
      setLoading(false);
    }
  }

  function addKeyword() {
    const term = newTerm.trim();
    if (!term) return;
    if (keywords.some((k) => k.term === term)) {
      setMessage("이미 존재하는 키워드입니다.");
      return;
    }
    setKeywords((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, term, active: true },
    ]);
    setNewTerm("");
  }

  function toggleKeyword(id: string) {
    setKeywords((prev) =>
      prev.map((k) => (k.id === id ? { ...k, active: !k.active } : k)),
    );
  }

  function removeKeyword(id: string) {
    setKeywords((prev) => prev.filter((k) => k.id !== id));
  }

  async function saveKeywords() {
    if (!token) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/keywords`, {
        method: "POST",
        headers: buildHeaders(token),
        body: JSON.stringify({
          keywords: keywords.map((k) => ({ term: k.term, active: k.active })),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      await loadKeywords(token);
      setMessage("저장 완료");
    } catch (error) {
      setMessage("저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function sendReportNow() {
    if (!token) return;
    setSendingReport(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/report/send`, {
        method: "POST",
        headers: buildHeaders(token),
      });
      if (!res.ok) throw new Error("Report failed");
      const data = (await res.json()) as {
        crawl: { newArticles: number };
        report: { sent: boolean; count: number; reason?: string | null };
      };
      if (!data.report.sent) {
        setMessage(
          `수집은 완료됐지만 메일 발송은 실패했습니다. reason=${data.report.reason ?? "unknown"}`,
        );
        return;
      }
      setMessage(
        `수동 발송 완료: 신규 ${data.crawl.newArticles}건 수집, 리포트 ${data.report.count}건 발송`,
      );
    } catch (error) {
      setMessage("수동 리포트 발송에 실패했습니다.");
    } finally {
      setSendingReport(false);
    }
  }

  async function sendLarkNow() {
    if (!token) return;
    setSendingLark(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/report/send-lark`, {
        method: "POST",
        headers: buildHeaders(token),
      });
      if (!res.ok) throw new Error("Lark report failed");
      const data = (await res.json()) as {
        crawl: { newArticles: number };
        report: { sent: boolean; count: number; reason?: string | null };
      };
      if (!data.report.sent) {
        setMessage(
          `수집은 완료됐지만 Lark 전송은 실패했습니다. reason=${data.report.reason ?? "unknown"}`,
        );
        return;
      }
      setMessage(
        `Lark 전송 완료: 신규 ${data.crawl.newArticles}건 수집, 리포트 ${data.report.count}건 전송`,
      );
    } catch {
      setMessage("Lark 수동 전송에 실패했습니다.");
    } finally {
      setSendingLark(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Daily News Crawler
        </p>
        <h1 className="text-3xl font-bold text-slate-900">키워드 관리</h1>
        <p className="text-slate-600">
          네이버/구글 뉴스 수집용 키워드를 추가하고 활성 상태를 관리합니다.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
              관리자 토큰
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              placeholder="ADMIN_PASSWORD"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
          </div>
          <button
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            onClick={() => loadKeywords(token)}
            disabled={!token || loading}
          >
            불러오기
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
              신규 키워드
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              placeholder="예: SAMG엔터, 캐치 티니핑"
              value={newTerm}
              onChange={(event) => setNewTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addKeyword();
              }}
            />
          </div>
          <button
            className="rounded-lg border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            onClick={addKeyword}
          >
            추가
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <p>
            총 {keywords.length}개 · 활성 {activeCount}개
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
              onClick={sendReportNow}
              disabled={!token || loading || sendingReport || sendingLark}
            >
              지금 메일 발송
            </button>
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              onClick={sendLarkNow}
              disabled={!token || loading || sendingReport || sendingLark}
            >
              지금 Lark 전송
            </button>
            <button
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              onClick={saveKeywords}
              disabled={!token || loading || sendingReport || sendingLark}
            >
              저장
            </button>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {keywords.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              등록된 키워드가 없습니다.
            </div>
          ) : (
            keywords.map((keyword) => (
              <div
                key={keyword.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4"
              >
                <div className="flex items-center gap-3">
                  <button
                    className={`h-4 w-4 rounded-full border ${
                      keyword.active
                        ? "border-emerald-600 bg-emerald-500"
                        : "border-slate-300 bg-slate-200"
                    }`}
                    onClick={() => toggleKeyword(keyword.id)}
                    aria-label="toggle"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    {keyword.term}
                  </span>
                </div>
                <button
                  className="text-xs font-semibold uppercase tracking-wide text-rose-600 hover:text-rose-500"
                  onClick={() => removeKeyword(keyword.id)}
                >
                  삭제
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}
    </main>
  );
}
