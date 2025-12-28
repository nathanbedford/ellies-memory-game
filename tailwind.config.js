/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			perspective: {
				1000: "1000px",
			},
		},
	},
	plugins: [
		function ({ addVariant }) {
			// Only apply hover styles on devices that support hover (not touch)
			addVariant("can-hover", "@media (hover: hover) { &:hover }");
		},
	],
};
