import { createRouter, createWebHashHistory } from 'vue-router'
import { pb } from './pb'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('../views/Dashboard.vue') },
        { path: 'products', name: 'products', component: () => import('../views/ProductsList.vue') },
        { path: 'products/new', name: 'product-new', component: () => import('../views/ProductEdit.vue') },
        { path: 'products/:id', name: 'product-edit', component: () => import('../views/ProductEdit.vue') },
        { path: 'categories', name: 'categories', component: () => import('../views/CategoriesList.vue') },
        { path: 'categories/new', name: 'category-new', component: () => import('../views/CategoryEdit.vue') },
        { path: 'categories/:id', name: 'category-edit', component: () => import('../views/CategoryEdit.vue') },
        { path: 'settings', name: 'settings', component: () => import('../views/Settings.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  if (to.name !== 'login' && !pb.authStore.isValid) {
    return { name: 'login' }
  }
  if (to.name === 'login' && pb.authStore.isValid) {
    return { name: 'dashboard' }
  }
})
