<template>
  <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal">
    <el-menu-item
      v-for="(item, index) in navData"
      :index="index.toString()"
      :key="index"
      ><router-link :to="item.path">{{ item.name }}</router-link></el-menu-item
    >
  </el-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const route = useRoute();
const router = useRouter();
const navData = router.options.routes;

const activeIndex = ref('1');
// const handleSelect = (key: string, keyPath: string[]) => {
//   console.log(key, keyPath);
// };
</script>

<style scoped>
.read-the-docs {
  color: #888;
}
ul {
  display: flex;
}
li {
  padding: 10px;
  list-style: none;
}
</style>
