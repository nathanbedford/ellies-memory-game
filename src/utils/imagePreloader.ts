/**
 * Image Preloader Utility
 *
 * Provides functions to preload images into the browser cache
 * before they are needed for rendering.
 */

/**
 * Preloads a single image by creating an Image object and waiting for it to load.
 * The browser will cache the image for subsequent use.
 *
 * @param src - The image URL to preload
 * @returns Promise that resolves when the image is loaded, or rejects on error
 */
export function preloadImage(src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve();
		img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
		img.src = src;
	});
}

/**
 * Preloads multiple images in parallel.
 * Continues loading remaining images even if some fail.
 *
 * @param sources - Array of image URLs to preload
 * @returns Promise that resolves when all images are loaded (or failed)
 */
export async function preloadImages(sources: string[]): Promise<{
	loaded: number;
	failed: number;
	total: number;
}> {
	const results = await Promise.allSettled(sources.map(preloadImage));

	const loaded = results.filter((r) => r.status === "fulfilled").length;
	const failed = results.filter((r) => r.status === "rejected").length;

	return {
		loaded,
		failed,
		total: sources.length,
	};
}

/**
 * Preloads images with progress tracking.
 * Calls the onProgress callback after each image loads.
 *
 * @param sources - Array of image URLs to preload
 * @param onProgress - Callback called with (loaded, total) after each image
 * @returns Promise that resolves when all images are loaded
 */
export async function preloadImagesWithProgress(
	sources: string[],
	onProgress?: (loaded: number, total: number) => void,
): Promise<{
	loaded: number;
	failed: number;
	total: number;
}> {
	let loadedCount = 0;
	let failedCount = 0;
	const total = sources.length;

	const promises = sources.map((src) =>
		preloadImage(src)
			.then(() => {
				loadedCount++;
				onProgress?.(loadedCount + failedCount, total);
			})
			.catch(() => {
				failedCount++;
				onProgress?.(loadedCount + failedCount, total);
			}),
	);

	await Promise.all(promises);

	return {
		loaded: loadedCount,
		failed: failedCount,
		total,
	};
}

