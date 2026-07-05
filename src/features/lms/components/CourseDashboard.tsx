import {
  Video,
  FileText,
  FileQuestion,
  MessageSquare,
  Globe,
  ArrowRight,
} from "lucide-react";
import { AnimeFadeUp } from "../../../components/animations/AnimeWrappers";

interface CourseDashboardProps {
  module: any; // LMSModule
  lessons: any[]; // LMSLesson[]
  completions: Record<string, boolean>;
  onSelectLesson: (lesson: any) => void;
}

export function CourseDashboard({
  module,
  lessons,
  completions,
  onSelectLesson,
}: CourseDashboardProps) {
  if (!module) return null;

  const moduleLessons = lessons.filter((l) => l.module_id === module.id);

  // Group lessons by type for the pedagogical cards
  const syncClasses = moduleLessons.filter(
    (l) => l.type === "video" || l.type === "resource",
  );
  const assignments = moduleLessons.filter((l) => l.type === "assignment");
  const quizzes = moduleLessons.filter((l) => l.type === "quiz");
  const forums = moduleLessons.filter((l) => l.type === "forum");
  const materials = moduleLessons.filter(
    (l) => l.type === "document" || l.type === "h5p",
  );

  const renderCard = (
    title: string,
    icon: any,
    colorClass: string,
    items: any[],
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-150 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
          <div className={`p-3 rounded-2xl ${colorClass}`}>{icon}</div>
          <h3 className="font-bold font-serif text-lg text-slate-800 dark:text-white">
            {title}
          </h3>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const isComp = completions[item.id] || false;
            return (
              <button
                key={item.id}
                onClick={() => onSelectLesson(item)}
                className="w-full text-left group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10 cursor-pointer"
              >
                <div className="flex items-center gap-3 overflow-hidden pr-2">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${isComp ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                  />
                  <span
                    className={`text-sm font-medium truncate ${isComp ? "text-gray-500" : "text-slate-700 dark:text-gray-200"} group-hover:text-gold transition-colors`}
                  >
                    {item.title}
                  </span>
                </div>
                <ArrowRight
                  size={14}
                  className="text-gray-400 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all flex-shrink-0"
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AnimeFadeUp className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          {module.title}
        </h2>
        {module.description && (
          <p className="text-gray-500 dark:text-gray-400">
            {module.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderCard(
          "Clases Virtuales",
          <Video size={24} />,
          "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
          syncClasses,
        )}
        {renderCard(
          "Actividades Autónomas",
          <FileText size={24} />,
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
          assignments,
        )}
        {renderCard(
          "Foros de Debate",
          <MessageSquare size={24} />,
          "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
          forums,
        )}
        {renderCard(
          "Material de Estudio",
          <Globe size={24} />,
          "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
          materials,
        )}
        {renderCard(
          "Evaluaciones",
          <FileQuestion size={24} />,
          "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
          quizzes,
        )}
      </div>

      {moduleLessons.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
          <p className="text-gray-500">
            Aún no hay actividades publicadas en esta unidad.
          </p>
        </div>
      )}
    </AnimeFadeUp>
  );
}
