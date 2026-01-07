import { useNavigate } from "react-router-dom";

export default function ChatPage() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Chat</h1>
      <p>(Video provider integration later.)</p>
      <button onClick={() => navigate("/exit")} style={{ padding: "10px 14px" }}>
        Quit
      </button>
    </div>
  );
}
