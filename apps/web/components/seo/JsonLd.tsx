import { headers } from "next/headers";

export async function JsonLd({ data }: { data: unknown | unknown[] }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
