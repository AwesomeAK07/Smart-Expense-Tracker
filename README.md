# Smart Expense Tracker

A complete web application built with Flask that automatically processes receipt images using OCR technology to track and categorize expenses.

## 🚀 Features

- **Smart OCR Processing**: Automatically extract text and amounts from receipt images
- **Auto Categorization**: Intelligent categorization into Food, Transport, Shopping, Bills, and Others
- **Interactive Dashboard**: Visual charts and analytics for spending patterns
- **Search & Filter**: Find expenses quickly with search and category filters
- **CSV Export**: Export all expense data for external analysis
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Demo Data**: Pre-loaded sample data to demonstrate functionality

## 🛠️ Technology Stack

- **Backend**: Python 3.x, Flask
- **Database**: SQLite with SQLAlchemy ORM
- **Frontend**: HTML5, CSS3, Bootstrap 5, Chart.js
- **OCR**: pytesseract (Tesseract OCR engine)
- **Image Processing**: Pillow (PIL)

## 📋 Prerequisites

Before running this application, you need to install Tesseract OCR on your system:

### Windows
1. Download Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install it (default location: `C:\Program Files\Tesseract-OCR`)
3. Add Tesseract to your system PATH

### macOS
```bash
brew install tesseract
```

### Ubuntu/Debian
```bash
sudo apt-get install tesseract-ocr
```

### CentOS/RHEL
```bash
sudo yum install tesseract
```

## 🚀 Installation & Setup

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd Smart-Expense-Tracker
   ```

2. **Create a virtual environment (recommended)**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Open your browser**
   Navigate to: `http://localhost:5000`

## 📁 Project Structure

```
Smart Expense Tracker/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── static/               # Static files
│   ├── css/
│   │   └── style.css     # Custom CSS styles
│   ├── js/               # JavaScript files (if any)
│   ├── images/           # Image assets
│   └── uploads/          # Temporary upload directory
├── templates/            # HTML templates
│   ├── base.html         # Base template
│   ├── home.html         # Homepage with upload form
│   ├── dashboard.html    # Dashboard with charts and table
│   └── 404.html          # Error page
└── expenses.db           # SQLite database (created automatically)
```

## 🎯 How to Use

### 1. Upload Receipts
- Go to the homepage
- Drag and drop receipt images or click to browse
- Supported formats: JPG, JPEG, PNG (max 16MB)
- The system will automatically:
  - Extract text using OCR
  - Identify the total amount
  - Categorize the expense
  - Store it in the database

### 2. View Dashboard
- Navigate to the Dashboard page
- View summary statistics
- See spending breakdown by category
- Analyze monthly spending trends
- Search and filter expenses

### 3. Export Data
- Click "Export CSV" to download all expense data
- Use the exported file for external analysis or backup

## 🔧 Configuration

### Environment Variables (Optional)
You can set these environment variables for customization:

```bash
export FLASK_SECRET_KEY="your-secret-key"
export FLASK_ENV="development"
export MAX_CONTENT_LENGTH="16777216"  # 16MB in bytes
```

### Database Configuration
The application uses SQLite by default. To use a different database:

1. Update the `SQLALCHEMY_DATABASE_URI` in `app.py`
2. Example for PostgreSQL:
   ```python
   app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:pass@localhost/dbname'
   ```

## 🎨 Customization

### Adding New Categories
Edit the `categorize_expense()` function in `app.py`:

```python
def categorize_expense(text):
    text_lower = text.lower()
    
    # Add your custom keywords
    custom_keywords = ['your', 'custom', 'keywords']
    
    for keyword in custom_keywords:
        if keyword in text_lower:
            return 'Your Category'
    
    return 'Others'
```

### Styling
- Modify `static/css/style.css` for custom styles
- Update Bootstrap classes in templates for layout changes
- Customize Chart.js colors and options in dashboard template

## 🐛 Troubleshooting

### Common Issues

1. **Tesseract not found**
   ```
   Error: tesseract is not installed or it's not in your PATH
   ```
   **Solution**: Install Tesseract OCR and ensure it's in your system PATH

2. **Permission denied for uploads**
   ```
   Error: [Errno 13] Permission denied
   ```
   **Solution**: Ensure the `static/uploads` directory has write permissions

3. **Database errors**
   ```
   Error: no such table: expense
   ```
   **Solution**: Delete `expenses.db` and restart the application

4. **Image processing errors**
   ```
   Error: cannot identify image file
   ```
   **Solution**: Ensure uploaded files are valid image formats

### Debug Mode
Run the application in debug mode for detailed error messages:

```python
app.run(debug=True, host='0.0.0.0', port=5000)
```

## 📊 API Endpoints

- `GET /` - Homepage with upload form
- `POST /upload` - Upload and process receipt
- `GET /dashboard` - Dashboard with charts and expenses table
- `GET /api/expenses` - JSON API for expenses data
- `GET /export` - Export expenses as CSV
- `POST /delete/<id>` - Delete specific expense

## 🔒 Security Considerations

- File upload validation (type and size)
- SQL injection protection via SQLAlchemy
- XSS protection via Flask's template engine
- Secure file handling with temporary storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Flask](https://flask.palletsprojects.com/) - Web framework
- [Bootstrap](https://getbootstrap.com/) - CSS framework
- [Chart.js](https://www.chartjs.org/) - Charting library
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) - OCR engine
- [SQLAlchemy](https://www.sqlalchemy.org/) - Database ORM

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the Flask and Tesseract documentation
3. Create an issue in the repository

---

**Happy Expense Tracking! 💰📊**
