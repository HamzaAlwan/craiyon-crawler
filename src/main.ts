// For more information, see https://crawlee.dev/
import { HttpCrawler, KeyValueStore, Dataset, createRequestDebugInfo, log } from "crawlee";
import { Actor } from "apify";

import { router } from "./routes.js";

await Actor.init();

interface InputSchema {
	debug?: boolean;
	searchKeywords: string[];
}

const { debug, searchKeywords } =
	(await KeyValueStore.getInput<InputSchema>()) ?? { searchKeywords: [] };

if (debug) {
	log.setLevel(log.LEVELS.DEBUG);
}

// const proxyConfiguration = await Actor.createProxyConfiguration({
// 	useApifyProxy: true,
// });

const crawler = new HttpCrawler({
	// proxyConfiguration,
    navigationTimeoutSecs: 60 * 5, // Takes a while for the images to generate
	requestHandler: router,
    failedRequestHandler: async ({ request }) => {
		log.error(`Request ${request.url} failed too many times`);

		const debugDataset = await Dataset.open('debug');
		await debugDataset.pushData({
			"#debug": createRequestDebugInfo(request),
		});
	},
	errorHandler: async ({ response }) => {
		log.error(
			`Response status is: ${response?.statusCode} msg: ${response?.statusMessage}`
		);
	},
});

await crawler.run(
	searchKeywords.map(searchKeyword => ({
		url: "https://backend.craiyon.com/generate",
		method: "POST",
		payload: JSON.stringify({ prompt: searchKeyword.toLowerCase() }),
        headers: {
            "content-type":"application/json",
        },
        useExtendedUniqueKey: true,
        userData: {
            searchKeyword
        }
	}))
);

await Actor.exit();
