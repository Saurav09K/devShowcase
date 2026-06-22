const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const generateThumbnail = (videoPath) => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(videoPath);

    const fileName = path.basename(videoPath, ext);

    ffmpeg(videoPath)
      .screenshots({
        timestamps: ["1"],
        filename: `${fileName}.jpg`,
        folder: path.join(process.cwd(), "thumbnails"),
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