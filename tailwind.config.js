/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// Google button colors
  			pink: 'hsl(var(--highlight-button-bg))',
  			pinkhover: 'hsl(var(--highlight-button-bg-hover))',
  			pinkborder: 'hsl(var(--highlight-button-border))',
  			pinktext: 'hsl(var(--highlight-button-text))',
  			// Complete button colors
  			complete: 'hsl(var(--complete-button-bg))',
  			completehover: 'hsl(var(--complete-button-bg-hover))',
  			completetext: 'hsl(var(--complete-button-text))',
  			// Confetti colors (theme-aware)
  			confetti: {
  				'1': 'var(--confetti-1)',
  				'2': 'var(--confetti-2)',
  				'3': 'var(--confetti-3)',
  				'4': 'var(--confetti-4)',
  				'5': 'var(--confetti-5)',
  				'6': 'var(--confetti-6)'
  			},
  			// Priority colors (amber - consistent)
  			priority: {
  				DEFAULT: 'hsl(var(--color-priority))',
  				light: 'hsl(var(--color-priority-light))',
  				dark: 'hsl(var(--color-priority-dark))',
  				fill: 'hsl(var(--color-priority-fill))'
  			},
  			// Focus mode actions
  			focusAction: {
  				DEFAULT: 'hsl(var(--color-focus-action))',
  				hover: 'hsl(var(--color-focus-action-hover))'
  			},
  			// Progress chart colors
  			progressChart: {
  				'1': 'hsl(var(--progress-chart-1))',
  				'2': 'hsl(var(--progress-chart-2))',
  				'3': 'hsl(var(--progress-chart-3))',
  				'4': 'hsl(var(--progress-chart-4))',
  				'5': 'hsl(var(--progress-chart-5))',
  				gradientFrom: 'hsl(var(--progress-gradient-from))',
  				gradientTo: 'hsl(var(--progress-gradient-to))',
  				stroke: 'hsl(var(--progress-stroke))',
  				grid: 'hsl(var(--progress-grid))'
  			},
  			// Landing page decorative
  			landing: {
  				success: 'hsl(var(--landing-success))',
  				successBg: 'hsl(var(--landing-success-bg))',
  				error: 'hsl(var(--landing-error))',
  				errorBg: 'hsl(var(--landing-error-bg))',
  				info: 'hsl(var(--landing-info))',
  				infoBg: 'hsl(var(--landing-info-bg))',
  				warning: 'hsl(var(--landing-warning))',
  				warningBg: 'hsl(var(--landing-warning-bg))'
  			},
  			// Heatmap colors
  			heatmap: {
  				'0': 'var(--heatmap-0)',
  				'1': 'var(--heatmap-1)',
  				'2': 'var(--heatmap-2)',
  				'3': 'var(--heatmap-3)',
  				'4': 'var(--heatmap-4)'
  			},
  			// UI states
  			disabled: {
  				DEFAULT: 'hsl(var(--color-disabled))',
  				bg: 'hsl(var(--color-disabled-bg))'
  			},
  			successBg: 'hsl(var(--color-success-bg))',
  			// Task item backgrounds
  			taskNormal: {
  				from: 'hsl(var(--task-normal-from))',
  				to: 'hsl(var(--task-normal-to))'
  			},
  			taskPriority: {
  				from: 'hsl(var(--task-priority-from))',
  				to: 'hsl(var(--task-priority-to))',
  				hoverFrom: 'hsl(var(--task-priority-hover-from))',
  				hoverTo: 'hsl(var(--task-priority-hover-to))'
  			},
  			taskHover: {
  				from: 'hsl(var(--task-hover-from))',
  				to: 'hsl(var(--task-hover-to))'
  			},
  			// Current task highlight
  			currentTask: {
  				from: 'hsl(var(--current-task-from))',
  				to: 'hsl(var(--current-task-to))',
  				border: 'hsl(var(--current-task-border))',
  				text: 'hsl(var(--current-task-text))',
  				shadow: 'hsl(var(--current-task-shadow))'
  			},
  			// Link colors
  			link: {
  				DEFAULT: 'hsl(var(--link-color))',
  				hover: 'hsl(var(--link-hover))',
  				decoration: 'hsl(var(--link-decoration))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
