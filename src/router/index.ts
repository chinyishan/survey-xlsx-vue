// import type { App } from 'vue';
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'; //  createWebHashHistory,

// 靜態路由
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home.vue'),
    meta: { title: '首頁' },
  },
  {
    path: '/ag-grid',
    name: 'ag-grid',
    component: () => import('@/views/ag-grid/index.vue'),
    meta: { title: 'Ag-Grid列表編輯' },
  },
  {
    path: '/spark-md5',
    name: 'spark-md5',
    component: () => import('@/views/spark-md5/index.vue'),
    meta: { title: 'spark-md5大文件上傳' },
  },
];

/**
 * 創建路由
 */
const router = createRouter({
  // history: createWebHashHistory(),
  history: createWebHistory(),
  routes: constantRoutes,
  // 刷新時，滾動條位置還原
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

export default router;
