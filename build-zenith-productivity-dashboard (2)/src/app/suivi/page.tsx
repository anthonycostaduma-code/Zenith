"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useZenith } from "@/components/store";
import { Card, CardTitle, LineChart, Modal, PageHeader } from "@/components/ui";
import { IconCamera, IconTrash } from "@/components/icons";
import { live } from "@/lib/merge";
import { dayKey, frDate, frShort } from "@/lib/calc";

async function compress(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("lecture impossible"));
    reader.readAsDataURL(file);
  });
  const img = document.createElement("img");
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image invalide"));
    img.src = dataUrl;
  });
  const maxSide = 1100;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function TrackingPage() {
  const { state, photos, addWeightEntry, deleteWeightEntry, uploadPhoto, deletePhoto, status } = useZenith();
  const entries = live(state.weight.entries).sort((a, b) => a.date.localeCompare(b.date));

  const [kg, setKg] = useState("");
  const [date, setDate] = useState(dayKey());
  const [note, setNote] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const latest = entries[entries.length - 1];
  const first = entries[0];
  const delta = latest && first ? latest.kg - first.kg : 0;
  const min = entries.length ? Math.min(...entries.map((e) => e.kg)) : 0;

  const chart = entries.slice(-14).map((e) => ({
    label: frShort(e.date),
    value: e.kg,
    hint: frDate(e.date),
  }));

  const statusText =
    status === "synced" ? "sauvegardé" : status === "offline" ? "sauvegarde locale" : "synchronisation…";

  return (
    <div>
      <PageHeader
        title="Suivi."
        subtitle={`${latest ? `${latest.kg} kg` : "— kg"} · ${photos.length} photo${photos.length > 1 ? "s" : ""} · ${statusText}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Poids actuel" value={latest ? `${latest.kg} kg` : "—"} hint={latest ? frDate(latest.date) : "Aucune pesée"} />
        <Stat
          label="Évolution"
          value={`${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`}
          hint="depuis la première pesée"
        />
        <Stat label="Minimum enregistré" value={entries.length ? `${min} kg` : "—"} hint="record le plus bas" />
        <Stat label="Pesées" value={`${entries.length}`} hint={`${photos.length} photo(s)`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card halo>
            <CardTitle>Nouvelle pesée</CardTitle>
            <p className="muted mb-3 text-sm">Une valeur par jour</p>
            <input
              className="input mb-2"
              type="number"
              step="0.1"
              placeholder="Poids (kg)"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
            />
            <input className="input mb-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <input
              className="input mb-3"
              placeholder="à jeun, après sport..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              className="btn btn-accent w-full"
              onClick={() => {
                const value = Number(kg);
                if (!value || Number.isNaN(value)) return;
                addWeightEntry(Math.round(value * 10) / 10, date, note.trim());
                setKg("");
                setNote("");
              }}
            >
              Enregistrer
            </button>
          </Card>

          <Card>
            <CardTitle>Photo de progression</CardTitle>
            <input
              className="input mb-3"
              placeholder="Légende (optionnelle)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                try {
                  const compressed = await compress(file);
                  await uploadPhoto(compressed, caption.trim(), date);
                  setCaption("");
                } catch {
                  alert("Impossible d'envoyer la photo. Vérifiez votre connexion.");
                } finally {
                  setBusy(false);
                  if (fileRef.current) fileRef.current.value = "";
                }
              }}
            />
            <button className="btn w-full" disabled={busy} onClick={() => fileRef.current?.click()}>
              <IconCamera width={18} height={18} />
              {busy ? "Envoi en cours…" : "Choisir ou prendre une photo"}
            </button>
            <p className="muted mt-3 text-xs">
              Les images sont compressées automatiquement avant d&apos;être enregistrées, puis disponibles sur tous vos
              appareils.
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle>Courbe de poids</CardTitle>
            {chart.length < 2 ? (
              <p className="muted text-sm">Ajoutez au moins deux pesées pour visualiser la courbe.</p>
            ) : (
              <LineChart data={chart} unit=" kg" digits={1} height={230} />
            )}
          </Card>

          <Card>
            <CardTitle>Photos</CardTitle>
            {photos.length === 0 ? (
              <p className="muted text-sm">Aucune photo de progression.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photos.map((p) => (
                  <button
                    key={p.id}
                    className="group relative aspect-square overflow-hidden rounded-[20px_14px_20px_14px] border border-white/10"
                    onClick={() => setLightbox(p.id)}
                  >
                    <Image
                      src={`/api/photos/${p.id}`}
                      alt={p.caption || "Photo de progression"}
                      fill
                      unoptimized
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1 text-[9px] font-bold">
                      {frShort(p.date)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardTitle>Historique des pesées</CardTitle>
            {entries.length === 0 ? (
              <p className="muted text-sm">Aucune pesée enregistrée.</p>
            ) : (
              <ul className="space-y-1.5">
                {[...entries].reverse().map((e) => (
                  <li key={e.id} className="row-hover flex items-center gap-3 px-2 py-2 text-sm">
                    <span className="w-20 font-extrabold" style={{ color: "var(--accent)" }}>
                      {e.kg} kg
                    </span>
                    <span className="muted w-32">{frDate(e.date, { day: "2-digit", month: "short", year: "2-digit" })}</span>
                    <span className="muted min-w-0 flex-1 truncate">{e.note}</span>
                    <button style={{ color: "var(--danger)" }} onClick={() => deleteWeightEntry(e.id)}>
                      <IconTrash width={15} height={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Modal open={!!lightbox} onClose={() => setLightbox(null)} title="Photo de progression">
        {lightbox && (
          <div>
            <div className="relative h-[60vh] w-full overflow-hidden rounded-2xl">
              <Image src={`/api/photos/${lightbox}`} alt="Photo" fill unoptimized className="object-contain" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="muted text-sm">{photos.find((p) => p.id === lightbox)?.caption}</span>
              <button
                className="btn"
                style={{ color: "var(--danger)" }}
                onClick={async () => {
                  await deletePhoto(lightbox);
                  setLightbox(null);
                }}
              >
                <IconTrash width={16} height={16} /> Supprimer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="!p-5">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-3xl font-extrabold">{value}</div>
      <p className="muted mt-1 text-xs">{hint}</p>
    </Card>
  );
}
