const { Parser } = require('@json2csv/node');
const ExcelJS = require('exceljs');

/**
 * ExportService
 * Reusable utility to convert a list of objects into CSV or XLSX and stream it to Express Res.
 */
class ExportService {
  /**
   * Export to CSV
   * @param {Object} res - Express response object
   * @param {Array} data - Array of objects
   * @param {string} filename 
   */
  static async toCSV(res, data, filename = 'export.csv') {
    if (!data || data.length === 0) {
      return res.status(400).json({ message: "No data to export" });
    }

    try {
      const parser = new Parser();
      const csv = await parser.parse(data);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    } catch (err) {
      console.error('[ExportService] CSV Export Failed', err);
      return res.status(500).json({ message: "Export failed" });
    }
  }

  /**
   * Export to Excel (XLSX)
   * @param {Object} res 
   * @param {Array} data 
   * @param {string} filename 
   */
  static async toExcel(res, data, filename = 'export.xlsx') {
    if (!data || data.length === 0) {
      return res.status(400).json({ message: "No data to export" });
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      // Generate columns from the keys of the first object
      const columns = Object.keys(data[0]).map(key => ({
        header: key.toUpperCase(),
        key: key,
        width: 20
      }));
      worksheet.columns = columns;

      // Add Rows
      worksheet.addRows(data);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('[ExportService] Excel Export Failed', err);
      return res.status(500).json({ message: "Export failed" });
    }
  }
}

module.exports = ExportService;
