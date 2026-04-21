'use client';

import QRCode from 'qrcode';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { captureEvent } from '@/lib/analytics';
import { createClient } from '@/lib/supabase/client';
import { useSurvey } from '@/hooks/use-survey';

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const { data: survey, refetch } = useSurvey(id);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const shareUrl = useMemo(
    () => (typeof window === 'undefined' ? '' : `${window.location.origin}/r/${id}`),
    [id],
  );

  useEffect(() => {
    if (!shareUrl) return;
    void QRCode.toDataURL(shareUrl, {
      width: 220,
      margin: 1,
      color: { dark: '#111827', light: '#ffffff' },
    }).then(setQrDataUrl);
  }, [shareUrl]);

  const embedCode = useMemo(
    () =>
      `<iframe src="${shareUrl}" title="Formit 설문" style="width:100%;min-height:560px;border:0;border-radius:12px" loading="lazy"></iframe>`,
    [shareUrl],
  );

  const toggleLive = useMutation({
    mutationFn: async () => {
      if (!survey) throw new Error('no survey');
      const next = survey.status === 'live' ? 'draft' : 'live';
      const sb = createClient();
      const { error } = await sb.from('surveys').update({ status: next }).eq('id', survey.id);
      if (error) throw error;
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['survey', id] });
      await refetch();
    },
  });

  return (
    <main className="grid gap-4 lg:grid-cols-2">
      <section className="border-border bg-bg-elev rounded-2xl border p-6 shadow-sm">
        <h1 className="text-lg font-extrabold tracking-tight">공유</h1>
        <p className="text-ink-2 mt-1 text-sm">
          응답자 링크·QR·임베드를 활용하세요. 공개(live)일 때만 /r 링크가 열립니다.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="border-border bg-bg rounded-xl border px-4 py-3 text-sm sm:col-span-2">
            <div className="text-ink-3 text-xs font-semibold">응답 링크</div>
            <div className="mt-1 font-mono text-xs break-all">{shareUrl || '…'}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="border-border bg-bg-elev hover:bg-bg-soft rounded-full border px-4 py-2 text-sm font-semibold"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                  captureEvent('share_link_copied', { survey_id: id });
                }}
              >
                링크 복사
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  className="border-border bg-bg-elev hover:bg-bg-soft rounded-full border px-4 py-2 text-sm font-semibold"
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: survey?.title ?? 'Formit 설문',
                        text: '설문에 참여해 주세요',
                        url: shareUrl,
                      });
                      captureEvent('share_native', { survey_id: id });
                    } catch {
                      /* 사용자 취소 */
                    }
                  }}
                >
                  기기에서 공유…
                </button>
              )}
            </div>
          </div>

          <div className="border-border bg-bg flex flex-col items-center justify-center rounded-xl border p-4">
            <div className="text-ink-3 text-xs font-semibold">QR 코드</div>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="설문 링크 QR"
                className="mt-3 h-44 w-44 rounded-lg bg-white p-2"
              />
            ) : (
              <div className="text-ink-3 mt-6 text-xs">생성 중…</div>
            )}
          </div>

          <div className="border-border bg-bg rounded-xl border px-4 py-3 text-sm">
            <div className="text-ink-3 text-xs font-semibold">웹사이트 임베드</div>
            <textarea
              readOnly
              className="border-border bg-bg-soft mt-2 h-28 w-full resize-none rounded-lg border p-2 font-mono text-[11px] leading-relaxed"
              value={embedCode}
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              className="border-border bg-bg-elev hover:bg-bg-soft mt-2 rounded-full border px-4 py-2 text-xs font-semibold"
              onClick={async () => {
                await navigator.clipboard.writeText(embedCode);
                captureEvent('embed_code_copied', { survey_id: id });
              }}
            >
              임베드 코드 복사
            </button>
          </div>
        </div>
      </section>

      <section className="border-border bg-bg-elev rounded-2xl border p-6 shadow-sm">
        <h2 className="text-lg font-extrabold tracking-tight">공개 상태</h2>
        <p className="text-ink-2 mt-1 text-sm">draft ↔ live를 전환합니다.</p>

        <div className="border-border bg-bg mt-5 flex items-center justify-between rounded-xl border px-4 py-4">
          <div>
            <div className="text-ink-3 text-xs font-semibold">현재 상태</div>
            <div className="mt-1 text-sm font-extrabold">{survey?.status ?? '—'}</div>
          </div>
          <button
            type="button"
            className="border-accent bg-accent shadow-pop hover:bg-accent-ink rounded-full border px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={!survey || toggleLive.isPending}
            onClick={async () => {
              if (!survey) return;
              await toggleLive.mutateAsync();
              captureEvent('survey_status_toggled', { survey_id: id });
            }}
          >
            {survey?.status === 'live' ? '비공개로' : '공개로'}
          </button>
        </div>
      </section>
    </main>
  );
}
