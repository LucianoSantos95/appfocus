import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

/**
 * Wrapper leve que aplica um fade curto sempre que a rota muda.
 * Evita depender de framer-motion para essa animação global.
 */
export function RouteFade({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [key, setKey] = useState(location.pathname);

  useEffect(() => {
    setKey(location.pathname);
  }, [location.pathname]);

  return (
    <div key={key} className="page-fade-enter">
      {children}
    </div>
  );
}
