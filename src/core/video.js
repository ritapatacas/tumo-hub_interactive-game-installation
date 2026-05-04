import { markVideoViewed } from "./team.js";

export function selectVideoFromPayload(ctx) {
  const state = ctx.state;
  const payload = ctx.payload;

  if (!payload) {
    state.selectedVideoSrc = "";
    state.selectedVideoId = "";
    return {
      selectedVideoSrc: "",
      selectedVideoId: "",
    };
  }

  let src = "";
  if (payload.src) {
    src = payload.src;
  } else if (payload.videoPath) {
    src = payload.videoPath;
  }

  let id = "";
  if (payload.id) {
    id = payload.id;
  } else if (payload.name) {
    id = payload.name;
  }

  state.selectedVideoSrc = src;
  state.selectedVideoId = id;
  markVideoViewed(state, id);
  ctx.persistTeams?.();

  return {
    selectedVideoSrc: src,
    selectedVideoId: id,
  };
}

export function showSelectedVideo(ctx, opts = {}) {
  const state = ctx.state;
  const ui = ctx.ui;
  const onEndedAction = opts.onEndedAction || "";

  if (state.selectedVideoSrc) {
    ui.addVideo({
      src: state.selectedVideoSrc,
      autoplay: true,
      controls: false,
      onEndedAction,
    });
  }
}

export function createVideoPlayer(domRoot) {
  const video = document.createElement('video');
  video.className = 'tumo-video';
  domRoot.appendChild(video);

  function show({ src, autoplay = true, controls = true } = {}) {
    if (src) video.src = src;
    video.controls = !!controls;
    video.style.display = 'block';
    if (autoplay) {
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  }

  function hide() {
    video.pause();
    video.style.display = 'none';
  }

  return { show, hide, el: video };
}
