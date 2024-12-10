<!-- xlsx 上傳組件 -->
<template>
  <el-button
    type="primary"
    icon="Upload"
    @click="uploadVisible = true"
    class="m-2"
  >
    匯入檔案
  </el-button>

  <!-- 匯入燈箱 -->
  <el-dialog
    v-model="uploadVisible"
    @close="handleCloseModel"
    title="請匯入檔案"
    width="80%"
    top="0px"
  >
    <div class="upload-contaiter" v-loading="loading">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :limit="1"
        accept=".xlsx, .xls"
        :before-upload="handleFileUpload"
      >
        <el-icon style="font-size: 32px; color: #c1cdd1">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          將檔案拖到此處或
          <em>點擊上傳</em>
        </div>
      </el-upload>
      <ag-grid-vue
        class="ag-theme-quartz"
        style="height: 600px"
        :columnDefs="columnDefs"
        :rowData="rowData"
        :enableColResize="true"
        :stopEditingWhenCellsLoseFocus="true"
      ></ag-grid-vue>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleCheckExport">
          匯入
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as XLSX from 'xlsx';
import 'ag-grid-community/styles/ag-grid.css'; // Mandatory CSS required by the Data Grid
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Optional Theme applied to the Data Grid
import { AgGridVue } from 'ag-grid-vue3'; // Vue Data Grid Component
import { ColDef, RowDragEndEvent } from 'ag-grid-community';
import type { UploadRawFile } from 'element-plus';
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

/**燈箱開關 */
const uploadVisible = ref(false);

/**
 * 處理關閉燈箱
 */
const handleCloseModel = () => {
  rowData.value = [];
};

/**表格數據 */
const rowUploadData = defineModel<IObject[]>('uploadData');

/**表頭數據 */
const colUploadHeader = defineModel<TableHeader>('uploadHeader');

/**
 * 將表頭title映射為key
 */
const keyProps = computed(() => {
  const newHeader: { [key: string]: string } = {};
  for (const key in colUploadHeader.value) {
    newHeader[colUploadHeader.value[key].title] = key;
  }
  return newHeader;
});

/**
 * 配置欄
 * @param editable: 是否可編輯
 * @param rowDrag: 是否可拖曳
 */
const colOptions = ref<IObject>({
  editable: true,
});

/**
 * 欄資料
 */
const columnDefs = ref<ColDef[]>([]);

/**
 * 配置行
 * @param rowSelection: 行全選單選，需用物件形式
 */
const rowOptions = ref({
  rowSelection: {
    mode: 'multiRow',
  },
});

/**
 * 行資料(數據)
 */
const rowData = ref<IObject[]>([]);

/**
 * 檔案匯入
 */
const handleFileUpload = (rawFile: UploadRawFile) => {
  startLoading();
  rowData.value = [];
  const file = rawFile;
  const reader = new FileReader();

  // 當文件讀取完成時
  reader.onload = (e: ProgressEvent<FileReader>) => {
    try {
      const arrayBuffer = e.target?.result;
      if (!arrayBuffer) return;

      // 將 ArrayBuffer 轉換為 Uint8Array
      const data = new Uint8Array(arrayBuffer as ArrayBuffer);

      // 使用 SheetJS 解析 Excel 文件
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // 將數據轉為 JSON 格式
      const json: IObject[] = XLSX.utils.sheet_to_json(worksheet);

      // 設定表頭
      columnDefs.value = Object.keys(keyProps.value).map((key) => {
        return {
          field: key,
          ...colOptions.value,
        };
      });

      // 處理數據
      rowData.value = json.map((item) => {
        const newObj: IObject = {};

        // 確保空欄位賦予空字串
        Object.keys(keyProps.value).forEach((k) => {
          newObj[k] = item[k] !== undefined ? item[k] : '';
        });
        return newObj;
      });
    } catch (error) {
      console.error(error);
      ElMessageBox.confirm(`${error}`, '匯入失敗', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'error',
      })
        .then(() => {})
        .catch(() => {});
    } finally {
      endLoading();
    }
  };

  // 讀取指定的 file
  reader.readAsArrayBuffer(file);
  // 停止默認上傳行為
  return false;
};

/**
 * 行拖動結束事件處理
 */
const onRowDragEnd = (event: RowDragEndEvent) => {
  console.log(event, 'event');
  // 獲取拖動的節點和目標位置
  // const draggedNode = event.node
  // const targetNode = event.overNode

  // if (!draggedNode || !targetNode) return

  // // 從數據中移除拖動的行
  // const draggedData = rowData.value.splice(draggedNode.rowIndex, 1)[0]

  // // 插入到目標位置
  // rowData.value.splice(targetNode.rowIndex, 0, draggedData)

  // // 重新計算ID以保持順序
  // rowData.value.forEach((item: any, index: number) => {
  //   item.id = index + 1
  // })
};

/**
 * 確認是否匯入資料
 */
const handleCheckExport = () => {
  if (!rowData.value?.length) {
    return ElMessage.warning('請上傳檔案，再匯入資料');
  }

  ElMessageBox.confirm('確定要匯入資料?', '提示', {
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    type: 'warning',
    lockScroll: false,
  })
    .then(() => {
      handleExport();
    })
    .catch(() => {});
};

/**
 * 匯入
 */
const handleExport = () => {
  startLoading();
  // Record 斷言物件結構
  rowUploadData.value = rowData.value.map((item) => {
    const newObj: IObject = {};

    // 將中文key做替換，並確保空欄位給空字串
    Object.keys(item).forEach((key) => {
      if (keyProps.value[key]) {
        newObj[keyProps.value[key]] = item[key] !== undefined ? item[key] : '';
      }
    });
    return newObj;
  });

  uploadVisible.value = false;
  endLoading();
};
</script>

<style scoped>
:deep(.el-upload-dragger) {
  padding: 10px;
}
</style>
