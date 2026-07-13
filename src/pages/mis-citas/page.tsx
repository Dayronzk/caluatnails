import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MisCitasPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/mi-cuenta", { replace: true });
  }, [navigate]);

  return null;
}
