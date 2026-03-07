# bunnyware.fun

A multi-site project for bunnyware, including the main landing page, stats tracking, and profile search.

## Project Structure

This repository is organized into independent sites located in the `sites/` directory. Each site is designed to be deployed as a standalone Cloudflare Pages project.

- **[sites/main/](https://bunnyware.fun)**: The primary landing page for bunnyware. Includes features, pricing, and a radar viewer.
- **[sites/stats/](https://stats.bunnyware.fun)**: A CS2 stats search interface where users can input Steam IDs or profile URLs.
- **[sites/search/](https://search.bunnyware.fun)**: The results page that fetches and displays detailed player stats from Leetify and Steam.

## Deployment

This project is optimized for **Cloudflare Pages**. To deploy:

1. Create a new Cloudflare Pages project for each subdomain.
2. Connect to this repository.
3. Set the **Root Directory** for each project to its corresponding folder:
   - Main: `sites/main`
   - Stats: `sites/stats`
   - Search: `sites/search`
4. Assign the appropriate custom domains/subdomains in the Cloudflare Dashboard.

## Features

- **Responsive Design**: Modern, animated UI built with vanilla CSS.
- **Interactive Radar**: Real-time collision-based bunny animations on CS2 maps.
- **Deep Integration**: Fetches real-time data from Steam and Leetify APIs.
- **API Proxying**: Uses Cloudflare Functions for secure API communication.
