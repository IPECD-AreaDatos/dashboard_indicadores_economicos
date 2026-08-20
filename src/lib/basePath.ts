export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/indicadores-economicos'

/** Prefija rutas absolutas del sitio con el basePath de Next. */
export function withBasePath(path: string): string {
  if (!path) return BASE_PATH
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (!path.startsWith('/')) return `${BASE_PATH}/${path}`
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path
  return `${BASE_PATH}${path}`
}
