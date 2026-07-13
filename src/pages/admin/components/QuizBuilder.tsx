import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import type { QuizQuestion } from '@/lib/types';

interface QuizBuilderProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

const LETTERS = ['A', 'B', 'C', 'D'];

const emptyQuestion = (): QuizQuestion => ({
  question: '',
  options: ['', '', '', ''],
  correct: 0,
  explanation: '',
});

export function QuizBuilder({ questions, onChange }: QuizBuilderProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(questions.length === 0 ? null : 0);

  const addQuestion = () => {
    const updated = [...questions, emptyQuestion()];
    onChange(updated);
    setExpandedIdx(updated.length - 1);
  };

  const removeQuestion = (idx: number) => {
    const updated = questions.filter((_, i) => i !== idx);
    onChange(updated);
    setExpandedIdx(updated.length > 0 ? Math.min(idx, updated.length - 1) : null);
  };

  const updateQuestion = (idx: number, patch: Partial<QuizQuestion>) => {
    const updated = questions.map((q, i) => (i === idx ? { ...q, ...patch } : q));
    onChange(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const updated = questions.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[oIdx] = value;
      return { ...q, options: opts };
    });
    onChange(updated);
  };

  const isQuestionValid = (q: QuizQuestion) =>
    q.question.trim() !== '' && q.options.every((o) => o.trim() !== '');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          Preguntas de la evaluación
          <span className="ml-2 text-xs text-gray-400 font-normal">— agrega preguntas de opción múltiple</span>
        </label>
        <span className="text-xs text-gray-400">{questions.length} pregunta{questions.length !== 1 ? 's' : ''}</span>
      </div>

      {questions.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-full mx-auto mb-3">
            <i className="ri-question-line text-purple-600 text-xl"></i>
          </div>
          <p className="text-sm text-gray-500 mb-1">No hay preguntas todavía</p>
          <p className="text-xs text-gray-400">Agrega preguntas de opción múltiple para esta evaluación</p>
        </div>
      )}

      {questions.map((q, qIdx) => {
        const isExpanded = expandedIdx === qIdx;
        const valid = isQuestionValid(q);

        return (
          <div key={qIdx} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors select-none"
              onClick={() => setExpandedIdx(isExpanded ? null : qIdx)}
            >
              <div className={`w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 text-xs font-bold ${valid ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                {valid ? <CheckCircle className="w-4 h-4" /> : qIdx + 1}
              </div>
              <p className={`flex-1 text-sm truncate ${q.question ? 'text-gray-800 font-medium' : 'text-gray-400 italic'}`}>
                {q.question || 'Nueva pregunta...'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeQuestion(qIdx); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>

            {/* Body */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4 bg-gray-50/40">
                {/* Question text */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Pregunta <span className="text-rose-500">*</span></label>
                  <textarea
                    value={q.question}
                    onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none text-sm"
                    placeholder="Escribe la pregunta aquí..."
                  />
                </div>

                {/* Options */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Opciones <span className="text-rose-500">*</span>
                    <span className="ml-1 text-gray-400 font-normal">— haz clic en el círculo para marcar la respuesta correcta</span>
                  </label>
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuestion(qIdx, { correct: oIdx })}
                          className={`w-7 h-7 flex items-center justify-center rounded-full border-2 flex-shrink-0 transition-all cursor-pointer font-bold text-xs ${
                            q.correct === oIdx
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-gray-300 text-gray-400 hover:border-green-300'
                          }`}
                        >
                          {q.correct === oIdx ? <i className="ri-check-line text-xs"></i> : LETTERS[oIdx]}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
                            q.correct === oIdx
                              ? 'border-green-300 bg-green-50 focus:border-green-400 focus:ring-2 focus:ring-green-100'
                              : 'border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100'
                          }`}
                          placeholder={`Opción ${LETTERS[oIdx]}...`}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                    <i className="ri-information-line"></i>
                    La opción con el círculo verde es la respuesta correcta
                  </p>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Explicación <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={q.explanation ?? ''}
                    onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none text-sm"
                    placeholder="Explica por qué esta respuesta es correcta..."
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addQuestion}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-purple-200 text-purple-600 text-sm font-medium hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Agregar pregunta
      </button>
    </div>
  );
}
