// Defaults
export const DEFAULT_CORES_NUMBER = 1
export const DEFAULT_RAM_NUMBER = 1
export const DEFAULT_GPU_NUMBER = 0
export const DEFAULT_IMAGE_REGISTRY = 'images.canfar.net'
export const DEFAULT_NOTEBOOK_SKAHA_IMAGE = 'astroml:latest'
export const DEFAULT_DESKTOP_SKAHA_IMAGE = 'desktop:latest'
export const DEFAULT_FIREFLY_SKAHA_IMAGE = 'firefly:2025.2'
export const DEFAULT_CARTA_SKAHA_IMAGE = 'carta:latest'
export const DEFAULT_CONTRIBUTED_SKAHA_IMAGE = 'astroml-vscode:latest'
export const NOTEBOOK_TYPE = 'notebook'
export const CARTA_TYPE = 'carta'
export const CONTRIBUTED_TYPE = 'contributed'
export const DESKTOP_TYPE = 'desktop'
export const FIREFLY_TYPE = 'firefly'

export const DEFAULT_IMAGE_NAMES = {
    [CARTA_TYPE]: DEFAULT_CARTA_SKAHA_IMAGE,
    [CONTRIBUTED_TYPE]: DEFAULT_CONTRIBUTED_SKAHA_IMAGE,
    [DESKTOP_TYPE]: DEFAULT_DESKTOP_SKAHA_IMAGE,
    [NOTEBOOK_TYPE]: DEFAULT_NOTEBOOK_SKAHA_IMAGE,
    [FIREFLY_TYPE]: DEFAULT_FIREFLY_SKAHA_IMAGE
}

export const HAS_FIXED = [
    CARTA_TYPE,
    CONTRIBUTED_TYPE,
    NOTEBOOK_TYPE
]