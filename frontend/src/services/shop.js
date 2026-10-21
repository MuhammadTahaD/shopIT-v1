import api from './api'

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/admin/products', data),
  update: (id, data) => api.put(`/admin/products/${id}`, data),
  remove: (id) => api.delete(`/admin/products/${id}`),
}
export const authApi = {
  login: (data) => api.post('/login', data), register: (data) => api.post('/register', data),
  logout: () => api.get('/logout'), me: () => api.get('/me'), update: (data) => api.put('/me/update', data),
  updatePassword: (data) => api.put('/password/update', data), forgot: (data) => api.post('/password/forgot', data),
  reset: (token, data) => api.put(`/password/reset/${token}`, data),
}
export const ordersApi = {
  create: (data) => api.post('/orders/new', data), mine: () => api.get('/me/orders'),
  get: (id) => api.get(`/orders/${id}`), all: () => api.get('/admin/orders'),
  update: (id, data) => api.put(`/admin/orders/${id}`, data), remove: (id) => api.delete(`/admin/orders/${id}`),
}
export const usersApi = {
  all: () => api.get('/admin/users'), get: (id) => api.get(`/admin/users/${id}`), remove: (id) => api.delete(`/admin/users/${id}`),
}
export const reviewsApi = {
  list: (productId) => api.get('/reviews', { params: { id: productId } }),
  save: (data) => api.put('/reviews', data),
}
