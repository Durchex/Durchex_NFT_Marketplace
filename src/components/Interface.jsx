import { useState, useEffect } from "react";
import Loading from "../Context/Loading";
function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading NFTs
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 second loading simulation

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screenbggray-900">
      {isLoading ? <Loading /> : <div className="container mx-auto p-4"></div>}
    </div>
  );
}

export default App;
