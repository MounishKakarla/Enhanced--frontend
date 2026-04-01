// src/utils/csvUtils.js
/**
 * Converts an array of objects into a CSV string and triggers a browser download.
 * @param {Array<Object>} data - The data to export.
 * @param {string} fileName - The name of the file to save (default: export.csv).
 */
export function exportToCSV(data, fileName = 'employees_export.csv') {
  if (!data || !data.length) return

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(fieldName => {
        let value = row[fieldName]

        // ── Formatting for Excel & Readability ──
        
        // 1. Force Phone Numbers to string to prevent scientific notation (e.g. 7.03E+10)
        if (fieldName.toLowerCase().includes('phone') && value) {
          value = `="${value}"` // Excel formula trick for literal string
        } 
        // 2. Standardize Dates (DOB, DOJ, DOE) to DD/MM/YYYY for Excel
        else if (fieldName.toLowerCase().includes('date') && value) {
          try {
            const d = new Date(value)
            if (!isNaN(d)) {
              const day = String(d.getDate()).padStart(2, '0')
              const month = String(d.getMonth() + 1).padStart(2, '0')
              const year = d.getFullYear()
              value = `${day}/${month}/${year}`
            }
          } catch (e) { /* fallback to original */ }
        }
        // 3. Convert Booleans to Yes/No
        else if (typeof value === 'boolean') {
          value = value ? 'Yes' : 'No'
        }
        // 4. Handle arrays (e.g. roles)
        else if (Array.isArray(value)) {
          value = value.join(', ')
        }

        const stringValue = value?.toString() || ''
        // Escape quotes and wrap in quotes for CSV compliance
        return `"${stringValue.replace(/"/g, '""')}"`
      }).join(',')
    )
  ]

  const csvString = csvRows.join('\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
