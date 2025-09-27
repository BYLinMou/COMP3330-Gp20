"""
Version: 1.0.0
Author: Xie Yee Lam
Date: 2025-09-27
Description: Receipt Smart Analyzer main script
"""
import sys
import base64
import os
import json
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                             QPushButton, QLabel, QTextEdit, QFileDialog, QMessageBox)
from PyQt5.QtGui import QPixmap
from PyQt5.QtCore import Qt
from openai import OpenAI
from dotenv import load_dotenv

# --- Utility Functions ---
def encode_image_to_base64(image_path):
    """Encode image file as a Base64 string"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# --- OpenAI API Handling Functions ---
def analyze_receipt_with_openai(image_path):
    """Call OpenAI API to analyze the receipt image"""
    
    # Load environment variables from .env file
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL")
    model = os.getenv("OPENAI_MODEL", "gpt-4-vision-preview")

    if not api_key:
        return {"error": "OpenAI API key not found.\nPlease set OPENAI_API_KEY in the .env file."}

    # Initialize OpenAI client depending on whether base_url is set
    if base_url:
        client = OpenAI(api_key=api_key, base_url=base_url)
    else:
        client = OpenAI(api_key=api_key)

    try:
        base64_image = encode_image_to_base64(image_path)

    # Prepare the message to send to the API
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """
                        You are a professional receipt information extraction assistant. Please analyze this receipt image and return the following information in JSON format:
                        1. `store_name`: Name of the store.
                        2. `payment_method`: Type of payment method or account (e.g., VISA, Mastercard, Cash, Apple Pay). If there are multiple, choose the primary one.
                        3. `items`: A list of all purchased items, each as an object containing `name` (item name) and `price` (price).
                        4. `total_amount`: Total amount spent.
                        5. `category`: Based on the purchased items, define a reasonable category for this expense (e.g., Dining, Grocery, Transportation, Electronics, Clothing, etc.).

                        If any information cannot be found, set its value to "N/A". Please ensure the returned content is pure JSON format, without any extra explanation or Markdown markup.
                        """
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ]

    # Call the API
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=1024
        )

    # Parse the returned JSON
        response_text = response.choices[0].message.content

    # Clean up possible Markdown formatting
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()

        return json.loads(response_text)

    except Exception as e:
        print(f"[Debug] Error occurred({model}): {str(e)}\n{response_text if 'response_text' in locals() else ''}")
        return {"error": f"API call failed or parsing error: {str(e)}"}

# --- PyQt5 GUI Interface ---

class ReceiptProcessorApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle('Receipt Smart Analysis Tool')
        self.setGeometry(100, 100, 600, 700)

        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)

        self.layout = QVBoxLayout(self.central_widget)

        self.image_path = None

        # 1. Upload button
        self.upload_btn = QPushButton('Upload Receipt Image')
        self.upload_btn.clicked.connect(self.upload_image)
        self.layout.addWidget(self.upload_btn)

        # 2. Image preview label
        self.image_label = QLabel('Please upload an image first')
        self.image_label.setAlignment(Qt.AlignCenter)
        self.image_label.setFixedSize(580, 200)
        self.image_label.setStyleSheet("border: 1px solid #ccc; background-color: #f0f0f0;")
        self.layout.addWidget(self.image_label)

        # 3. Analyze button
        self.analyze_btn = QPushButton('Analyze')
        self.analyze_btn.clicked.connect(self.analyze_image)
        self.analyze_btn.setEnabled(False) # Disabled by default
        self.layout.addWidget(self.analyze_btn)

        # 4. Results display area
        self.results_text = QTextEdit()
        self.results_text.setReadOnly(True)
        self.results_text.setPlaceholderText("Analysis results will be displayed here...")
        self.layout.addWidget(self.results_text)

    def upload_image(self):
        """Handle image upload"""
        options = QFileDialog.Options()
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Receipt Image", "", 
                                                  "Image Files (*.png *.jpg *.jpeg *.bmp)", options=options)
        if file_path:
            self.image_path = file_path
            pixmap = QPixmap(file_path)
            # Scale image to fit label size
            self.image_label.setPixmap(pixmap.scaled(self.image_label.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation))
            self.analyze_btn.setEnabled(True)
            self.results_text.setText("Image uploaded. Please click 'Analyze'.")

    def analyze_image(self):
        """Handle image analysis"""
        if not self.image_path:
            QMessageBox.warning(self, "Error", "Please upload an image first!")
            return

        # Provide user feedback
        self.results_text.setText("Communicating with OpenAI, please wait...\nThis may take a few seconds.")
        self.analyze_btn.setEnabled(False)
        self.upload_btn.setEnabled(False)
        QApplication.processEvents() # Force UI update

        # Call backend analysis function
        result_data = analyze_receipt_with_openai(self.image_path)

        # Display results
        self.display_results(result_data)

        # Restore button states
        self.analyze_btn.setEnabled(True)
        self.upload_btn.setEnabled(True)

    def display_results(self, data):
        """Format and display analysis results in the interface"""
        if "error" in data:
            self.results_text.setText(f"Error occurred:\n{data['error']}")
            return

        # Format output
        formatted_text = (
            f"--- Receipt Analysis Result ---\n\n"
            f"Store Name: {data.get('store_name', 'N/A')}\n"
            f"Payment Method: {data.get('payment_method', 'N/A')}\n"
            f"Total Amount: {data.get('total_amount', 'N/A')}\n"
            f"Category: {data.get('category', 'N/A')}\n\n"
            f"--- Purchased Items List ---\n"
        )

        items = data.get('items', [])
        if items and isinstance(items, list):
            for item in items:
                name = item.get('name', 'Unknown Item')
                price = item.get('price', '-')
                formatted_text += f"- {name}: {price}\n"
        else:
            formatted_text += "No item list found or format error.\n"

        self.results_text.setText(formatted_text)

 # --- Main Program Entry ---
if __name__ == '__main__':
    app = QApplication(sys.argv)
    main_window = ReceiptProcessorApp()
    main_window.show()
    sys.exit(app.exec_())
