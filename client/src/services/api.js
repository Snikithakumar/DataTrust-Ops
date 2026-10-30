import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to unwrap standard response format { success, data, error, message }
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'Unable to communicate with DataTrust Ops backend'
    };
    return Promise.reject(errorData);
  }
);

export const HealthAPI = {
  checkHealth: () => api.get('/health')
};

export const DashboardAPI = {
  getOverview: () => api.get('/dashboard')
};

export const PipelinesAPI = {
  getPipelines: () => api.get('/pipelines'),
  runPipeline: (payload) => api.post('/pipelines/run', payload)
};

export const QualityAPI = {
  scanFile: (file, datasetName) => {
    const formData = new FormData();
    formData.append('file', file);
    if (datasetName) formData.append('datasetName', datasetName);

    return api.post('/quality/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  scanRaw: (csvData, datasetName) => api.post('/quality/scan', { csvData, datasetName })
};

export const IncidentsAPI = {
  getIncidents: (params) => api.get('/incidents', { params }),
  updateIncident: (id, payload) => api.patch(`/incidents/${id}`, payload),
  explainIncident: (id) => api.post(`/incidents/${id}/explain`)
};

export default api;
