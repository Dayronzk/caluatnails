import { useState } from 'react';
import type { QuizQuestion } from '@/mocks/courseData';

interface LessonQuizProps {
  questions: QuizQuestion[];
  lessonTitle: string;
  onFinish: () => void;
}

type QuizState = 'idle' | 'active' | 'finished';

export function LessonQuiz({ questions, lessonTitle, onFinish }: LessonQuizProps) {
  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = questions[currentQ];
  const selected = selectedAnswers[currentQ];
  const isCorrect = selected === question?.correct;
  const score = selectedAnswers.filter((a, i) => a === questions[i]?.correct).length;
  const passingScore = Math.ceil(questions.length * 0.6);
  const passed = score >= passingScore;

  const handleAnswer = (idx: number) => {
    if (selected !== undefined) return;
    const updated = [...selectedAnswers];
    updated[currentQ] = idx;
    setSelectedAnswers(updated);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setQuizState('finished');
      onFinish();
    }
  };

  const restart = () => {
    setQuizState('idle');
    setCurrentQ(0);
    setSelectedAnswers([]);
    setShowExplanation(false);
  };

  if (quizState === 'idle') {
    return (
      <div className="bg-purple-50 rounded-xl p-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 flex items-center justify-center bg-purple-100 rounded-full mb-4">
          <i className="ri-file-text-line text-3xl text-purple-600"></i>
        </div>
        <h4 className="text-lg font-bold text-gray-900 mb-2">{lessonTitle}</h4>
        <p className="text-gray-500 text-sm mb-1">
          {questions.length} pregunta{questions.length !== 1 ? 's' : ''} de opción múltiple
        </p>
        <p className="text-gray-400 text-xs mb-6">
          Necesitas el {Math.round((passingScore / questions.length) * 100)}% para aprobar ({passingScore}/{questions.length} correctas)
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {['Opción múltiple', 'Corrección inmediata', 'Explicaciones detalladas'].map((tag) => (
            <span key={tag} className="bg-white border border-purple-100 text-purple-600 text-xs font-medium px-3 py-1.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <button
          onClick={() => setQuizState('active')}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap text-sm"
        >
          <i className="ri-play-fill mr-2"></i>
          Comenzar Evaluación
        </button>
      </div>
    );
  }

  if (quizState === 'active') {
    return (
      <div className="bg-purple-50 rounded-xl overflow-hidden">
        {/* Progress */}
        <div className="px-5 pt-4 pb-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">
              Pregunta {currentQ + 1} de {questions.length}
            </span>
            <span className="text-purple-600 text-xs font-bold">
              {score} correcta{score !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${((currentQ + (selected !== undefined ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-5">
          <h4 className="font-semibold text-gray-900 text-sm mb-5 leading-relaxed">
            {question.question}
          </h4>

          {/* Options */}
          <div className="flex flex-col gap-2 mb-5">
            {question.options.map((opt, idx) => {
              let style = 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50';
              if (selected !== undefined) {
                if (idx === question.correct) style = 'bg-green-50 border-green-300 text-green-800';
                else if (idx === selected && !isCorrect) style = 'bg-red-50 border-red-200 text-red-700';
                else style = 'bg-white border-gray-100 text-gray-400';
              }
              const letters = ['A', 'B', 'C', 'D'];
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selected !== undefined}
                  className={`w-full text-left border rounded-xl px-4 py-3 text-sm transition-all flex items-center gap-3 cursor-pointer disabled:cursor-default ${style}`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full border text-xs font-bold flex-shrink-0 ${
                    selected !== undefined && idx === question.correct
                      ? 'border-green-400 bg-green-100 text-green-700'
                      : selected !== undefined && idx === selected && !isCorrect
                      ? 'border-red-300 bg-red-50 text-red-500'
                      : 'border-current'
                  }`}>
                    {selected !== undefined && idx === question.correct ? (
                      <i className="ri-check-line text-xs"></i>
                    ) : selected !== undefined && idx === selected && !isCorrect ? (
                      <i className="ri-close-line text-xs"></i>
                    ) : (
                      letters[idx]
                    )}
                  </div>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && question.explanation && (
            <div className={`rounded-xl p-4 mb-4 border text-sm leading-relaxed ${
              isCorrect ? 'bg-green-50 border-green-100 text-green-800' : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <i className={`${isCorrect ? 'ri-check-double-line' : 'ri-information-line'} text-base`}></i>
                <span className="font-semibold text-xs">{isCorrect ? '¡Correcto!' : 'Respuesta incorrecta'}</span>
              </div>
              <p className="text-xs">{question.explanation}</p>
            </div>
          )}
          {showExplanation && !question.explanation && (
            <div className={`rounded-xl p-3 mb-4 border text-xs ${
              isCorrect ? 'bg-green-50 border-green-100 text-green-700' : 'bg-rose-50 border-rose-100 text-rose-700'
            }`}>
              {isCorrect ? '¡Correcto!' : 'Respuesta incorrecta — la respuesta correcta está resaltada en verde.'}
            </div>
          )}

          {selected !== undefined && (
            <button
              onClick={handleNext}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap text-sm"
            >
              {currentQ < questions.length - 1 ? 'Siguiente Pregunta' : 'Ver Resultados'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // finished
  const pct = Math.round((score / questions.length) * 100);
  return (
    <div className="bg-purple-50 rounded-xl p-8 text-center">
      <div className={`w-20 h-20 flex items-center justify-center rounded-full mx-auto mb-5 ${passed ? 'bg-green-100' : 'bg-orange-100'}`}>
        <i className={`text-4xl ${passed ? 'ri-trophy-line text-green-600' : 'ri-emotion-sad-line text-orange-500'}`}></i>
      </div>
      <h4 className="text-xl font-bold text-gray-900 mb-2">
        {passed ? '¡Evaluación Aprobada!' : 'Sigue Practicando'}
      </h4>
      <p className="text-gray-500 text-sm mb-5">
        Obtuviste{' '}
        <strong className="text-gray-900">{score}/{questions.length}</strong> respuestas correctas —{' '}
        <strong className={passed ? 'text-green-600' : 'text-orange-500'}>{pct}%</strong>
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div
          className={`h-2.5 rounded-full ${passed ? 'bg-green-500' : 'bg-orange-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {passed && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5 flex items-center gap-3 text-left">
          <i className="ri-medal-line text-green-600 text-2xl flex-shrink-0"></i>
          <div>
            <p className="text-green-800 font-semibold text-sm">¡Excelente trabajo!</p>
            <p className="text-green-600 text-xs">Superaste el mínimo requerido. Puedes marcar esta lección como completada.</p>
          </div>
        </div>
      )}
      {!passed && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-5 flex items-center gap-3 text-left">
          <i className="ri-information-line text-orange-500 text-2xl flex-shrink-0"></i>
          <div>
            <p className="text-orange-800 font-semibold text-sm">Puedes intentarlo de nuevo</p>
            <p className="text-orange-600 text-xs">Necesitas {passingScore}/{questions.length} ({Math.round((passingScore / questions.length) * 100)}%) para aprobar. ¡Repasa el contenido y vuelve a intentarlo!</p>
          </div>
        </div>
      )}
      <button
        onClick={restart}
        className="border border-purple-200 text-purple-600 hover:bg-purple-50 text-sm font-medium px-6 py-2.5 rounded-full cursor-pointer whitespace-nowrap transition-colors"
      >
        <i className="ri-refresh-line mr-2"></i>
        Repetir Evaluación
      </button>
    </div>
  );
}
