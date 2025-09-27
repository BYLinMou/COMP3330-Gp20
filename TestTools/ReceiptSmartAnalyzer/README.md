# Receipt Smart Analysis Tool

This tool is a PyQt5-based desktop application for analyzing receipt images using OpenAI's Vision API. It extracts key information from receipts, such as store name, payment method, purchased items, total amount, and category, and presents the results in a user-friendly interface.

This tool is designed for testing the performance of different models on processing receipts. After experimentation, we found that **Gemini is the best choice in terms of cost-performance and overall performance among all models we tested**.

## Features
- **Upload Receipt Image**: Select and preview a receipt image (supports PNG, JPG, JPEG, BMP).
- **Analyze with OpenAI**: Uses OpenAI's Vision API to extract structured data from the receipt image.
- **Display Results**: Shows extracted information in a clear, formatted text area.
- **Error Handling**: Provides user feedback for missing API keys, failed analysis, or missing information.

## Requirements
- Python 3.x
- [PyQt5](https://pypi.org/project/PyQt5/)
- [openai](https://pypi.org/project/openai/)
- [python-dotenv](https://pypi.org/project/python-dotenv/)

Install dependencies with:
```bash
pip install PyQt5 openai python-dotenv
```

## Setup
1. **Clone the repository** and navigate to the `TestTools/ReceiptSmartAnalyzer/` directory.
2. **Configure Environment Variables**:
   - Create `.env` file and fill in your actual OpenAI API key and model as needed.
   - Do not share your `.env` file or its contents publicly.
    ```     
    # .env file for environment variables
    # Environment variables required for the Receipt Analysis Tool

    # OpenAI API Key
    OPENAI_API_KEY=""

    # OpenAI API Base URL (optional, leave blank if using official OpenAI API)
    OPENAI_BASE_URL=""

    # Specify the model to use (e.g., gpt-4-vision-preview)
    OPENAI_MODEL=""
     ```
3. **Run the Application**:
   ```bash
   python main.py
   ```

## Usage
1. Click **"Upload Receipt Image"** to select a receipt image file.
2. Preview the image in the application window.
3. Click **"Analyze"** to send the image to OpenAI and extract receipt information.
4. View the structured results in the text area below.

## Output Format
The extracted information includes:
- Store Name
- Payment Method
- Total Amount
- Category
- List of Purchased Items (name and price)

If any information is missing, it will be shown as "N/A".

## Notes
- The application requires a valid OpenAI API key.
- The analysis may take a few seconds depending on network speed and API response time.
- All extracted data is displayed in the application; no data is stored locally.

## License
This project is for educational and demonstration purposes only.
