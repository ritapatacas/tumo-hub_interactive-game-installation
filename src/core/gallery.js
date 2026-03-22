// src/core/gallery.js

function baseName(path) {
  let parts = String(path || "").split("/");
  let file = parts[parts.length - 1];
  if (file == null || file === "") file = String(path || "");

  let dot = file.lastIndexOf(".");
  if (dot === -1) return file;
  return file.slice(0, dot);
}

function toUrl(maybeModule) {
  if (typeof maybeModule === "string") return maybeModule;
  if (maybeModule && typeof maybeModule.default === "string") return maybeModule.default;
  return "";
}

function normalizeItems(optsItems) {
  let out = [];
  if (!Array.isArray(optsItems)) return out;

  for (let i = 0; i < optsItems.length; i++) {
    let it = optsItems[i];
    if (!it) continue;

    // Already normalized: { name, src, thumbnail }
    if (it.src != null || it.thumbnail != null) {
      let name = it.name;
      if (name == null || name === "") {
        if (it.src) name = baseName(it.src);
        else name = "Item " + (i + 1);
      }

      out.push({
        type: it.type || "video",
        name: name,
        src: it.src || "",
        thumbnail: it.thumbnail || "",
      });
      continue;
    }

    // data.json shape: { id, videoPath, thumbnailPath }
    if (it.videoPath != null || it.thumbnailPath != null) {
      let name2 = it.id;
      if (name2 == null || name2 === "") {
        if (it.videoPath) name2 = baseName(it.videoPath);
        else name2 = "Video " + (i + 1);
      }

      out.push({
        type: "video",
        name: name2,
        src: it.videoPath || "",
        thumbnail: it.thumbnailPath || "",
      });
      continue;
    }
  }

  return out;
}

export function getDefaultGalleryItems() {
  try {
    let videos = import.meta.glob("../../assets/videos/*.{mp4,webm,ogg,mov}", {
      eager: true,
      query: "?url",
      import: "default",
    });

    // Thumbnails via URL estática: glob eager em .png pedia o ficheiro como módulo ES e chocava com o middleware /assets (MIME image/png).
    let items = [];
    for (let path in videos) {
      let src = toUrl(videos[path]);
      if (!src) continue;

      let name = baseName(path);
      items.push({
        type: "video",
        name: name,
        src: src,
        thumbnail: `/assets/thumbnails/${name}.png`,
      });
    }

    items.sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name));
    });

    return items;
  } catch (e) {
    return [];
  }
}

export function resolveGalleryItems(optsItems) {
  if (Array.isArray(optsItems) && optsItems.length > 0) {
    return normalizeItems(optsItems);
  }
  return getDefaultGalleryItems();
}