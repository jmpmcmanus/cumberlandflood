import Vue from 'vue'
import Router from 'vue-router'
import HurricaneFlorence from '@/components/HurricaneFlorence'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'HurricaneFlorence',
      component: HurricaneFlorence,
    },
  ],
})
