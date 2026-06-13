import { useState } from "react";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  return (
    <>
      {isLoggedIn ? (
        <Dashboard setIsLoggedIn={setIsLoggedIn} />
      ) : (
        <Login setIsLoggedIn={setIsLoggedIn} />
      )}
    </>
  );
}

export default App;