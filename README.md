# Healthcare Insurance Data Analysis System

A lightweight, optimized system for analyzing healthcare insurance data from Excel and PDF files. This system extracts, processes, and analyzes insurance claims data to identify trends, patterns, rejection rates, and provides actionable insights. Optimized for deployment on Cloudflare Workers.

## Features

- **Data Extraction**: Import data from Excel files and tables from PDFs
- **Data Processing**: Clean and transform data for analysis
- **Rejection Analysis**: Analyze claim rejection patterns and trends
- **Trend Analysis**: Identify monthly and quarterly trends in claims
- **Interactive Visualizations**: View data through interactive charts and graphs
- **Report Generation**: Generate JSON and CSV reports
- **AI-Powered Insights**: Get AI-generated analysis and recommendations
- **Cloudflare Workers Compatible**: Optimized for edge deployment with minimal resource usage

## JavaScript Implementation (Recommended)

The JavaScript implementation is optimized for deployment on Cloudflare Workers, providing fast, scalable performance.

### Installation

```bash
# Clone the repository
git clone https://github.com/BrainSAIT-LTD/Healthcare-Insurance-Data-Analysis-System.git
cd Healthcare-Insurance-Data-Analysis-System

# Install dependencies
npm install
```

### Development

```bash
# Install Wrangler CLI globally (if not already installed)
npm install -g wrangler

# Start local development server
npm run dev
```

### Deployment to Cloudflare Workers

1. Login to Cloudflare
```bash
wrangler login
```

2. Update your KV namespace ID in `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "HEALTH_INSURANCE_DATA"
id = "your-kv-namespace-id"
```

3. Deploy to Cloudflare Workers
```bash
npm run deploy
```

## API Documentation

### Endpoints

- `POST /api/upload`: Upload Excel or PDF files for analysis
- `POST /api/analyze/rejections`: Analyze claim rejection patterns
- `POST /api/analyze/trends`: Analyze claim trends over time
- `POST /api/report`: Generate downloadable reports
- `POST /api/insights`: Generate AI-powered insights (requires OpenAI API key)

## License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
