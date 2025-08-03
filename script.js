// Importamos la base de datos Firestore desde base.js
import { db } from './base.js';

// Importamos las funciones necesarias desde el SDK de Firebase Firestore
import {
    collection,    // Para acceder a una colección en Firestore
    addDoc,        // Para agregar un nuevo documento
    onSnapshot,    // Para escuchar los cambios en tiempo real
    deleteDoc,     // Para eliminar un documento
    doc            // Para referenciar un documento
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// --------------------
// Elementos del DOM
// --------------------
const registroTrabajadores = document.getElementById('registroTrabajadores'); // input del nombre
const registroEstudio = document.getElementById('registroEstudio');           // input del nivel educativo
const botonRegistro = document.getElementById('botonSubmit-registro');                 // botón para registrar
const listaTrabajadores = document.getElementById('listaTrabajadores');       // contenedor donde se muestran los trabajadores
const retiroTrabajadores = document.getElementById('retiroTrabajadores');   // input para retirar trabajador
const botonRetiro = document.getElementById('botonSubmit-retiro');            // botón para retirar trabajador
// --------------------
// Retiro de trabajador por nombre
// --------------------
botonRetiro.addEventListener('click', async () => {
    const nombreRetiro = retiroTrabajadores.value.trim();
    if (!nombreRetiro) {
        alert('Por favor ingresa el nombre del trabajador a retirar.');
        return;
    }

    // Buscar el documento con ese nombre
    const trabajadoresRef = collection(db, 'trabajadores');
    const snapshot = await onSnapshot(trabajadoresRef, () => { }); // Para obtener la referencia
    let encontrado = false;
    // Usamos getDocs para obtener los documentos una sola vez
    import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js').then(async (firestore) => {
        const { getDocs, query, where, deleteDoc, doc } = firestore;
        const q = query(trabajadoresRef, where('nombre', '==', nombreRetiro));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            alert('No se encontró un trabajador con ese nombre.');
            return;
        }
        querySnapshot.forEach(async (docSnap) => {
            await deleteDoc(doc(db, 'trabajadores', docSnap.id));
            encontrado = true;
        });
        if (encontrado) {
            alert('Trabajador retirado correctamente.');
            retiroTrabajadores.value = '';
        }
    });
});

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
    snapshot.forEach((docSnap) => {
        const data = docSnap.data(); // Obtenemos los datos del trabajador

        // Creamos un contenedor para cada trabajador
        const div = document.createElement('div');
        div.classList.add('trabajador-item');

        // Creamos el texto con la información del trabajador
        let texto = '';
        if (data.pago && data.sueldo) {
            texto = `${contador}. ${data.nombre} nivel educativo: ${data.nivel} salario base: $${data.pago.toLocaleString()} / sueldo con descuento $${data.sueldo.toLocaleString()}`;
        } else {
            texto = `${contador}. ${data.nombre} - Error en los datos`;
        }
        div.textContent = texto;

        // Botón para eliminar trabajador
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.style.marginLeft = '10px';
        btnEliminar.addEventListener('click', async () => {
            if (confirm(`¿Seguro que deseas eliminar a ${data.nombre}?`)) {
                await deleteDoc(doc(db, 'trabajadores', docSnap.id));
            }
        });
        div.appendChild(btnEliminar);

        // Lo agregamos al contenedor principal
        listaTrabajadores.appendChild(div);
        contador++;
    });
});

// --------------------
// Mostrar tabla de trabajadores al hacer clic Trabajo viernes
// --------------------
const botonMostrarTabla = document.getElementById('mostrarGeneral');

const botonMostrarTablaT = document.getElementById('mostrarTecnico');

const botonMostrarTablaU = document.getElementById('mostrarUniversitario');

const botonMostrarTablaTi = document.getElementById('mostrarTitulado');

const botonMostrarTablaM = document.getElementById('mostrarMagister');

const tabla = document.getElementById('tablaTrabajadores');
const cuerpoTabla = document.getElementById('cuerpoTabla');

let tablaVisible = false;

botonMostrarTabla.addEventListener('click', async () => {
    // Alterna la visibilidad de la tabla al hacer clic
    if (tabla.style.display === 'table') {
        // Si está visible, la ocultamos
        tabla.style.display = 'none';
        tablaVisible = false;
        cuerpoTabla.innerHTML = '';
    } else {
        // Si está oculta, la mostramos y cargamos datos
        tabla.style.display = 'table';
        tablaVisible = true;
        cuerpoTabla.innerHTML = ''; // Limpiamos tabla
        let contador = 1;
        onSnapshot(collection(db, 'trabajadores'), (snapshot) => {
            cuerpoTabla.innerHTML = ''; // Reiniciamos cada vez que cambia la BD
            const filah = document.createElement('tr');
            filah.innerHTML = `
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Nivel</th>
                        <th>Salario Base</th>
                        <th>Sueldo con Descuento</th>
                    `;
            cuerpoTabla.appendChild(filah);
            let total = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.pago && data.sueldo) {
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${contador}</td>
                        <td>${data.nombre}</td>
                        <td>${data.nivel}</td>
                        <td>$${data.pago.toLocaleString()}</td>
                        <td>$${data.sueldo.toLocaleString()}</td>
                    `;
                    total = total + data.sueldo; // Acumulamos el sueldo total
                    cuerpoTabla.appendChild(fila);
                    contador++;
                }
            });
            // Limpiamos el pie de la tabla antes de agregar la fila de total
            pieTabla.innerHTML = '';
            const filaTotal = document.createElement('tr');
            filaTotal.innerHTML = `
                        <td colspan="4" style="text-align: right;"><strong>Total Sueldos:</strong></td>
                        <td><strong>$${total.toLocaleString()}</strong></td>
                    `;
            pieTabla.appendChild(filaTotal);
        });
    }
});

botonMostrarTablaT.addEventListener('click', async () => {
    // Alterna la visibilidad de la tabla al hacer clic
    if (tabla.style.display === 'table') {
        // Si está visible, la ocultamos
        tabla.style.display = 'none';
        tablaVisible = false;
        cuerpoTabla.innerHTML = '';
        pieTabla.innerHTML = '';
    } else {
        // Si está oculta, la mostramos y cargamos datos
        tabla.style.display = 'table';
        tablaVisible = true;
        cuerpoTabla.innerHTML = '';
        let contador = 1;
        onSnapshot(collection(db, 'trabajadores'), (snapshot) => {
            cuerpoTabla.innerHTML = '';
            const filah = document.createElement('tr');
            filah.innerHTML = `
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Nivel</th>
                        <th>Salario Base</th>
                        <th>Sueldo con Descuento</th>
                    `;
            cuerpoTabla.appendChild(filah);
            let total = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.pago && data.sueldo && data.nivel === "tecnico") {
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${contador}</td>
                        <td>${data.nombre}</td>
                        <td>${data.nivel}</td>
                        <td>$${data.pago.toLocaleString()}</td>
                        <td>$${data.sueldo.toLocaleString()}</td>
                    `;
                    cuerpoTabla.appendChild(fila);
                    contador++;
                    total = total + data.sueldo;
                }
            });
            // Limpiamos el pie de la tabla antes de agregar la fila de total
            pieTabla.innerHTML = '';
            const filaTotal = document.createElement('tr');
            filaTotal.innerHTML = `
                        <td colspan="4" style="text-align: right;"><strong>Total Sueldos:</strong></td>
                        <td><strong>$${total.toLocaleString()}</strong></td>
                    `;
            pieTabla.appendChild(filaTotal);
        });
    }
});

botonMostrarTablaU.addEventListener('click', async () => {
    // Alterna la visibilidad de la tabla al hacer clic
    if (tabla.style.display === 'table') {
        // Si está visible, la ocultamos
        tabla.style.display = 'none';
        tablaVisible = false;
        cuerpoTabla.innerHTML = '';
        pieTabla.innerHTML = '';
    } else {
        // Si está oculta, la mostramos y cargamos datos
        tabla.style.display = 'table';
        tablaVisible = true;
        cuerpoTabla.innerHTML = '';
        let contador = 1;
        onSnapshot(collection(db, 'trabajadores'), (snapshot) => {
            cuerpoTabla.innerHTML = '';
            const filah = document.createElement('tr');
            filah.innerHTML = `
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Nivel</th>
                        <th>Salario Base</th>
                        <th>Sueldo con Descuento</th>
                    `;
            cuerpoTabla.appendChild(filah);
            let total = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.pago && data.sueldo && data.nivel === "universitario") {
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${contador}</td>
                        <td>${data.nombre}</td>
                        <td>${data.nivel}</td>
                        <td>$${data.pago.toLocaleString()}</td>
                        <td>$${data.sueldo.toLocaleString()}</td>
                    `;
                    cuerpoTabla.appendChild(fila);
                    contador++;
                    total = total + data.sueldo;
                }
            });
            // Limpiamos el pie de la tabla antes de agregar la fila de total
            pieTabla.innerHTML = '';
            const filaTotal = document.createElement('tr');
            filaTotal.innerHTML = `
                        <td colspan="4" style="text-align: right;"><strong>Total Sueldos:</strong></td>
                        <td><strong>$${total.toLocaleString()}</strong></td>
                    `;
            pieTabla.appendChild(filaTotal);
        });
    }
});

botonMostrarTablaTi.addEventListener('click', async () => {
    // Alterna la visibilidad de la tabla al hacer clic
    if (tabla.style.display === 'table') {
        // Si está visible, la ocultamos
        tabla.style.display = 'none';
        tablaVisible = false;
        cuerpoTabla.innerHTML = '';
        pieTabla.innerHTML = '';
    } else {
        // Si está oculta, la mostramos y cargamos datos
        tabla.style.display = 'table';
        tablaVisible = true;
        cuerpoTabla.innerHTML = '';
        let contador = 1;
        onSnapshot(collection(db, 'trabajadores'), (snapshot) => {
            cuerpoTabla.innerHTML = '';
            const filah = document.createElement('tr');
            filah.innerHTML = `
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Nivel</th>
                        <th>Salario Base</th>
                        <th>Sueldo con Descuento</th>
                    `;
            cuerpoTabla.appendChild(filah);
            let total = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.pago && data.sueldo && data.nivel === "titulado") {
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${contador}</td>
                        <td>${data.nombre}</td>
                        <td>${data.nivel}</td>
                        <td>$${data.pago.toLocaleString()}</td>
                        <td>$${data.sueldo.toLocaleString()}</td>
                    `;
                    cuerpoTabla.appendChild(fila);
                    contador++;
                    total = total + data.sueldo;
                }
            });
            // Limpiamos el pie de la tabla antes de agregar la fila de total
            pieTabla.innerHTML = '';
            const filaTotal = document.createElement('tr');
            filaTotal.innerHTML = `
                        <td colspan="4" style="text-align: right;"><strong>Total Sueldos:</strong></td>
                        <td><strong>$${total.toLocaleString()}</strong></td>
                    `;
            pieTabla.appendChild(filaTotal);
        });
    }
});

botonMostrarTablaM.addEventListener('click', async () => {
    // Alterna la visibilidad de la tabla al hacer clic
    if (tabla.style.display === 'table') {
        // Si está visible, la ocultamos
        tabla.style.display = 'none';
        tablaVisible = false;
        cuerpoTabla.innerHTML = '';
        pieTabla.innerHTML = '';
    } else {
        // Si está oculta, la mostramos y cargamos datos
        tabla.style.display = 'table';
        tablaVisible = true;
        cuerpoTabla.innerHTML = '';
        let contador = 1;
        onSnapshot(collection(db, 'trabajadores'), (snapshot) => {
            cuerpoTabla.innerHTML = '';
            const filah = document.createElement('tr');
            filah.innerHTML = `
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Nivel</th>
                        <th>Salario Base</th>
                        <th>Sueldo con Descuento</th>
                    `;
            cuerpoTabla.appendChild(filah);
            let total = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.pago && data.sueldo && data.nivel === "magister") {
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${contador}</td>
                        <td>${data.nombre}</td>
                        <td>${data.nivel}</td>
                        <td>$${data.pago.toLocaleString()}</td>
                        <td>$${data.sueldo.toLocaleString()}</td>
                    `;
                    cuerpoTabla.appendChild(fila);
                    contador++;
                    total = total + data.sueldo;
                }
            });
            // Limpiamos el pie de la tabla antes de agregar la fila de total
            pieTabla.innerHTML = '';
            const filaTotal = document.createElement('tr');
            filaTotal.innerHTML = `
                        <td colspan="4" style="text-align: right;"><strong>Total Sueldos:</strong></td>
                        <td><strong>$${total.toLocaleString()}</strong></td>
                    `;
            pieTabla.appendChild(filaTotal);
        });
    }
});