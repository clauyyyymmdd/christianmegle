import { useNavigate } from "react-router-dom";
import { setPriestOk, setRole } from "../lib/session";

export default function HomePage() {
  const navigate = useNavigate();

  function chooseSinner() {
    setRole("sinner");
    setPriestOk(false);
    navigate("/waiting");
  }

  function choosePriest() {
    setRole("priest");
    setPriestOk(false);
    navigate("/quiz");
  }

  return (
    <div style={{ padding: 32, fontFamily: "system-ui" }}>
      <h1>christianmegle</h1>
      <p>Confession booth matchmaking.</p>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={chooseSinner} style={{ padding: "10px 14px" }}>
          I am a sinner
        </button>
        <button onClick={choosePriest} style={{ padding: "10px 14px" }}>
          I am a priest
        </button>
      </div>
    </div>
  );
}
