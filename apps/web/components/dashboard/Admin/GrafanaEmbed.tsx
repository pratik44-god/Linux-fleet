"use client";

type GrafanaEmbedProps = {
  src: string;
  title: string;
};

export default function GrafanaEmbed({
  src,
  title,
}: GrafanaEmbedProps) {
  return (
    <iframe
      src={src}
      title={title}
      className="block h-full min-h-0 w-full border-0"
      allow="fullscreen"
      loading="lazy"
    />
  );
}