import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import type { AppState } from '@/types'
import { loadAppState, saveAppState } from '@/storage/storage-service'

interface AppStoreContextValue {
  state: AppState
  setState: (updater: (prev: AppState) => AppState) => void
}

const AppStoreContext = createContext<AppStoreContextValue | null>(null)

const PERSIST_DEBOUNCE_MS = 500

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(() => loadAppState())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialMount = useRef(true)

  // Debounced localStorage persistence (Decision #5)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      saveAppState(state)
    }, PERSIST_DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [state])

  // Flush pending writes before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        saveAppState(state)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state])

  const setState = useCallback((updater: (prev: AppState) => AppState) => {
    setStateRaw(updater)
  }, [])

  return (
    <AppStoreContext.Provider value={{ state, setState }}>
      {children}
    </AppStoreContext.Provider>
  )
}

export function useAppStore(): AppStoreContextValue {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}
