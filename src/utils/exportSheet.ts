/**
 * 匯出表格 Xlsx
 */
// export function exportSheet(
//   list = [],
//   headerFormat = {},
//   filename = 'exportSheet',
//   bookType = 'xlsx'
// ) {
//   import('@/vendor/Export2Excel').then((excel) => {
//     const { tHeader, filterVal } = filterExportParams(headerFormat, list);
//     const data = formatJson(filterVal, list);

//     excel.export_json_to_excel({
//       header: tHeader,
//       data,
//       filename,
//       autoWidth: true,
//       bookType,
//     });
//   });
// }

// export function formatJson(filterVal, jsonData) {
//   return jsonData.map((v) => filterVal.map((j) => v[j]));
// }

// export function filterExportParams(headerFormat, list) {
//   const result = {
//     tHeader: [],
//     filterVal: [],
//   };

//   if (Object.keys(headerFormat).length) {
//     const header = Object.keys(headerFormat);
//     const map = new Map();

//     header.forEach((key) => {
//       map.set(key, headerFormat[key]);
//     });

//     map.forEach((v, k) => {
//       result.filterVal.push(k);
//       result.tHeader.push(v.title);
//     });
//   } else if (list) {
//     result.filterVal = result.tHeader = Object.keys(list[0]);
//   }

//   return result;
// }
