import { useNavigate } from "react-router-dom";
import { clearSession } from "../lib/session";

export default function ExitPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>You have repented.</h1>
      <p>Now go collect your treasures in heaven.</p>
      <button
        onClick={() => {
          clearSession();
          navigate("/", { replace: true });
        }}
        style={{ padding: "10px 14px" }}
      >
        Back home
      </button>
    </div>
  );
}
