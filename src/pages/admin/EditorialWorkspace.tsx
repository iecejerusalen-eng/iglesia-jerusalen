import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Eye,
  FileText,
  FolderTree,
  KeyRound,
  MessageSquare,
  MonitorPlay,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import BlockEditor from "../../components/admin/BlockEditor";
import MediaAssetPicker from "../../components/admin/MediaAssetPicker";
import { supabase } from "../../config/supabase";
import BlockLessonRenderer from "../../components/public/BlockLessonRenderer";
import type {
  EditorialCategory,
  EditorialDocument,
  EditorialDocumentType,
  EditorialEditor,
  EditorialEditorRole,
  EditorialSpace,
  EditorialStatus,
  EditorialVisibility,
} from "../../features/editorial/types";

type WorkspaceTab = "content" | "categories" | "editors" | "settings";
interface DocumentDraft {
  id?: string;
  parent_id: string;
  category_id: string;
  document_type: EditorialDocumentType;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string;
  cover_media_type: "image" | "video";
  cover_video_url: string;
  content: string;
  visibility: EditorialVisibility;
  status: EditorialStatus;
  scheduled_at: string;
  is_featured: boolean;
  allow_comments: boolean;
  password: string;
  seo_title: string;
  seo_description: string;
  view_count: number;
  views_last_30_days: number;
}
interface ProfileOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const emptyDraft: DocumentDraft = {
  parent_id: "",
  category_id: "",
  document_type: "post",
  title: "",
  slug: "",
  excerpt: "",
  cover_image_url: "",
  cover_media_type: "image",
  cover_video_url: "",
  content: "[]",
  visibility: "public",
  status: "draft",
  scheduled_at: "",
  is_featured: false,
  allow_comments: true,
  password: "",
  seo_title: "",
  seo_description: "",
  view_count: 0,
  views_last_30_days: 0,
};
const slugify = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const blocksAsString = (value: unknown): string =>
  JSON.stringify(Array.isArray(value) ? value : [], null, 2);

export default function EditorialWorkspace() {
  const { id = "" } = useParams<{ id: string }>();
  const [space, setSpace] = useState<EditorialSpace | null>(null);
  const [documents, setDocuments] = useState<EditorialDocument[]>([]);
  const [categories, setCategories] = useState<EditorialCategory[]>([]);
  const [editors, setEditors] = useState<EditorialEditor[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [tab, setTab] = useState<WorkspaceTab>("content");
  const [draft, setDraft] = useState<DocumentDraft | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [selectedEditor, setSelectedEditor] = useState("");
  const [selectedRole, setSelectedRole] =
    useState<EditorialEditorRole>("author");

  const load = useCallback(async () => {
    setLoading(true);
    const [
      spaceResult,
      documentsResult,
      categoriesResult,
      editorsResult,
      profilesResult,
    ] = await Promise.all([
      supabase.from("editorial_spaces").select("*").eq("id", id).single(),
      supabase
        .from("editorial_documents")
        .select("*")
        .eq("space_id", id)
        .order("order_index")
        .order("created_at"),
      supabase
        .from("editorial_categories")
        .select("*")
        .eq("space_id", id)
        .order("order_index"),
      supabase
        .from("editorial_space_editors")
        .select("*, profiles:user_id(first_name,last_name,email,photo_url)")
        .eq("space_id", id),
      supabase
        .from("profiles")
        .select("id,first_name,last_name,email")
        .neq("banned", true)
        .order("first_name")
        .limit(500),
    ]);
    setLoading(false);
    const firstError =
      spaceResult.error ??
      documentsResult.error ??
      categoriesResult.error ??
      editorsResult.error ??
      profilesResult.error;
    if (firstError) {
      console.error("No se pudo cargar el espacio editorial.", firstError);
      toast.error("No se pudo abrir el espacio editorial.");
      return;
    }
    setSpace(spaceResult.data as EditorialSpace);
    setDocuments((documentsResult.data ?? []) as EditorialDocument[]);
    setCategories((categoriesResult.data ?? []) as EditorialCategory[]);
    setEditors((editorsResult.data ?? []) as EditorialEditor[]);
    setProfiles((profilesResult.data ?? []) as ProfileOption[]);
  }, [id]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const childCounts = useMemo(
    () =>
      documents.reduce<Record<string, number>>((counts, document) => {
        if (document.parent_id)
          counts[document.parent_id] = (counts[document.parent_id] ?? 0) + 1;
        return counts;
      }, {}),
    [documents],
  );
  const openDocument = (document?: EditorialDocument) => {
    setDraft(
      document
        ? {
            id: document.id,
            parent_id: document.parent_id ?? "",
            category_id: document.category_id ?? "",
            document_type: document.document_type,
            title: document.title,
            slug: document.slug,
            excerpt: document.excerpt,
            cover_image_url: document.cover_image_url ?? "",
            cover_media_type: document.cover_media_type ?? (document.cover_image_url ? "image" : "video"),
            cover_video_url: document.cover_video_url ?? "",
            content: blocksAsString(document.content_blocks),
            visibility: document.visibility,
            status: document.status ?? "draft",
            scheduled_at: document.scheduled_at?.slice(0, 16) ?? "",
            is_featured: document.is_featured,
            allow_comments: document.allow_comments,
            password: "",
            seo_title: document.seo_title ?? "",
            seo_description: document.seo_description ?? "",
            view_count: 0,
            views_last_30_days: 0,
          }
        : { ...emptyDraft },
    );
    if (document) void loadDocumentAnalytics(document.id);
  };

  const loadDocumentAnalytics = async (documentId: string) => {
    const { data, error } = await supabase.rpc(
      "get_editorial_document_analytics",
      { p_document_id: documentId },
    );
    if (error) {
      console.error("No se pudo cargar la analítica editorial.", error);
      return;
    }
    const values = data as {
      total_views?: number;
      views_last_30_days?: number;
    } | null;
    setDraft((current) =>
      current?.id === documentId
        ? {
            ...current,
            view_count: Number(values?.total_views ?? 0),
            views_last_30_days: Number(values?.views_last_30_days ?? 0),
          }
        : current,
    );
  };

  const saveDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    if (
      draft.status === "scheduled" &&
      (!draft.scheduled_at ||
        new Date(draft.scheduled_at).getTime() <= Date.now())
    ) {
      setSaving(false);
      toast.error("La fecha programada debe estar en el futuro.");
      return;
    }
    if (
      draft.visibility === "password" &&
      !draft.id &&
      draft.password.length < 8
    ) {
      setSaving(false);
      toast.error("Define una contraseña de al menos 8 caracteres.");
      return;
    }
    const payload = {
      space_id: id,
      parent_id: draft.parent_id || null,
      category_id: draft.category_id || null,
      document_type: draft.document_type,
      title: draft.title.trim(),
      slug: draft.slug || slugify(draft.title),
      excerpt: draft.excerpt,
      cover_image_url: draft.cover_image_url || null,
      cover_media_type: draft.cover_media_type,
      cover_video_url: draft.cover_video_url || null,
      content_blocks: JSON.parse(draft.content) as unknown,
      visibility:
        draft.visibility === "password"
          ? draft.id
            ? "password"
            : "public"
          : draft.visibility,
      status: draft.status,
      scheduled_at:
        draft.status === "scheduled" && draft.scheduled_at
          ? new Date(draft.scheduled_at).toISOString()
          : null,
      published_at:
        draft.status === "published" ? new Date().toISOString() : null,
      is_featured: draft.is_featured,
      allow_comments: draft.allow_comments,
      seo_title: draft.seo_title.trim() || null,
      seo_description: draft.seo_description.trim() || null,
    };
    const result = draft.id
      ? await supabase
          .from("editorial_documents")
          .update(payload)
          .eq("id", draft.id)
          .select("id")
          .single()
      : await supabase
          .from("editorial_documents")
          .insert(payload)
          .select("id")
          .single();
    if (result.error) {
      setSaving(false);
      console.error("No se guardó la publicación.", result.error);
      toast.error("No se pudo guardar la publicación.");
      return;
    }
    const documentId = result.data.id as string;
    if (draft.visibility === "password") {
      if (draft.password) {
        const { error } = await supabase.rpc(
          "set_editorial_document_password",
          { p_document_id: documentId, p_password: draft.password },
        );
        if (error) {
          setSaving(false);
          console.error("No se configuró la contraseña.", error);
          toast.error(error.message);
          return;
        }
      }
    } else if (
      draft.id &&
      documents.find((item) => item.id === draft.id)?.visibility === "password"
    ) {
      const { error } = await supabase.rpc("set_editorial_document_password", {
        p_document_id: documentId,
        p_password: null,
      });
      if (error) {
        setSaving(false);
        console.error("No se retiró la contraseña.", error);
        toast.error("No se pudo cambiar la privacidad.");
        return;
      }
    }
    setSaving(false);
    setDraft(null);
    toast.success("Publicación guardada.");
    await load();
  };

  useEffect(() => {
    if (!draft) return;
    const key = `editorial-draft:${id}:${draft.id ?? "new"}`;
    const timer = window.setTimeout(
      () => window.localStorage.setItem(key, JSON.stringify(draft)),
      700,
    );
    return () => window.clearTimeout(timer);
  }, [draft, id]);

  const removeDocument = async (document: EditorialDocument) => {
    if (
      !window.confirm(
        `Eliminar “${document.title}”${childCounts[document.id] ? " y sus subpáginas" : ""}?`,
      )
    )
      return;
    const { error } = await supabase
      .from("editorial_documents")
      .delete()
      .eq("id", document.id);
    if (error) {
      console.error("No se eliminó la publicación.", error);
      toast.error("No se pudo eliminar.");
      return;
    }
    toast.success("Publicación eliminada.");
    await load();
  };

  const createCategory = async () => {
    if (!newCategory.trim()) return;
    const { error } = await supabase.from("editorial_categories").insert({
      space_id: id,
      name: newCategory.trim(),
      slug: slugify(newCategory),
      order_index: categories.length,
    });
    if (error) {
      console.error("No se creó la categoría.", error);
      toast.error("No se pudo crear la categoría.");
      return;
    }
    setNewCategory("");
    await load();
  };
  const removeCategory = async (category: EditorialCategory) => {
    if (
      !window.confirm(
        `Eliminar la categoría “${category.name}”? Las publicaciones no se eliminarán.`,
      )
    )
      return;
    const { error } = await supabase
      .from("editorial_categories")
      .delete()
      .eq("id", category.id);
    if (error) {
      console.error("No se eliminó la categoría.", error);
      toast.error("No se pudo eliminar.");
      return;
    }
    await load();
  };
  const addEditor = async () => {
    if (!selectedEditor) return;
    const { error } = await supabase.from("editorial_space_editors").upsert({
      space_id: id,
      user_id: selectedEditor,
      editor_role: selectedRole,
    });
    if (error) {
      console.error("No se asignó el editor.", error);
      toast.error("No se pudo asignar.");
      return;
    }
    setSelectedEditor("");
    toast.success("Colaborador asignado.");
    await load();
  };
  const removeEditor = async (editor: EditorialEditor) => {
    const { error } = await supabase
      .from("editorial_space_editors")
      .delete()
      .eq("space_id", id)
      .eq("user_id", editor.user_id);
    if (error) {
      console.error("No se retiró el editor.", error);
      toast.error("No se pudo retirar.");
      return;
    }
    await load();
  };
  const saveSpace = async () => {
    if (!space) return;
    setSaving(true);
    const { error } = await supabase
      .from("editorial_spaces")
      .update({
        name: space.name,
        slug: space.slug,
        description: space.description,
        cover_image_url: space.cover_image_url,
        accent_color: space.accent_color,
        is_published: space.is_published,
        allow_comments: space.allow_comments,
        updated_at: new Date().toISOString(),
      })
      .eq("id", space.id);
    setSaving(false);
    if (error) {
      console.error("No se guardó el espacio.", error);
      toast.error("No se pudo guardar.");
      return;
    }
    toast.success("Configuración guardada.");
  };

  if (loading)
    return (
      <div className="flex min-h-[450px] items-center justify-center text-slate-500">
        Cargando espacio editorial…
      </div>
    );
  if (!space)
    return (
      <div className="rounded-3xl border border-red-200 p-12 text-center">
        <h1 className="font-serif text-2xl font-bold">Espacio no disponible</h1>
        <Link
          to="/admin/publicaciones"
          className="mt-4 inline-block text-blue-700"
        >
          Volver
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] bg-[#081630] p-7 text-white">
        <div
          className="absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl"
          style={{ backgroundColor: `${space.accent_color}33` }}
        />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Link
              to="/admin/publicaciones"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300"
            >
              <ArrowLeft size={14} /> Centro editorial
            </Link>
            <h1 className="mt-4 font-serif text-3xl font-bold">{space.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              {space.description}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/publicaciones/${space.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-bold"
            >
              <Eye size={15} /> Vista pública
            </Link>
            <button
              onClick={() => openDocument()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-xs font-black text-slate-950"
            >
              <Plus size={15} /> Crear
            </button>
          </div>
        </div>
      </header>
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/70 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
        <nav className="flex overflow-x-auto border-b border-slate-200 p-2 dark:border-white/10">
          {(
            [
              ["content", "Contenido", FolderTree],
              ["categories", "Categorías", BookOpen],
              ["editors", "Equipo editorial", Users],
              ["settings", "Configuración", Settings2],
            ] as Array<[WorkspaceTab, string, typeof FileText]>
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold ${tab === key ? "bg-blue-700 text-white" : "text-slate-500"}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-5 sm:p-7">
          {tab === "content" && (
            <section>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-bold">
                    Árbol de contenido
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Páginas, subpáginas y entradas del blog en una sola
                    estructura.
                  </p>
                </div>
                <button
                  onClick={() => openDocument()}
                  className="rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white"
                >
                  Nueva publicación
                </button>
              </div>
              {documents.length ? (
                <div className="space-y-2">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40"
                      style={{
                        marginLeft: `${Math.min(document.depth, 4) * 18}px`,
                      }}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/5">
                        {document.document_type === "page" ? (
                          <FileText size={18} />
                        ) : (
                          <MessageSquare size={18} />
                        )}
                      </div>
                      <button
                        onClick={() => openDocument(document)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <strong className="block truncate text-sm">
                          {document.title}
                        </strong>
                        <span className="mt-0.5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
                          {document.status} · {document.visibility}
                          {childCounts[document.id]
                            ? ` · ${childCounts[document.id]} subpáginas`
                            : ""}
                        </span>
                      </button>
                      <ChevronRight size={16} className="text-slate-300" />
                      <button
                        onClick={() => void removeDocument(document)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        aria-label={`Eliminar ${document.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-white/15">
                  Crea la primera página o publicación.
                </div>
              )}
            </section>
          )}
          {tab === "categories" && (
            <section>
              <h2 className="font-serif text-2xl font-bold">Categorías</h2>
              <div className="mt-5 flex gap-2">
                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="Nueva categoría"
                  className="h-11 flex-1 rounded-xl border border-slate-200 px-4 dark:border-white/10 dark:bg-slate-950"
                />
                <button
                  onClick={() => void createCategory()}
                  className="rounded-xl bg-blue-700 px-5 text-sm font-bold text-white"
                >
                  Agregar
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10"
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <strong className="text-sm">{category.name}</strong>
                      <span className="block text-[10px] text-slate-500">
                        /{category.slug}
                      </span>
                    </div>
                    <button
                      onClick={() => void removeCategory(category)}
                      className="text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
          {tab === "editors" && (
            <section>
              <h2 className="font-serif text-2xl font-bold">
                Equipo editorial
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Asigna quién administra, escribe o modera sin entregar acceso a
                todo el panel.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_11rem_auto]">
                <select
                  value={selectedEditor}
                  onChange={(event) => setSelectedEditor(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950"
                >
                  <option value="">Selecciona una persona…</option>
                  {profiles
                    .filter(
                      (profile) =>
                        !editors.some(
                          (editor) => editor.user_id === profile.id,
                        ),
                    )
                    .map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {`${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
                          profile.email ||
                          "Usuario"}
                      </option>
                    ))}
                </select>
                <select
                  value={selectedRole}
                  onChange={(event) =>
                    setSelectedRole(event.target.value as EditorialEditorRole)
                  }
                  className="h-11 rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950"
                >
                  <option value="owner">Propietario</option>
                  <option value="editor">Editor</option>
                  <option value="author">Autor</option>
                  <option value="moderator">Moderador</option>
                </select>
                <button
                  onClick={() => void addEditor()}
                  className="rounded-xl bg-blue-700 px-5 text-sm font-bold text-white"
                >
                  Asignar
                </button>
              </div>
              <div className="mt-5 space-y-2">
                {editors.map((editor) => (
                  <div
                    key={editor.user_id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                      {(
                        editor.profiles?.first_name?.[0] ??
                        editor.profiles?.email?.[0] ??
                        "?"
                      ).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-sm">
                        {`${editor.profiles?.first_name ?? ""} ${editor.profiles?.last_name ?? ""}`.trim() ||
                          editor.profiles?.email}
                      </strong>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {editor.editor_role}
                      </span>
                    </div>
                    <button
                      onClick={() => void removeEditor(editor)}
                      className="text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
          {tab === "settings" && (
            <section className="grid gap-6 lg:grid-cols-[1fr_20rem]">
              <div className="space-y-4">
                <label className="block text-sm font-bold">
                  Nombre
                  <input
                    value={space.name}
                    onChange={(event) =>
                      setSpace({ ...space, name: event.target.value })
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal dark:border-white/10 dark:bg-slate-950"
                  />
                </label>
                <label className="block text-sm font-bold">
                  Descripción
                  <textarea
                    value={space.description}
                    onChange={(event) =>
                      setSpace({ ...space, description: event.target.value })
                    }
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-slate-200 p-4 font-normal dark:border-white/10 dark:bg-slate-950"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-bold">
                    Slug
                    <input
                      value={space.slug}
                      onChange={(event) =>
                        setSpace({
                          ...space,
                          slug: slugify(event.target.value),
                        })
                      }
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal dark:border-white/10 dark:bg-slate-950"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Color
                    <input
                      type="color"
                      value={space.accent_color}
                      onChange={(event) =>
                        setSpace({ ...space, accent_color: event.target.value })
                      }
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 p-2 dark:border-white/10 dark:bg-slate-950"
                    />
                  </label>
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-bold dark:border-white/10">
                  <input
                    type="checkbox"
                    checked={space.is_published ?? false}
                    onChange={(event) =>
                      setSpace({ ...space, is_published: event.target.checked })
                    }
                  />{" "}
                  Espacio visible públicamente
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-bold dark:border-white/10">
                  <input
                    type="checkbox"
                    checked={space.allow_comments}
                    onChange={(event) =>
                      setSpace({
                        ...space,
                        allow_comments: event.target.checked,
                      })
                    }
                  />{" "}
                  Permitir conversaciones internas
                </label>
                <button
                  disabled={saving}
                  onClick={() => void saveSpace()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Save size={17} /> Guardar configuración
                </button>
              </div>
              <aside>
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                  {space.cover_image_url && (
                    <img
                      src={space.cover_image_url}
                      alt="Portada"
                      className="mb-4 aspect-video w-full rounded-xl object-cover"
                    />
                  )}
                  <MediaAssetPicker
                    value={space.cover_image_url}
                    onSelect={(asset) => setSpace({ ...space, cover_image_url: asset.url })}
                    folder="editorial"
                    allowedTypes={["image"]}
                    label="Subir, pegar o elegir portada"
                  />
                </div>
              </aside>
            </section>
          )}
        </div>
      </div>

      {draft && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-md">
          <form
            onSubmit={saveDocument}
            className="mx-auto my-5 max-w-6xl rounded-[2rem] bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-amber-300">
                  Editor por bloques
                </span>
                <h2 className="mt-1 font-serif text-2xl font-bold">
                  {draft.id ? "Editar publicación" : "Nueva publicación"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewing(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold dark:border-white/10"
                >
                  <MonitorPlay size={15} /> Vista previa
                </button>
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="rounded-xl border border-slate-200 p-2 dark:border-white/10"
                >
                  <X />
                </button>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-bold lg:col-span-2">
                Título
                <input
                  required
                  value={draft.title}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      title: event.target.value,
                      slug: draft.id ? draft.slug : slugify(event.target.value),
                    })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950"
                />
              </label>
              <label className="text-xs font-bold">
                Tipo
                <select
                  value={draft.document_type}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      document_type: event.target
                        .value as EditorialDocumentType,
                    })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950"
                >
                  <option value="post">Blog / entrada</option>
                  <option value="page">Página</option>
                </select>
              </label>
              <label className="text-xs font-bold">
                Estado
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      status: event.target.value as EditorialStatus,
                    })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950"
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                  <option value="scheduled">Programado</option>
                  <option value="archived">Archivado</option>
                </select>
              </label>
              <label className="text-xs font-bold">
                Subpágina de
                <select
                  value={draft.parent_id}
                  onChange={(event) =>
                    setDraft({ ...draft, parent_id: event.target.value })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950"
                >
                  <option value="">Nivel principal</option>
                  {documents
                    .filter(
                      (item) =>
                        item.id !== draft.id &&
                        item.document_type === "page" &&
                        item.depth < 4,
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {"— ".repeat(item.depth)}
                        {item.title}
                      </option>
                    ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                Categoría
                <select
                  value={draft.category_id}
                  onChange={(event) =>
                    setDraft({ ...draft, category_id: event.target.value })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                Visibilidad
                <select
                  value={draft.visibility}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      visibility: event.target.value as EditorialVisibility,
                    })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950"
                >
                  <option value="public">Público</option>
                  <option value="members">Solo integrantes</option>
                  <option value="password">Con contraseña</option>
                  <option value="editors">Solo equipo editorial</option>
                </select>
              </label>
              {draft.status === "scheduled" && (
                <label className="text-xs font-bold">
                  Fecha de publicación
                  <input
                    type="datetime-local"
                    required
                    value={draft.scheduled_at}
                    onChange={(event) =>
                      setDraft({ ...draft, scheduled_at: event.target.value })
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950"
                  />
                </label>
              )}
            </div>
            <label className="mt-4 block text-xs font-bold">
              Resumen
              <textarea
                value={draft.excerpt}
                onChange={(event) =>
                  setDraft({ ...draft, excerpt: event.target.value })
                }
                rows={2}
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 dark:border-white/10 dark:bg-slate-950"
              />
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold">
                Título SEO
                <input
                  maxLength={60}
                  value={draft.seo_title}
                  onChange={(event) =>
                    setDraft({ ...draft, seo_title: event.target.value })
                  }
                  placeholder="Título para buscadores"
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950"
                />
              </label>
              <label className="text-xs font-bold">
                Descripción SEO
                <textarea
                  maxLength={160}
                  rows={2}
                  value={draft.seo_description}
                  onChange={(event) =>
                    setDraft({ ...draft, seo_description: event.target.value })
                  }
                  placeholder="Resumen para Google y redes"
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3 dark:border-white/10 dark:bg-slate-950"
                />
              </label>
            </div>
            {draft.visibility === "password" && (
              <label className="mt-4 block rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-950 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
                <span className="flex items-center gap-2">
                  <KeyRound size={16} />{" "}
                  {draft.id
                    ? "Nueva contraseña (déjala vacía para conservar la actual)"
                    : "Contraseña de acceso"}
                </span>
                <input
                  type="password"
                  minLength={8}
                  required={!draft.id}
                  value={draft.password}
                  onChange={(event) =>
                    setDraft({ ...draft, password: event.target.value })
                  }
                  className="mt-3 h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-slate-900 dark:border-white/10"
                />
              </label>
            )}
            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_18rem]">
              <div>
                <BlockEditor
                  content={draft.content}
                  onChange={(value) => setDraft({ ...draft, content: value })}
                />
              </div>
              <aside className="space-y-4">
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                  {draft.cover_image_url && (
                    <img
                      src={draft.cover_image_url}
                      alt="Portada"
                      className="mb-3 aspect-video rounded-xl object-cover"
                    />
                  )}
                  <MediaAssetPicker
                    value={draft.cover_image_url}
                    onSelect={(asset) => setDraft({ ...draft, cover_image_url: asset.url })}
                    folder="editorial"
                    allowedTypes={["image"]}
                    label="Subir, pegar o elegir portada"
                  />
                  <div className="mt-4 space-y-3">
                    <span className="block text-xs font-black uppercase tracking-wider text-slate-500">Usar como portada</span>
                    <div className="flex gap-2">
                      {(["image", "video"] as const).map((type) => (
                        <label key={type} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${draft.cover_media_type === type ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-amber-200" : "border-slate-200 text-slate-500 dark:border-white/10"}`}>
                          <input type="radio" value={type} checked={draft.cover_media_type === type} onChange={() => setDraft({ ...draft, cover_media_type: type })} />
                          {type === "image" ? "Imagen" : "Vídeo"}
                        </label>
                      ))}
                    </div>
                    <input type="url" value={draft.cover_video_url} onChange={(event) => setDraft({ ...draft, cover_video_url: event.target.value })} placeholder="URL del vídeo de portada" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm dark:border-white/10 dark:bg-slate-950" />
                    <p className="text-[11px] leading-5 text-slate-500">En las tarjetas se verá una miniatura. El vídeo no se reproduce automáticamente.</p>
                  </div>
                </div>
                {draft.id && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-950 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-100">
                    <div className="flex items-center justify-between">
                      <strong>Lecturas</strong>
                      <Eye size={16} />
                    </div>
                    <p className="mt-3 text-2xl font-black">
                      {draft.view_count}
                    </p>
                    <p className="text-[11px]">
                      {draft.views_last_30_days} en los últimos 30 días
                    </p>
                  </div>
                )}
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-xs font-bold dark:border-white/10">
                  <input
                    type="checkbox"
                    checked={draft.is_featured}
                    onChange={(event) =>
                      setDraft({ ...draft, is_featured: event.target.checked })
                    }
                  />{" "}
                  Destacar publicación
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-xs font-bold dark:border-white/10">
                  <input
                    type="checkbox"
                    checked={draft.allow_comments}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        allow_comments: event.target.checked,
                      })
                    }
                  />{" "}
                  Permitir comentarios
                </label>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                  <ShieldCheck className="mb-2" />
                  <strong>Acceso protegido</strong>
                  <p>
                    Las contraseñas se cifran y el cuerpo privado no viaja al
                    navegador sin autorización.
                  </p>
                </div>
              </aside>
            </div>
            <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-xl px-5 py-3 text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <Save size={16} /> {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
      {previewing && draft && (
        <div className="fixed inset-0 z-[140] overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="mx-auto my-6 max-w-4xl rounded-[2rem] bg-slate-50 p-5 shadow-2xl dark:bg-slate-900 sm:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-white/10">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-600">
                  Vista previa
                </span>
                <h2 className="mt-1 font-serif text-2xl font-black dark:text-white">
                  {draft.title || "Sin título"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewing(false)}
                className="rounded-xl border border-slate-200 p-2 dark:border-white/10"
                aria-label="Cerrar vista previa"
              >
                <X />
              </button>
            </div>
            <p className="mt-5 text-base leading-7 text-slate-500 dark:text-slate-300">
              {draft.excerpt ||
                "Añade un resumen para presentar esta publicación."}
            </p>
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950">
              <BlockLessonRenderer
                content={draft.content}
                lessonId={`preview-${draft.id ?? "new"}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
