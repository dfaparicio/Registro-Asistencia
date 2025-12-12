<template>
  <q-layout class="fondo" view="hHh lpR fFf">
    <div class="blur-overlay"></div>

    <!-- HEADER -->
    <q-header class="bg-transparent q-pt-xl no-shadow no-border">
      <q-toolbar class="justify-center">
        <q-toolbar-title class="text-center text-h3">
          <q-avatar class="img" size="8rem">
            <img :src="Uni" />
          </q-avatar>
          Centro de Asistencia Estudiantil
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- CONTENIDO -->
    <q-page-container class="contenido flex justify-around items-center">
      <div><BotonIniciar to="/registro">Registro</BotonIniciar></div>
      <div><BotonIniciar to="/consulta">Consulta</BotonIniciar></div>
    </q-page-container>
    
  </q-layout>
</template>

<script setup>
import Uni from "../assets/Uni.png";
import BotonIniciar from "../components/BotonIniciar.vue"
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap');

* {
  margin: 0;
  padding: 0;
  font-family: 'Merriweather', serif;
}

.fondo {
  position: relative;
  background-image: url("../assets/Ambiente.jpg");
  background-position: center;
  background-size: cover;
  overflow: hidden;
}

.blur-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1;
}

.contenido{
  position: relative;
  z-index: 5;
  width: 100%;
  height: 100vh;
}
</style>