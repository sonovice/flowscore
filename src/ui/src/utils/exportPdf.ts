import { createVerovio } from "../workers/ThreadedVerovio";
import type { VerovioOptions } from "verovio";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import SVGtoPDF from "svg-to-pdfkit";

function parseSvgSize(svgString: string): { width: number; height: number } {
	const doc = new DOMParser().parseFromString(svgString, "image/svg+xml");
	const svg = doc.documentElement;

	const viewBox = svg.getAttribute("viewBox");
	// Prefer viewBox for sizing since we render with svgViewBox=true for export
	if (viewBox) {
		const parts = viewBox.split(/\s+/).map(Number);
		if (parts.length === 4) {
			return { width: parts[2], height: parts[3] };
		}
	}

	const widthAttr = svg.getAttribute("width");
	const heightAttr = svg.getAttribute("height");

	if (widthAttr && heightAttr) {
		const width = parseFloat(widthAttr);
		const height = parseFloat(heightAttr);
		if (!Number.isNaN(width) && !Number.isNaN(height)) {
			return { width, height };
		}
	}

	// Fallback to A4-ish proportions if unknown
	return { width: 2100, height: 2970 };
}

function ensurePreserveAspectRatio(svgString: string): string {
	// Ensure the SVG root preserves aspect ratio to avoid horizontal overflow
	const doc = new DOMParser().parseFromString(svgString, "image/svg+xml");
	const svg = doc.documentElement;
	svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
	return new XMLSerializer().serializeToString(svg);
}

export async function exportScoreToPdf(
	mei: string,
	filename: string = "flowscore-export.pdf",
) {
	const vrv = createVerovio();
	// 1) Re-render the score system-by-system with Verovio
	const options: VerovioOptions = {
		adjustPageHeight: true,
		svgViewBox: true,
		font: "Bravura",
		header: "none",
		footer: "none",
		justifyVertically: false,
		pageWidth: 2100,
		// Height is adjusted dynamically per system
		pageMarginTop: 0,
		pageMarginBottom: 0,
		pageMarginLeft: 20,
		pageMarginRight: 0,
		spacingSystem: 0,
		breaks: "smart",
		scale: 40,
		systemMaxPerPage: 1,
		condense: "none",
		mdivAll: true,
	};

	await vrv.loadData(mei);
	await vrv.setOptions(options);
	await vrv.redoLayout();

	const systemCount = await vrv.getPageCount();
	const systemSvgs: string[] = [];
	for (let i = 1; i <= systemCount; i++) {
		const svg = await vrv.renderToSVG(i);
		systemSvgs.push(svg);
	}

	// 2) Create PDF and paginate systems onto A4 pages
	const doc = new PDFDocument({ size: "A4", margin: 0 });

	const pageWidthPt = doc.page.width; // ~595.28pt
	const pageHeightPt = doc.page.height; // ~841.89pt
	const mmToPt = (mm: number) => (mm * 72) / 25.4;
	const marginPt = mmToPt(10); // 10mm
	const usableWidth = pageWidthPt - marginPt * 2;
	const usableHeight = pageHeightPt - marginPt * 2;

	let cursorY = marginPt;

	for (let i = 0; i < systemSvgs.length; i++) {
		let svg = systemSvgs[i];
		svg = ensurePreserveAspectRatio(svg);

		const { width: svgW, height: svgH } = parseSvgSize(svg);
		const scale = usableWidth / svgW;
		const scaledHeight = svgH * scale;

		// New page if this system doesn't fit vertically
		if (cursorY + scaledHeight > marginPt + usableHeight) {
			doc.addPage();
			cursorY = marginPt;
		}

		// Draw the SVG, scaled to usable width
		const targetWidth = usableWidth - 1; // small epsilon avoids rounding overflow
		SVGtoPDF(doc as unknown, svg, marginPt, cursorY, {
			width: targetWidth,
			assumePt: true,
		});

		cursorY += scaledHeight;
	}

	// Collect PDF bytes directly (avoid blob-stream and Node streams)
	const chunks: Uint8Array[] = [];
	interface PdfEventEmitter {
		on(event: "data", cb: (chunk: Uint8Array) => void): void;
		on(event: "end", cb: () => void): void;
	}
	await new Promise<void>((resolve, reject) => {
		try {
			const ev = doc as unknown as PdfEventEmitter;
			ev.on("data", (chunk: Uint8Array) => chunks.push(chunk));
			ev.on("end", () => resolve());
			doc.end();
		} catch (e) {
			reject(e as Error);
		}
	});

	const blob = new Blob(chunks as unknown as BlobPart[], {
		type: "application/pdf",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);

	// Cleanup dedicated Verovio worker
	vrv.destroy();
}

export async function exportSnapshotsToPdf(
	meis: string[],
	filename: string = "flowscore-export.pdf",
) {
	if (!meis || meis.length === 0) return;
	const vrv = createVerovio();

	// Create PDF upfront to accumulate all snapshots
	const doc = new PDFDocument({ size: "A4", margin: 0 });

	const pageWidthPt = doc.page.width; // ~595.28pt
	const pageHeightPt = doc.page.height; // ~841.89pt
	const mmToPt = (mm: number) => (mm * 72) / 25.4;
	const marginPt = mmToPt(10); // 10mm
	const usableWidth = pageWidthPt - marginPt * 2;
	const usableHeight = pageHeightPt - marginPt * 2;

	let cursorY = marginPt;

	const options: VerovioOptions = {
		adjustPageHeight: true,
		svgViewBox: true,
		font: "Bravura",
		header: "none",
		footer: "none",
		justifyVertically: false,
		pageWidth: 2100,
		pageMarginTop: 0,
		pageMarginBottom: 0,
		pageMarginLeft: 20,
		pageMarginRight: 0,
		spacingSystem: 0,
		breaks: "smart",
		scale: 40,
		systemMaxPerPage: 1,
		condense: "none",
		mdivAll: true,
	};

	for (let m = 0; m < meis.length; m++) {
		const mei = meis[m];
		await vrv.loadData(mei);
		await vrv.setOptions(options);
		await vrv.redoLayout();

		const systemCount = await vrv.getPageCount();
		for (let i = 1; i <= systemCount; i++) {
			let svg = await vrv.renderToSVG(i);
			svg = ensurePreserveAspectRatio(svg);

			const { width: svgW, height: svgH } = parseSvgSize(svg);
			const scale = usableWidth / svgW;
			const scaledHeight = svgH * scale;

			if (cursorY + scaledHeight > marginPt + usableHeight) {
				doc.addPage();
				cursorY = marginPt;
			}

			const targetWidth = usableWidth - 1;
			SVGtoPDF(doc as unknown, svg, marginPt, cursorY, {
				width: targetWidth,
				assumePt: true,
			});

			cursorY += scaledHeight;
		}
	}

	// Finalize & download
	const chunks: Uint8Array[] = [];
	interface PdfEventEmitter {
		on(event: "data", cb: (chunk: Uint8Array) => void): void;
		on(event: "end", cb: () => void): void;
	}
	await new Promise<void>((resolve, reject) => {
		try {
			const ev = doc as unknown as PdfEventEmitter;
			ev.on("data", (chunk: Uint8Array) => chunks.push(chunk));
			ev.on("end", () => resolve());
			doc.end();
		} catch (e) {
			reject(e as Error);
		}
	});

	const blob = new Blob(chunks as unknown as BlobPart[], {
		type: "application/pdf",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);

	vrv.destroy();
}
