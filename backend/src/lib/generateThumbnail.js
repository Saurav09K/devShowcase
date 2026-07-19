const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const path = require("path");
const fs = require("fs");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const generateThumbnail = (videoPath) => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(videoPath);
    const fileName = path.basename(videoPath, ext);

    const thumbnailDir = path.join(process.cwd(), "thumbnails");

    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    ffmpeg(videoPath)
      .screenshots({
        timestamps: ["1"],
        filename: `${fileName}.jpg`,
        folder: thumbnailDir, 
        size: "320x240",
      })
      .on("end", () => {
        resolve(`/thumbnails/${fileName}.jpg`);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

module.exports = generateThumbnail;