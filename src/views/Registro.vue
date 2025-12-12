<template>
  <div class="row justify-center q-gutter-xl">
    <div>
      <div class="column justify-center items-center q-gutter-lg">
        <div><h3>Centro de Asistencia Estudiantil</h3></div>

        <div class="container">
          <video ref="video" width="320" height="240" autoplay muted></video>
        </div>

        <div>
          <input v-model="nombre" placeholder="Nombre del estudiante" />
        </div>
        <div>
          <input v-model="documento" placeholder="Documento del estudiante" />
        </div>

        <div>
          <BotonIniciar @click="registroestudiante" :disabled="isLoading">
            <span v-if="isLoading && action === 'registro'">
              <i class="spinner"></i> Registrando...
            </span>
            <span v-else>Registro</span>
          </BotonIniciar>
        </div>

        <div>
          <BotonIniciar @click="abrirmodal" :disabled="isLoading">
            <span v-if="isLoading && action === 'asistencia'">
              <i class="spinner"></i> Marcando...
            </span>
            <span v-else>Marcar Asistencia</span>
          </BotonIniciar>
        </div>
      </div>

      <div v-if="isLoading && action === ''" class="loading-text">
        ⏳ Procesando, por favor espera...
      </div>
    </div>

    <div class="column justify-center items-center q-gutter-md">
      <div><h3>Asistencia del día</h3></div>

      <div v-if="asistenciahoy.length">
        <table class="asistencia-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, index) in asistenciahoy" :key="s.documento">
              <td>{{ index + 1 }}</td>
              <td>{{ s.nombre }}</td>
              <td>{{ s.documento }}</td>
              <td>{{ s.fecha }}</td>
              <td>✅ Presente</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="no-asistencia">
        <p>📭 No hay registros de asistencia hoy.</p>
      </div>
    </div>

    <div v-if="modalVisible" class="modal">
      <div class="modal-content">
        <h3>Marcando asistencia...</h3>
        <p>Acerca tu rostro a la cámara</p>
        <button @click="cerrarmodal" class="btn-cancel">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from "vue";
import { useFace } from "@/composables/useFace";
import BotonIniciar from "../components/BotonIniciar.vue";

function fechaactual() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const video = ref(null);
const nombre = ref("");
const documento = ref("");
const isLoading = ref(false);
const action = ref("");
const modalVisible = ref(false);

const estudiantes = reactive(
  JSON.parse(localStorage.getItem("estudiantes") || "[]")
);
const asistencia = reactive(
  JSON.parse(localStorage.getItem("asistencia") || "[]")
);

// Cálculo de asistencia del día
const asistenciahoy = computed(() => {
  const hoy = fechaactual();
  return asistencia.filter((a) => a.fecha === hoy);
});

// Métodos importados del módulo facial
const {
  setVideoElement,
  loadModels,
  startCamera,
  getFaceDescriptor,
  createFaceMatcher,
} = useFace();

// Registro de estudiante con rostro
const registroestudiante = async () => {
  if (!nombre.value || !documento.value)
    return alert("Ingresa nombre y documento primero");

  isLoading.value = true;
  action.value = "registro";

  try {
    const existe = estudiantes.find((e) => e.documento === documento.value);
    if (existe) return alert("Este documento ya está registrado");

    const descriptor = await getFaceDescriptor();
    if (!descriptor) return alert("No se detectó el rostro");

    estudiantes.push({
      nombre: nombre.value,
      documento: documento.value,
      descriptor: Array.from(descriptor),
    });

    localStorage.setItem("estudiantes", JSON.stringify(estudiantes));

    alert(`Estudiante ${nombre.value} registrado correctamente`);
    nombre.value = "";
    documento.value = "";
  } catch (error) {
    console.error(error);
    alert("Error al registrar");
  } finally {
    isLoading.value = false;
    action.value = "";
  }
};

// Abrir modal para marcar asistencia
const abrirmodal = async () => {
  modalVisible.value = true;

  await nextTick();

  setTimeout(() => {
    marcarasistencia();
  }, 800);
};

// Cerrar modal de asistencia
const cerrarmodal = () => {
  modalVisible.value = false;
};

// Procesar detección y registro de asistencia con reconocimiento facial
const marcarasistencia = async () => {
  if (estudiantes.length === 0) {
    alert("No hay estudiantes registrados");
    cerrarmodal();
    return;
  }

  isLoading.value = true;
  action.value = "asistencia";

  try {
    const descriptor = await getFaceDescriptor();
    if (!descriptor) {
      alert("No se detectó rostro");
      cerrarmodal();
      return;
    }

    const matcher = createFaceMatcher(estudiantes);
    const result = matcher.findBestMatch(descriptor);

    if (result.label === "unknown") {
      alert("Rostro no reconocido");
      cerrarmodal();
      return;
    }

    const estudiante = estudiantes.find((e) => e.nombre === result.label);
    const hoy = fechaactual();

    const ya = asistencia.find(
      (a) => a.documento === estudiante.documento && a.fecha === hoy
    );

    if (ya) {
      alert(`${estudiante.nombre} ya registró asistencia hoy`);
    } else {
      asistencia.push({
        nombre: estudiante.nombre,
        documento: estudiante.documento,
        fecha: hoy,
      });
      localStorage.setItem("asistencia", JSON.stringify(asistencia));
      alert(`Asistencia registrada para ${estudiante.nombre}`);
    }
  } catch (error) {
    console.error(error);
    alert("Error marcando asistencia");
  } finally {
    isLoading.value = false;
    action.value = "";
    cerrarmodal();
  }
};

// Inicialización: conectar video, cargar modelos y activar cámara
onMounted(async () => {
  await nextTick();
  setVideoElement(video.value);
  await loadModels();
  await startCamera();
});
</script>

<style>

.container {
  display: flex;
  justify-content: center;
  max-width: 500px;
  color: #4a4a4a;
}

.title {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #3e3e3e;
}

video {
  border: 2px solid #333;
  border-radius: 6px;
  margin-bottom: 15px;
  width: 100%;
  height: auto;
}

input {
  padding: 8px 12px;
  font-size: 1rem;
  border: 2px solid #8b7d66;
  border-radius: 6px;
  outline-offset: 2px;
  transition: border-color 0.3s ease;
}

input:focus {
  border-color: #72694f;
}

.spinner {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #333;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  display: inline-block;
  animation: spin 1s linear infinite;
  margin-right: 5px;
  vertical-align: middle;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #1a73e8;
  margin-bottom: 15px;
}

.modal {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  padding: 25px 35px;
  border-radius: 8px;
  text-align: center;
  max-width: 320px;
  width: 90%;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin-bottom: 10px;
  font-weight: 700;
  color: #4a4a4a;
}

.modal-content p {
  margin-bottom: 20px;
  color: #666;
}

.btn-cancel {
  background-color: #8b7d66;
  border: none;
  color: white;
  letter-spacing: 0.15em;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  text-transform: uppercase;
  transition: background-color 0.3s ease;
}

.btn-cancel:hover {
  background-color: #72694f;
}

.asistencia-table {
  text-align: center;
  border-collapse: collapse;
}

.asistencia-table th,
.asistencia-table td {
  padding: 8px 12px;
}

.asistencia-table th {
  background-color: #8b7d66;
  color: white;
}

.asistencia-table tbody tr:nth-child(even) {
  background-color: #f5f5f5;
}

.asistencia-table tbody tr:hover {
  background-color: #e0d9c3;
}

.no-asistencia {
  margin-top: 10px;
  font-style: italic;
  color: #000000;
}
</style>