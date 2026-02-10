/**
 * FinanceContext.jsx
 * 
 * NÚCLEO CENTRAL DEL SISTEMA DE GESTIÓN FINANCIERA
 * 
 * ========================================
 * DESCRIPCIÓN GENERAL
 * ========================================
 * 
 * Este archivo contiene la lógica central de la aplicación. Aquí se:
 * - Administra TODO el estado financiero (proyectos, costos, socios, balance)
 * - Aplican cálculos de utilidad neta mensual
 * - Genera reportes financieros
 * - Mantiene auditoría de todas las transacciones
 * - Persiste datos en localStorage (SERÁ MIGRADO A BACKEND MYSQL)
 * 
 * ARQUITECTURA ACTUAL:
 * - Estado React con localStorage como persistence layer
 * - Todos los cambios pasan por métodos de este Context
 * - Las 6 páginas principales leen datos vía hook useFinance()
 * - Sin autenticación ni validación de permisos (FUTURO)
 * 
 * INTEGRACIÓN CON BACKEND (PRÓXIMO PASO):
 * - addTransaction() → POST /api/transacciones
 * - removeTransaction() → DELETE /api/transacciones/{id}
 * - getFinancialStats() → GET /api/reportes/financiero
 * - getReportStats() → GET /api/reportes/mensual?mes=X&año=Y
 * - localStorage pasará a ser CACHÉ LOCAL solamente
 * - MySQL será la "truth source" (fuente única de verdad)
 * 
 * CRÍTICO: Diferentes tipos de transacción (project_income, fixed_cost, etc)
 * tienen impactos financieros distintos. Esto DEBE preservarse en backend.
 */

import { createContext, useContext, useState, useEffect } from 'react';

/**
 * CREAR CONTEXTO
 * Contenedor para compartir estado entre todos los componentes
 */
const FinanceContext = createContext();

/**
 * Hook useFinance()
 * 
 * PROPÓSITO: Permitir que los componentes accedan al estado y métodos del Context
 * 
 * EJEMPLO DE USO:
 * 
 * function MiComponente() {
 *   const { projects, addProject, balance } = useFinance();
 *   // Aquí puedes usar los datos y métodos del contexto
 * }
 * 
 * ERROR COMÚN: Olvidar envolverse con <FinanceProvider>
 */
export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error('useFinance debe utilizarse dentro de un FinanceProvider');
    }
    return context;
};

/**
 * Proveedor del Contexto Financiero
 * 
 * Componente que debe envolver la aplicación para proporcionar acceso al Context
 * 
 * EJEMPLO DE USO (en App.jsx):
 * <FinanceProvider>
 *   <MainLayout />
 * </FinanceProvider>
 */
export const FinanceProvider = ({ children }) => {
    // ========================================
    // ESTADO GLOBAL - ESTRUCTURA DE DATOS
    // ========================================

    /**
     * INICIALIZACIÓN DEL ESTADO
     * 
     * Se ejecuta UNA SOLA VEZ cuando el componente monta.
     * Intenta cargar datos de localStorage; si no existen, usa valores por defecto.
     */
    const [data, setData] = useState(() => {
        const savedData = localStorage.getItem('financeData');
        
        /**
         * ESTRUCTURA DE DATOS POR DEFECTO
         * 
         * Esta es la "forma" de los datos. Cada propiedad se explica abajo.
         */
        const defaultData = {
            // *** BALANCE GENERAL ***
            balance: 0,                                  // Dinero disponible en cuenta
            
            // *** INGRESOS (Proyectos) ***
            projects: [],                               // Array de proyectos con historial de pagos
            
            // *** EGRESOS - COSTOS FIJOS ***
            fixedCosts: [],                             // Gastos recurrentes mensuales
            
            // *** EGRESOS - COSTOS VARIABLES ***
            variableCosts: [],                          // Gastos puntuales variables
            
            // *** INVERSIONES ***
            investments: [],                            // Inversiones en equipos o fondos
            
            // *** CATÁLOGOS (Dropdowns dinámicos) ***
            services: [
                'Hosting',
                'Dominios',
                'Software',
                'Oficina',
                'Servicios Básicos',
                'Internet',
                'Marketing'
            ],
            
            projectTypes: [
                'Web',
                'E-commerce',
                'SaaS',
                'Landing Page',
                'Inmobiliaria',
                'Marketing'
            ],
            
            projectStatuses: [
                'Lead',
                'Cotizado',
                'Aceptado',
                'En desarrollo',
                'Entregado',
                'Cancelado'
            ],
            
            variableCostTypes: [
                'Freelancer',
                'Plugin',
                'Comisión',
                'Marketing / Ads',
                'Servicio Puntual'
            ],
            
            // *** SOCIOS Y RETIROS ***
            partners: [
                { id: 1, name: 'Dan Sepúlveda', percentage: 50, withdrawals: [] },
                { id: 2, name: 'Nicolás Machuca', percentage: 50, withdrawals: [] }
            ],
            
            // *** CONTABILIDAD ***
            income: 0,                                  // Ingresos totales
            expenses: 0,                                // Gastos totales
            emergencyFund: 0,                           // Fondo de emergencia acumulado
            retentions: 0,                              // Retenciones acumuladas
            
            transactions: [],                           // AUDITORÍA de todas las operaciones
            
            // *** CONFIGURACIÓN FINANCIERA ***
            financialConfigs: {
                emergencyFundPercentage: 15,
                reinvestmentPercentage: 0
            }
        };

        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                return {
                    ...defaultData,
                    ...parsed,
                    projects: parsed.projects || defaultData.projects,
                    fixedCosts: parsed.fixedCosts || defaultData.fixedCosts,
                    variableCosts: parsed.variableCosts || defaultData.variableCosts,
                    investments: parsed.investments || defaultData.investments,
                    transactions: parsed.transactions || defaultData.transactions,
                    projectTypes: parsed.projectTypes || defaultData.projectTypes,
                    projectStatuses: parsed.projectStatuses || defaultData.projectStatuses,
                    variableCostTypes: parsed.variableCostTypes || defaultData.variableCostTypes,
                    services: parsed.services || defaultData.services,
                    financialConfigs: { ...defaultData.financialConfigs, ...(parsed.financialConfigs || {}) },
                    partners: Array.isArray(parsed.partners) ? parsed.partners : defaultData.partners
                };
            } catch (e) {
                console.error("Error al cargar datos desde localStorage:", e);
                return defaultData;
            }
        }

        return defaultData;
    });

    // ========================================
    // PERSISTENCIA A localStorage
    // ========================================

    /**
     * useEffect: GUARDAR ESTADO EN localStorage
     * 
     * Se ejecuta CADA VEZ que cambia el estado (data).
     * Asegura que los datos no se pierdan si se cierra el navegador.
     * 
     * FUTURO: Cuando haya backend, esto hará sync automático con servidor
     */
    useEffect(() => {
        localStorage.setItem('financeData', JSON.stringify(data));
    }, [data]);


    // ========================================
    // MÉTODOS - TRANSACCIONES (NÚCLEO)
    // ========================================

    /**
     * addTransaction - AÑADIR NUEVA TRANSACCIÓN
     * 
     * PROPÓSITO: Registrar cualquier operación financiera (ingreso, gasto, etc)
     * y aplicar su impacto financiero automáticamente.
     * 
     * TIPOS DE TRANSACCIÓN SOPORTADOS:
     * 1. project_income     → Pago recibido de cliente por proyecto
     * 2. fixed_cost         → Gasto recurrente (hosting, dominio, etc)
     * 3. variable_cost      → Gasto puntual (freelancer, material, etc)
     * 4. investment         → Inversión en equipo o fondo de emergencia
     * 5. withdrawal         → Retiro de socio
     * 6. income (genérico)  → Ingreso sin asociar a proyecto específico
     * 
     * PARÁMETRO:
     * @param {Object} transaction - Objeto con estructura:
     *   {
     *     id: Date.now(),                    // ID único
     *     type: 'project_income',            // Tipo de transacción
     *     amount: 2500,                      // Cantidad
     *     date: '2026-02-01',                // Fecha ISO
     *     projectId: 123,                    // ID del proyecto (si aplica)
     *     description: 'Pago anticipo',      // Texto descriptivo
     *     ...otros campos según tipo
     *   }
     * 
     * FLUJO:
     * 1. Agregar transacción al historial (para auditoría)
     * 2. Según el TYPE, aplicar impacto específico:
     *    - project_income: ↑balance, ↑income, registrar pago en proyecto
     *    - fixed_cost: ↓balance, ↑expenses, agregar a costosF
     *    - variable_cost: ↓balance, ↑expenses, agregar a costosV
     *    - investment: ↓balance, ↑emergencyFund
     *    - withdrawal: ↓balance, registrar retiro en socio
     * 3. Guardar cambios (automático via useEffect)
     * 
     * IMPORTANTE PARA BACKEND:
     * Esta lógica debe replicarse en el backend. Cada endpoint POST
     * debe validar el type y aplicar el impacto financiero.
     */
    const addTransaction = (transaction) => {
        setData(prev => {
            const amount = parseFloat(transaction.amount || 0);

            // Copiar arrays profundamente para evitar problemas con React Strict Mode
            const newState = {
                ...prev,
                transactions: [transaction, ...(prev.transactions || [])],
                projects: prev.projects ? [...prev.projects] : [],
                fixedCosts: prev.fixedCosts ? [...prev.fixedCosts] : [],
                variableCosts: prev.variableCosts ? [...prev.variableCosts] : [],
                investments: prev.investments ? [...prev.investments] : [],
            };

            // APLICAR IMPACTO SEGÚN TIPO DE TRANSACCIÓN
            switch (transaction.type) {
                case 'project_income':
                    // Buscar el proyecto por ID
                    const existingProjIndex = newState.projects.findIndex(
                        p => p.id === parseInt(transaction.projectId)
                    );
                    
                    if (existingProjIndex >= 0) {
                        const project = { ...newState.projects[existingProjIndex] };
                        // Agregar el pago al historial del proyecto
                        project.history = [...(project.history || []), {
                            date: transaction.date,
                            amount: amount,
                            note: transaction.description,
                            transactionId: transaction.id
                        }];
                        newState.projects[existingProjIndex] = project;
                    }
                    
                    // Aumentar ingresos globales y balance
                    newState.income = (prev.income || 0) + amount;
                    newState.balance = (prev.balance || 0) + amount;
                    break;

                case 'fixed_cost':
                    // Normalizar campo de fecha (paymentDate → date)
                    const fixedCostToAdd = {
                        ...transaction,
                        date: transaction.date || transaction.paymentDate
                    };
                    newState.fixedCosts = [...newState.fixedCosts, fixedCostToAdd];
                    // Aumentar gastos globales, disminuir balance
                    newState.expenses = (prev.expenses || 0) + amount;
                    newState.balance = (prev.balance || 0) - amount;
                    
                    // Auto-agregar categoría al catálogo si no existe
                    if (transaction.category && !newState.services?.includes(transaction.category)) {
                        newState.services = [...(prev.services || []), transaction.category];
                    }
                    break;

                case 'variable_cost':
                    newState.variableCosts = [...newState.variableCosts, transaction];
                    newState.expenses = (prev.expenses || 0) + amount;
                    newState.balance = (prev.balance || 0) - amount;
                    break;

                case 'investment':
                    newState.investments = [...newState.investments, transaction];
                    newState.emergencyFund = (prev.emergencyFund || 0) + amount;
                    newState.balance = (prev.balance || 0) - amount;
                    break;

                default:
                    // Transacciones genéricas (income sin proyecto específico)
                    if (transaction.type === 'income') {
                        newState.income = prev.income + amount;
                        newState.balance = prev.balance + amount;
                    } else {
                        newState.expenses = prev.expenses + amount;
                        newState.balance = prev.balance - amount;
                    }
                    break;
            }

            return newState;
        });
    };

    /**
     * removeTransaction - ELIMINAR TRANSACCIÓN Y REVERTIR SU IMPACTO
     * 
     * PROPÓSITO: Deshacer una transacción previamente registrada.
     * Esto es crítico para la auditoría (nunca se borra), pero sí se crea
     * una transacción inversa en el sistema.
     * 
     * PARÁMETROS:
     * @param {number} id - ID único de la transacción a eliminar
     * @param {string} type - Tipo de transacción (project_income, fixed_cost, etc)
     * 
     * LÓGICA:
     * 1. Buscar la transacción por ID
     * 2. Revertir el impacto financiero:
     *    - Si era +balance, ahora -balance
     *    - Si era -balance, ahora +balance
     * 3. Limpiar referencias en proyectos, socios, etc
     * 
     * NOTA IMPORTANTE PARA BACKEND:
     * En una BD real, las transacciones NO se deletan.
     * Se crea una transacción inversa o de ajuste.
     * Esto permite auditoría completa.
     */
    const removeTransaction = (id, type) => {
        setData(prev => {
            const transaction = prev.transactions.find(t => t.id === id);
            if (!transaction) return prev; // No encontrada

            const amount = parseFloat(transaction.amount);
            const newState = {
                ...prev,
                transactions: prev.transactions.filter(t => t.id !== id)
            };

            // REVERTIR IMPACTO SEGÚN TIPO
            if (type === 'project_income' || type === 'income') {
                // Revertir: disminuir ingresos y balance
                newState.income -= amount;
                newState.balance -= amount;

                // Si era de proyecto, quitar del historial del proyecto
                if (transaction.projectId) {
                    newState.projects = newState.projects.map(p => {
                        if (p.id === parseInt(transaction.projectId)) {
                            return {
                                ...p,
                                history: p.history
                                    ? p.history.filter(h => h.transactionId !== id)
                                    : []
                            };
                        }
                        return p;
                    });
                }

            } else if (type === 'withdrawal') {
                // Revertir retiro: aumentar balance
                newState.balance += amount;
                // Quitar del historial de retiros del socio
                if (transaction.partnerId) {
                    newState.partners = prev.partners.map(p => {
                        if (p.id === transaction.partnerId) {
                            return {
                                ...p,
                                withdrawals: (p.withdrawals || []).filter(
                                    w => w.transactionId !== id
                                )
                            };
                        }
                        return p;
                    });
                }
            } else {
                // Costos e inversiones
                if (type === 'investment') {
                    // Revertir: disminuir fondo, aumentar balance
                    newState.emergencyFund -= amount;
                    newState.balance += amount;
                    newState.investments = prev.investments.filter(t => t.id !== id);
                } else {
                    // fixed_cost o variable_cost: revertir gasto
                    newState.expenses -= amount;
                    newState.balance += amount;
                    
                    if (type === 'fixed_cost') {
                        newState.fixedCosts = prev.fixedCosts.filter(t => t.id !== id);
                    } else if (type === 'variable_cost') {
                        newState.variableCosts = prev.variableCosts.filter(t => t.id !== id);
                    }
                }
            }

            return newState;
        });
    };


    // ========================================
    // MÉTODOS - GESTIÓN DE PROYECTOS
    // ========================================

    /**
     * generateProjectId - GENERAR ID ÚNICO PARA PROYECTO
     * 
     * PROPÓSITO: Crear identificadores con significado para proyectos.
     * Formato: NC[TIPO][NÚMERO]
     * Ejemplo: NCW0001, NCE0002, NCL0003
     * 
     * PARÁMETROS:
     * @param {string} type - Tipo de proyecto (Web, E-commerce, SaaS, etc)
     * @param {Array} currentProjects - Lista de proyectos existentes
     * 
     * RETORNA:
     * @returns {string} - ID personalizado (ej: "NCW0042")
     * 
     * LÓGICA:
     * 1. Mapear tipo de proyecto a prefijo (Web→NCW, E-commerce→NCE, etc)
     * 2. Contar cuántos proyectos del mismo tipo existen
     * 3. Incrementar contador y rellenar con ceros
     * 4. Devolver: PREFIJO + CONTADOR (ej: NCW + 0042 = NCW0042)
     * 
     * IMPORTANTE PARA BACKEND:
     * Esta lógica DEBE replicarse en el backend para generar IDs consistentes.
     * NO se debe permitir que el cliente genere IDs; siempre el servidor.
     */
    const generateProjectId = (type, currentProjects) => {
        const prefixMap = {
            'Web': 'NCW',
            'E-commerce': 'NCE',
            'SaaS': 'NCS',
            'Landing Page': 'NCL',
            'Inmobiliaria': 'NCI',
            'Marketing': 'NCM'
        };
        
        // Usar prefijo del tipo, o genérico si no existe
        const prefix = prefixMap[type] || 'NCG';
        
        // Contar cuántos proyectos del tipo actual ya existen
        const count = currentProjects
            .filter(p => p.customId && p.customId.startsWith(prefix))
            .length;
        
        // Crear número con ceros a la izquierda (0001, 0002, etc)
        const number = (count + 1).toString().padStart(4, '0');
        
        return `${prefix}${number}`;
    };

    /**
     * addProject - CREAR NUEVO PROYECTO
     * 
     * PROPÓSITO: Registrar un nuevo proyecto con cliente, monto acordado, etc.
     * 
     * PARÁMETRO:
     * @param {Object} project - Datos del proyecto:
     *   {
     *     name: "Sistema web para tienda",
     *     type: "E-commerce",
     *     status: "Lead",
     *     clientName: "Juan García",
     *     clientRut: "12.345.678-9",
     *     clientPhone: "+56 9 87654321",
     *     clientEmail: "juan@empresa.cl",
     *     clientProfession: "Comerciante",
     *     agreedAmount: 5000
     *   }
     * 
     * PROCEDIMIENTO:
     * 1. Generar customId automáticamente (NCE0042)
     * 2. Inicializar historial vacío (se llenará cuando reciba pagos)
     * 3. Agregar al principio de la lista (más reciente arriba)
     * 4. Guardar en localStorage (automático)
     */
    const addProject = (project) => {
        setData(prev => {
            // Generar ID personalizado
            const customId = generateProjectId(project.type, prev.projects);
            
            return {
                ...prev,
                projects: [
                    {
                        ...project,
                        customId,
                        history: []  // Historial de pagos (se llena después)
                    },
                    ...prev.projects
                ]
            };
        });
    };

    /**
     * updateProjectStatus - CAMBIAR ESTADO DE PROYECTO
     * 
     * PROPÓSITO: Cambiar el estado (Lead → Cotizado → Aceptado → En desarrollo → Entregado)
     * 
     * PARÁMETROS:
     * @param {number} projectId - ID del proyecto
     * @param {string} newStatus - Nuevo estado (ej: "En desarrollo")
     * 
     * NOTAS:
     * - Solo cambia metadata, NO afecta balance
     * - Importante para tracking de progreso del proyecto
     */
    const updateProjectStatus = (projectId, newStatus) => {
        setData(prev => ({
            ...prev,
            projects: prev.projects.map(p =>
                p.id === projectId ? { ...p, status: newStatus } : p
            )
        }));
    };

    /**
     * removeProject - ELIMINAR PROYECTO Y REVERTIR SUS INGRESOS
     * 
     * PROPÓSITO: Borrar un proyecto completo.
     * Esto revierte TODOS los pagos recibidos del proyecto.
     * 
     * PARÁMETRO:
     * @param {number} id - ID del proyecto a eliminar
     * 
     * PROCEDIMIENTO:
     * 1. Buscar el proyecto
     * 2. Si tiene historial de pagos, sumarlos
     * 3. Revertir cantidad total del balance e ingresos
     * 4. Eliminar todas las transacciones asociadas al proyecto
     * 5. Eliminar el proyecto
     * 
     * IMPORTANTE: Es una operación destructiva y NO es reversible.
     * En producción, se debería usar "soft delete" (marcar como eliminado).
     */
    const removeProject = (id) => {
        setData(prev => {
            // Buscar el proyecto
            const project = prev.projects.find(p => p.id === id);
            if (!project) return prev;

            // Calcular total de ingresos recibidos
            const totalProjectIncome = project.history
                ? project.history.reduce((acc, curr) => acc + curr.amount, 0)
                : 0;

            // Eliminar transacciones asociadas al proyecto
            const newTransactions = prev.transactions.filter(
                t => t.projectId !== id.toString() && t.projectId !== id
            );

            return {
                ...prev,
                projects: prev.projects.filter(p => p.id !== id),
                transactions: newTransactions,
                income: prev.income - totalProjectIncome,
                balance: prev.balance - totalProjectIncome
            };
        });
    };

    const updateFinancialConfig = (key, value) => {
        setData(prev => ({
            ...prev,
            financialConfigs: {
                ...prev.financialConfigs,
                [key]: parseFloat(value)
            }
        }));
    };

    const updatePartnerPercentage = (partnerId, newPercentage) => {
        setData(prev => ({
            ...prev,
            partners: prev.partners.map(p =>
                p.id === partnerId ? { ...p, percentage: parseFloat(newPercentage) } : p
            )
        }));
    };

    const addWithdrawal = (partnerId, amount, date) => {
        setData(prev => {
            const partner = prev.partners.find(p => p.id === partnerId);
            const transaction = {
                id: Date.now(),
                type: 'withdrawal',
                partnerId,
                description: `Retiro: ${partner?.name || 'Socio'}`,
                amount: parseFloat(amount),
                date
            };

            return {
                ...prev,
                balance: prev.balance - parseFloat(amount),
                transactions: [transaction, ...(prev.transactions || [])],
                partners: prev.partners.map(p => {
                    if (p.id === partnerId) {
                        return {
                            ...p,
                            withdrawals: [...(p.withdrawals || []), { amount: parseFloat(amount), date, transactionId: transaction.id }]
                        };
                    }
                    return p;
                })
            };
        });
    };

    const addPartner = (name) => {
        setData(prev => ({
            ...prev,
            partners: [...prev.partners, {
                id: Date.now(),
                name,
                percentage: 0,
                withdrawals: []
            }]
        }));
    };

    const removePartner = (id) => {
        setData(prev => ({
            ...prev,
            partners: prev.partners.filter(p => p.id !== id)
        }));
    };

    const resetData = () => {
        if (window.confirm("¿ESTÁS SEGURO? Se borrarán todos los datos y no se podrán recuperar.")) {
            localStorage.removeItem('financeData');
            window.location.reload();
        }
    };

    // Centralized Logic (with filters support)
    const getReportStats = (month = null, year = null) => {
        let filteredIncome = 0;
        let filteredFixedCosts = 0;
        let filteredVariableCosts = 0;
        let filteredInvestments = 0;

        // Helper to check date
        const isWithinPeriod = (dateStr) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            const matchesYear = year ? d.getFullYear() === parseInt(year) : true;
            const matchesMonth = month !== null ? d.getMonth() === parseInt(month) : true; // month is 0-indexed
            return matchesYear && matchesMonth;
        };

        // Recalculate from source streams for time period:
        const periodProjectIncome = (data.projects || []).reduce((sum, proj) => {
            const historyInPeriod = (proj.history || []).filter(h => isWithinPeriod(h.date));
            return sum + historyInPeriod.reduce((acc, h) => acc + h.amount, 0);
        }, 0);

        // Filter generic income transactions if they exist and are not project-related
        const genericIncomeInPeriod = (data.transactions || [])
            .filter(t => t.type === 'income' && !t.projectId && isWithinPeriod(t.date))
            .reduce((acc, t) => acc + parseFloat(t.amount), 0);

        filteredIncome = periodProjectIncome + genericIncomeInPeriod;

        // Fixed costs may use paymentDate instead of date
        filteredFixedCosts = (data.fixedCosts || []).filter(c => isWithinPeriod(c.date || c.paymentDate)).reduce((acc, c) => acc + (c.amount || 0), 0);
        filteredVariableCosts = (data.variableCosts || []).filter(c => isWithinPeriod(c.date)).reduce((acc, c) => acc + (c.amount || 0), 0);
        filteredInvestments = (data.investments || []).filter(c => isWithinPeriod(c.date)).reduce((acc, c) => acc + (c.amount || 0), 0);

        const operatingResult = filteredIncome - (filteredFixedCosts + filteredVariableCosts);
        const baseForDeductions = Math.max(0, operatingResult);

        const emergencyFundDeduction = (baseForDeductions * (data.financialConfigs?.emergencyFundPercentage || 0)) / 100;
        const reinvestmentDeduction = (baseForDeductions * (data.financialConfigs?.reinvestmentPercentage || 0)) / 100;

        const netProfit = operatingResult - emergencyFundDeduction - reinvestmentDeduction - filteredInvestments;

        // Partner Withdrawals in period
        const periodWithdrawals = (data.partners || []).reduce((sum, p) => {
            const wInPeriod = (p.withdrawals || []).filter(w => isWithinPeriod(w.date));
            return sum + wInPeriod.reduce((acc, w) => acc + w.amount, 0);
        }, 0);

        return {
            income: filteredIncome,
            expenses: filteredFixedCosts + filteredVariableCosts,
            fixedCosts: filteredFixedCosts,
            variableCosts: filteredVariableCosts,
            investments: filteredInvestments,
            operatingResult,
            netProfit,
            emergencyFundDeduction,
            reinvestmentDeduction,
            withdrawals: periodWithdrawals
        };
    };

    // Global Stats (Current State)
    const getFinancialStats = () => {
        const totalIncome = data.income || 0;
        const totalFixedCosts = (data.fixedCosts || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const totalVariableCosts = (data.variableCosts || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);

        const operatingResult = totalIncome - (totalFixedCosts + totalVariableCosts);

        const baseForDeductions = Math.max(0, operatingResult);

        const emergencyFundDeduction = (baseForDeductions * (data.financialConfigs?.emergencyFundPercentage || 0)) / 100;
        const reinvestmentDeduction = (baseForDeductions * (data.financialConfigs?.reinvestmentPercentage || 0)) / 100;

        const totalInvestments = (data.investments || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);

        const netProfit = operatingResult - emergencyFundDeduction - reinvestmentDeduction - totalInvestments;

        return {
            totalIncome,
            totalFixedCosts,
            totalVariableCosts,
            totalInvestments,
            totalExpenses: totalFixedCosts + totalVariableCosts,
            operatingResult,
            emergencyFundDeduction,
            reinvestmentDeduction,
            netProfit,
            emergencyFundTotal: (data.emergencyFund || 0) + emergencyFundDeduction
        };
    };

    const getMonthlyStats = (month, year) => getReportStats(month, year);
    const getYearlyStats = (year) => getReportStats(null, year);

    // ========================================
    // CATALOG FUNCTIONS
    // ========================================

    const addProjectType = (name) => {
        setData(prev => ({
            ...prev,
            projectTypes: [...(prev.projectTypes || []), {
                id: Date.now(),
                name
            }]
        }));
    };

    const removeProjectType = (id) => {
        setData(prev => ({
            ...prev,
            projectTypes: (prev.projectTypes || []).filter(t => t.id !== id)
        }));
    };

    const addProjectStatus = (name) => {
        setData(prev => ({
            ...prev,
            projectStatuses: [...(prev.projectStatuses || []), {
                id: Date.now(),
                name
            }]
        }));
    };

    const removeProjectStatus = (id) => {
        setData(prev => ({
            ...prev,
            projectStatuses: (prev.projectStatuses || []).filter(s => s.id !== id)
        }));
    };

    const addService = (name) => {
        setData(prev => ({
            ...prev,
            services: [...(prev.services || []), {
                id: Date.now(),
                name
            }]
        }));
    };

    const removeService = (id) => {
        setData(prev => ({
            ...prev,
            services: (prev.services || []).filter(s => s.id !== id)
        }));
    };

    const addVariableCostType = (name) => {
        setData(prev => ({
            ...prev,
            variableCostTypes: [...(prev.variableCostTypes || []), {
                id: Date.now(),
                name
            }]
        }));
    };

    const removeVariableCostType = (id) => {
        setData(prev => ({
            ...prev,
            variableCostTypes: (prev.variableCostTypes || []).filter(t => t.id !== id)
        }));
    };

    return (
        <FinanceContext.Provider value={{
            data,
            addTransaction,
            removeTransaction,
            addProject,
            removeProject,
            updateProjectStatus,
            addProjectType,
            removeProjectType,
            addProjectStatus,
            removeProjectStatus,
            addService,
            removeService,
            addVariableCostType,
            removeVariableCostType,
            updateFinancialConfig,
            updatePartnerPercentage,
            addPartner,
            removePartner,
            addWithdrawal,
            resetData,
            getFinancialStats,
            getReportStats,
            getMonthlyStats,
            getYearlyStats
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
