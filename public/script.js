// Importamos la base de datos Firestore y las funciones necesarias del SDK web
import { db } from './base.js';
import {
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// --------------------
// Elementos del DOM
// --------------------
const registroTrabajadores = document.getElementById('registroTrabajadores');
const registroEstudio = document.getElementById('registroEstudio');
const botonRegistro = document.getElementById('botonSubmit-registro');
const listaTrabajadores = document.getElementById('listaTrabajadores');
const retiroTrabajadores = document.getElementById('retiroTrabajadores');
const botonRetiro = document.getElementById('botonSubmit-retiro');

const tabla = document.getElementById('tablaTrabajadores');
const cuerpoTabla = document.getElementById('cuerpoTabla');
const pieTabla = document.getElementById('pieTabla');

const botonesMostrar = {
    'general': document.getElementById('mostrarGeneral'),
    'tecnico': document.getElementById('mostrarTecnico'),
    'universitario': document.getElementById('mostrarUniversitario'),
    'titulado': document.getElementById('mostrarTitulado'),
    'magister': document.getElementById('mostrarMagister')
};

// --------------------
// Lógica principal de la aplicación
// --------------------
const dbCollection = collection(db, 'empleados');
let todosLosEmpleados = [];

// Función para calcular y renderizar la tabla
const renderTable = (empleados, filtro) => {
    cuerpoTabla.innerHTML = '';
    const empleadosFiltrados = empleados.filter(empleado =>
        filtro === 'general' || empleado.nivel.trim().toLowerCase() === filtro
    );

    let contador = 1;
    let totalSueldos = 0;
    
    // Encabezado de la tabla
    const filah = document.createElement('tr');
    filah.innerHTML = `
        <th>N°</th>
        <th>Nombre</th>
        <th>Nivel</th>
        <th>Salario Base</th>
        <th>Sueldo con Descuento</th>
    `;
    cuerpoTabla.appendChild(filah);
    
    // Cuerpo de la tabla con los empleados filtrados
    empleadosFiltrados.forEach(empleado => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${contador}</td>
            <td>${empleado.nombre}</td>
            <td>$${empleado.pago.toLocaleString()}</td>
            <td>${empleado.nivel}</td>
            <td>$${empleado.sueldo.toLocaleString()}</td>
        `;
        cuerpoTabla.appendChild(fila);
        contador++;
        totalSueldos += empleado.sueldo;
    });

    // Pie de la tabla con el total
    pieTabla.innerHTML = '';
    const filaTotal = document.createElement('tr');
    filaTotal.innerHTML = `
        <td colspan="4" style="text-align: right;"><strong>Total Sueldos:</strong></td>
        <td><strong>$${totalSueldos.toLocaleString()}</strong></td>
    `;
    pieTabla.appendChild(filaTotal);
};

// Listener para la colección de Firebase
onSnapshot(dbCollection, (snapshot) => {
    // Cuando hay un cambio, actualizamos la lista de empleados
    todosLosEmpleados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Volvemos a renderizar la tabla con el filtro activo
    const filtroActivo = document.querySelector('.Buttons .active');
    if (filtroActivo) {
        renderTable(todosLosEmpleados, filtroActivo.dataset.filter);
    } else {
        // Si no hay filtro activo, no mostramos la tabla
        tabla.style.display = 'none';
    }
});

// --------------------
// Eventos de los botones
// --------------------
// Evento para el botón de registro
botonRegistro.addEventListener('click', async () => {
    const nombre = registroTrabajadores.value;
    const nivel = registroEstudio.value;
    const sueldoBase = {
        'tecnico': 1650000,
        'universitario': 2000000,
        'titulado': 2400000,
        'magister': 3000000
    };
    const pago = sueldoBase[nivel.trim().toLowerCase()];

    // Calcular sueldo con descuentos
    const descuentoPension = pago * 0.10;
    const descuentoSocial = pago * 0.05;
    const descuentoAhorro = pago * 0.12;
    const sueldoFinal = pago - descuentoPension - descuentoSocial - descuentoAhorro;
    
    if (nombre && nivel && pago) {
        try {
            await addDoc(dbCollection, {
                nombre: nombre,
                nivel: nivel,
                pago: pago,
                sueldo: sueldoFinal
            });
            console.log("Documento agregado con éxito.");
            registroTrabajadores.value = '';
        } catch (e) {
            console.error("Error agregando documento: ", e);
        }
    } else {
        console.log("Por favor, rellene todos los campos.");
    }
});

// Evento para el botón de retiro
botonRetiro.addEventListener('click', async () => {
    const nombreRetiro = retiroTrabajadores.value.trim().toLowerCase();
    if (!nombreRetiro) {
        console.log("Por favor, ingrese el nombre del trabajador a retirar.");
        return;
    }

    // Buscamos el trabajador por nombre en la lista local
    const trabajador = todosLosEmpleados.find(emp => emp.nombre.toLowerCase() === nombreRetiro);
    if (trabajador) {
        try {
            await deleteDoc(doc(db, 'empleados', trabajador.id));
            console.log("Documento eliminado con éxito.");
            retiroTrabajadores.value = '';
        } catch (e) {
            console.error("Error al eliminar documento: ", e);
        }
    } else {
        console.log("No se encontró un trabajador con ese nombre.");
    }
});

// Eventos de los botones para mostrar las tablas
const toggleTable = (filtro) => {
    // Si la tabla ya está visible y se presiona el mismo botón, la ocultamos
    const filtroActivo = document.querySelector('.Buttons .active');
    if (filtroActivo && filtroActivo.dataset.filter === filtro) {
        tabla.style.display = 'none';
        filtroActivo.classList.remove('active');
        return;
    }
    
    // Mostramos la tabla
    tabla.style.display = 'table';
    
    // Actualizamos la clase 'active' de los botones
    const allButtons = document.querySelectorAll('.Buttons button');
    allButtons.forEach(btn => btn.classList.remove('active'));
    
    const activeButton = document.querySelector(`.Buttons button[data-filter="${filtro}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Renderizamos la tabla con el nuevo filtro
    renderTable(todosLosEmpleados, filtro);
};

// Asignar los eventos a los botones
for (const filtro in botonesMostrar) {
    if (botonesMostrar.hasOwnProperty(filtro)) {
        botonesMostrar[filtro].addEventListener('click', () => toggleTable(filtro));
    }
}