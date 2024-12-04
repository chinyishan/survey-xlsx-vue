<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const route = useRoute();
const router = useRouter();

const navData = router.options.routes;
</script>

<template>
  <ul>
    <li>
      <router-link to="/ag-grid">ag-grid</router-link>
    </li>
  </ul>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
