import { KeyValueStore, Dataset, createHttpRouter } from "crawlee";
import { v4 as uuid } from "uuid";

export const router = createHttpRouter();

router.addDefaultHandler(async ({ request, log, json }) => {
    const { userData: { searchString } } = request;

    if (!json || !json?.images || !json?.images?.length) {
        throw new Error (`Couldn't generate images`);
    }

    const { images } = json;

    log.info(`Successfully generated ${images.length} images for ${searchString}`);

    const keyValueStore = await KeyValueStore.open();

    for (const image of images) {
        const key = uuid();
        const imageBuffer = Buffer.from(image, "base64");

        await keyValueStore.setValue(key, imageBuffer, {
            contentType: "image/png",
        });

        const imageUrl = `https://api.apify.com/v2/key-value-stores/${keyValueStore.id}/records/${key}`;

        await Dataset.pushData({ searchString, imageUrl });
    }
});
