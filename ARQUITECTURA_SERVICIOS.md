# ARQUITECTURA DE SERVICIOS - Guía Definitiva

**Estado del Proyecto:** ✅ Preparado para Backend  
**Última actualización:** 2026  
**Patrones:** Service Layer Pattern, Dependency Injection  

---

## 📊 Diagrama de La Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE PRESENTACIÓN                       │
│  (React Components: Dashboard, Ingresos, Gastos, Socios, etc)   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ import * as projectsService from '../services'
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                    CAPA DE SERVICIOS                             │
│  (Service Layer: projectsService, costsService, etc)             │
│                                                                  │
│   Responsabilidades:                                             │
│   ✓ Encapsular operaciones de negocio                            │
│   ✓ Manejar lógica de datos                                      │
│   ✓ Coordinar llamadas a apiClient                               │
│   ✓ Retornar datos consistentes                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ await apiClient.post('/api/proyectos', data)
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                  CAPA HTTP (apiClient.js)                        │
│                                                                  │
│   ACTUAL (Dev):           FUTURO (Backend):                      │
│   ├─ get() → null         ├─ get() → fetch()                    │
│   ├─ post() → null        ├─ post() → fetch()                   │
│   ├─ put() → null         ├─ put() → fetch()                    │
│   └─ delete() → null      └─ delete() → fetch()                 │
└────────────────┬────────────────────────────────────────────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
     ▼ (Actualmente)         ▼ (Cuando venga backend)
┌─────────────────┐      ┌─────────────────┐
│ FinanceContext  │      │  Backend API    │
│  (localStorage) │      │  (Node.js)      │
│                 │      │  (MySQL)        │
│ - projects      │      │                 │
│ - costs         │      │ - GET /api/... │
│ - partners      │      │ - POST /api/...│
│ - transactions  │      │ - PUT /api/...│
│ - balance       │      │ - DELETE /api/.│
└─────────────────┘      └─────────────────┘
```

---

## 🎯 Arquitectura Layer-by-Layer

### Nivel 1: Componentes React (UI Layer)

**Archivos:**
- Dashboard.jsx
- Ingresos.jsx  
- Gastos.jsx
- Socios.jsx
- Reportes.jsx
- Config.jsx

**Responsabilidades:**
- Renderizar UI
- Manejar interacciones del usuario
- Mostrar datos
- Llamar servicios

```javascript
// ❌ NO HACER:
const { addProject } = useFinance();
addProject(data);

// ✅ HACER:
import * as projectsService from '../services';
const result = await projectsService.addProject(data);
if (result === null) {
    // Fallback a contexto
}
```

---

### Nivel 2: Service Layer (Business Logic)

**Archivos:**
```
src/services/
├── projectsService.js       (10 métodos)
├── costsService.js          (15 métodos)
├── partnersService.js       (10 métodos)
├── reportsService.js        (8 métodos)
├── configService.js         (12 métodos)
└── index.js                 (Exportaciones)
```

**Cada servicio:**
1. Encapsula un dominio ($proyecto$, $costos$, $socios$, etc)
2. Expone métodos coincidentes con endpoints
3. Llama apiClient para transparencia HTTP
4. Documenta comportamiento actual y futuro

**Ejemplo: projectsService.js**

```javascript
/**
 * projectsService.js
 * 
 * Métodos disponibles:
 * - getProjects()              → GET /api/proyectos
 * - getProject(id)             → GET /api/proyectos/:id
 * - addProject(data)           → POST /api/proyectos
 * - updateProject(id, data)    → PUT /api/proyectos/:id
 * - deleteProject(id)          → DELETE /api/proyectos/:id
 * - updateProjectStatus()      → PATCH /api/proyectos/:id/estado
 * - getProjectPayments()       → GET /api/proyectos/:id/pagos
 * - addProjectPayment()        → POST /api/proyectos/:id/pagos
 * - deleteProjectPayment()     → DELETE /api/proyectos/:id/pagos/:id
 * - getProjectTypes()          → GET /api/catalogos/tipos-proyecto
 * 
 * PATRÓN CONSISTENTE:
 * Todas retornan null si no hay backend
 * Componentes usan FinanceContext de fallback
 */
```

---

### Nivel 3: HTTP Abstraction Layer (apiClient.js)

**Responsabilidades:**
- Punto único de entrada para HTTP
- Manejo de autenticación
- Gestión de errores
- Fácil para agregar logging/métricas

**Métodos:**

```javascript
export const get = async (endpoint) => {
    // ACTUAL: return null
    // FUTURO: return await fetch(`${API_URL}${endpoint}`, ...)
};

export const post = async (endpoint, data) => {
    // Similar
};

export const put = async (endpoint, data) => {
    // Similar
};

export const patch = async (endpoint, data) => {
    // Similar
};

export const delete = async (endpoint) => {
    // Similar
};
```

---

### Nivel 4: Data Source (localStorage o Backend API)

**Actualmente:**
- FinanceContext maneja localStorage
- apiClient retorna null
- Componentes usan contexto como fallback

**Cuando backend esté listo:**
- apiClient hace fetch() reales a Backend API
- FinanceContext puede usarse como caché
- Sin cambios en componentes

---

## 📋 Inventario Completo de Servicios

### 1. projectsService (10 métodos)

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| getProjects() | GET /api/proyectos | Listar proyectos |
| getProject(id) | GET /api/proyectos/:id | Detalle proyecto |
| addProject(data) | POST /api/proyectos | Crear proyecto |
| updateProject(id, data) | PUT /api/proyectos/:id | Actualizar proyecto |
| deleteProject(id) | DELETE /api/proyectos/:id | Eliminar proyecto |
| updateProjectStatus(id, status) | PATCH /api/proyectos/:id/estado | Cambiar estado |
| getProjectPayments(id) | GET /api/proyectos/:id/pagos | Pagos recibidos |
| addProjectPayment(id, payment) | POST /api/proyectos/:id/pagos | Registrar pago |
| deleteProjectPayment(id, paymentId) | DELETE /api/proyectos/:id/pagos/:lid | Reversar pago |
| getProjectTypes() | GET /api/catalogos/tipos-proyecto | Tipos disponibles |

---

### 2. costsService (15 métodos)

**Costos Fijos:**
| Método | Endpoint |
|--------|----------|
| getFixedCosts() | GET /api/costos-fijos |
| addFixedCost(data) | POST /api/costos-fijos |
| updateFixedCost(id, data) | PUT /api/costos-fijos/:id |
| deleteFixedCost(id) | DELETE /api/costos-fijos/:id |

**Costos Variables:**
| Método | Endpoint |
|--------|----------|
| getVariableCosts() | GET /api/costos-variables |
| addVariableCost(data) | POST /api/costos-variables |
| deleteVariableCost(id) | DELETE /api/costos-variables/:id |

**Catálogos:**
| Método | Endpoint |
|--------|----------|
| getServices() | GET /api/catalogos/servicios |
| addService(data) | POST /api/catalogos/servicios |
| deleteService(id) | DELETE /api/catalogos/servicios/:id |
| getVariableCostTypes() | GET /api/catalogos/tipos-costo |

---

### 3. partnersService (10 métodos)

| Método | Endpoint |
|--------|----------|
| getPartners() | GET /api/socios |
| getPartner(id) | GET /api/socios/:id |
| addPartner(data) | POST /api/socios |
| updatePartner(id, data) | PUT /api/socios/:id |
| updatePartnerPercentage(id, %) | PATCH /api/socios/:id/porcentaje |
| deletePartner(id) | DELETE /api/socios/:id |
| getWithdrawals(id) | GET /api/socios/:id/retiros |
| addWithdrawal(id, data) | POST /api/socios/:id/retiros |
| deleteWithdrawal(id, rid) | DELETE /api/socios/:id/retiros/:rid |
| getAvailableAmount(id) | GET /api/socios/:id/disponible |

---

### 4. reportsService (8 métodos)

| Método | Endpoint |
|--------|----------|
| getFinancialStats() | GET /api/reportes/financiero |
| getMonthlyStats(m, y) | GET /api/reportes/mensual |
| getYearlyStats(y) | GET /api/reportes/anual |
| getProjectsReport() | GET /api/reportes/proyectos |
| getPartnersReport() | GET /api/reportes/socios |
| getCostsReport() | GET /api/reportes/costos |
| exportReportToPDF(...) | GET /api/reportes/export/pdf |
| exportReportToCSV(...) | GET /api/reportes/export/csv |

---

### 5. configService (12 métodos)

| Método | Endpoint |
|--------|----------|
| getFinancialConfig() | GET /api/config/financiera |
| updateFinancialConfig(data) | PUT /api/config/financiera |
| getProjectTypes() | GET /api/catalogos/tipos-proyecto |
| addProjectType(data) | POST /api/catalogos/tipos-proyecto |
| getProjectStatuses() | GET /api/catalogos/estados-proyecto |
| getVariableCostTypes() | GET /api/catalogos/tipos-costo |
| resetAllData() | POST /api/admin/reset-data |
| exportAllData() | GET /api/admin/export |
| importData(file) | POST /api/admin/import |

---

## 🔄 Flujos de Datos

### Flujo 1: Cargar Proyectos

```
1. Component monta
   ↓
2. useEffect → await projectsService.getProjects()
   ↓
3. projectsService.getProjects() → await apiClient.get('/api/proyectos')
   ↓
4. apiClient.get() retorna null (dev) o array (backend)
   ↓
5. if (null) { usar financeContext.projects }
   if (array) { usar datos del servidor }
   ↓
6. Renderizar lista
```

---

### Flujo 2: Agregar Proyecto

```
1. Usuario llena formulario y presiona "Guardar"
   ↓
2. handleSubmit() → await projectsService.addProject(formData)
   ↓
3. projectsService.addProject() → await apiClient.post('/api/proyectos', data)
   ↓
4. apiClient.post() retorna null (dev) o {id, ...} (backend)
   ↓
5. if (null) { financeContext.addProject(); } ← Actualiza local
   if (object) { newProject ya en servidor }
   ↓
6. Recargar lista o agregar a UI
```

---

### Flujo 3: Cuando Backend esté listo

Solo cambiar apiClient.js:

```javascript
// ANTES (apiClient.js):
export const post = async (endpoint, data) => {
    return null; // Simula, components usan contexto
};

// DESPUÉS (apiClient.js):
export const post = async (endpoint, data) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) throw handleApiError(response);
    return await response.json();
};

// COMPONENTES: ⚠️ CERO CAMBIOS ⚠️
// Los servicios ahora retornan datos reales
// Los componentes siguen igual
```

---

## 🎯 Ventajas de Esta Arquitectura

### Para Desarrollo Actual

✅ **Sin acoplamiento** - Componentes no saben de localStorage  
✅ **Fácil testear** - Mockear servicios sin tocar componentes  
✅ **Reutilizable** - Servicios disponibles en cualquier componente  
✅ **Legible** - Cada servicio responsable de un dominio  

### Para Integración Backend (Futuro)

✅ **Cambio mínimo** - Solo modificar apiClient.js  
✅ **Sin regresiones** - Mismas interfaces de servicios  
✅ **Transición gradual** - Componentes pueden migrar uno a uno  
✅ **Monitoreo fácil** - Un punto central (apiClient) para logging  

---

## 📝 Checklist de Backend

Cuando el backend esté listo, usar este checklist:

```
FASE 1: Preparación Backend
- [ ] Base de datos MySQL creada (usar DATABASE_SCHEMA.sql)
- [ ] Node.js + Express configurado
- [ ] Rutas definidas (40+ endpoints de ANALISIS_PROYECTO.md)
- [ ] Modelos de datos implementados

FASE 2: Implementar apiClient.js
- [ ] get() con fetch real
- [ ] post() con fetch real
- [ ] put() con fetch real
- [ ] patch() con fetch real
- [ ] delete() con fetch real
- [ ] Manejo de errores
- [ ] Autenticación (JWT)
- [ ] Logging

FASE 3: Testear
- [ ] getProjects() funciona
- [ ] addProject() crea en BD
- [ ] updateProject() guarda cambios
- [ ] deleteProject() elimina
- [ ] Todos los endpoints funcionan
- [ ] Autenticación valida

FASE 4: Componentes (Opcional)
- [ ] Migrar Dashboard.jsx
- [ ] Migrar Ingresos.jsx
- [ ] Migrar Gastos.jsx
- [ ] Migrar Socios.jsx
- [ ] Migrar Reportes.jsx
- [ ] Migrar Config.jsx

FASE 5: Optimizaciones
- [ ] Agregar caché en FinanceContext
- [ ] Agregar paginación
- [ ] Agregar filtros
- [ ] Agregar búsqueda
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Componente Simple

```javascript
// src/pages/Gastos/Gastos.jsx
import * as costsService from '../../services';
import { useFinance } from '../../context/FinanceContext';
import { useState, useEffect } from 'react';

export default function Gastos() {
    const context = useFinance();
    const [fixed, setFixed] = useState([]);
    const [variable, setVariable] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Cargar costos
    useEffect(() => {
        const loadCosts = async () => {
            setLoading(true);
            
            const fixedCosts = await costsService.getFixedCosts();
            const varCosts = await costsService.getVariableCosts();
            
            if (fixedCosts === null) {
                setFixed(context.fixedCosts);
            } else {
                setFixed(fixedCosts);
            }
            
            if (varCosts === null) {
                setVariable(context.variableCosts);
            } else {
                setVariable(varCosts);
            }
            
            setLoading(false);
        };
        
        loadCosts();
    }, []);
    
    // Agregar costo fijo
    const handleAddFixed = async (costData) => {
        const result = await costsService.addFixedCost(costData);
        
        if (result === null) {
            context.addFixedCost(costData);
        }
        
        // Recargar lista
        const updated = await costsService.getFixedCosts();
        setFixed(updated || context.fixedCosts);
    };
    
    return (
        <div className="gastos-container">
            <h1>Gastos</h1>
            
            <div className="costos-fijos">
                <h2>Costos Fijos</h2>
                {fixed.map(c => (
                    <CostCard key={c.id} cost={c} />
                ))}
                <button onClick={() => handleAddFixed({...})}>
                    Agregar Costo Fijo
                </button>
            </div>
            
            <div className="costos-variables">
                <h2>Costos Variables</h2>
                {variable.map(c => (
                    <CostCard key={c.id} cost={c} />
                ))}
                <button onClick={() => handleAddVariable({...})}>
                    Agregar Costo Variable
                </button>
            </div>
        </div>
    );
}
```

---

### Ejemplo 2: Con Reportes

```javascript
// src/pages/Reportes/Reportes.jsx
import * as reportsService from '../../services';
import { useState, useEffect } from 'react';

export default function Reportes() {
    const [stats, setStats] = useState(null);
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    
    // Cargar reporte del mes
    const loadMonthly = async () => {
        const data = await reportsService.getMonthlyStats(month, year);
        setStats(data);
    };
    
    useEffect(() => {
        loadMonthly();
    }, [month, year]);
    
    if (!stats) return <div>Cargando...</div>;
    
    return (
        <div className="reportes">
            <h1>Reportes</h1>
            
            <div className="selectors">
                <select value={month} onChange={(e) => setMonth(+e.target.value)}>
                    <option value={0}>Enero</option>
                    <option value={1}>Febrero</option>
                    {/* ... */}
                </select>
                
                <input 
                    type="number" 
                    value={year} 
                    onChange={(e) => setYear(+e.target.value)}
                />
            </div>
            
            <div className="resumen">
                <Card 
                    title="Ingresos" 
                    value={stats.ingresos_total}
                    color="green"
                />
                <Card 
                    title="Gastos" 
                    value={stats.gastos_total}
                    color="red"
                />
                <Card 
                    title="Utilidad Neta" 
                    value={stats.utilidad_neta}
                    color={stats.utilidad_neta >= 0 ? "green" : "red"}
                />
                <Card 
                    title="Margen %" 
                    value={`${stats.margen_pct}%`}
                    color="blue"
                />
            </div>
            
            {/* Tablas de distribución a socios, etc */}
        </div>
    );
}
```

---

## 🚀 Conclusión

La arquitectura está lista y documentada. Cuando el backend esté listo:

1. **Solo** cambiar apiClient.js
2. **Cero** cambios en componentes
3. **Sistema completo** funcionando con backend
4. **Auditoría** de todas las operaciones en BD

**Tiempo de integración estimado:** 2-3 horas en apiClient.js  
**Riesgo de regresión:** Mínimo (servicios ya abstractos)  
**Mantenibilidad:** Alta (código limpio y organizado)

---

## 📞 Contacto

Para preguntas sobre la arquitectura, revisar:
- `/src/services/README.md` - Guía de uso
- `/src/services/apiClient.js` - Capa HTTP
- `/src/services/projectsService.js` - Ejemplo de servicio
- Comentarios en español en cada archivo

**¡La base está lista para el backend!** 🎉
