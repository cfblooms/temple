import { onRequestDelete as __api_save_js_onRequestDelete } from "/home/user/temple/functions/api/save.js"
import { onRequestGet as __api_save_js_onRequestGet } from "/home/user/temple/functions/api/save.js"
import { onRequestPut as __api_save_js_onRequestPut } from "/home/user/temple/functions/api/save.js"

export const routes = [
    {
      routePath: "/api/save",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_save_js_onRequestDelete],
    },
  {
      routePath: "/api/save",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_save_js_onRequestGet],
    },
  {
      routePath: "/api/save",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_save_js_onRequestPut],
    },
  ]