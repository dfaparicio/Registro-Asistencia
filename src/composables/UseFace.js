// src/composables/useFace.js
import * as faceapi from "face-api.js";

export function useFace() {
  let video = null;

  // Conectar el <video ref="video">
  const setVideoElement = (videoRef) => {
    video = videoRef;
  };

  // Cargar todos los modelos que tienes en Public/models
  const loadModels = async () => {
    const MODEL_URL = "/models"; // carpeta en public

    // Detectores de rostro
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.mtcnn.loadFromUri(MODEL_URL);

    // Landmark / puntos faciales
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);

    // Reconocimiento facial
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

    // Edad, género y expresiones
    await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

    console.log("✅ Modelos cargados correctamente");
  };

  // Iniciar cámara
  const startCamera = async () => {
    if (!video?.value) {
      console.error("❌ No se encontró el elemento <video>");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    video.value.srcObject = stream;
    await video.value.play();
  };

  // Detectar rostro y obtener descriptor
  const getFaceDescriptor = async () => {
    if (!video?.value) return null;

    const result = await faceapi
      .detectSingleFace(
        video.value,
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceDescriptor()
      .withAgeAndGender()
      .withFaceExpressions();

    if (!result) return null;
    return result.descriptor;
  };

  // Crear matcher de estudiantes
  const createFaceMatcher = (estudiantes) => {
    const labeled = estudiantes.map(
      (e) =>
        new faceapi.LabeledFaceDescriptors(
          e.nombre,
          [new Float32Array(e.descriptor)]
        )
    );
    return new faceapi.FaceMatcher(labeled);
  };

  return {
    setVideoElement,
    loadModels,
    startCamera,
    getFaceDescriptor,
    createFaceMatcher,
  };
}
