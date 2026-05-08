import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Generates a standardized filename with organization name and timestamp
 */
const generateFileName = (orgName, baseName, extension) => {
    const cleanOrg = (orgName || 'Inzeedo').replace(/[^a-z0-9]/gi, '_');
    const cleanBase = baseName.replace(/[^a-z0-9]/gi, '_');
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    return `${cleanOrg}_${cleanBase}_${timestamp}.${extension}`;
};

/**
 * Exports data to CSV
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file (without extension)
 * @param {string} orgName - Organization name for branding
 */
export const exportToCSV = (data, fileName, orgName = '') => {
    if (!data || data.length === 0) return;

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        const fullFileName = generateFileName(orgName, fileName, 'csv');
        link.setAttribute('href', url);
        link.setAttribute('download', fullFileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Exports data to Excel
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file (without extension)
 * @param {string} orgName - Organization name for branding
 */
export const exportToExcel = (data, fileName, orgName = '') => {
    if (!data || data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Export");
    
    // Auto-size columns
    const max_width = data.reduce((w, r) => Math.max(w, ...Object.values(r).map(v => v ? v.toString().length : 0)), 10);
    worksheet['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: max_width + 5 }));

    const fullFileName = generateFileName(orgName, fileName, 'xlsx');
    XLSX.writeFile(workbook, fullFileName);
};
