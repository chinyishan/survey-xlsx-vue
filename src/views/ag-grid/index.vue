<template>
  <div class="app-container">
    <h1>Ag-Grid列表編輯</h1>
    <XlsxUpload
      v-model:uploadData="tableList"
      v-model:uploadHeader="tableHeader"
    ></XlsxUpload>
    <XlsxDownload
      v-model:downloadData="tableList"
      v-model:downloadHeader="tableHeader"
      v-model:downloadTitle="downloadTitle"
    ></XlsxDownload>
    <el-button class="m-2" @click="submit">送出資料</el-button>
    <el-table
      :data="tableList"
      v-loading="loading"
      ref="dataTableRef"
      highlight-current-row
      border
    >
      <el-table-column
        v-for="item of tableHeader"
        :align="item.align"
        :key="item.key"
        :label="item.title"
        :prop="item.key"
        :width="item.width"
        header-align="center"
      />
    </el-table>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import XlsxUpload from '@/components/Xlsx/Upload.vue';
import XlsxDownload from '@/components/Xlsx/Download.vue';
import dayjs from 'dayjs';

const downloadTitle = computed(() => {
  return `${dayjs().format('YYYY-MM-DD')}-表格數據`;
});

const loading = ref(false);
const dataTableRef = ref(null);
const tableList = ref([]);

const tableHeader = computed(() => {
  return {
    points: {
      title: '積點',
      show: true,
      width: 'auto',
      align: 'center',
      export: true,
      key: 'points',
    },
    barcode: {
      title: '國際條碼',
      show: true,
      width: 'auto',
      align: 'center',
      export: true,
      key: 'barcode',
    },
    item_id: {
      title: '品編',
      show: true,
      width: 'auto',
      align: 'center',
      export: true,
      key: 'item_id',
    },
    product_title: {
      title: '品名',
      show: true,
      width: 'auto',
      align: 'center',
      export: true,
      key: 'product_title',
    },
    subject: {
      title: '活動內容A',
      show: true,
      width: 'auto',
      align: 'center',
      export: true,
      key: 'subject',
    },
    content: {
      title: '活動內容B',
      show: true,
      width: 'auto',
      align: 'center',
      export: true,
      key: 'content',
    },
    price: {
      title: '定價',
      show: true,
      width: 'auto',
      align: 'center',
      export: true,
      key: 'price',
    },
    level: {
      title: '等級',
      show: true,
      width: 'auto',
      align: 'center',
      export: true,
      key: 'level',
    },
    campaign_date: {
      title: '活動期間',
      show: true,
      width: 'auto',
      align: 'center',
      export: true,
      key: 'campaign_date',
    },
    type: {
      title: '價卡類型',
      show: true,
      width: 'auto',
      align: 'center',
      export: true,
      key: 'type',
    },
  };
});

/**送出資料 */
const submit = () => {
  console.log(tableList.value, 'tableList');
};
</script>
<style></style>
