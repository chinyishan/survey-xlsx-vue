<template>
  <div class="app-container">
    <h1>Ag-Grid測試</h1>
    <el-upload
      class="upload-demo"
      drag
      action="#"
      :limit="1"
      accept=".xlsx, .xls"
      :before-upload="handleFileUpload"
    >
      <el-icon><UploadFilled /></el-icon>
      <div class="el-upload__text">
        將 Excel 文件拖到此處或<em>點擊上傳</em>
      </div>
    </el-upload>

    <ag-grid-vue
      class="ag-theme-quartz"
      style="height: 500px"
      :columnDefs="columnDefs"
      :rowData="rowData"
      :enableColResize="true"
      :gridReady="onGridReady"
      @cellClicked="onCellClicked"
      :rowSelection="rowOptions.rowSelection"
    >
    </ag-grid-vue>
    <el-button type="success" @click="downloadExcel">下載</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import * as XLSX from 'xlsx';
import 'ag-grid-community/styles/ag-grid.css'; // Mandatory CSS required by the Data Grid
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Optional Theme applied to the Data Grid
import { AgGridVue } from 'ag-grid-vue3'; // Vue Data Grid Component
import type { UploadRawFile } from 'element-plus';

// const emits = defineEmits<{
//   (e: 'rowData', data: Array<object>): void;
// }>();

const rowData = ref<any>([]);
const columnDefs = ref<any>([]);
const colOptions = ref<any>({
  editable: true,
});
/**配置
 * rowSelection: 行選擇，需用物件形式
 */
const rowOptions = ref({
  rowSelection: {
    mode: 'multiRow',
  },
});

const handleFileUpload = (rawFile: UploadRawFile) => {
  const file = rawFile;
  const reader = new FileReader();

  // 當文件讀取完成時
  reader.onload = (e: ProgressEvent<FileReader>) => {
    const arrayBuffer = e.target?.result;
    if (!arrayBuffer) return;

    // 將 ArrayBuffer 轉換為 Uint8Array
    const data = new Uint8Array(arrayBuffer as ArrayBuffer);

    // 使用 SheetJS 解析 Excel 文件
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // 將數據轉為 JSON 格式
    const json = XLSX.utils.sheet_to_json(worksheet);

    // 第一行作為表頭
    columnDefs.value =
      json.length > 0
        ? Object.keys(json[0] as object).map((key) => ({
            field: key,
            ...colOptions.value,
          }))
        : [];
    // 剩餘行作為數據
    rowData.value = json;
  };

  // 讀取指定的 file
  reader.readAsArrayBuffer(file);

  // 停止默認上傳行為
  return false;
};

// 將表格數據導出為 Excel
const downloadExcel = () => {
  // 生成工作表
  const worksheet = XLSX.utils.json_to_sheet(rowData.value);
  // 創建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  // 下載 Excel 文件
  XLSX.writeFile(workbook, '表格數據.xlsx');
};

// -----------------------------------------------------------------------

/**
 * col: 定義ag-grid列
 * editable 可編輯
 * sortable 排序
 * checkboxSelection: 新增checkbox
 */
// const columnDefs = ref([
//   { field: 'make', editable: true },
//   { field: 'model', editable: true },
//   { field: 'price', editable: true },
//   {
//     field: 'year',
//     editable: true,
//     cellEditor: 'agSelectCellEditor',
//     cellEditorParams: {
//       values: [2018, 2019, 2020],
//     },
//   },
//   { field: 'electric' },
// ]);

/**
 * row: 需要顯示的數據
 */
// const rowData = ref([
//   {
//     make: 'Tesla',
//     model: 'Model Y',
//     price: 649550,
//     year: 2080,
//     electric: true,
//   },
//   {
//     make: 'Ford',
//     model: 'Short-Track Speed Skating Short-Track Speed Skating',
//     price: 33850,
//     year: 2018,
//     electric: true,
//   },
//   {
//     make: 'Toyota',
//     model: '',
//     price: 29600,
//     year: 2026,
//     electric: false,
//   },
// ]);

// watch(
//   () => rowData.value,
//   (newValue, oldValue) => {
//     // 監聽 rowData 陣列物件中的每個值變化
//     newValue.forEach((newItem, index) => {
//       const oldItem = oldValue[index];
//       if (JSON.stringify(newItem) !== JSON.stringify(oldItem)) {
//         console.log(
//           'Item changed at index',
//           index,
//           'from',
//           oldItem,
//           'to',
//           newItem
//         );
//       }
//     });
//   },
//   { deep: true }
// );

//ag-grid创建完成后执行的事件
const onGridReady = (params: any) => {
  // console.log(params, 'params');
};

//單元格典籍事件
const onCellClicked = (cell: any) => {
  // console.log(cell, 'cell');
};
</script>

<style></style>
