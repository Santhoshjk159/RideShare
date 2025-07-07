import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function RouteDebugger() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Current route:", location.pathname);
    console.log("Search params:", location.search);
    console.log("Hash:", location.hash);

    // If someone tries to access /dashboard/rides, redirect to /dashboard
    if (location.pathname === "/dashboard/rides") {
      console.log("Redirecting from /dashboard/rides to /dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [location, navigate]);

  return null;
}

export default RouteDebugger;
