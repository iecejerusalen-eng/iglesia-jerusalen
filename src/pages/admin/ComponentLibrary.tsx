import React, { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Autocomplete,
  AutocompleteInput,
  AutocompletePopup,
  AutocompleteList,
  AutocompleteItem,
  AutocompleteEmpty,
  AutocompleteGroup,
  type AutocompleteItemType,
} from "@/components/ui/autocomplete";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import VideoPlayer from "@/components/ui/video-player";
import { VideoThumbnailPlayer } from "@/components/ui/video-thumbnail-player";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { BibleVerseLink } from "@/components/ui/BibleVerseLink";
import { FooterBreadcrumb } from "@/components/common/FooterBreadcrumb";
import { toast } from "sonner";
import {
  Sparkles,
  Layers,
  Search,
  Video,
  BookOpen,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Copy,
  Check,
  Code2,
  SlidersHorizontal,
  ChevronRight,
  Home,
  Play,
} from "lucide-react";

type TabType = "all" | "buttons" | "autocomplete" | "breadcrumbs" | "alerts" | "video" | "progress";

const SAMPLE_AUTOCOMPLETE_ITEMS: AutocompleteItemType[] = [
  {
    value: "1",
    label: "El Ancla de Nuestra Alma",
    category: "Prédicas y Devocionales",
    description: "Pastor Roberto Gómez • 15 de julio de 2026",
    icon: <Video className="w-4 h-4 text-amber-400" />,
  },
  {
    value: "2",
    label: "Caminando en Amor y Unidad",
    category: "Prédicas y Devocionales",
    description: "Pastora Elizabeth de Gómez • 12 de julio de 2026",
    icon: <Video className="w-4 h-4 text-amber-400" />,
  },
  {
    value: "3",
    label: "Cuan Grande es Él",
    category: "Biblioteca de Alabanzas",
    description: "Himno Clásico • Tono: SOL (G) • 75 BPM",
    icon: <Sparkles className="w-4 h-4 text-blue-400" />,
  },
  {
    value: "4",
    label: "Fundamentos de la Fe Cristiana",
    category: "Aula Virtual (LMS)",
    description: "Curso Teológico • 8 Lecciones",
    icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
  },
];

const BUTTON_ITEMS: {
  variant: NonNullable<ButtonProps["variant"]>;
  name: string;
  desc: string;
  code: string;
}[] = [
  {
    variant: "glass",
    name: "Glass Estándar",
    desc: "Vidrio traslúcido con reflejo metálico sutil",
    code: `<Button variant="glass">Boton Glass</Button>`,
  },
  {
    variant: "glass-primary",
    name: "Glass Azul Primario",
    desc: "Glassmorphism con tinte azul noche institucional",
    code: `<Button variant="glass-primary">Glass Primario</Button>`,
  },
  {
    variant: "glass-gold",
    name: "Glass Dorado Noble",
    desc: "Glassmorphism premium con acentos dorados",
    code: `<Button variant="glass-gold">Glass Dorado</Button>`,
  },
  {
    variant: "glass-emerald",
    name: "Glass Esmeralda",
    desc: "Ideal para confirmaciones y estados positivos",
    code: `<Button variant="glass-emerald">Glass Esmeralda</Button>`,
  },
  {
    variant: "glass-rose",
    name: "Glass Rosa / Destructivo",
    desc: "Para advertencias delicadas o acciones de alerta",
    code: `<Button variant="glass-rose">Glass Rosa</Button>`,
  },
  {
    variant: "secondary",
    name: "Secundario Sólido",
    desc: "Botón alternativo institucional",
    code: `<Button variant="secondary">Secundario</Button>`,
  },
  {
    variant: "default",
    name: "Solido Por Defecto",
    desc: "Boton institucional azul principal",
    code: `<Button variant="default">Sólido</Button>`,
  },
  {
    variant: "outline",
    name: "Borde Definido (Outline)",
    desc: "Contorno elegante para acciones secundarias",
    code: `<Button variant="outline">Outline</Button>`,
  },
  {
    variant: "ghost",
    name: "Fantasma (Ghost)",
    desc: "Sin fondo ni contorno hasta interactuar",
    code: `<Button variant="ghost">Ghost</Button>`,
  },
];

export function ComponentLibrary() {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Controls Playground
  const [btnSize, setBtnSize] = useState<"sm" | "default" | "lg">("default");
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [isDisabledState, setIsDisabledState] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Autocomplete State
  const [autoVal, setAutoVal] = useState("");

  // Circular progress state
  const [progressVal, setProgressVal] = useState(78);

  const copySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Código copiado al portapapeles");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const triggerToast = (type: "success" | "error" | "warning" | "info") => {
    if (type === "success") {
      toast.success("¡Operación completada con éxito!", {
        description: "Alerta flotante en el centro inferior de la pantalla con disolución.",
      });
    } else if (type === "error") {
      toast.error("Ha ocurrido un error inesperado", {
        description: "Verifica los permisos o la conexión a internet.",
      });
    } else if (type === "warning") {
      toast("Atención: Cambios no guardados", {
        description: "Guarda tu trabajo antes de cambiar de sección.",
        icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      });
    } else {
      toast("Información del sistema", {
        description: "El nuevo módulo de alertas adaptativo está activo.",
        icon: <Info className="w-4 h-4 text-blue-400" />,
      });
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "all", label: "Todos los Componentes" },
    { id: "buttons", label: "Botones (Button)" },
    { id: "autocomplete", label: "Autocompletado" },
    { id: "breadcrumbs", label: "Breadcrumbs" },
    { id: "alerts", label: "Alertas & Modales" },
    { id: "video", label: "Reproductor Video" },
    { id: "progress", label: "Progreso & Biblia" },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10 space-y-8 bg-slate-950 text-slate-100 font-sans">
      {/* Header Hero */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 p-8 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-widest">
              <Layers className="w-3.5 h-3.5" />
              <span>Sistema de Diseño & UI Primitives</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
              Biblioteca Visual de Componentes
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Explora, prueba e inspecciona todos los componentes visuales del sistema Jerusalén. Personaliza variantes, estados y estilos en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <div className="text-xs">
              <p className="font-bold text-white">Control Global</p>
              <p className="text-slate-400">Glassmorphism Activo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Control & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/20 scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-3 border-l border-white/10 pl-4">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10 text-xs">
            <span className="px-2 text-slate-400 font-medium">Tamaño:</span>
            {(["sm", "default", "lg"] as const).map((sz) => (
              <button
                key={sz}
                onClick={() => setBtnSize(sz)}
                className={`px-2 py-1 rounded-lg text-xs uppercase font-mono ${
                  btnSize === sz
                    ? "bg-white/20 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {sz === "default" ? "md" : sz}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsLoadingState(!isLoadingState)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isLoadingState
                ? "bg-amber-400/20 border-amber-400/40 text-amber-300 font-bold"
                : "border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {isLoadingState ? "Cargando: ON" : "Cargando: OFF"}
          </button>

          <button
            onClick={() => setIsDisabledState(!isDisabledState)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isDisabledState
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold"
                : "border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {isDisabledState ? "Deshabilitado: ON" : "Deshabilitado: OFF"}
          </button>
        </div>
      </div>

      {/* Component Sections */}
      <div className="space-y-12">
        {/* 1. BUTTONS SECTION */}
        {(activeTab === "all" || activeTab === "buttons") && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Botones y Variantes Glassmorphism</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Variantes reutilizables con soporte de carga, iconos y refracción de cristal.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
                onClick={() => (window.location.href = "/admin/apariencia/botones")}
              >
                Ir a Estudio de Botones
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BUTTON_ITEMS.map((item) => (
                <div
                  key={item.variant}
                  className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4 hover:border-amber-400/30 transition-all group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        variant="{item.variant}"
                      </span>
                      <button
                        onClick={() => copySnippet(item.code, item.variant)}
                        className="text-slate-500 hover:text-white transition-colors"
                        title="Copiar Código"
                      >
                        {copiedCode === item.variant ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <h3 className="text-base font-bold text-white">{item.name}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-center min-h-[56px] bg-slate-950/60 rounded-xl border border-white/5 p-3">
                    <Button
                      variant={item.variant}
                      size={btnSize}
                      loading={isLoadingState}
                      disabled={isDisabledState}
                    >
                      <span>Probar {item.name}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. AUTOCOMPLETE SECTION */}
        {(activeTab === "all" || activeTab === "autocomplete") && (
          <section className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" />
                <span>Autocompletado Universal (`Autocomplete`)</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Input con sugerencias desplegables en tiempo real, grupos, atajos de teclado y limpieza rápida.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Demo Playground */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Demostración Interactiva</h3>
                  <p className="text-slate-400 text-xs">
                    Escribe para filtrar (ej: "Alma", "Amor", "Grande", "Fe").
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Buscador de Sermones, Alabanzas y Cursos:
                  </label>
                  <Autocomplete
                    items={SAMPLE_AUTOCOMPLETE_ITEMS}
                    value={autoVal}
                    onValueChange={(val) => setAutoVal(val)}
                    onSelect={(item) => {
                      setAutoVal(item.label);
                      toast.info(`Seleccionaste: ${item.label}`);
                    }}
                  >
                    <AutocompleteInput
                      placeholder="Buscar por título, pastor o tipo..."
                      showClear
                      showTrigger
                      size={btnSize}
                    />
                    <AutocompletePopup>
                      <AutocompleteEmpty>
                        No se encontraron resultados para tu búsqueda.
                      </AutocompleteEmpty>
                      <AutocompleteList>
                        <AutocompleteGroup label="Sugerencias del Sistema">
                          {SAMPLE_AUTOCOMPLETE_ITEMS.map((item) => (
                            <AutocompleteItem key={item.value} value={item}>
                              {item.label}
                            </AutocompleteItem>
                          ))}
                        </AutocompleteGroup>
                      </AutocompleteList>
                    </AutocompletePopup>
                  </Autocomplete>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-white/10 text-xs space-y-1 font-mono">
                  <p className="text-slate-400">Valor Seleccionado / Ingresado:</p>
                  <p className="text-amber-400 font-bold truncate">
                    {autoVal || "(Ninguno)"}
                  </p>
                </div>
              </div>

              {/* Specs & Features */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <span>Características Clave</span>
                </h3>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Navegación completa por teclado con <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">Flecha Abajo</code>, <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">Flecha Arriba</code> y <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">Enter</code>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Soporte para categorización por grupos (<code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">&lt;AutocompleteGroup&gt;</code>) e íconos temáticos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Botones opcionales de limpieza rápida (<code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">showClear</code>) y disparador (<code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">showTrigger</code>).</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 3. BREADCRUMBS SECTION */}
        {(activeTab === "all" || activeTab === "breadcrumbs") && (
          <section className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-amber-400" />
                <span>Navegación por Migas de Pan (`Breadcrumb`)</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Jerarquía de enlaces situados en páginas y centrados en la parte superior del pie de página.
              </p>
            </div>

            <div className="space-y-6">
              {/* Page Breadcrumb */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-sm font-mono text-amber-400 font-bold">1. Breadcrumb de Página Estándar</h3>
                <div className="p-4 bg-slate-950 rounded-xl border border-white/10">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/" className="flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5" />
                          <span>Inicio</span>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/predicas">Prédicas</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>El Ancla de Nuestra Alma</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </div>

              {/* Footer Breadcrumb */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-sm font-mono text-amber-400 font-bold">2. Footer Breadcrumb (Centrado con Glassmorphism)</h3>
                <div className="p-6 bg-slate-950/80 rounded-xl border border-white/10 flex justify-center">
                  <FooterBreadcrumb />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. ALERTS & DIALOGS SECTION */}
        {(activeTab === "all" || activeTab === "alerts") && (
          <section className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-400" />
                <span>Sistema de Alertas & Diálogos Emergentes</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Toasts flotantes en el centro inferior con disolución y modales de confirmación crítica (`AlertDialog`).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Toasters */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-lg font-bold text-white">Alertas Flotantes (Centro Inferior)</h3>
                <p className="text-slate-400 text-xs">
                  Haz clic para probar las animaciones de entrada desde abajo y salida por disolución.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    variant="glass-emerald"
                    size="sm"
                    onClick={() => triggerToast("success")}
                    className="gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Toast Éxito</span>
                  </Button>

                  <Button
                    variant="glass-rose"
                    size="sm"
                    onClick={() => triggerToast("error")}
                    className="gap-2"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Toast Error</span>
                  </Button>

                  <Button
                    variant="glass-gold"
                    size="sm"
                    onClick={() => triggerToast("warning")}
                    className="gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Toast Advertencia</span>
                  </Button>

                  <Button
                    variant="glass-primary"
                    size="sm"
                    onClick={() => triggerToast("info")}
                    className="gap-2"
                  >
                    <Info className="w-4 h-4 text-blue-400" />
                    <span>Toast Info</span>
                  </Button>
                </div>
              </div>

              {/* AlertDialog Modal */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-lg font-bold text-white">Modal de Diálogo (`AlertDialog`)</h3>
                <p className="text-slate-400 text-xs">
                  Requiere la interacción explícita del usuario para confirmar una acción destructiva.
                </p>

                <div className="pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <Button variant="glass-rose" size="sm">
                        Probar Modal AlertDialog
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogPopup>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente la configuración del componente de nuestros servidores.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogClose>
                          <Button variant="ghost" size="sm">
                            Cancelar
                          </Button>
                        </AlertDialogClose>
                        <AlertDialogClose>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => toast.success("Confirmación recibida")}
                          >
                            Sí, eliminar
                          </Button>
                        </AlertDialogClose>
                      </AlertDialogFooter>
                    </AlertDialogPopup>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. VIDEO PLAYER SECTION */}
        {(activeTab === "all" || activeTab === "video") && (
          <section className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-red-500" />
                <span>Reproductor de Video Sincronizado (`VideoPlayer`)</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Integración con la API Oficial de YouTube con contador en vivo a 150ms y deslizador interactivo de tiempo.
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-sm font-mono text-amber-400 font-bold">1. VideoPlayer Completo con Controles Personalizados</h3>
                <VideoPlayer
                  youtubeUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  title="Demostración del Reproductor Sincronizado Jerusalén"
                />
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-sm font-mono text-amber-400 font-bold">2. VideoThumbnailPlayer (Miniatura con Modal / Inline)</h3>
                <div className="max-w-md">
                  <VideoThumbnailPlayer
                    videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    title="Prédica en Miniatura con Superposición de Cristal"
                    mode="modal"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6. PROGRESS & BIBLE LINKS */}
        {(activeTab === "all" || activeTab === "progress") && (
          <section className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>Indicadores de Progreso y Enlaces Bíblicos</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Anillos de progreso SVG animados y etiquetas de escrituras interactivas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Circular Progress */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 space-y-6">
                <h3 className="text-lg font-bold text-white">Progreso Circular (`CircularProgress`)</h3>
                <div className="flex items-center justify-center p-6 bg-slate-950 rounded-xl border border-white/10">
                  <CircularProgress percentage={progressVal} size={100} strokeWidth={8} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 flex justify-between">
                    <span>Ajustar Porcentaje:</span>
                    <span className="font-mono text-amber-400 font-bold">{progressVal}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressVal}
                    onChange={(e) => setProgressVal(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>

              {/* Bible Verse Link */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-lg font-bold text-white">Etiqueta de Pasaje Bíblico (`BibleVerseLink`)</h3>
                <p className="text-slate-400 text-xs">
                  Haz clic en las citas para abrir la vista previa flotante:
                </p>

                <div className="p-6 bg-slate-950 rounded-xl border border-white/10 space-y-3 leading-relaxed text-sm">
                  <p className="text-slate-300">
                    "Porque la palabra de Dios es viva y eficaz, más cortante que toda espada de dos filos..." (
                    <BibleVerseLink reference="Hebreos 4:12" />)
                  </p>
                  <p className="text-slate-300">
                    "El Señor es mi pastor; nada me faltará." (
                    <BibleVerseLink reference="Salmos 23:1" />)
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ComponentLibrary;
