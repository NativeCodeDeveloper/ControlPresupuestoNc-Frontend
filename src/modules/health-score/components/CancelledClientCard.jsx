/**
 * CancelledClientCard.jsx
 *
 * Tarjeta para clientes cancelados con información de cuándo nos dejaron
 * y cómo se comportaron.
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, TrendingDown, X } from 'lucide-react';
import { cn, formatDate } from '../../../lib/utils';

export default function CancelledClientCard({ data, isOpen, onToggle }) {
  const { companyName, fechaCancelacion, lastScore, metrics } = data;
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-card border border-red-500/20 rounded-2xl overflow-hidden opacity-75">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-foreground/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <X size={16} className="text-red-400" />
          </div>
          <div className="text-left">
            <p className="font-medium text-[13px] text-foreground">{companyName}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar size={10} />
              {formatDate(fechaCancelacion)}
            </p>
          </div>
        </div>

        {isOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {/* Detail */}
      {isOpen && (
        <div className="px-4 py-3 border-t border-border/50 bg-muted/10 space-y-3">
          {/* Último score registrado */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">Último Score registrado:</span>
            <span className="font-semibold text-red-400 tabular-nums">{lastScore}</span>
          </div>

          {/* Ver comportamiento previo */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
          >
            <TrendingDown size={12} />
            {showDetails ? 'Ocultar' : 'Ver'} comportamiento previo
          </button>

          {showDetails && (
            <div className="pt-2 space-y-2 text-[11px] text-muted-foreground">
              {/* TODO: Mostrar métricas históricas cuando tengamos historial */}
              <p>Historial de métricas previo a cancelación:</p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {metrics?.map(m => (
                  <div key={m.id} className="flex justify-between">
                    <span>{m.label}:</span>
                    <span className="font-medium text-foreground">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
