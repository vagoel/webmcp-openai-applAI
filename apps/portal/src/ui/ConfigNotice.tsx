export function ConfigNotice({ app }: { app: string }) {
  return (
    <div className="config-notice">
      <h1>{app}</h1>
      <p>The Convex backend isn't configured yet.</p>
      <ol>
        <li>
          In <code>packages/convex</code>, run <code>npx convex dev</code> (writes
          <code> VITE_CONVEX_URL</code> to <code>.env.local</code>).
        </li>
        <li>
          Seed jobs: <code>npm run gen &amp;&amp; npm run seed</code> in the same package.
        </li>
        <li>Restart this app's dev server.</li>
      </ol>
    </div>
  )
}
