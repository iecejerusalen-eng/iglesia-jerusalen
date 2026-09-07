import { Check, Edit3, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import AdminHeader from "../../components/admin/AdminHeader";
import { Button } from "../../components/ui/button";
import { supabase } from "../../config/supabase";
import { fetchAllChangelog } from "../../features/changelog/service";
import {
  CHANGE_TYPES,
  type ChangelogChange,
  type ChangelogStatus,
  type ChangelogType,
  type ChangelogVersion,
} from "../../features/changelog/types";

const emptyChange = (): Omit<ChangelogChange, "id" | "version_id"> => ({
  tipo: "nuevo",
  titulo: "",
  descripcion: "",
  descripcion_tecnica: "",
  link_interno: "",
  link_texto: "",
  link_externo: "",
  imagen_url: "",
  video_url: "",
  departamento: "",
  es_destacado: false,
  orden: 0,
});
type VersionDraft = {
  version: string;
  titulo: string;
  resumen: string;
  fecha_lanzamiento: string;
  estado: ChangelogStatus;
  es_mayor: boolean;
  imagen_portada: string;
  color_acento: string;
  cambios: Array<Omit<ChangelogChange, "id" | "version_id">>;
};
const emptyVersion = (): VersionDraft => ({
  version: "",
  titulo: "",
  resumen: "",
  fecha_lanzamiento: new Date().toISOString().slice(0, 10),
  estado: "borrador",
  es_mayor: false,
  imagen_portada: "",
  color_acento: "#1e1558",
  cambios: [emptyChange()],
});

export default function ChangelogManager() {
  const [items, setItems] = useState<ChangelogVersion[]>([]);
  const [draft, setDraft] = useState(emptyVersion);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setItems(await fetchAllChangelog());
    } catch (error) {
      console.error("No se pudo cargar el changelog administrativo.", error);
      toast.error("No se pudieron cargar las versiones.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !draft.version.trim() ||
      !draft.titulo.trim() ||
      !draft.resumen.trim()
    ) {
      toast.error("Completa versión, título y resumen.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        version: draft.version.trim(),
        titulo: draft.titulo.trim(),
        resumen: draft.resumen.trim(),
        fecha_lanzamiento: draft.fecha_lanzamiento,
        estado: draft.estado,
        es_mayor: draft.es_mayor,
        imagen_portada: draft.imagen_portada.trim() || null,
        color_acento: draft.color_acento,
      };
      const result = editing
        ? await supabase
            .from("changelog_versiones")
            .update(payload)
            .eq("id", editing)
            .select("id")
            .single()
        : await supabase
            .from("changelog_versiones")
            .insert(payload)
            .select("id")
            .single();
      if (result.error) throw result.error;
      const versionId = result.data?.id;
      if (!versionId)
        throw new Error("Supabase no devolvió el ID de la versión.");
      if (editing) {
        const remove = await supabase
          .from("changelog_cambios")
          .delete()
          .eq("version_id", editing);
        if (remove.error) throw remove.error;
      }
      const changes = draft.cambios.map((change, index) => ({
        ...change,
        version_id: versionId,
        orden: index + 1,
        id: undefined,
      }));
      const changeResult = await supabase
        .from("changelog_cambios")
        .insert(changes);
      if (changeResult.error) throw changeResult.error;
      toast.success(editing ? "Versión actualizada." : "Versión creada.");
      setDraft(emptyVersion());
      setEditing(null);
      await load();
    } catch (error) {
      console.error("No se pudo guardar la versión de changelog.", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la versión.",
      );
    } finally {
      setSaving(false);
    }
  };
  const edit = (item: ChangelogVersion) => {
    setEditing(item.id);
    setDraft({
      version: item.version,
      titulo: item.titulo,
      resumen: item.resumen,
      fecha_lanzamiento: item.fecha_lanzamiento,
      estado: item.estado,
      es_mayor: item.es_mayor,
      imagen_portada: item.imagen_portada ?? "",
      color_acento: item.color_acento,
      cambios: item.cambios.map((change) => ({
        tipo: change.tipo,
        titulo: change.titulo,
        descripcion: change.descripcion,
        descripcion_tecnica: change.descripcion_tecnica,
        link_interno: change.link_interno,
        link_texto: change.link_texto,
        link_externo: change.link_externo,
        imagen_url: change.imagen_url,
        video_url: change.video_url,
        departamento: change.departamento,
        es_destacado: change.es_destacado,
        orden: change.orden,
      })),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async (id: string) => {
    if (!window.confirm("¿Eliminar esta versión y sus cambios?")) return;
    const { error } = await supabase
      .from("changelog_versiones")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("No se pudo eliminar la versión.", error);
      toast.error("No se pudo eliminar la versión.");
      return;
    }
    toast.success("Versión eliminada.");
    await load();
  };
  const updateChange = (
    index: number,
    field: keyof ReturnType<typeof emptyChange>,
    value: string | boolean,
  ) =>
    setDraft((current) => ({
      ...current,
      cambios: current.cambios.map((change, itemIndex) =>
        itemIndex === index ? { ...change, [field]: value } : change,
      ),
    }));
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Novedades del sitio"
        description="Redacta y publica las actualizaciones que ayudan a la iglesia a descubrir nuevas formas de conectar, aprender y servir."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(emptyVersion());
              setEditing(null);
              void load();
            }}
          >
            <RefreshCw size={16} /> Actualizar
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <form
          onSubmit={save}
          className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-7"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-amber-600">
              {editing ? "Editar versión" : "Nueva versión"}
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-indigo-950 dark:text-white">
              Cabecera editorial
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold">
              Versión
              <input
                required
                value={draft.version}
                onChange={(e) =>
                  setDraft({ ...draft, version: e.target.value })
                }
                placeholder="2.4.0 o Septiembre 2026"
                className="field mt-1"
              />
            </label>
            <label className="text-xs font-bold">
              Fecha
              <input
                required
                type="date"
                value={draft.fecha_lanzamiento}
                onChange={(e) =>
                  setDraft({ ...draft, fecha_lanzamiento: e.target.value })
                }
                className="field mt-1"
              />
            </label>
          </div>
          <label className="block text-xs font-bold">
            Título editorial
            <input
              required
              value={draft.titulo}
              onChange={(e) => setDraft({ ...draft, titulo: e.target.value })}
              placeholder="Gran actualización de Comunidad"
              className="field mt-1"
            />
          </label>
          <label className="block text-xs font-bold">
            Resumen
            <textarea
              required
              rows={3}
              value={draft.resumen}
              onChange={(e) => setDraft({ ...draft, resumen: e.target.value })}
              placeholder="Una o dos frases orientadas a la comunidad..."
              className="field mt-1 resize-y"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold">
              Imagen portada (URL)
              <input
                type="url"
                value={draft.imagen_portada}
                onChange={(e) =>
                  setDraft({ ...draft, imagen_portada: e.target.value })
                }
                placeholder="https://..."
                className="field mt-1"
              />
            </label>
            <label className="text-xs font-bold">
              Color acento
              <input
                type="color"
                value={draft.color_acento}
                onChange={(e) =>
                  setDraft({ ...draft, color_acento: e.target.value })
                }
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white p-1"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-bold">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.es_mayor}
                onChange={(e) =>
                  setDraft({ ...draft, es_mayor: e.target.checked })
                }
              />{" "}
              Versión mayor
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.estado === "publicado"}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    estado: e.target.checked ? "publicado" : "borrador",
                  })
                }
              />{" "}
              Publicar ahora
            </label>
          </div>
          <div className="border-t border-slate-200 pt-5 dark:border-white/10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black text-indigo-950 dark:text-white">
                Cambios ({draft.cambios.length})
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    cambios: [...current.cambios, emptyChange()],
                  }))
                }
              >
                <Plus size={15} /> Añadir cambio
              </Button>
            </div>
            <div className="space-y-4">
              {draft.cambios.map((change, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[.03]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[.15em] text-slate-400">
                      Cambio {index + 1}
                    </span>
                    {draft.cambios.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            cambios: current.cambios.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          }))
                        }
                        className="text-slate-400 hover:text-red-600"
                        aria-label="Eliminar cambio"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={change.tipo}
                      onChange={(e) =>
                        updateChange(
                          index,
                          "tipo",
                          e.target.value as ChangelogType,
                        )
                      }
                      className="field"
                    >
                      {CHANGE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.emoji} {type.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={change.titulo}
                      onChange={(e) =>
                        updateChange(index, "titulo", e.target.value)
                      }
                      placeholder="Título corto del cambio"
                      className="field"
                    />
                    <textarea
                      required
                      rows={3}
                      value={change.descripcion}
                      onChange={(e) =>
                        updateChange(index, "descripcion", e.target.value)
                      }
                      placeholder="Descripción clara para la comunidad"
                      className="field sm:col-span-2"
                    />
                    <input
                      value={change.link_interno ?? ""}
                      onChange={(e) =>
                        updateChange(index, "link_interno", e.target.value)
                      }
                      placeholder="/ruta-interna"
                      className="field"
                    />
                    <input
                      value={change.link_texto ?? ""}
                      onChange={(e) =>
                        updateChange(index, "link_texto", e.target.value)
                      }
                      placeholder="Explorar →"
                      className="field"
                    />
                    <input
                      type="url"
                      value={change.imagen_url ?? ""}
                      onChange={(e) =>
                        updateChange(index, "imagen_url", e.target.value)
                      }
                      placeholder="URL de screenshot/GIF"
                      className="field sm:col-span-2"
                    />
                    <label className="flex items-center gap-2 text-xs font-bold sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={change.es_destacado}
                        onChange={(e) =>
                          updateChange(index, "es_destacado", e.target.checked)
                        }
                      />{" "}
                      Destacar este cambio
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraft(emptyVersion());
                setEditing(null);
              }}
            >
              Limpiar
            </Button>
            <Button type="submit" loading={saving}>
              <Check size={16} />{" "}
              {editing ? "Guardar cambios" : "Crear versión"}
            </Button>
          </div>
        </form>
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-3xl font-bold text-indigo-950 dark:text-white">
              Historial
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {items.length} versiones
            </span>
          </div>
          {loading && (
            <div className="h-32 animate-pulse rounded-3xl bg-slate-200 dark:bg-white/5" />
          )}
          {!loading && items.length === 0 && (
            <div className="rounded-3xl border border-dashed p-10 text-center text-sm text-slate-500">
              Todavía no hay versiones.
            </div>
          )}
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${item.estado === "publicado" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {item.estado}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {item.version}
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold text-slate-900 dark:text-white">
                    {item.titulo}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.cambios.length} cambios · {item.fecha_lanzamiento}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => edit(item)}
                    aria-label="Editar"
                  >
                    <Edit3 size={15} />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => void remove(item.id)}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
