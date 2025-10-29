import { onMount, type Setter } from "solid-js";
import { useSettings } from "../contexts/SettingsContext.tsx";

/**
 * Hook to handle user input in a container.
 *
 * @param {HTMLDivElement} containerRef - The container in which the systems are displayed.
 * @param {() => void} highlightSystem - A function to highlight a system.
 * @param {Setter<boolean>} setIsScrolling - A setter function to set the scrolling state.
 */
export function useInputHandler(
	containerRef: HTMLDivElement,
	highlightSystem: () => void,
	setIsScrolling: Setter<boolean>,
) {
	// Get settings from the SettingsContext
	const {
		smartScroll: [smartScroll],
		scrollPercentage: [scrollPercentage],
		colorizeBottomSystem: [colorizeBottomSystem],
		smoothScrolling: [smoothScrolling],
	} = useSettings();

	let lastScrollTop = 0;
	let scrollTimeout: ReturnType<typeof setTimeout>;

	// Assign event handlers to the container
	containerRef.onscroll = handleScroll;
	containerRef.onclick = handleClick;

	/**
	 * Check if a point is within a given area.
	 *
	 * @param {number} x - The x-coordinate of the point.
	 * @param {number} y - The y-coordinate of the point.
	 * @param {Object} area - The area to check.
	 * @returns {boolean} True if the point is within the area, false otherwise.
	 */
	function isInArea(x, y, area) {
		return (
			x >= area.x &&
			x <= area.x + area.width &&
			y >= area.y &&
			y <= area.y + area.height
		);
	}

	/**
	 * Handle click events on the container.
	 *
	 * @param {MouseEvent} e - The click event.
	 */
	function handleClick(e: MouseEvent) {
		// Get the click coordinates
		const { clientX, clientY } = e instanceof TouchEvent ? e.touches[0] : e;

		// Get the dimensions of the container
		const { width, height } = containerRef.getBoundingClientRect();

		// Define the areas for scrolling
		const areaRight = { x: (width * 2) / 3, y: 0, width: width / 3, height };
		const areaLeft = { x: 0, y: 0, width: width / 3, height };
		const areaBottom = { x: 0, y: (height * 2) / 3, width, height: height / 3 };
		const areaTop = { x: 0, y: 0, width, height: height / 3 };

		// Scroll based on the click area
		if (
			isInArea(clientX, clientY, areaRight) ||
			isInArea(clientX, clientY, areaBottom)
		) {
			scrollForward();
		} else if (
			isInArea(clientX, clientY, areaLeft) ||
			isInArea(clientX, clientY, areaTop)
		) {
			scrollBackward();
		}
	}

	/**
	 * Handle scroll events on the container.
	 */
	function handleScroll() {
		setIsScrolling(true);
		if (scrollTimeout) {
			clearTimeout(scrollTimeout);
		}

		scrollTimeout = setTimeout(() => {
			// Check if the scroll position has changed
			if (containerRef.scrollTop !== lastScrollTop) {
				lastScrollTop = containerRef.scrollTop;
				handleScrollEnd();
			}
		}, 50);
	}

	/**
	 * Handle the end of a scroll event.
	 */
	function handleScrollEnd() {
		setIsScrolling(false);
		if (colorizeBottomSystem()) {
			highlightSystem();
		}
	}

	/**
	 * Scroll the container backward.
	 */
	function scrollBackward() {
		containerRef.scrollTo({
			top:
				containerRef.scrollTop -
				(containerRef.clientHeight * scrollPercentage()) / 100,
			behavior: smoothScrolling() ? "smooth" : "instant",
		});
	}

	/**
	 * Scroll the container forward.
	 */
	function scrollForward() {
		const systems: HTMLCollectionOf<Element> =
			containerRef.getElementsByClassName("viewer-system");
		const boundingRects = Array.from(systems).map((system) =>
			system.getBoundingClientRect(),
		);
		const screenHeight = containerRef.clientHeight;

		if (smartScroll()) {
			for (let i = 0; i < boundingRects.length; i++) {
				if (boundingRects[i].bottom > screenHeight) {
					const targetSystem = systems[i] as HTMLDivElement;
					const nextSystemTop =
						targetSystem.getBoundingClientRect().top +
						containerRef.scrollTop +
						1; // +1 to make sure that screen filling pages will not break next key press
					containerRef.scrollTo({
						top: nextSystemTop,
						behavior: smoothScrolling() ? "smooth" : "instant",
					});
					break;
				}
			}
		} else {
			containerRef.scrollTo({
				top: containerRef.scrollTop + (screenHeight * scrollPercentage()) / 100,
				behavior: smoothScrolling() ? "smooth" : "instant",
			});
		}
	}

	/**
	 * Handle keydown events.
	 *
	 * @param {KeyboardEvent} e - The keydown event.
	 */
	const handleKeydown = (e) => {
		switch (e.key) {
			// Scroll backward
			case "PageUp":
			case "ArrowLeft":
			case "ArrowUp":
			case " ":
				e.preventDefault();
				scrollBackward();
				break;

			// Scroll forward
			case "PageDown":
			case "ArrowRight":
			case "ArrowDown":
			case "Enter":
				e.preventDefault();
				scrollForward();
				break;
		}
	};

	// Add the keydown event listener on mount and remove it on unmount
	onMount(() => {
		document.addEventListener("keydown", handleKeydown);
		return () => document.removeEventListener("keydown", handleKeydown);
	});
}
