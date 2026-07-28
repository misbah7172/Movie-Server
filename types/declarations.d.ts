declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "ffprobe-static" {
  const path: string;
  export default { path };
}

declare module "ffmpeg-static" {
  const path: string;
  export default path;
}
