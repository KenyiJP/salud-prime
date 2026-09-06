import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser, PenLine, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMedicoImpresion, useSubirFirma } from "@/lib/imagenologia.queries";

const MAX_BYTES = 512 * 1024;

/** Compone el "sello virtual": firma dibujada + nombre, especialidad, CMP y RNE. */
async function componerSello(
  firma: HTMLCanvasElement,
  lineas: string[],
): Promise<Blob> {
  const ancho = 700;
  const alto = 320;
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no permite generar la imagen del sello.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ancho, alto);

  const escala = Math.min((ancho - 60) / firma.width, 180 / firma.height);
  const w = firma.width * escala;
  const h = firma.height * escala;
  ctx.drawImage(firma, (ancho - w) / 2, 10, w, h);

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 205);
  ctx.lineTo(ancho - 80, 205);
  ctx.stroke();

  ctx.fillStyle = "#111827";
  ctx.textAlign = "center";
  lineas.forEach((linea, i) => {
    ctx.font = i === 0 ? "bold 24px sans-serif" : "18px sans-serif";
    ctx.fillText(linea, ancho / 2, 236 + i * 28);
  });

  return await new Promise<Blob>((resolve, reject) =>
    lienzo.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("No se pudo generar la imagen."))),
      "image/png",
    ),
  );
}

export function FirmaMedicoCard() {
  const { data: medico, isLoading } = useMedicoImpresion();
  const subir = useSubirFirma();
  const [preview, setPreview] = useState<string | null>(null);
  const sigRef = useRef<SignatureCanvas | null>(null);

  async function enviar(blob: Blob) {
    setPreview(URL.createObjectURL(blob));
    await subir.mutateAsync(blob);
  }

  function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Usa una imagen PNG, JPEG o WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("La imagen no debe pasar de 512 KB.");
      return;
    }
    void enviar(file);
    e.target.value = "";
  }

  async function guardarDibujo() {
    const canvas = sigRef.current?.getCanvas();
    if (!canvas || sigRef.current?.isEmpty()) {
      toast.error("Dibuja tu firma antes de guardarla.");
      return;
    }
    const lineas = [
      `Dr(a). ${medico?.nombres ?? ""} ${medico?.apellidos ?? ""}`.trim(),
      medico?.especialidad ?? "Medicina general",
      [medico?.cmp ? `CMP ${medico.cmp}` : null, medico?.rne ? `RNE ${medico.rne}` : null]
        .filter(Boolean)
        .join(" · "),
    ].filter((l) => l.length > 0);
    try {
      const blob = await componerSello(canvas, lineas);
      await enviar(blob);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const actual = preview ?? medico?.firma_url ?? null;

  return (
    <section className="space-y-5 rounded-xl border border-border/60 bg-card p-5">
      <div>
        <h2 className="font-display text-base font-semibold">Firma y sello digital</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          La firma aparecerá automáticamente en todas las órdenes impresas.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando tu ficha…</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="firma-archivo" className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> Subir imagen de tu firma
          </Label>
          <input
            id="firma-archivo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onArchivo}
            className="block w-full cursor-pointer rounded-md border border-border/70 bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary/15 file:px-3 file:py-1 file:text-primary"
          />
          <p className="text-xs text-muted-foreground">PNG, JPEG o WEBP, máximo 512 KB.</p>
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <PenLine className="h-4 w-4" /> O dibuja tu firma
          </Label>
          <div className="overflow-hidden rounded-md border border-border/70 bg-white">
            <SignatureCanvas
              ref={(r) => {
                sigRef.current = r;
              }}
              penColor="#111827"
              canvasProps={{
                width: 520,
                height: 180,
                className: "h-[180px] w-full touch-none",
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="gap-2"
              disabled={subir.isPending}
              onClick={guardarDibujo}
            >
              {subir.isPending ? "Guardando…" : "Guardar como sello virtual"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-2 text-muted-foreground"
              onClick={() => sigRef.current?.clear()}
            >
              <Eraser className="h-4 w-4" /> Borrar trazo
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            El sello incluye tu firma dibujada más tu nombre, especialidad, CMP y RNE.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Firma actual</p>
        {actual ? (
          <img
            src={actual}
            alt="Firma y sello del médico"
            className="max-h-40 rounded-md border border-border/60 bg-white p-2"
          />
        ) : (
          <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
            Todavía no cargaste tu firma. Las órdenes se imprimirán con una línea en blanco.
          </p>
        )}
      </div>
    </section>
  );
}
