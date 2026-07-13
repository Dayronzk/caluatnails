import { useState } from "react";
import { quizQuestions } from "@/mocks/courseData";

type QuizState = "idle" | "active" | "finished";

export default function EvaluacionesAutomaticas() {
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = quizQuestions[currentQ];
  const selected = selectedAnswers[currentQ];
  const isCorrect = selected === question.correct;
  const score = selectedAnswers.filter((a, i) => a === quizQuestions[i].correct).length;

  const handleAnswer = (idx: number) => {
    if (selected !== undefined) return;
    const updated = [...selectedAnswers];
    updated[currentQ] = idx;
    setSelectedAnswers(updated);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setQuizState("finished");
    }
  };

  const restart = () => {
    setQuizState("idle");
    setCurrentQ(0);
    setSelectedAnswers([]);
    setShowExplanation(false);
  };

  return (
    <section id="evaluaciones" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-rose-600 text-sm font-semibold tracking-widest uppercase mb-3">
            Módulo 05 — Evaluaciones
          </span>
          <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Pon a Prueba tu
            <br />
            <span className="text-rose-600">Conocimiento</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            Evaluaciones automáticas con corrección inmediata, explicaciones detalladas y seguimiento de tu progreso.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left info */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {[
              {
                icon: "ri-brain-line",
                title: "Corrección Automática",
                desc: "Resultados instantáneos al responder cada pregunta con explicación detallada.",
                color: "rose",
              },
              {
                icon: "ri-bar-chart-2-line",
                title: "Seguimiento de Progreso",
                desc: "Visualiza tu avance módulo a módulo y detecta las áreas a mejorar.",
                color: "orange",
              },
              {
                icon: "ri-medal-line",
                title: "Certificado al Aprobar",
                desc: "Al superar el 80% obtienes tu certificado de módulo con sello oficial.",
                color: "rose",
              },
              {
                icon: "ri-refresh-line",
                title: "Intentos Ilimitados",
                desc: "Repite las evaluaciones las veces que necesites hasta dominar el contenido.",
                color: "orange",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 bg-stone-50 rounded-2xl p-5">
                <div
                  className={`w-11 h-11 flex items-center justify-center rounded-xl flex-shrink-0 ${
                    item.color === "rose" ? "bg-rose-100" : "bg-orange-100"
                  }`}
                >
                  <i
                    className={`${item.icon} text-xl ${
                      item.color === "rose" ? "text-rose-600" : "text-orange-500"
                    }`}
                  ></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right quiz */}
          <div className="lg:col-span-3">
            {quizState === "idle" && (
              <div className="bg-stone-50 rounded-3xl border border-stone-100 p-10 text-center flex flex-col items-center">
                <div className="w-20 h-20 flex items-center justify-center bg-rose-100 rounded-full mb-6">
                  <i className="ri-file-text-line text-4xl text-rose-600"></i>
                </div>
                <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-3">
                  Evaluación de Técnicas
                </h3>
                <p className="text-gray-500 text-sm mb-2 max-w-xs">
                  {quizQuestions.length} preguntas de opción múltiple sobre manicura y pedicura profesional.
                </p>
                <p className="text-gray-400 text-xs mb-8">Tiempo estimado: 5-8 minutos</p>
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  {["Técnicas de Gel", "Herramientas", "Pigmentos", "Polygel"].map((tag) => (
                    <span
                      key={tag}
                      className="bg-white border border-rose-100 text-rose-600 text-xs font-medium px-3 py-1.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setQuizState("active")}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-play-fill mr-2"></i>
                  Comenzar Evaluación
                </button>
              </div>
            )}

            {quizState === "active" && (
              <div className="bg-stone-50 rounded-3xl border border-stone-100 overflow-hidden">
                {/* Progress bar */}
                <div className="p-5 pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-500 text-xs font-medium">
                      Pregunta {currentQ + 1} de {quizQuestions.length}
                    </span>
                    <span className="text-rose-600 text-xs font-bold">
                      {score} correctas
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${((currentQ + (selected !== undefined ? 1 : 0)) / quizQuestions.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="p-7">
                  <h3 className="font-semibold text-gray-900 text-base mb-6 leading-relaxed">
                    {question.question}
                  </h3>

                  {/* Options */}
                  <div className="flex flex-col gap-3 mb-6">
                    {question.options.map((opt, idx) => {
                      let style = "bg-white border-gray-200 text-gray-700";
                      if (selected !== undefined) {
                        if (idx === question.correct) style = "bg-green-50 border-green-300 text-green-800";
                        else if (idx === selected && !isCorrect)
                          style = "bg-red-50 border-red-200 text-red-700";
                        else style = "bg-white border-gray-100 text-gray-400";
                      } else {
                        style = "bg-white border-gray-200 text-gray-700 hover:border-rose-300 hover:bg-rose-50";
                      }
                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          disabled={selected !== undefined}
                          className={`w-full text-left border rounded-xl px-4 py-3 text-sm transition-all flex items-center gap-3 cursor-pointer ${style} disabled:cursor-default`}
                        >
                          <div
                            className={`w-6 h-6 flex items-center justify-center rounded-full border text-xs font-bold flex-shrink-0 ${
                              selected !== undefined && idx === question.correct
                                ? "border-green-400 bg-green-100 text-green-700"
                                : selected !== undefined && idx === selected && !isCorrect
                                ? "border-red-300 bg-red-50 text-red-500"
                                : "border-current"
                            }`}
                          >
                            {selected !== undefined && idx === question.correct ? (
                              <i className="ri-check-line text-xs"></i>
                            ) : selected !== undefined && idx === selected && !isCorrect ? (
                              <i className="ri-close-line text-xs"></i>
                            ) : (
                              String.fromCharCode(65 + idx)
                            )}
                          </div>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {showExplanation && (
                    <div
                      className={`rounded-xl p-4 mb-5 border text-sm leading-relaxed ${
                        isCorrect
                          ? "bg-green-50 border-green-100 text-green-800"
                          : "bg-rose-50 border-rose-100 text-rose-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <i className={`${isCorrect ? "ri-check-double-line" : "ri-information-line"} text-base`}></i>
                        <span className="font-semibold text-xs">{isCorrect ? "¡Correcto!" : "Respuesta incorrecta"}</span>
                      </div>
                      <p className="text-xs">{question.explanation}</p>
                    </div>
                  )}

                  {selected !== undefined && (
                    <button
                      onClick={handleNext}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap text-sm"
                    >
                      {currentQ < quizQuestions.length - 1 ? "Siguiente Pregunta" : "Ver Resultados"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {quizState === "finished" && (
              <div className="bg-stone-50 rounded-3xl border border-stone-100 p-10 text-center">
                <div
                  className={`w-24 h-24 flex items-center justify-center rounded-full mx-auto mb-6 ${
                    score >= 4 ? "bg-green-100" : "bg-orange-100"
                  }`}
                >
                  <i
                    className={`text-5xl ${
                      score >= 4 ? "ri-trophy-line text-green-600" : "ri-emotion-sad-line text-orange-500"
                    }`}
                  ></i>
                </div>
                <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">
                  {score >= 4 ? "¡Excelente Resultado!" : "Sigue Practicando"}
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Obtuviste{" "}
                  <strong className="text-gray-900">
                    {score}/{quizQuestions.length}
                  </strong>{" "}
                  respuestas correctas —{" "}
                  <strong className={score >= 4 ? "text-green-600" : "text-orange-500"}>
                    {Math.round((score / quizQuestions.length) * 100)}%
                  </strong>
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
                  <div
                    className={`h-2.5 rounded-full ${score >= 4 ? "bg-green-500" : "bg-orange-400"}`}
                    style={{ width: `${(score / quizQuestions.length) * 100}%` }}
                  ></div>
                </div>
                {score >= 4 && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <i className="ri-medal-line text-green-600 text-2xl flex-shrink-0"></i>
                    <div className="text-left">
                      <p className="text-green-800 font-semibold text-sm">Certificado Desbloqueado</p>
                      <p className="text-green-600 text-xs">Cumpliste el mínimo de 80% para obtener tu certificado de módulo.</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={restart}
                    className="border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-medium px-5 py-2.5 rounded-full cursor-pointer whitespace-nowrap transition-colors"
                  >
                    Repetir Evaluación
                  </button>
                  <button
                    onClick={() => {
                      const el = document.querySelector("#foro");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-5 py-2.5 rounded-full cursor-pointer whitespace-nowrap transition-colors"
                  >
                    Ver el Foro
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
