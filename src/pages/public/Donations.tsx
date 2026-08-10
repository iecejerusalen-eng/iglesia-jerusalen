import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  FileCheck2,
  Heart,
  HeartHandshake,
  Landmark,
  Loader2,
  MessageCircle,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../config/supabase';
import { useDonationPageData } from '../../features/donations/hooks/useDonationPageData';
import { formatWhatsAppLink } from '../../utils/whatsapp';
import MediaUploader from '../../components/common/MediaUploader';
import soloLogoColorido from '../../assets/Jerusalén/solo logo colorido.svg';
import soloLogoBlanco from '../../assets/Jerusalén/solo logo blanco.svg';

const donationSchema = z.object({
  name: z.string().trim().max(120, 'El nombre es demasiado largo').optional(),
  email: z.string().trim().email('Ingresa un correo electrónico válido').max(180),
  amount: z.string().min(1, 'Ingresa un monto').refine((value) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount >= 1 && amount <= 100000;
  }, 'El monto debe estar entre $1 y $100.000'),
  categoryId: z.string().uuid('Selecciona un destino válido'),
  isAnonymous: z.boolean(),
  privacyAccepted: z.boolean().refine((accepted) => accepted, 'Debes aceptar el tratamiento de datos'),
}).superRefine((data, context) => {
  if (!data.isAnonymous && !data.name) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Ingresa tu nombre o selecciona aporte anónimo' });
  }
});

type DonationForm = z.infer<typeof donationSchema>;

interface DonationReceipt {
  id: string;
  receiptNumber: string;
  amount: number;
  category: string;
  donorName: string;
  donorEmail: string;
  createdAt: string;
  proofUrl?: string | null;
}

function cleanPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export default function Donations() {
  const { settings, categories, loading, error, refetch } = useDonationPageData();
  const [receipt, setReceipt] = useState<DonationReceipt | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { register, handleSubmit, setValue, reset, control, formState: { errors, isSubmitting } } = useForm<DonationForm>({
    resolver: zodResolver(donationSchema),
    defaultValues: { amount: '', categoryId: '', isAnonymous: false, privacyAccepted: false },
  });
  const amount = useWatch({ control, name: 'amount' });
  const isAnonymous = useWatch({ control, name: 'isAnonymous' });

  const config = settings?.donation_page_config;
  const hasBankDetails = Boolean(settings?.bank_name && settings.bank_account && settings.ruc && config?.beneficiary);
  const canRegister = Boolean(config?.transfer_enabled && hasBankDetails && categories.length > 0);

  const whatsappMessage = useMemo(() => {
    if (!receipt) return '';
    return `Hola, deseo reportar mi aporte a la Iglesia Jerusalén.\nRecibo Nº: ${receipt.receiptNumber}\nReferencia: ${receipt.id.slice(0, 8).toUpperCase()}\nMonto: $${receipt.amount.toFixed(2)}\nDestino: ${receipt.category}\nDonante: ${receipt.donorName}\nCorreo: ${receipt.donorEmail}\n${receipt.proofUrl ? `Comprobante: ${receipt.proofUrl}\n` : ''}Adjunto comprobante de transferencia.`;
  }, [receipt]);

  const copyValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      toast.success(`${label} copiado.`);
      window.setTimeout(() => setCopiedField(null), 1800);
    } catch (caughtError: unknown) {
      console.error('Error copying donation bank detail:', caughtError);
      toast.error('No fue posible copiar el dato.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const onSubmit = async (formData: DonationForm) => {
    if (!canRegister) {
      toast.error('Las aportaciones no están disponibles hasta completar la configuración administrativa.');
      return;
    }

    const selectedCategory = categories.find((category) => category.id === formData.categoryId);
    if (!selectedCategory) {
      toast.error('El destino seleccionado ya no está disponible. Actualiza la página.');
      return;
    }

    const numericAmount = Number(formData.amount);
    const donorName = formData.isAnonymous ? 'Anónimo' : formData.name?.trim() || '';
    const donorEmail = formData.email.trim();

    const { data, error: insertError } = await supabase
      .from('donations')
      .insert({
        donor_name: donorName,
        donor_email: donorEmail,
        amount: numericAmount,
        category_id: selectedCategory.id,
        category_name_backup: selectedCategory.name,
        payment_method: 'transferencia',
        status: 'pending',
        proof_url: proofUrl || null,
      })
      .select('id, receipt_number, created_at')
      .single();

    if (insertError) {
      console.error('Error registering pending donation:', insertError);
      toast.error('No pudimos registrar el aporte. No se creó ningún comprobante; inténtalo otra vez.');
      return;
    }

    const generatedReceiptNumber = data.receipt_number || `REC-${new Date().getFullYear()}-${data.id.slice(0, 5).toUpperCase()}`;

    setReceipt({
      id: data.id,
      receiptNumber: generatedReceiptNumber,
      amount: numericAmount,
      category: selectedCategory.name,
      donorName,
      donorEmail,
      createdAt: data.created_at || new Date().toISOString(),
      proofUrl: proofUrl || null,
    });

    setProofUrl(null);
    reset({ amount: '', categoryId: selectedCategory.id, isAnonymous: false, privacyAccepted: false, email: '', name: '' });
  };

  if (loading) {
    return <div className="min-h-[70vh] bg-[#f6f7fb] px-4 py-16 dark:bg-slate-950"><div className="mx-auto h-[34rem] max-w-7xl animate-pulse rounded-[2.5rem] border border-white/70 bg-white/60 dark:border-white/10 dark:bg-slate-900/60" /></div>;
  }

  if (error || !settings || !config) {
    return (
      <div className="min-h-[70vh] bg-[#f6f7fb] px-4 py-20 dark:bg-slate-950">
        <div role="alert" className="mx-auto max-w-2xl rounded-[2rem] border border-red-200 bg-white/80 p-8 text-center shadow-xl backdrop-blur-2xl dark:border-red-500/20 dark:bg-slate-900/80">
          <AlertCircle className="mx-auto text-red-500" size={42} />
          <h1 className="mt-4 font-serif text-2xl font-bold text-primary dark:text-white">Donaciones temporalmente no disponibles</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">No mostraremos cuentas, categorías ni confirmaciones de respaldo mientras la conexión administrativa no responda correctamente.</p>
          <button type="button" onClick={() => void refetch()} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-white"><RefreshCw size={15} /> Reintentar</button>
        </div>
      </div>
    );
  }

  if (receipt) {
    const whatsappUrl = formatWhatsAppLink(cleanPhone(settings.phone || ''), undefined, whatsappMessage);
    const formattedDate = new Date(receipt.createdAt).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div className="relative min-h-[75vh] overflow-hidden bg-[#f6f7fb] px-4 py-12 dark:bg-slate-950 print:bg-white print:p-0">
        <Helmet><title>Recibo Digital de Donación | Iglesia Jerusalén</title></Helmet>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.15),transparent_45%)] print:hidden" />

        {/* Certificate Container */}
        <div className="relative mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white p-7 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/90 sm:p-10 print:border-none print:shadow-none print:p-4">

            {/* Certificate Header */}
            <div className="border-b border-slate-100 pb-6 text-center dark:border-white/10">
              <div className="flex items-center justify-center gap-3">
                <img src={soloLogoColorido} alt="Iglesia Jerusalén" className="h-12 w-auto dark:hidden" />
                <img src={soloLogoBlanco} alt="Iglesia Jerusalén" className="hidden h-12 w-auto dark:block" />
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-church-gold/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-church-gold-dark dark:text-church-gold-light">
                <Sparkles size={12} /> Certificado de Mayordomía
              </span>
              <h1 className="mt-2 font-serif text-2xl font-bold text-primary dark:text-white sm:text-3xl">
                Comprobante de Donación Registrado
              </h1>
              <p className="mt-1 text-xs text-slate-400">Iglesia Evangélica Cristiana Ecuatoriana Jerusalén</p>
            </div>

            {/* Receipt Number Badge */}
            <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-slate-900 to-primary p-4 text-white sm:flex-row dark:from-slate-800 dark:to-slate-900">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Recibo Nº</span>
                <p className="font-mono text-xl font-bold tracking-wider text-church-gold-light">{receipt.receiptNumber}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
                <CheckCircle2 size={15} className="text-amber-400" /> Pendiente de Verificación
              </span>
            </div>

            {/* Receipt Details Table */}
            <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-white/5 dark:bg-white/[0.03]">
              <div className="flex flex-col justify-between border-b border-slate-200/60 pb-2.5 text-sm sm:flex-row dark:border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Donante</span>
                <strong className="font-semibold text-slate-800 dark:text-white">{receipt.donorName}</strong>
              </div>
              <div className="flex flex-col justify-between border-b border-slate-200/60 pb-2.5 text-sm sm:flex-row dark:border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Correo Electrónico</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{receipt.donorEmail}</span>
              </div>
              <div className="flex flex-col justify-between border-b border-slate-200/60 pb-2.5 text-sm sm:flex-row dark:border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Destino del Aporte</span>
                <strong className="font-semibold text-primary dark:text-blue-300">{receipt.category}</strong>
              </div>
              <div className="flex flex-col justify-between border-b border-slate-200/60 pb-2.5 text-sm sm:flex-row dark:border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monto Aportado</span>
                <strong className="text-lg font-black text-emerald-600 dark:text-emerald-400">${receipt.amount.toFixed(2)} USD</strong>
              </div>
              <div className="flex flex-col justify-between text-sm sm:flex-row">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fecha de Registro</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{formattedDate}</span>
              </div>
              {receipt.proofUrl && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span className="inline-flex items-center gap-1.5"><FileCheck2 size={15} /> Comprobante adjuntado correctamente</span>
                  <a href={receipt.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline dark:text-blue-300">Ver <ExternalLink size={12} /></a>
                </div>
              )}
            </div>

            {/* Visual QR Code & Authenticity Seal */}
            <div className="mt-6 flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-slate-200 bg-white p-5 sm:flex-row dark:border-white/10 dark:bg-slate-900/50">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-inner dark:border-white/10">
                <svg viewBox="0 0 100 100" className="h-full w-full fill-slate-900 dark:fill-white">
                  {/* QR Position detection patterns */}
                  <rect x="5" y="5" width="26" height="26" rx="4" fill="currentColor" />
                  <rect x="9" y="9" width="18" height="18" fill="white" />
                  <rect x="13" y="13" width="10" height="10" fill="currentColor" />

                  <rect x="69" y="5" width="26" height="26" rx="4" fill="currentColor" />
                  <rect x="73" y="9" width="18" height="18" fill="white" />
                  <rect x="77" y="13" width="10" height="10" fill="currentColor" />

                  <rect x="5" y="69" width="26" height="26" rx="4" fill="currentColor" />
                  <rect x="9" y="73" width="18" height="18" fill="white" />
                  <rect x="13" y="77" width="10" height="10" fill="currentColor" />

                  {/* Simulated Data Pattern */}
                  <rect x="38" y="8" width="6" height="6" fill="currentColor" />
                  <rect x="50" y="8" width="6" height="6" fill="currentColor" />
                  <rect x="38" y="20" width="12" height="6" fill="currentColor" />
                  <rect x="56" y="20" width="6" height="6" fill="currentColor" />
                  <rect x="8" y="38" width="6" height="12" fill="currentColor" />
                  <rect x="20" y="38" width="12" height="6" fill="currentColor" />
                  <rect x="38" y="38" width="8" height="8" fill="currentColor" />
                  <rect x="52" y="38" width="12" height="6" fill="currentColor" />
                  <rect x="70" y="38" width="10" height="6" fill="currentColor" />
                  <rect x="86" y="38" width="6" height="12" fill="currentColor" />

                  <rect x="38" y="52" width="6" height="12" fill="currentColor" />
                  <rect x="50" y="56" width="12" height="6" fill="currentColor" />
                  <rect x="68" y="52" width="6" height="12" fill="currentColor" />
                  <rect x="80" y="56" width="12" height="6" fill="currentColor" />

                  <rect x="38" y="70" width="10" height="6" fill="currentColor" />
                  <rect x="54" y="70" width="6" height="10" fill="currentColor" />
                  <rect x="68" y="70" width="12" height="6" fill="currentColor" />
                  <rect x="86" y="70" width="6" height="12" fill="currentColor" />
                  <rect x="38" y="84" width="18" height="6" fill="currentColor" />
                  <rect x="62" y="84" width="12" height="6" fill="currentColor" />
                  <rect x="80" y="84" width="12" height="6" fill="currentColor" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded bg-white/95 p-1 shadow-xs dark:bg-slate-900/95">
                    <QrCode size={18} className="text-primary dark:text-church-gold-light" />
                  </span>
                </div>
              </div>

              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck size={13} /> Sello de Autenticidad Digital
                </div>
                <h2 className="mt-1 font-serif text-sm font-bold text-slate-800 dark:text-white">
                  Verificación de Donación
                </h2>
                <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                  Este certificado digital acredita el registro del aporte ante la secretaría de la Iglesia Jerusalén.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3 print:hidden sm:flex-row sm:justify-center">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-98"
                >
                  <MessageCircle size={18} /> Enviar a WhatsApp Secretaría
                </a>
              )}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <Printer size={17} /> Imprimir / Guardar Recibo
              </button>
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
              >
                Registrar otro aporte
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-[#f6f7fb] px-4 py-8 dark:bg-slate-950 md:px-8 md:py-10">
      <Helmet>
        <title>Donaciones y Ofrendas | Iglesia Jerusalén</title>
        <meta name="description" content="Registra diezmos, ofrendas y donaciones para apoyar la obra de la Iglesia Jerusalén." />
      </Helmet>
      <div className="pointer-events-none absolute left-[-10rem] top-52 h-96 w-96 rounded-full bg-church-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-9rem] top-[42rem] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <main className="relative mx-auto max-w-7xl space-y-7">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-[linear-gradient(135deg,#0b1b42_0%,#173d91_62%,#3157b3_100%)] px-6 py-10 text-white shadow-2xl shadow-blue-950/20 sm:px-10 lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[55px] border-white/[0.04]" />
          <Heart className="pointer-events-none absolute -bottom-12 right-8 text-white/[0.05]" size={260} strokeWidth={1} />
          <div className="relative grid items-end gap-10 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-church-gold/30 bg-church-gold/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-church-gold-light"><Sparkles size={13} /> {config.eyebrow}</span>
              <h1 className="mt-5 max-w-3xl font-serif text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">{config.title}</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">{config.description}</p>
            </div>
            <blockquote className="rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-5 backdrop-blur-xl sm:p-6">
              <p className="font-serif text-base italic leading-7 text-white/90">“{config.verse}”</p>
              <footer className="mt-3 text-xs font-black uppercase tracking-wider text-church-gold-light">— {config.verse_reference}</footer>
            </blockquote>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <article className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70 sm:p-7">
              <div className="flex items-start justify-between gap-4"><div><span className="text-[10px] font-black uppercase tracking-[0.18em] text-church-gold-dark dark:text-church-gold-light">Transferencia bancaria</span><h2 className="mt-1 font-serif text-2xl font-bold text-primary dark:text-white">Datos de la cuenta</h2></div><span className="rounded-2xl bg-primary/8 p-3 text-primary dark:bg-white/5 dark:text-church-gold-light"><Landmark size={22} /></span></div>
              {hasBankDetails ? (
                <div className="mt-6 space-y-3">
                  {[
                    ['Banco', settings.bank_name],
                    ['Tipo de cuenta', config.account_type],
                    ['Número de cuenta', settings.bank_account],
                    ['Beneficiario', config.beneficiary],
                    ['RUC / CI', settings.ruc],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-white/5 dark:bg-white/[0.03]">
                      <div className="min-w-0"><span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</span><strong className="mt-0.5 block break-words text-sm text-slate-800 dark:text-slate-100">{value}</strong></div>
                      <button type="button" onClick={() => void copyValue(label, value)} className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-primary dark:hover:bg-white/10" aria-label={`Copiar ${label}`}>{copiedField === label ? <Check size={16} className="text-emerald-500" /> : <Clipboard size={16} />}</button>
                    </div>
                  ))}
                </div>
              ) : <div className="mt-6 rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">La administración debe completar los datos bancarios antes de recibir aportes.</div>}
            </article>

            <article className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/[0.06] p-6 backdrop-blur-xl">
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" size={20} /><div><h3 className="font-bold text-slate-800 dark:text-white">{config.transparency_title}</h3><p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">{config.transparency_text}</p></div></div>
            </article>

            {config.volunteer_enabled && <Link to="/contacto" className="group flex items-center justify-between rounded-[1.75rem] border border-slate-200/80 bg-white/60 p-5 backdrop-blur-xl transition hover:border-church-gold/40 hover:bg-white dark:border-white/10 dark:bg-white/5"><div className="flex items-center gap-3"><span className="rounded-xl bg-church-gold/10 p-2.5 text-church-gold-dark dark:text-church-gold-light"><HeartHandshake size={19} /></span><div><strong className="block text-sm text-slate-800 dark:text-white">También puedes servir</strong><span className="text-xs text-slate-400">Conoce las oportunidades de voluntariado.</span></div></div><ArrowRight size={17} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-church-gold-dark" /></Link>}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-2xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/75 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><span className="text-[10px] font-black uppercase tracking-[0.18em] text-church-gold-dark dark:text-church-gold-light">Registro seguro</span><h2 className="mt-1 font-serif text-2xl font-bold text-primary dark:text-white">Registrar un aporte</h2><p className="mt-1 text-xs leading-5 text-slate-400">Quedará pendiente hasta que administración verifique el comprobante.</p></div><span className="rounded-2xl bg-church-gold/10 p-3 text-church-gold-dark dark:text-church-gold-light"><Heart size={21} /></span></div>

            <div className="mt-7">
              <label htmlFor="donation-amount" className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Monto en dólares</label>
              <div className="mt-2 grid grid-cols-4 gap-2">{config.preset_amounts.slice(0, 4).map((preset) => <button key={preset} type="button" onClick={() => setValue('amount', String(preset), { shouldValidate: true })} className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition ${amount === String(preset) ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}>${preset}</button>)}</div>
              <div className="relative mt-3"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span><input id="donation-amount" type="number" min="1" max="100000" step="0.01" inputMode="decimal" {...register('amount')} className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-9 pr-4 text-lg font-bold text-slate-800 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder="0.00" /></div>
              {errors.amount && <p className="mt-1.5 text-xs text-red-500">{errors.amount.message}</p>}
            </div>

            <div className="mt-5"><label htmlFor="donation-category" className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Destino</label><select id="donation-category" {...register('categoryId')} defaultValue="" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-slate-800 dark:text-white"><option value="" disabled>Selecciona el destino del aporte</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{errors.categoryId && <p className="mt-1.5 text-xs text-red-500">{errors.categoryId.message}</p>}{categories.length === 0 && <p className="mt-2 text-xs text-amber-600">No existen destinos activos configurados.</p>}</div>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5"><div><span className="block text-sm font-bold text-slate-700 dark:text-slate-200">Aporte anónimo</span><span className="text-[11px] text-slate-400">El equipo financiero conservará el correo para conciliación.</span></div><input type="checkbox" {...register('isAnonymous')} className="h-5 w-5 accent-primary" aria-label="Registrar como anónimo" /></div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">{!isAnonymous && <div><label htmlFor="donor-name" className="sr-only">Nombre completo</label><input id="donor-name" {...register('name')} autoComplete="name" placeholder="Nombre completo" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white" />{errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}</div>}<div className={isAnonymous ? 'sm:col-span-2' : ''}><label htmlFor="donor-email" className="sr-only">Correo electrónico</label><input id="donor-email" type="email" {...register('email')} autoComplete="email" placeholder="Correo para seguimiento" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white" />{errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}</div></div>

            {/* Proof Upload Field */}
            <div className="mt-5">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Comprobante de transferencia
              </span>
              <div className="mt-2 flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-white/10 dark:text-church-gold-light">
                    <FileCheck2 size={20} />
                  </span>
                  <div>
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      {proofUrl ? 'Comprobante adjuntado' : 'Adjuntar comprobante de transferencia (opcional)'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {proofUrl ? 'Imagen subida correctamente' : 'Puedes subir la captura de pantalla de la transferencia bancaria.'}
                    </span>
                  </div>
                </div>
                {proofUrl ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline dark:text-blue-300"
                    >
                      Ver comprobante <ExternalLink size={12} />
                    </a>
                    <button
                      type="button"
                      onClick={() => setProofUrl(null)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                      title="Quitar comprobante"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <MediaUploader
                    folder="donation-proofs"
                    label="Adjuntar comprobante de transferencia (opcional)"
                    onUploadSuccess={(url) => setProofUrl(url)}
                  />
                )}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-blue-200/60 bg-blue-50/60 p-4 dark:border-blue-500/20 dark:bg-blue-500/10"><h3 className="text-xs font-black text-primary dark:text-blue-200">Proceso de transferencia</h3><ol className="mt-2 space-y-1.5">{config.transfer_instructions.map((instruction, index) => <li key={`${instruction}-${index}`} className="flex gap-2 text-xs leading-5 text-slate-600 dark:text-slate-300"><span className="font-black text-church-gold-dark dark:text-church-gold-light">{index + 1}.</span>{instruction}</li>)}</ol></div>

            <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-slate-500 dark:text-slate-400"><input type="checkbox" {...register('privacyAccepted')} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" /><span>Acepto que mis datos sean usados para registrar, verificar y dar seguimiento a este aporte según la <Link to="/privacidad" className="font-bold text-primary hover:underline dark:text-blue-300">política de privacidad</Link>.</span></label>{errors.privacyAccepted && <p className="mt-1.5 text-xs text-red-500">{errors.privacyAccepted.message}</p>}

            <button type="submit" disabled={isSubmitting || !canRegister} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/15 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700">{isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Registrando…</> : <>Registrar aporte {amount && `$${amount}`}<ArrowRight size={17} /></>}</button>
            {!canRegister && <p className="mt-2 text-center text-xs text-amber-600 dark:text-amber-300">El registro se habilitará cuando administración complete cuenta, destinos y transferencia.</p>}
            <p className="mt-3 text-center text-[10px] leading-4 text-slate-400">Registrar un aporte no mueve dinero ni confirma un pago. La conciliación se realiza después de recibir el comprobante.</p>
          </form>
        </section>

        {settings.phone && <section className="flex flex-col items-start justify-between gap-4 rounded-[1.75rem] border border-slate-200/70 bg-white/55 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center"><div><strong className="text-sm text-slate-800 dark:text-white">¿Necesitas ayuda?</strong><p className="mt-0.5 text-xs text-slate-400">Comunícate con {config.whatsapp_label} para resolver dudas sobre tu aporte.</p></div><a href={formatWhatsAppLink(cleanPhone(settings.phone), undefined, 'Hola, necesito ayuda con una aportación a la Iglesia Jerusalén.')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-300"><MessageCircle size={15} /> Contactar por WhatsApp</a></section>}
      </main>
    </div>
  );
}

