declare module "*.svg" {
	const content: string;
	export default content;
}

declare module "minify-xml";

declare module "svg-to-pdfkit" {
	const SVGtoPDF: (
		doc: unknown,
		svg: string,
		x: number,
		y: number,
		options?: unknown,
	) => void;
	export default SVGtoPDF;
}
