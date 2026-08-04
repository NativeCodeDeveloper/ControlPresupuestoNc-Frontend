# Health Score Module

Módulo de monitoreo de clientes para NativeCode Finance.

## 📁 Estructura

```
modules/health-score/
├── components/
│   ├── HealthScoreCard.jsx      ← Tarjeta principal de score
│   ├── CancelledClientCard.jsx   ← Tarjeta para cancelados
│   └── MetricProgressBar.jsx     ← Barra de progreso
├── services/
│   ├── healthScoreService.js     ← Servicio principal
│   └── agendaClinicaApiService.js ← Cliente API de Agenda Clínica (mock)
├── utils/
│   └── healthScoreCalculator.js  ← Calculadora desacoplada
├── constants/
│   └── healthScoreConstants.js   ← Pesos, umbrales, configuración
├── mocks/
│   └── agendaClinicaMockData.js  ← Datos simulados
├── types/
│   └── index.js                  ← Interfaces/documentación
└── index.js                       ← Export principal
```

## 🎯 Funcionalidad

### Métricas (pesos)

| Categoría | Métrica | Peso | Fuente |
|-----------|---------|------|--------|
| **USO** | Reservas | 35% | Agenda Clínica |
| | Confirmaciones | 20% | Agenda Clínica |
| | Fichas clínicas | 20% | Agenda Clínica |
| | Último ingreso | 15% | Agenda Clínica |
| | Frecuencia | 10% | Agenda Clínica |
| **VALOR** | Valor facturado | 20% | Finance |
| **PAGA** | Estado pagos | 10% | Finance |
| | Morosidad | 5% | Finance |
| | DTEs al día | 5% | Finance |

### Estados

- **0-39**: 🔴 Crítico
- **40-69**: 🟡 En riesgo
- **70-100**: 🟢 Saludable

## 🚀 TODO - Pendientes

### Frontend
- [x] Crear estructura de módulo
- [x] Crear calculadora desacoplada
- [x] Crear componentes de UI
- [x] Integrar con sidebar
- [ ] Conectar con backend real de Finance
- [ ] Conectar con API de Agenda Clínica

### Backend (control-back)
- [ ] Crear controller `healthScoreController.js`
- [ ] Crear service `healthScoreService.js`
- [ ] Crear rutas `/api/health-score/*`
- [ ] Implementar caché Redis

### Agenda Clínica
- [ ] Crear endpoints `/api/v1/companies/{id}/health/*`
- [ ] Implementar autenticación JWT entre servidores
- [ ] Documentar API

## 📝 Notas

- El módulo está completamente desacoplado
- Todos los mocks están marcados con `TODO`
- La calculadora no depende de React ni de APIs
- La arquitectura permite agregar nuevas métricas sin romper el código existente
