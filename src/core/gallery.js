function baseName(path) {
  let parts = String(path || "").split("/");
  let file = parts[parts.length - 1];
  if (file == null || file === "") file = String(path || "");

  const dot = file.lastIndexOf(".");
  if (dot === -1) return file;
  return file.slice(0, dot);
}

function toUrl(maybeModule) {
  if (typeof maybeModule === "string") return maybeModule;
  if (maybeModule && typeof maybeModule.default === "string") return maybeModule.default;
  return "";
}

function normalizeItems(optsItems) {
  const out = [];
  if (!Array.isArray(optsItems)) return out;

  for (let i = 0; i < optsItems.length; i += 1) {
    const it = optsItems[i];
    if (!it) continue;

    if (it.src != null || it.thumbnail != null) {
      let name = it.name;
      if (name == null || name === "") {
        if (it.src) name = baseName(it.src);
        else name = `Item ${i + 1}`;
      }

      out.push({
        type: it.type || "video",
        name,
        src: it.src || "",
        thumbnail: it.thumbnail || "",
      });
      continue;
    }

    if (it.videoPath != null || it.thumbnailPath != null) {
      let name2 = it.id;
      if (name2 == null || name2 === "") {
        if (it.videoPath) name2 = baseName(it.videoPath);
        else name2 = `Video ${i + 1}`;
      }

      out.push({
        type: "video",
        name: name2,
        src: it.videoPath || "",
        thumbnail: it.thumbnailPath || "",
      });
    }
  }

  return out;
}

export function getDefaultGalleryItems() {
  try {
    const videos = import.meta.glob("../../assets/videos/*.{mp4,webm,ogg,mov}", {
      eager: true,
      query: "?url",
      import: "default",
    });

    const items = [];
    for (const path in videos) {
      const src = toUrl(videos[path]);
      if (!src) continue;

      const name = baseName(path);
      items.push({
        type: "video",
        name,
        src,
        thumbnail: `/assets/thumbnails/${name}.png`,
      });
    }

    items.sort((a, b) => String(a.name).localeCompare(String(b.name)));

    return items;
  } catch {
    return [];
  }
}

export function resolveGalleryItems(optsItems) {
  if (Array.isArray(optsItems) && optsItems.length > 0) {
    return normalizeItems(optsItems);
  }
  return getDefaultGalleryItems();
}
