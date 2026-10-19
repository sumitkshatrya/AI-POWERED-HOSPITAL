import api from './api';

export interface ReportDataResponse {
  reportTitle: string;
  module: string;
  timeframe?: string;
  kpiSummary: Array<{ label: string; value: string }>;
  headers: string[];
  rows: string[][];
}

export const reportsService = {
  getReportData: async (module: string, timeframe = '30_DAYS'): Promise<ReportDataResponse> => {
    const res = await api.get(`/reports?module=${module}&timeframe=${timeframe}&format=json`);
    return res.data.data;
  },

  downloadCsv: async (module: string, timeframe = '30_DAYS'): Promise<void> => {
    const response = await api.get(`/reports?module=${module}&timeframe=${timeframe}&format=csv`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${module.toLowerCase()}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },

  downloadPdf: async (module: string, timeframe = '30_DAYS'): Promise<void> => {
    const response = await api.get(`/reports?module=${module}&timeframe=${timeframe}&format=pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const windowOpen = window.open(url, '_blank');
    if (!windowOpen) {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${module.toLowerCase()}_report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    }
  },
};

