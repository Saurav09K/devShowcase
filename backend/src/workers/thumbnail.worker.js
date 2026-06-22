const { Worker } = require("bullmq");
const prisma = require("../lib/prisma");
const generateThumbnail = require("../lib/generateThumbnail");

const { redisConnection } = require("../lib/queue");

console.log('Video Worker is running and waiting for jobs...');

const worker = new Worker("generate-thumbnail", async (job) => {

    console.log("Job received");

    const { videoId , filePath } = job.data;

    // generate thumbnail
    const thumbnailPath = await generateThumbnail(filePath);
    console.log(`[Job ${job.id}] Thumbnail generated: ${thumbnailPath}`);

    // update db
    await prisma.video.update({
        where: {
            id: videoId,
        },
        data: {
            thumbnailPath,
        },
    });

  },
  {
    connection: redisConnection,
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

worker.on("failed", (job, err) => {
  console.error(
    `Job ${job?.id} failed:`,
    err.message
  );
});