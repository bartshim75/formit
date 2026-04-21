'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { AddBlockMenu } from './AddBlockMenu';
import { QuestionBlock } from './QuestionBlock';
import { useBuilderStore } from './use-builder-store';

export function BlockList() {
  const survey = useBuilderStore((s) => s.survey);
  const selection = useBuilderStore((s) => s.selection);
  const selectQuestion = useBuilderStore((s) => s.selectQuestion);
  const reorderQuestionsInSection = useBuilderStore((s) => s.reorderQuestionsInSection);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!survey) return null;

  function handleDragEnd(event: DragEndEvent) {
    const current = useBuilderStore.getState().survey;
    if (!current) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const aid = String(active.id);
    const oid = String(over.id);

    for (const sec of current.sections) {
      const from = sec.questions.findIndex((q) => q.id === aid);
      const to = sec.questions.findIndex((q) => q.id === oid);
      if (from >= 0 && to >= 0) {
        reorderQuestionsInSection(sec.id, from, to);
        return;
      }
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="border-border bg-bg-elev rounded-2xl border p-5 shadow-sm">
        <h2 className="text-lg font-extrabold tracking-tight">문항</h2>
        <p className="text-ink-3 mt-1 text-xs">드래그로 순서 변경 · Delete로 선택 문항 삭제</p>

        <div className="mt-5">
          {survey.sections.map((sec) => (
            <div key={sec.id} className="mb-8 last:mb-0">
              <div className="text-ink mb-2 text-sm font-extrabold">{sec.title}</div>
              {sec.description && <p className="text-ink-2 mb-3 text-xs">{sec.description}</p>}
              <SortableContext
                items={sec.questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {sec.questions.map((q, i) => (
                    <QuestionBlock
                      key={q.id}
                      question={q}
                      sectionId={sec.id}
                      index={i}
                      selected={selection?.sectionId === sec.id && selection?.questionId === q.id}
                      onSelect={() => selectQuestion({ sectionId: sec.id, questionId: q.id })}
                    />
                  ))}
                </div>
              </SortableContext>
              <div className="mt-3">
                <AddBlockMenu sectionId={sec.id} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  );
}
