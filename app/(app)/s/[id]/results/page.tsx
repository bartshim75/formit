'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useResponses } from '@/hooks/use-responses';
import { useSurvey } from '@/hooks/use-survey';

function aggregateForQuestion(
  answersList: Record<string, unknown>[],
  questionId: string,
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const answers of answersList) {
    const v = answers[questionId];
    const key = v == null || v === '' ? '(비어 있음)' : String(v);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count }));
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: survey } = useSurvey(id);
  const { data: rows = [], isLoading } = useResponses(id);

  const choiceQuestions = useMemo(() => {
    if (!survey) return [];
    const out: { id: string; title: string }[] = [];
    for (const sec of survey.sections) {
      for (const q of sec.questions) {
        if (q.type === 'single_choice' || q.type === 'single') {
          out.push({ id: q.id, title: q.title || q.id });
        }
      }
    }
    return out;
  }, [survey]);

  const [selectedQ, setSelectedQ] = useState<string | null>(null);

  const activeQId = selectedQ ?? choiceQuestions[0]?.id ?? null;

  const chartRows = useMemo(() => {
    if (!activeQId) return [];
    const list = rows.map((r) =>
      r.answers && typeof r.answers === 'object' ? (r.answers as Record<string, unknown>) : {},
    );
    return aggregateForQuestion(list, activeQId);
  }, [rows, activeQId]);

  const total = rows.length;

  return (
    <main className="grid gap-4">
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="border-border bg-bg-elev rounded-[24px] border p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">결과 분석</h1>
              <p className="text-ink-2 mt-1 text-sm">
                응답 추이와 객관식(단일) 문항 분포를 확인하세요.
              </p>
            </div>
            <div className="border-border bg-bg-soft text-ink-2 rounded-full border px-4 py-2 text-sm font-extrabold">
              총 응답 {isLoading ? '…' : `${total}건`}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              ['응답', isLoading ? '…' : `${total.toLocaleString()}건`],
              ['완료율', '78%'],
              ['평균 응답 시간', '2분 42초'],
              ['범주', '방금 전'],
            ].map(([k, v]) => (
              <div key={k} className="border-border bg-bg rounded-2xl border px-4 py-4">
                <div className="text-ink-3 text-xs font-extrabold">{k}</div>
                <div className="mt-2 text-lg font-extrabold tracking-tight">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-border bg-bg-elev rounded-[24px] border p-6 shadow-sm">
          <div className="text-ink-3 text-xs font-extrabold">알림</div>
          <div className="mt-3 grid gap-2">
            {[
              ['✅', '이번 주 평균 응답률이 좋아요'],
              ['🧠', '응답자 화면을 단순화하면 완료율이 상승해요'],
              ['⚠️', '특정 문항에서 이탈이 생길 수 있어요'],
            ].map(([e, t]) => (
              <div key={t} className="border-border bg-bg rounded-2xl border p-3 text-xs">
                <div className="flex items-start gap-2">
                  <div className="bg-bg-soft grid h-7 w-7 place-items-center rounded-xl">{e}</div>
                  <div className="text-ink-2 leading-5 font-semibold">{t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {choiceQuestions.length > 0 && total > 0 && (
        <section className="border-border bg-bg-elev rounded-[24px] border p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-extrabold tracking-tight">객관식 분포</h2>
            <select
              className="border-border bg-bg rounded-lg border px-3 py-2 text-sm font-semibold"
              value={activeQId ?? ''}
              onChange={(e) => setSelectedQ(e.target.value || null)}
            >
              {choiceQuestions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,26,20,0.12)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(31,26,20,0.12)',
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 700 }}
                />
                <Bar dataKey="count" name="응답 수" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="border-border bg-bg-elev rounded-[24px] border p-6 shadow-sm">
        {isLoading ? (
          <div className="text-ink-2 text-sm">불러오는 중…</div>
        ) : total === 0 ? (
          <div className="text-ink-2 text-sm">
            아직 응답이 없어요. 공유 페이지에서 링크를 배포해 보세요.
          </div>
        ) : (
          <div className="grid gap-3">
            {rows.slice(0, 50).map((r) => (
              <div key={r.id} className="border-border bg-bg rounded-xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-ink-3 font-mono text-xs">{r.id}</div>
                  <div className="text-ink-3 text-xs">{r.submitted_at ?? ''}</div>
                </div>
                <pre className="bg-bg-soft text-ink-2 mt-3 overflow-auto rounded-lg p-3 text-xs leading-5">
                  {JSON.stringify(r.answers, null, 2)}
                </pre>
              </div>
            ))}
            {total > 50 && <div className="text-ink-3 text-xs">최신 50개만 표시합니다.</div>}
          </div>
        )}
      </section>
    </main>
  );
}
