// Importamos la base de datos Firestore desde base.js
import { db } from './base.js';

// Importamos las funciones necesarias desde el SDK de Firebase Firestore
import {
    collection,    // Para acceder a una colección en Firestore
    addDoc,        // Para agregar un nuevo documento
    onSnapshot     // Para escuchar los cambios en tiempo real
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// --------------------
// Elementos del DOM
// --------------------
const registroTrabajadores = document.getElementById('registroTrabajadores'); // input del nombre
const registroEstudio = document.getElementById('registroEstudio');           // input del nivel educativo
const botonRegistro = document.getElementById('botonSubmit');                 // botón para registrar
const listaTrabajadores = document.getElementById('listaTrabajadores');       // contenedor donde se muestran los trabajadores

// --------------------
// Clase Empleado
// --------------------
class Empleado {
    constructor(nombre, nivel) {
        this.nombre = nombre;   // nombre del trabajador
        this.nivel = nivel;     // nivel educativo
        this.resultado = this.calcularPago(); // se calcula el sueldo base y con descuentos
        if (typeof this.resultado === 'string') {
            // Si hubo error en el cálculo, asigna valores nulos
            this.pago = null;
            this.sueldo = null;
            this.error = this.resultado;
        } else {
            this.pago = this.resultado.pago;   // salario base
            this.sueldo = this.resultado.sueldo; // sueldo con descuento
            this.error = null;
        }
    }

    // Método para calcular el sueldo base según el nivel de estudio
    calcularPago() {
        const tecnico = 1650000;
        const universidad = 2000000;
        const titulado = 2400000;
        const maestria = 3000000;

        let porcentaje = 0;

        // Determina el sueldo según el nivel educativo y aplica descuentos
        switch (this.nivel.trim().toLowerCase()) {
            case 'tecnico': {
                porcentaje = tecnico - tecnico * 0.27; // Descuento total del 27%
                return { pago: tecnico, sueldo: porcentaje };
            }
            case 'universitario': {
                porcentaje = universidad - universidad * 0.27;
                return { pago: universidad, sueldo: porcentaje };
            }
            case 'titulado': {
                porcentaje = titulado - titulado * 0.27;
                return { pago: titulado, sueldo: porcentaje };
            }
            case 'magister': {
                porcentaje = maestria - maestria * 0.27;
                return { pago: maestria, sueldo: porcentaje };
            }
            default:
                // Si el nivel no existe, retorna un mensaje de error
                return "Este nivel no existe dentro de la base de datos";
        }
    }

    mostrarInformación(i) {
        if (this.error) {
            return `${i + 1}. ${this.nombre} - ${this.error}`;
        }
        return `${i + 1}. ${this.nombre} nivel educativo: ${this.nivel} salario base: $${this.pago.toLocaleString()}, sueldo con descuento $${this.sueldo.toLocaleString()}`;
    }
}

// --------------------
// Registro del trabajador en Firestore
// --------------------
botonRegistro.addEventListener('click', async () => {
    const nombre = registroTrabajadores.value.trim();  // obtiene y limpia el nombre
    const nivel = registroEstudio.value.trim();        // obtiene y limpia el nivel de estudio

    // Validación de campos vacíos
    if (!nombre || !nivel) {
        alert('Registro incompleto, llena ambos campos.');
        return;
    }

    // Se crea un nuevo empleado usando la clase
    const nuevoEmpleado = new Empleado(nombre, nivel);

    if (nuevoEmpleado.error) {
        alert(nuevoEmpleado.error);
        return;
    }

    try {
        // Se guarda el nuevo trabajador en la colección 'trabajadores' en Firestore
        await addDoc(collection(db, 'trabajadores'), {
            nombre: nuevoEmpleado.nombre,
            nivel: nuevoEmpleado.nivel,
            pago: nuevoEmpleado.pago,
            sueldo: nuevoEmpleado.sueldo
        });

        // Limpiamos los campos del formulario
        registroTrabajadores.value = '';
        registroEstudio.value = '';
    } catch (error) {
        // Si algo falla al guardar en Firebase, se muestra un mensaje
        console.error('Error al guardar:', error);
        alert('Error al registrar trabajador.');
    }
});

// --------------------
// Mostrar trabajadores en tiempo real
// --------------------
onSnapshot(collection(db, 'trabajadores'), (snapshot) => {
    // Limpiamos la lista antes de volver a pintar
    listaTrabajadores.innerHTML = '';

    // Creamos un contador manual para numerar los trabajadores
    let contador = 1;
    snapshot.forEach((doc) => {
        const data = doc.data(); // Obtenemos los datos del trabajador

        // Creamos un párrafo y le asignamos el contenido con nombre, nivel y sueldo
        const p = document.createElement('p');
        if (data.pago && data.sueldo) {
            p.textContent = `${contador}. ${data.nombre} nivel educativo: ${data.nivel} salario base: $${data.pago.toLocaleString()} / sueldo con descuento $${data.sueldo.toLocaleString()}`;
        } else {
            p.textContent = `${contador}. ${data.nombre} - Error en los datos`;
        }
        p.classList.add('listaTrabajadores'); // Le asignamos una clase para aplicar estilos

        // Lo agregamos al contenedor principal
        listaTrabajadores.appendChild(p);
        contador++;
    });
});