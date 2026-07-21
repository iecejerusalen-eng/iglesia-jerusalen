import React, { useState } from "react";
import { useGlassStore } from "@/store/useGlassStore";
import { Button } from "@/components/ui/button";
import {
  Sliders,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Palette,
  Eye,
  Info,
  CheckCircle2,
  Trash2,
} from "lucide-react";

export default function ComponentStylesManager() {
  const {
    globalSettings,
    updateGlobalSettings,
    resetVariantOverride,
    resetToDefaults,
  } = useGlassStore();

  const [copied, setCopied] = useState(false);
  const [stageBg, setStageBg] = useState<"dark" | "gradient" | "light">("gradient");
  const [activeTab, setActiveTab] = useState<"global" | "variants" | "catalog">("global");
  const [selectedVariant, setSelectedVariant] = useState<string>("glass-gold");

  // Computed CSS snippet string (matching user's provided CSS class .glass-card)
  const cssCodeSnippet = `.glass-card {
  width: 240px;
  height: 360px;
  background: rgba(255, 255, 255, ${globalSettings.refraction});
  backdrop-filter: blur(${globalSettings.blur}px);
  -webkit-backdrop-filter: blur(${globalSettings.blur}px);
  border-radius: ${globalSettings.borderRadius}px;
  border: 1px solid rgba(255, 255, 255, ${globalSettings.borderOpacity});
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, ${globalSettings.shadowOpacity}),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(255, 255, 255, 0.1),
    inset 0 0 ${globalSettings.depth}px ${globalSettings.depth}px rgba(255, 255, 255, 0.4);
  position: relative;
  overflow: hidden;
}

.glass-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(${globalSettings.lightAngle}deg, transparent, rgba(255, 255, 255, 0.8), transparent);
}

.glass-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 1px; height: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8), transparent, rgba(255, 255, 255, 0.3));
}`;

  const handleCopyCSS = () => {
    navigator.clipboard.writeText(cssCodeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Estudio de Diseño & Botones Glassmorphism
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Personaliza los parámetros globales de Glassmorphic Design, variantes de botones y exporta tokens CSS.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={resetToDefaults} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Restablecer Todo</span>
          </Button>
          <Button onClick={handleCopyCSS} variant="glass-gold" size="sm" className="gap-2">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "¡Copiado!" : "Copiar CSS Global"}</span>
          </Button>
        </div>
      </div>

      {/* Tabs Selection */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Button
          onClick={() => setActiveTab("global")}
          variant={activeTab === "global" ? "glass-primary" : "ghost"}
          size="sm"
          className="gap-2"
        >
          <Sliders className="w-4 h-4" />
          <span>Glassmorphism General</span>
        </Button>

        <Button
          onClick={() => setActiveTab("variants")}
          variant={activeTab === "variants" ? "glass-primary" : "ghost"}
          size="sm"
          className="gap-2"
        >
          <Layers className="w-4 h-4" />
          <span>Ajustes por Variantes</span>
        </Button>

        <Button
          onClick={() => setActiveTab("catalog")}
          variant={activeTab === "catalog" ? "glass-primary" : "ghost"}
          size="sm"
          className="gap-2"
        >
          <Palette className="w-4 h-4" />
          <span>Catálogo de Botones</span>
        </Button>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configurator Panel */}
        <div className="lg:col-span-5 space-y-6">
          {activeTab === "global" && (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-400" />
                  <span>Settings</span>
                </h3>
                <span className="text-xs px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-full font-mono">
                  Valores Globales
                </span>
              </div>

              {/* Slider 1: Blur value */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <label className="text-slate-300">Blur value</label>
                  <span className="text-emerald-400 font-mono font-bold">{globalSettings.blur}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={globalSettings.blur}
                  onChange={(e) => updateGlobalSettings({ blur: Number(e.target.value) })}
                  className="w-full accent-lime-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 2: Refraction / Opacity */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <label className="text-slate-300">Refraction (Fondo Opacidad)</label>
                  <span className="text-emerald-400 font-mono font-bold">{globalSettings.refraction}</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.80"
                  step="0.01"
                  value={globalSettings.refraction}
                  onChange={(e) => updateGlobalSettings({ refraction: Number(e.target.value) })}
                  className="w-full accent-lime-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 3: Depth */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <label className="text-slate-300">Depth (Resplandor Interno)</label>
                  <span className="text-emerald-400 font-mono font-bold">{globalSettings.depth}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={globalSettings.depth}
                  onChange={(e) => updateGlobalSettings({ depth: Number(e.target.value) })}
                  className="w-full accent-lime-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 4: Border Opacity */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <label className="text-slate-300">Border Specular Opacity</label>
                  <span className="text-emerald-400 font-mono font-bold">{globalSettings.borderOpacity}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.90"
                  step="0.05"
                  value={globalSettings.borderOpacity}
                  onChange={(e) => updateGlobalSettings({ borderOpacity: Number(e.target.value) })}
                  className="w-full accent-lime-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 5: Border Radius */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <label className="text-slate-300">Border Radius (px)</label>
                  <span className="text-emerald-400 font-mono font-bold">{globalSettings.borderRadius}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="32"
                  value={globalSettings.borderRadius}
                  onChange={(e) => updateGlobalSettings({ borderRadius: Number(e.target.value) })}
                  className="w-full accent-lime-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Live CSS Code Box (matching provided screenshot) */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">CSS Generado</label>
                <div className="relative rounded-2xl bg-black/90 p-4 font-mono text-xs text-slate-200 border border-slate-800 overflow-x-auto max-h-48 custom-scrollbar-dark">
                  <pre>{cssCodeSnippet}</pre>
                </div>
                <button
                  onClick={handleCopyCSS}
                  className="mt-3 w-full py-2.5 px-4 bg-lime-400 hover:bg-lime-300 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>Copy CSS</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "variants" && (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
              <h3 className="text-lg font-bold text-white">Personalizar Variante</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Seleccionar Variante</label>
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 text-sm font-medium"
                >
                  <option value="glass-gold">glass-gold (Oro)</option>
                  <option value="glass-primary">glass-primary (Azul)</option>
                  <option value="glass-emerald">glass-emerald (Verde)</option>
                  <option value="glass-rose">glass-rose (Rojo)</option>
                  <option value="glass">glass (Blanco puro)</option>
                  <option value="default">default (Sólido)</option>
                </select>
              </div>

              <div className="space-y-4 pt-2">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Las variantes heredan la base de Glassmorphism pero pueden anular opacidades y tonos específicos para dar coherencia visual en cada sección.
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => resetVariantOverride(selectedVariant)}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    Restablecer Variante
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "catalog" && (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-4">
              <h3 className="text-lg font-bold text-white">Resumen de la Biblioteca</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Todos los componentes de botones utilizan la API estándar Shadcn (`Button`), con soporte completo para prop `loading`, variantes `glass-*`, y tamaños desde `xs` hasta `xl`.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Stage & Showcase */}
        <div className="lg:col-span-7 space-y-6">
          {/* Stage Controls */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Fondo del Canvas de Previsualización:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStageBg("gradient")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  stageBg === "gradient" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                Degradado
              </button>

              <button
                onClick={() => setStageBg("dark")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  stageBg === "dark" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                Oscuro Puro
              </button>

              <button
                onClick={() => setStageBg("light")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  stageBg === "light" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                Claro
              </button>
            </div>
          </div>

          {/* Stage Area */}
          <div
            className={`p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden transition-all duration-500 min-h-[500px] flex flex-col justify-center items-center gap-8 ${
              stageBg === "gradient"
                ? "bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950"
                : stageBg === "dark"
                ? "bg-black"
                : "bg-slate-100 text-slate-900"
            }`}
          >
            {/* Background 3D Floating Geometry for Glass Effect Demonstration */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-amber-500/30 rounded-full blur-2xl animate-pulse pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-500/30 rounded-full blur-2xl animate-pulse pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {/* Glass Card Sample (Matching User CSS) */}
            <div
              className="glass-card flex flex-col justify-between p-6 text-white transition-all duration-300"
              style={{
                width: "280px",
                height: "360px",
                background: `rgba(255, 255, 255, ${globalSettings.refraction})`,
                backdropFilter: `blur(${globalSettings.blur}px)`,
                WebkitBackdropFilter: `blur(${globalSettings.blur}px)`,
                borderRadius: `${globalSettings.borderRadius}px`,
                border: `1px solid rgba(255, 255, 255, ${globalSettings.borderOpacity})`,
                boxShadow: `0 8px 32px rgba(0, 0, 0, ${globalSettings.shadowOpacity}), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 255, 255, 0.1), inset 0 0 ${globalSettings.depth}px ${globalSettings.depth}px rgba(255, 255, 255, 0.4)`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-widest text-amber-300 uppercase">
                  Glassmorphism Card
                </span>
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-bold tracking-tight">Efecto Cristal Vivo</h4>
                <p className="text-xs opacity-80 leading-relaxed">
                  Refracción de luz, resplandor interno y bordes especulares activos en tiempo real.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="glass-gold" size="sm" className="w-full">
                  Acción
                </Button>
              </div>
            </div>

            {/* Showcase of Glass Button Variants */}
            <div className="w-full max-w-lg space-y-4 pt-4 z-10">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 text-center">
                Variantes de Botones Glassmorphism
              </h4>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="glass-gold">
                  <Sparkles className="w-4 h-4" />
                  <span>Glass Gold</span>
                </Button>

                <Button variant="glass-primary">
                  <Info className="w-4 h-4" />
                  <span>Glass Primary</span>
                </Button>

                <Button variant="glass-emerald">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Glass Emerald</span>
                </Button>

                <Button variant="glass-rose">
                  <Trash2 className="w-4 h-4" />
                  <span>Glass Rose</span>
                </Button>

                <Button variant="glass">
                  <span>Glass Default</span>
                </Button>
              </div>

              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 text-center pt-2">
                Estados de Carga (`loading` prop) & Tamaños
              </h4>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="glass-gold" size="xs" loading>
                  Cargando
                </Button>
                <Button variant="glass-primary" size="sm" loading>
                  Procesando
                </Button>
                <Button variant="glass-emerald" size="default" loading>
                  Guardando Datos
                </Button>
                <Button variant="glass-rose" size="lg" loading>
                  Cargando Grande
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
