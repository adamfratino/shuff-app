import { Diagram } from "@shuff/diagram";

export function App() {
  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <h1>shuff diagram playground</h1>
      <p>Half-court rendering with sample discs.</p>
      <div style={{ maxWidth: 360 }}>
        <Diagram
          discs={[
            { x: 36, y: 108, color: "#f5c518" }, // 10 zone, near apex
            { x: 28, y: 72, color: "#1a1a1a" }, // 8 left
            { x: 46, y: 72, color: "#f5c518" }, // 8 right
            { x: 18, y: 38, color: "#1a1a1a" }, // 7 left
            { x: 54, y: 38, color: "#f5c518" }, // 7 right
            { x: 22, y: 10, color: "#1a1a1a" }, // kitchen (left of separator)
          ]}
        />
      </div>
    </main>
  );
}
