/**
 * Sello de orden anulada para las hojas imprimibles: banner superior + marca de
 * agua diagonal. Cumple auditoría MINSA/SUSALUD: la orden no se borra, pero el
 * documento queda claramente sin validez médica.
 */
export function MarcaAnulada() {
  return (
    <>
      <div className="mb-4 rounded border-2 border-red-600 bg-red-50 px-4 py-2 text-center text-[12pt] font-bold uppercase tracking-wide text-red-700 print:bg-white">
        Orden anulada — Documento sin validez médica
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <span className="-rotate-45 whitespace-nowrap text-[46pt] font-black uppercase tracking-widest text-red-600/15">
          Anulada
        </span>
      </div>
    </>
  );
}
