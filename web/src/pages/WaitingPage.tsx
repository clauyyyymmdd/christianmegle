import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRole, isPriestOk } from "../lib/session";

export default function WaitingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = getRole();
    if (!role) return navigate("/", { replace: true });
    if (role === "priest" && !isPriestOk()) return navigate("/quiz", { replace: true });

    const t = setTimeout(() => navigate("/chat"), 900);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Entering the confession booth…</h1>
      <p>Matching you with a stranger.</p>
    </div>
  );
}
