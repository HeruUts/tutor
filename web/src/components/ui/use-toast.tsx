// components/ui/toast.tsx
'use client'
import { 
  useState, 
  useEffect, 
  createContext, 
  useContext, 
  ReactNode 
} from 'react'

type ToastType = {
  id: string
  title: string
  description: string
  variant: 'default' | 'destructive'
}

type ToastContextType = {
  addToast: (toast: Omit<ToastType, 'id'>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const Toaster = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastType[]>([])

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toasts])

  const addToast = (toast: Omit<ToastType, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-md shadow-lg border ${
              toast.variant === 'destructive'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}
          >
            <h3 className="font-bold">{toast.title}</h3>
            <p className="text-sm">{toast.description}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}