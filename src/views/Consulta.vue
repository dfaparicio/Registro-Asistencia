<template>
  <div class="consulta-container">
    <h2>Consulta de Asistencia</h2>

    <div class="consulta-form">
      <input v-model="documento" placeholder="Ingresa el documento del estudiante" />
      <button @click="buscarPorDocumento">Buscar</button>
      <button @click="abrirModalRostro">Reconocimiento Facial</button>
    </div>

    <div v-if="estudianteSeleccionado" class="calendario-container">
      <h3>Asistencia de {{ estudianteSeleccionado.nombre }}</h3>
      <p>{{ monthName }} {{ yearActual }}</p>

      <div class="calendario">
        <div class="dias-semana">
          <span v-for="d in diasSemana" :key="d">{{ d }}</span>
        </div>
        <div class="dias-mes">
          <span 
            v-for="(dia, index) in diasMes" 
            :key="index" 
            :class="{'asistio': diasAsistencia.includes(dia)}"
          >
            {{ dia }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="mensaje" class="mensaje">
      <p>{{ mensaje }}</p>
    </div>

    <!-- Modal de cámara -->
    <div v-if="modalVisible" class="modal">
      <div class="modal-content">
        <h3>Acerca tu rostro a la cámara</h3>
        <video ref="video" autoplay muted width="320" height="240"></video>
        <div style="margin-top:10px;">
          <button @click="cerrarModal" class="btn-cancel">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from "vue";
import { getDaysInMonth } from "date-fns";
import { useFace } from "@/composables/useFace";

const documento = ref("");
const estudianteSeleccionado = ref(null);
const diasAsistencia = ref([]);
const mensaje = ref("");
const modalVisible = ref(false);

const video = ref(null);

const hoy = new Date();
const yearActual = hoy.getFullYear();
const monthActual = hoy.getMonth();
const monthName = hoy.toLocaleString("es-ES", { month: "long" });
const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const diasMes = Array.from({ length: getDaysInMonth(hoy) }, (_, i) => i + 1);

const estudiantes = reactive(JSON.parse(localStorage.getItem("estudiantes") || "[]"));
const asistencia = reactive(JSON.parse(localStorage.getItem("asistencia") || "[]"));

const { setVideoElement, loadModels, startCamera, getFaceDescriptor, createFaceMatcher } = useFace();

// Buscar por documento
const buscarPorDocumento = () => {
  mensaje.value = "";
  estudianteSeleccionado.value = null;
  diasAsistencia.value = [];

  const estudiante = estudiantes.find(e => e.documento === documento.value);
  if (!estudiante) {
    mensaje.value = "No se encontró ningún estudiante con ese documento.";
    return;
  }

  estudianteSeleccionado.value = estudiante;

  const registrosMes = asistencia.filter(a => {
    const fecha = new Date(a.fecha + "T00:00");
    return a.documento === estudiante.documento &&
           fecha.getMonth() === monthActual &&
           fecha.getFullYear() === yearActual;
  });

  diasAsistencia.value = registrosMes.map(r => new Date(r.fecha + "T00:00").getDate());
};

// Abrir modal y mostrar cámara
const abrirModalRostro = async () => {
  modalVisible.value = true;
  mensaje.value = "";

  await nextTick(); // Esperamos a que el video exista en el DOM
  setVideoElement(video.value);
  await loadModels();
  await startCamera();

  // Esperar un segundo para que la cámara cargue imagen antes de reconocimiento
  setTimeout(() => {
    reconocimientoFacial();
  }, 1000);
};

const cerrarModal = () => {
  modalVisible.value = false;
};

// Reconocimiento facial
const reconocimientoFacial = async () => {
  try {
    const descriptor = await getFaceDescriptor();
    if (!descriptor) {
      mensaje.value = "No se detectó rostro.";
      return;
    }

    const matcher = createFaceMatcher(estudiantes);
    const resultado = matcher.findBestMatch(descriptor);

    if (resultado.label === "unknown") {
      mensaje.value = "Rostro no reconocido.";
      return;
    }

    const estudiante = estudiantes.find(e => e.nombre === resultado.label);
    estudianteSeleccionado.value = estudiante;

    const registrosMes = asistencia.filter(a => {
      const fecha = new Date(a.fecha + "T00:00");
      return a.documento === estudiante.documento &&
             fecha.getMonth() === monthActual &&
             fecha.getFullYear() === yearActual;
    });

    diasAsistencia.value = registrosMes.map(r => new Date(r.fecha + "T00:00").getDate());
  } catch (error) {
    console.error(error);
    mensaje.value = "Ocurrió un error al reconocer el rostro.";
  }
};
</script>

<style scoped>
.consulta-container {
  max-width: 600px;
  margin: auto;
  padding: 20px;
  font-family: "Georgia", serif;
}

.consulta-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

input {
  padding: 6px 10px;
  font-size: 1rem;
  border-radius: 5px;
  border: 1px solid #8b7d66;
}

button {
  padding: 6px 12px;
  background-color: #8b7d66;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #72694f;
}

.calendario-container {
  margin-top: 20px;
}

.calendario {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dias-semana {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  font-weight: bold;
  text-align: center;
}

.dias-mes {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  gap: 5px;
}

.dias-mes span {
  padding: 5px;
  border-radius: 5px;
  background-color: #f0f0f0;
}

.dias-mes span.asistio {
  background-color: #8b7d66;
  color: white;
  font-weight: bold;
}

.mensaje {
  margin-top: 20px;
  font-style: italic;
  color: #333;
}

.modal {
  position: fixed;
  inset: 0;
  background-color: rgba(0,0,0,0.6);
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
  max-width: 350px;
}

.btn-cancel {
  background-color: #8b7d66;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
