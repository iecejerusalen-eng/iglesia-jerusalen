import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, LockKeyhole, ShieldCheck, Clock, Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import BlockLessonRenderer from "../../components/public/BlockLessonRenderer";
import {
  fetchEditorialDocument,
  trackEditorialDocumentView,
  unlockEditorialDocument,
} from "../../features/editorial/service";
import type { EditorialDocumentResponse } from "../../features/editorial/types";
import EditorialComments from "../../features/editorial/components/EditorialComments";

export default function EditorialDocumentPage() {
  const { spaceSlug = "", documentId = "" } = useParams<{
    spaceSlug: string;
    documentId: string;
  }>();
  const [result, setResult] = useState<EditorialDocumentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const nextResult = await fetchEditorialDocument(spaceSlug, documentId);
      setResult(nextResult);
      if (
        nextResult &&
        !nextResult.is_locked &&
        nextResult.document.content_blocks
      ) {
        void trackEditorialDocumentView(documentId).catch(
          (trackingError: unknown) => {
            console.error(
              "No se pudo registrar la lectura editorial.",
              trackingError,
            );
          },
        );
      }
    } catch (error: unknown) {
      console.error("No se pudo abrir la publicación.", error);
      toast.error("No fue posible abrir esta publicación.");
    } finally {
      setLoading(false);
    }
  }, [documentId, spaceSlug]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    setUnlocking(true);
    try {
      const status = await unlockEditorialDocument(documentId, password);
      if (status === "success") {
        setPassword("");
        await load();
        return;
      }
      toast.error(
        status === "rate_limited"
          ? "Demasiados intentos. Inténtalo más tarde."
          : "La contraseña no es correcta.",
      );
    } catch (error: unknown) {
      console.error("No se pudo validar el acceso.", error);
      toast.error("No se pudo validar el acceso.");
    } finally {
      setUnlocking(false);
    }
  };

  if (loading)
    return (
      <main className="mx-auto min-h-[65vh] max-w-4xl px-4 py-20">
        <div className="h-96 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/5" />
      </main>
    );
  if (!result)
    return (
      <main className="mx-auto min-h-[65vh] max-w-3xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-bold">
          Publicación no encontrada
        </h1>
        <Link
          to={`/publicaciones/${spaceSlug}`}
          className="mt-5 inline-block font-bold text-blue-700 dark:text-amber-300"
        >
          Volver a la bitácora
        </Link>
      </main>
    );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950 dark:bg-[#030817] dark:text-white sm:px-6">
      <article className="mx-auto max-w-4xl">
        <Link
          to={`/publicaciones/${spaceSlug}`}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-bold backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
        >
          <ArrowLeft size={14} /> Volver a la bitácora
        </Link>
        <header className="mt-8 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 shadow-xl dark:border-white/10 dark:bg-white/5">
          {result.document.cover_image_url && (
            <img
              src={result.document.cover_image_url}
              alt=""
              className="aspect-[21/9] w-full object-cover"
            />
          )}
          <div className="p-7 sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-black uppercase tracking-[.18em] text-blue-700 dark:text-amber-300">
                {result.document.document_type === "page"
                  ? "Página"
                  : "Publicación"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                <Clock size={13} />
                {Math.max(1, Math.ceil(JSON.stringify(result.document.content_blocks || []).length / 1200))} min de lectura
              </span>
            </div>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-tight sm:text-5xl">
              {result.document.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-300">
              {result.document.excerpt}
            </p>
          </div>
        </header>

        {result.is_locked ? (
          <section className="mx-auto mt-8 max-w-xl rounded-[2rem] border border-slate-200 bg-white/80 p-8 text-center shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-500">
              <LockKeyhole size={26} />
            </div>
            <h2 className="mt-5 font-serif text-2xl font-bold">
              Contenido reservado
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {result.lock_reason === "members"
                ? "Inicia sesión con una cuenta integrante del grupo para continuar."
                : result.lock_reason === "editors"
                  ? "Esta página es exclusiva del equipo editorial."
                  : "Escribe la contraseña compartida por el equipo."}
            </p>
            {result.lock_reason === "password" && (
              <form
                onSubmit={unlock}
                className="mt-6 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Contraseña"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-slate-950"
                />
                <button
                  disabled={unlocking}
                  className="h-12 rounded-xl bg-blue-700 px-6 text-sm font-bold text-white disabled:opacity-50"
                >
                  {unlocking ? "Validando…" : "Desbloquear"}
                </button>
              </form>
            )}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-300">
              <ShieldCheck size={14} /> El contenido protegido no se descarga
              antes de validar el acceso.
            </div>
          </section>
        ) : (
          <>
            <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-10">
              <BlockLessonRenderer
                content={JSON.stringify(result.document.content_blocks ?? [])}
                lessonId={`editorial-${result.document.id}`}
              />
            </section>
            
            {/* Share Footer Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-xs dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <Share2 size={16} className="text-amber-500" />
                <span>¿Te sirvió esta lectura? Compártela con otros</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? "¡Copiado!" : "Copiar enlace"}
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${result.document.title}\n${window.location.href}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm"
                >
                  WhatsApp
                </a>
              </div>
            </div>
            {result.document.allow_comments && (
              <EditorialComments documentId={result.document.id} />
            )}
          </>
        )}
      </article>
    </main>
  );
}
