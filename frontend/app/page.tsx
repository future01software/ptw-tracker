export default async function Home() {
  const res = await fetch("http://localhost:3001/api/v1/permits", {
    cache: "no-store",
  });

  const text = await res.text();

  return (
    <main style={{ padding: 24 }}>
      <h1>PTW Tracker</h1>
      <pre style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{text}</pre>
    </main>
  );
}