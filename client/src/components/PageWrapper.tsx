import { ReactNode, useEffect, useState } from "react";

interface PageWrapperProps {
  children: ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-2"
      }`}
    >
      {children}
    </div>
  );
}
