import { useState, type FormEvent } from "react";
import { Landmark, Loader2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePasarelaConfigQuery, useGuardarPasarelaConfig } from "@/lib/facturacion.queries";
import type { GuardarPasarelaConfigInput } from "@/lib/facturacion-schemas";

const ESTADO_INICIAL: GuardarPasarelaConfigInput = {
  llave_publica: "",
  llave_secreta: "",
  modo: "test",
};

/**
 * Panel BYOK (Bring-Your-Own-Keys): el médico registra SUS PROPIAS llaves de
 * Culqi para cobrar directamente a sus pacientes por consultas. MATEO nunca
 * custodia ni intermedia estos fondos (modelo desacoplado, ver
 * `docs/04_ANEXOS.md`). La llave secreta se guarda cifrada en Supabase Vault
 * vía la RPC `culqi_guardar_pasarela_config` y nunca vuelve a mostrarse.
 */
export function FacturacionPasarelaCard() {
  const pasarela = usePasarelaConfigQuery();
  const guardar = useGuardarPasarelaConfig();
  const [form, setForm] = useState<GuardarPasarelaConfigInput>(ESTADO_INICIAL);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    guardar.mutate(form, {
      onSuccess: () => setForm(ESTADO_INICIAL),
    });
  };

  return (
    <Card className="max-w-3xl border-border/60 shadow-none">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Pasarela de tu consultorio (Culqi)</CardTitle>
              {pasarela.data ? (
                <Badge variant={pasarela.data.modo === "live" ? "default" : "secondary"}>
                  {pasarela.data.modo === "live" ? "Modo en vivo" : "Modo prueba"}
                </Badge>
              ) : null}
            </div>
            <CardDescription>
              Cobra tus consultas directo a tus pacientes con tus propias llaves de Culqi. MATEO no
              retiene ni intermedia este dinero.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pasarela.isPending ? (
          <div className="flex min-h-24 items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Verificando configuración…
          </div>
        ) : pasarela.isError ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {pasarela.error.message}
          </div>
        ) : (
          <div className="space-y-6">
            {pasarela.data ? (
              <div className="rounded-lg border border-border/60 bg-card/60 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Pasarela conectada
                </p>
                <p className="mt-1 break-all text-muted-foreground">
                  Llave pública: {pasarela.data.llave_publica}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Actualizada:{" "}
                  {pasarela.data.updated_at
                    ? new Date(pasarela.data.updated_at).toLocaleString("es-PE")
                    : "—"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aún no has registrado tus llaves de Culqi. Consíguelas en tu panel de comercio Culqi
                (pk_/sk_) y pégalas aquí para empezar a cobrar tus citas.
              </p>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="llave_publica">Llave pública (pk_)</Label>
                <Input
                  id="llave_publica"
                  placeholder="pk_test_..."
                  value={form.llave_publica}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, llave_publica: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="llave_secreta">Llave secreta (sk_)</Label>
                <Input
                  id="llave_secreta"
                  type="password"
                  placeholder="sk_test_..."
                  value={form.llave_secreta}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, llave_secreta: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modo">Modo</Label>
                <Select
                  value={form.modo}
                  onValueChange={(value: "test" | "live") =>
                    setForm((prev) => ({ ...prev, modo: value }))
                  }
                >
                  <SelectTrigger id="modo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Prueba (sandbox)</SelectItem>
                    <SelectItem value="live">En vivo (cobros reales)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={guardar.isPending} className="gap-2">
                  {guardar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Guardar pasarela
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
