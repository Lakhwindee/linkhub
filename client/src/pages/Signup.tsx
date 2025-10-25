import { useEffect } from "react";

export default function Signup() {
  // Redirect to professional signup to avoid duplication
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      window.location.href = `/professional-signup?redirect=${redirect}`;
    } else {
      window.location.href = '/professional-signup';
    }
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
    </div>
  );
}
