'use client';

import { useEffect } from 'react';

import { BlockList } from './BlockList';
import { Inspector } from './Inspector';
import { useBuilderStore } from './use-builder-store';

export function BuilderPanel() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'BUTTON' ||
        tag === 'SELECT' ||
        tag === 'A' ||
        el?.isContentEditable
      )
        return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selection, removeQuestion } = useBuilderStore.getState();
        if (selection) removeQuestion(selection.sectionId, selection.questionId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <BlockList />
      <Inspector />
    </div>
  );
}
