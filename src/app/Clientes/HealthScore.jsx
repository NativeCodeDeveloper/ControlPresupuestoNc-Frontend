/**
 * HealthScore.jsx
 *
 * Página principal de Health Score - Monitoreo de clientes.
 *
 * Muestra:
 * - Clientes activos con su Health Score
 * - Clientes cancelados (en sección aparte)
 * - Filtros y búsqueda
 * - Métricas agregadas (saludables, en riesgo, críticos)
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePersistedState } from '../../hooks/usePersistedState';
import {
  Search,
  RefreshCw,
  Loader2,
  HeartPulse,
  XCircle,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import * as svc from '../../modules/health-score/services/healthScoreService';
import HealthScoreCard from '../../modules/health-score/components/HealthScoreCard';
import CancelledClientCard from '../../modules/health-score/components/CancelledClientCard';
import HealthDistributionBar from '../../modules/health-score/components/HealthDistributionBar';
import HealthTrendChart from '../../modules/health-score/components/HealthTrendChart';
import { HEALTH_STATUS_CONFIG } from '../../modules/health-score/constants/healthScoreConstants';

// ── Helpers ───────────────────────────────────────────────────────────────

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

// ── Componentes ────────────────────────────────────────────────────────────

function StatusBadge({ status, count }) {
  const config = HEALTH_STATUS_CONFIG[status];
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-xl border',
      config.bgClass, config.borderClass
    )}>
      <span className={cn('text-lg font-bold tabular-nums', config.textClass)}>{count}</span>
      <span className={cn('text-[11px] font-medium uppercase', config.textClass)}>{config.label}</span>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────

export default function HealthScore() {
  const [clients, setClients] = useState([]);
  const [cancelled, setCancelled] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = usePersistedState('health-score:search', '');
  const [viewType, setViewType] = useState('activos'); // 'activos' | 'cancelados'
  const [selectedClient, setSelectedClient] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activosData, canceladosData] = await Promise.all([
        svc.getAllHealthScores(),
        svc.getCancelledHealthScores(),
      ]);
      setClients(activosData || []);
      setCancelled(canceladosData || []);
    } catch (error) {
      console.error('[HealthScore]', error);
    } finally {
      setLoading(false);
    }

    // Separado del bloque anterior a propósito: si el historial falla (es
    // una feature nueva, menos probada), no debe tumbar la carga de la
    // lista de clientes, que es lo importante de la página.
    try {
      const historyData = await svc.getPortfolioHistory();
      setHistory(historyData || []);
    } catch (error) {
      console.error('[HealthScore] historial', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtros
  const filteredClients = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(c =>
      c.companyName?.toLowerCase().includes(q) ||
      c.clientId?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  // Estadísticas
  const stats = useMemo(() => {
    const activos = filteredClients;
    return {
      total: activos.length,
      healthy: activos.filter(c => c.status === 'healthy').length,
      warning: activos.filter(c => c.status === 'warning').length,
      critical: activos.filter(c => c.status === 'critical').length,
    };
  }, [filteredClients]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse size={18} className="text-rose-400" strokeWidth={1.8} />
            <h1 className="text-[18px] font-semibold tracking-tight">Health Score</h1>
          </div>
          <p className="text-[12px] text-muted-foreground">Monitoreo de salud de clientes</p>
        </div>

        {/* Stats badges */}
        <div className="flex gap-2 flex-wrap">
          <StatusBadge status="healthy" count={stats.healthy} />
          <StatusBadge status="warning" count={stats.warning} />
          <StatusBadge status="critical" count={stats.critical} />
        </div>
      </div>

      {viewType === 'activos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HealthDistributionBar
            healthy={stats.healthy}
            warning={stats.warning}
            critical={stats.critical}
          />
          <HealthTrendChart data={history} />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre…"
            className="w-full pl-8 pr-3 py-2 text-[13px] bg-card border border-border rounded-lg outline-none focus:border-rose-500/60 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => { setViewType('activos'); setShowCancelled(false); }}
            className={cn(
              'px-3 py-2 text-[12px] font-medium transition-colors',
              viewType === 'activos' ? 'bg-rose-500/10 text-rose-400' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Activos
          </button>
          <button
            onClick={() => { setViewType('cancelados'); setShowCancelled(true); }}
            className={cn(
              'px-3 py-2 text-[12px] font-medium transition-colors',
              viewType === 'cancelados' ? 'bg-rose-500/10 text-rose-400' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Cancelados
          </button>
        </div>

        {/* Refresh */}
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        </button>

        <span className="text-[12px] text-muted-foreground">
          {viewType === 'activos'
            ? `${filteredClients.length} clientes`
            : `${cancelled.length} cancelados`
          }
        </span>
      </div>

      {/* Loading state */}
      {loading && clients.length === 0 ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-[13px]">Cargando Health Score…</span>
        </div>
      ) : viewType === 'activos' ? (
        /* Active clients */
        filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
            <HeartPulse size={32} strokeWidth={1.4} className="opacity-30" />
            <p className="text-[13px]">{search ? 'Sin resultados' : 'No hay clientes activos'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client, idx) => (
              <div key={client.clientId || idx}>
                <HealthScoreCard
                  data={{
                    ...client,
                    lastUpdated: formatDate(client.calculatedAt),
                  }}
                  isOpen={selectedClient === client.clientId}
                  onToggle={() => setSelectedClient(selectedClient === client.clientId ? null : client.clientId)}
                />
              </div>
            ))}
          </div>
        )
      ) : (
        /* Cancelled clients */
        cancelled.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
            <XCircle size={32} strokeWidth={1.4} className="opacity-30" />
            <p className="text-[13px]">No hay clientes cancelados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cancelled.map((client, idx) => (
              <CancelledClientCard
                key={client.clientId || idx}
                data={client}
                isOpen={selectedClient === client.clientId}
                onToggle={() => setSelectedClient(selectedClient === client.clientId ? null : client.clientId)}
              />
            ))}
          </div>
        )
      )}

    </div>
  );
}
