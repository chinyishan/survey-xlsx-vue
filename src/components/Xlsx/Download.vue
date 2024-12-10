<!-- xlsx 下載組件 -->
<template>
  <el-button
    type="success"
    icon="Download"
    :loading="loading"
    @click="handleDownload"
    class="m-2"
  >
    匯出檔案
  </el-button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as XLSX from 'xlsx';
import { useLoading } from '@/utils/hooks';

const { loading, startLoading, endLoading } = useLoading();

// 對象類型
export type IObject = Record<string, any>;

// 表頭類型定義
interface TableHeader {
  [key: string]: {
    title: string;
    [key: string]: any;
  };
}

/**表格數據 */
const rowDownloadData = defineModel<IObject[]>('downloadData');

/**表頭數據 */
const downloadHeader = defineModel<TableHeader>('downloadHeader');

/**表格檔案標題 */
const exportTitle = defineModel<String>('downloadTitle');

/**匯出數據 */
const exportData = ref<Record<string, any>[]>([]);

/**
 * 將表格數據匯出為Excel
 */
const handleDownload = () => {
  if (!rowDownloadData.value?.length) {
    return ElMessage.warning('無資料可匯出');
  }

  try {
    startLoading();

    // 轉換表頭為中文
    exportData.value = rowDownloadData.value.map((item) => {
      const newObj: IObject = {};
      Object.keys(item).forEach((key) => {
        for (const k in downloadHeader.value) {
          // 確保鍵匹配
          if (key === k) {
            // 確保空欄位給空字串
            newObj[downloadHeader.value[k].title] =
              item[key] !== undefined ? item[key] : '';
          }
        }
      });
      return newObj;
    });

    // 生成工作表
    const worksheet = XLSX.utils.json_to_sheet(exportData.value);
    // 創建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    // 下載 Excel 文件
    XLSX.writeFile(workbook, `${exportTitle.value}.xlsx`); // csv xlsx
    ElMessage.success('下載成功');
    endLoading();
  } catch (error) {
    console.error(error);
    ElMessageBox.confirm(`${error}`, '匯出失敗', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'error',
    })
      .then(() => {})
      .catch(() => {});
  }
};
</script>
