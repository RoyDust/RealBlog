import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";

/**
 * 获取原始的已排序文章列表
 * 从 Astro 内容集合中检索所有文章，在生产环境中过滤掉草稿文章
 * @returns 按发布日期降序排列的文章数组（最新的文章在前）
 */
async function getRawSortedPosts() {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

/**
 * 获取排序后的完整文章列表，并为每篇文章添加上一篇和下一篇的导航信息
 * 根据发布时间顺序，为每篇文章关联其相邻文章的 slug 和标题
 * @returns 包含完整数据和导航链接的排序文章数组
 */
export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}
	return sorted;
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
/**
 * 获取简化的文章列表，仅包含 slug 和元数据，不包含文章正文
 * 用于列表页面，避免加载完整的文章内容以提高性能
 * @returns 包含文章 slug 和元数据的简化文章列表
 */
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

/**
 * 获取所有标签及其使用次数的列表
 * 统计所有文章中的标签，并按标签名称的字母顺序排序
 * @returns 包含标签名称和使用次数的数组，按字母顺序排列
 */
export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

/**
 * 获取所有分类及其文章数量的列表
 * 统计每个分类下的文章数量，未分类的文章会被归入"未分类"类别
 * 分类按字母顺序排序，并为每个分类生成对应的 URL
 * @returns 包含分类名称、文章数量和分类 URL 的数组，按字母顺序排列
 */
export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	return ret;
}

/**
 * 获取 images 目录下的已排序文章列表
 * 从 Astro 内容集合中检索 images 目录下的所有文章，在生产环境中过滤掉草稿文章
 * @returns 按发布日期降序排列的 images 文章数组（最新的文章在前）
 */
async function getRawSortedImages() {
	const allImages = await getCollection("images", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	const sorted = allImages.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	console.log("这是所有图片");

	console.log(sorted);
	return sorted;
}

/**
 * 获取排序后的完整 images 列表，并为每个 image 添加上一篇和下一篇的导航信息
 * 根据发布时间顺序，为每个 image 关联其相邻内容的 slug 和标题
 * @returns 包含完整数据和导航链接的排序 images 数组
 */
export async function getSortedImages() {
	const sorted = await getRawSortedImages();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}

export type ImageForList = {
	slug: string;
	data: CollectionEntry<"images">["data"];
};

/**
 * 获取简化的 images 列表，仅包含 slug 和元数据，不包含正文内容
 * 用于列表页面，避免加载完整的内容以提高性能
 * @returns 包含 image slug 和元数据的简化列表
 */
export async function getSortedImagesList(): Promise<ImageForList[]> {
	const sortedFullImages = await getRawSortedImages();

	const sortedImagesList = sortedFullImages.map((image) => ({
		slug: image.slug,
		data: image.data,
	}));

	return sortedImagesList;
}
