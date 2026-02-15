# Servicios - Arquitectura de Separación de Capas

## 📋 Introducción

Este directorio implementa el **Service Layer Pattern**, que separa la lógica de datos de la interfaz de usuario. Esto permite:

✅ **Backend fácil de integrar** - Cambios mínimos cuando el backend esté listo  
✅ **Código limpio y organizado** - Cada servicio responsable de un dominio  
✅ **Reutilizable** - Los servicios pueden usarse desde cualquier componente  
✅ **Testeable** - Mocks y tests sin tocar componentes React  

---

## 🧭 Guía de Consumo API (Paginación)

El backend ahora soporta paginación en listados para evitar respuestas masivas.

### Parámetros estándar

- `limit`: cantidad por página
- `page`: página base 1
- `offset`: desplazamiento absoluto
- `all=true`: desactiva paginación

### Endpoints principales paginados

- `/api/socios`
- `/api/proyectos`
- `/api/proyectos/:id/pagos`
- `/api/costos-fijos`
- `/api/costos-fijos/activos`
- `/api/costos-variables`
- `/api/costos-variables/tipo/:tipo_costo_id`
- `/api/costos-variables/proyecto/:proyecto_id`
- `/api/servicios`
- `/api/inversiones`
- `/api/socios/:id/retiros`

### Headers de respuesta

Cuando hay paginación activa, backend devuelve:

- `x-pagination-limit`
- `x-pagination-offset`

### Uso desde servicios (ya habilitado)

```javascript
import * as projectsService from './projectsService';
import * as partnersService from './partnersService';
import * as costsService from './costsService';
import * as investmentsService from './investmentsService';

await projectsService.getProjects({ limit: 50, page: 1 });
await projectsService.getProjectPayments(projectId, { limit: 25, page: 1 });

await partnersService.getPartners({ limit: 100, page: 1 });
await partnersService.getWithdrawals(partnerId, { limit: 20, page: 1 });

await costsService.getFixedCosts({ limit: 100, page: 1 });
await costsService.getVariableCosts({ limit: 100, page: 1 });
await costsService.getServices({ all: true }); // catálogo pequeño

await investmentsService.getInvestments({ limit: 100, page: 1 });
```

### Recomendación práctica

- Tablas: usar `limit/page`.
- Catálogos chicos: `all=true`.
- Evitar `all=true` en datos transaccionales grandes.

---

## 🏗️ Estructura de Carpeta

```
src/services/
├── index.js                 ← Exportación centralizada
├── apiClient.js             ← Abstracción HTTP
├── projectsService.js       ← Operaciones de proyectos
├── costsService.js          ← Operaciones de costos
├── partnersService.js       ← Operaciones de socios
├── reportsService.js        ← Reportes y estadísticas
├── configService.js         ← Configuración global
└── README.md               ← Este archivo
```

---

## 🔄 Flujo de Datos

### Actual (localStorage)

```
Component
    ↓
useFinance() hook
    ↓
FinanceContext (localStorage)
    ↓
Datos locales
```

### Con Servicios (Preparado para Backend)

```
Component
    ↓
Service (projectsService, costsService, etc.)
    ↓
apiClient
    ↓ (Actualmente: null/simula)
    ↓ (Futuro: API calls reales)
FinanceContext O Backend API
```

---

## 📦 Servicios Disponibles

### 1. **apiClient.js** - Capa HTTP

Base de todas las operaciones. Actualmente simula respuestas, futuramente hará llamadas reales.

```javascript
import apiClient from './apiClient';

// Disponibles:
apiClient.get(endpoint)          // GET
apiClient.post(endpoint, data)   // POST
apiClient.put(endpoint, data)    // PUT
apiClient.patch(endpoint, data)  // PATCH
apiClient.delete(endpoint)       // DELETE
```

---

### 2. **projectsService.js** - Gestión de Proyectos

```javascript
import * as projectsService from './services';

// Proyectos
await projectsService.getProjects();
await projectsService.getProject(id);
await projectsService.addProject(projectData);
await projectsService.updateProject(id, updates);
await projectsService.deleteProject(id);
await projectsService.updateProjectStatus(id, newStatus);

// Pagos
await projectsService.getProjectPayments(projectId);
await projectsService.addProjectPayment(projectId, payment);
await projectsService.deleteProjectPayment(projectId, paymentId);

// Catálogos
await projectsService.getProjectTypes();
await projectsService.addProjectType(type);
await projectsService.deleteProjectType(id);
```

---

### 3. **costsService.js** - Gestión de Costos

```javascript
import * as costsService from './services';

// Costos Fijos
await costsService.getFixedCosts();
await costsService.addFixedCost(cost);
await costsService.updateFixedCost(id, updates);
await costsService.deleteFixedCost(id);

// Costos Variables
await costsService.getVariableCosts();
await costsService.addVariableCost(cost);
await costsService.deleteVariableCost(id);

// Catálogos
await costsService.getServices();
await costsService.addService(service);
await costsService.getVariableCostTypes();
```

---

### 4. **partnersService.js** - Gestión de Socios

```javascript
import * as partnersService from './services';

// Socios
await partnersService.getPartners();
await partnersService.getPartner(id);
await partnersService.addPartner(partner);
await partnersService.updatePartner(id, updates);
await partnersService.updatePartnerPercentage(id, newPercentage);
await partnersService.deletePartner(id);

// Retiros
await partnersService.getWithdrawals(partnerId);
await partnersService.addWithdrawal(partnerId, withdrawal);
await partnersService.deleteWithdrawal(partnerId, withdrawalId);

// Disponible
await partnersService.getAvailableAmount(partnerId, month, year);
```

---

### 5. **reportsService.js** - Reportes y Estadísticas

```javascript
import * as reportsService from './services';

// Estadísticas
await reportsService.getFinancialStats();
await reportsService.getMonthlyStats(month, year);
await reportsService.getYearlyStats(year);

// Reportes por entidad
await reportsService.getProjectsReport();
await reportsService.getPartnersReport();
await reportsService.getCostsReport();

// Exportar
await reportsService.exportReportToPDF('mensual', params);
await reportsService.exportReportToCSV('anual', params);
```

---

### 6. **configService.js** - Configuración

```javascript
import * as configService from './services';

// Configuración financiera
await configService.getFinancialConfig();
await configService.updateFinancialConfig(config);

// Catálogos (tipos, estados, servicios)
await configService.getProjectTypes();
await configService.addProjectType(type);

// Administración
await configService.resetAllData();
await configService.exportAllData();
await configService.importData(jsonFile);
```

---

## 💻 Uso en Componentes

### Manera sencilla con fallback

```javascript
import * as projectsService from '../services';
import { useFinance } from '../context/FinanceContext';

export default function Dashboard() {
    const financeContext = useFinance();
    const [projects, setProjects] = useState([]);
    
    useEffect(() => {
        const loadProjects = async () => {
            // Intenta con el servicio (backend o null)
            const data = await projectsService.getProjects();
            
            if (data === null) {
                // Si no hay backend, usa contexto local
                setProjects(financeContext.projects);
            } else {
                // Si hay backend, usa sus datos
                setProjects(data);
            }
        };
        
        loadProjects();
    }, []);
    
    return (
        <div>
            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
    );
}
```

---

## 🔗 Mapeo de Endpoints -> Servicios

### Proyectos

| Endpoint | Servicio | Método |
|----------|----------|--------|
| GET /api/proyectos | projectsService | getProjects() |
| POST /api/proyectos | projectsService | addProject() |
| PUT /api/proyectos/:id | projectsService | updateProject() |
| DELETE /api/proyectos/:id | projectsService | deleteProject() |

### Costos

| Endpoint | Servicio | Método |
|----------|----------|--------|
| GET /api/costos-fijos | costsService | getFixedCosts() |
| POST /api/costos-fijos | costsService | addFixedCost() |
| GET /api/costos-variables | costsService | getVariableCosts() |

### Socios

| Endpoint | Servicio | Método |
|----------|----------|--------|
| GET /api/socios | partnersService | getPartners() |
| POST /api/socios/:id/retiros | partnersService | addWithdrawal() |

### Reportes

| Endpoint | Servicio | Método |
|----------|----------|--------|
| GET /api/reportes/financiero | reportsService | getFinancialStats() |
| GET /api/reportes/mensual | reportsService | getMonthlyStats() |

---

## ⚙️ Para cuando el Backend esté listo

### Paso 1: Actualizar apiClient.js

Cambiar esto:
```javascript
export const get = async (endpoint) => {
    // Actualmente retorna null
    return null;
};
```

Por esto:
```javascript
export const get = async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw handleApiError(response);
    }
    
    return await response.json();
};
```

### Paso 2: Configurar URL

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### Paso 3: REST

Todo el sistema ya funcionará con el backend.

---

## 📊 Ejemplo Completo: Agregar un Proyecto

### Con Componente Actualizado

```javascript
// src/pages/Ingresos/Ingresos.jsx
import * as projectsService from '../../services';
import { useFinance } from '../../context/FinanceContext';

export default function Ingresos() {
    const financeContext = useFinance();
    const [loading, setLoading] = useState(false);
    
    const handleAddProject = async (formData) => {
        setLoading(true);
        
        try {
            // Usa el servicio
            const newProject = await projectsService.addProject(formData);
            
            if (newProject === null) {
                // Sin backend: usa contexto
                financeContext.addProject(formData);
                alert('Proyecto agregado localmente');
            } else {
                // Con backend: backend ya lo creó
                alert('Proyecto agregado en servidor');
                // Recargar lista
                const projects = await projectsService.getProjects();
                // actualizar UI...
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al agregar proyecto');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <ProjectForm onSubmit={handleAddProject} loading={loading} />
    );
}
```

---

## 🎯 Próximos Pasos

1. ✅ Servicios creados (6 archivos)
2. ✅ Documentación completa
3. ⏳ **Migrar componentes** a usar servicios (gradualmente)
4. ⏳ **Backend implementado** (Node.js + Express)
5. ⏳ **Actualizar apiClient.js** con llamadas reales
6. ✨ **Sistema completo funcionando**

---

## 📝 Notas Importantes

- **No modificar datos directamente desde componentes**  
  Siempre pasar por servicios
  
- **Los servicios retornan null cuando no hay backend**  
  Los componentes usan FinanceContext como fallback
  
- **Cuando el backend esté listo**  
  Cambiar apiClient.js, NADA MÁS
  
- **Todos los endpoints están documentados**  
  En cada servicio hay comentarios: `FUTURO BACKEND: GET /api/...`

---

## 🤔 Preguntas Frecuentes

**P: ¿Por qué null cuando no hay backend?**  
R: Permite que el componente use FinanceContext como fallback, sin errores.

**P: ¿Cuándo debo migrar un componente?**  
R: Gradualmente. Un componente a la vez. No hay prisa.

**P: ¿Qué pasa con el localStorage?**  
R: FinanceContext sigue usando localStorage. Los servicios son la capa intermedia.

**P: ¿Y si quiero agregar un nuevo endpoint?**  
R: Crear el método en el servicio correspondiente, documentar con `FUTURO BACKEND: POST /api/...`

---

## 📞 Soporte

Para preguntas sobre la arquitectura, revisar los comentarios en cada archivo de servicio.
Todos están en español y documentan el flujo actual y futuro.
