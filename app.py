import os
import re
import csv
from datetime import datetime
from io import StringIO
from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from PIL import Image
import pytesseract
from dateutil import parser
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///expenses.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

db = SQLAlchemy(app)

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.strftime('%Y-%m-%d'),
            'amount': self.amount,
            'category': self.category,
            'description': self.description,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def categorize_expense(text):
    """Categorize expense based on keywords in the extracted text"""
    text_lower = text.lower()
    
    # Food category keywords
    food_keywords = ['restaurant', 'cafe', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 
                    'pizza', 'burger', 'coffee', 'tea', 'snack', 'grocery', 'supermarket']
    
    # Transport category keywords
    transport_keywords = ['uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'subway', 
                         'gas', 'fuel', 'parking', 'toll', 'transport', 'car']
    
    # Shopping category keywords
    shopping_keywords = ['amazon', 'walmart', 'target', 'mall', 'store', 'shop', 
                        'clothing', 'shoes', 'electronics', 'book', 'gift']
    
    # Bills category keywords
    bills_keywords = ['bill', 'electricity', 'water', 'gas', 'internet', 'phone', 
                     'rent', 'mortgage', 'insurance', 'utility']
    
    # Check each category
    for keyword in food_keywords:
        if keyword in text_lower:
            return 'Food'
    
    for keyword in transport_keywords:
        if keyword in text_lower:
            return 'Transport'
    
    for keyword in shopping_keywords:
        if keyword in text_lower:
            return 'Shopping'
    
    for keyword in bills_keywords:
        if keyword in text_lower:
            return 'Bills'
    
    return 'Others'

def extract_expense_data(text):
    """Extract expense data from OCR text"""
    # Look for currency amounts (USD format)
    amount_pattern = r'\$?\d+\.?\d*'
    amounts = re.findall(amount_pattern, text)
    
    # Look for dates
    date_patterns = [
        r'\d{1,2}/\d{1,2}/\d{2,4}',
        r'\d{1,2}-\d{1,2}-\d{2,4}',
        r'\d{4}-\d{1,2}-\d{1,2}'
    ]
    
    dates = []
    for pattern in date_patterns:
        dates.extend(re.findall(pattern, text))
    
    # Extract the largest amount (likely the total)
    amount = 0
    if amounts:
        # Convert to float and find the largest
        amounts_float = []
        for amt in amounts:
            try:
                amt_clean = amt.replace('$', '')
                amounts_float.append(float(amt_clean))
            except ValueError:
                continue
        
        if amounts_float:
            amount = max(amounts_float)
    
    # Parse the first valid date found
    date = datetime.now().date()
    if dates:
        try:
            date = parser.parse(dates[0]).date()
        except:
            pass
    
    # Use first few words as description
    words = text.split()[:5]
    description = ' '.join(words) if words else 'Receipt scan'
    
    return {
        'amount': amount,
        'date': date,
        'description': description
    }

def create_demo_data():
    """Create demo data if no expenses exist"""
    # Commented out to start with empty database
    # if Expense.query.count() == 0:
    #     demo_expenses = [
    #         Expense(date=datetime(2024, 1, 15), amount=25.50, category='Food', description='Lunch at Subway'),
    #         Expense(date=datetime(2024, 1, 16), amount=45.00, category='Transport', description='Uber ride'),
    #         Expense(date=datetime(2024, 1, 17), amount=120.00, category='Shopping', description='Amazon purchase'),
    #         Expense(date=datetime(2024, 1, 18), amount=85.00, category='Bills', description='Electricity bill'),
    #         Expense(date=datetime(2024, 1, 19), amount=15.75, category='Food', description='Coffee and snacks'),
    #         Expense(date=datetime(2024, 1, 20), amount=200.00, category='Shopping', description='Clothing store'),
    #         Expense(date=datetime(2024, 1, 21), amount=35.00, category='Transport', description='Gas station'),
    #         Expense(date=datetime(2024, 1, 22), amount=65.00, category='Food', description='Dinner at restaurant'),
    #     ]
    #     
    #     for expense in demo_expenses:
    #         db.session.add(expense)
    #     
    #     db.session.commit()
    pass

@app.route('/')
def home():
    """Homepage with upload form"""
    return render_template('home.html')

@app.route('/upload', methods=['POST'])
def upload_receipt():
    """Handle receipt upload and OCR processing"""
    if 'receipt' not in request.files:
        flash('No file selected', 'error')
        return redirect(url_for('home'))
    
    file = request.files['receipt']
    
    if file.filename == '':
        flash('No file selected', 'error')
        return redirect(url_for('home'))
    
    if file and allowed_file(file.filename):
        try:
            # Save the uploaded file
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Process image with OCR
            image = Image.open(filepath)
            text = pytesseract.image_to_string(image)
            
            # Extract expense data
            expense_data = extract_expense_data(text)
            category = categorize_expense(text)
            
            # Create expense record
            expense = Expense(
                date=expense_data['date'],
                amount=expense_data['amount'],
                category=category,
                description=expense_data['description']
            )
            
            db.session.add(expense)
            db.session.commit()
            
            # Clean up uploaded file
            os.remove(filepath)
            
            flash(f'Receipt processed successfully! Amount: ${expense_data["amount"]:.2f}, Category: {category}', 'success')
            return redirect(url_for('dashboard'))
            
        except Exception as e:
            flash(f'Error processing receipt: {str(e)}', 'error')
            return redirect(url_for('home'))
    else:
        flash('Invalid file type. Please upload JPG, JPEG, or PNG files only.', 'error')
        return redirect(url_for('home'))

@app.route('/dashboard')
def dashboard():
    """Dashboard with expenses table and charts"""
    # Get all expenses
    expenses = Expense.query.order_by(Expense.date.desc()).all()
    
    # Calculate totals
    total_amount = sum(expense.amount for expense in expenses)
    
    # Category-wise totals
    categories = {}
    for expense in expenses:
        if expense.category in categories:
            categories[expense.category] += expense.amount
        else:
            categories[expense.category] = expense.amount
    
    # Monthly totals for chart
    monthly_data = {}
    for expense in expenses:
        month_key = expense.date.strftime('%Y-%m')
        if month_key in monthly_data:
            monthly_data[month_key] += expense.amount
        else:
            monthly_data[month_key] = expense.amount
    
    return render_template('dashboard.html', 
                         expenses=expenses, 
                         total_amount=total_amount,
                         categories=categories,
                         monthly_data=monthly_data)

@app.route('/api/expenses')
def api_expenses():
    """API endpoint for expenses data"""
    expenses = Expense.query.order_by(Expense.date.desc()).all()
    return jsonify([expense.to_dict() for expense in expenses])

@app.route('/export')
def export_csv():
    """Export expenses as CSV"""
    expenses = Expense.query.order_by(Expense.date.desc()).all()
    
    # Create CSV in memory
    si = StringIO()
    cw = csv.writer(si)
    
    # Write header
    cw.writerow(['Date', 'Amount', 'Category', 'Description'])
    
    # Write data
    for expense in expenses:
        cw.writerow([
            expense.date.strftime('%Y-%m-%d'),
            expense.amount,
            expense.category,
            expense.description
        ])
    
    output = si.getvalue()
    si.close()
    
    return send_file(
        StringIO(output),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'expenses_{datetime.now().strftime("%Y%m%d")}.csv'
    )

@app.route('/delete/<int:expense_id>', methods=['POST'])
def delete_expense(expense_id):
    """Delete an expense"""
    expense = Expense.query.get_or_404(expense_id)
    db.session.delete(expense)
    db.session.commit()
    flash('Expense deleted successfully', 'success')
    return redirect(url_for('dashboard'))

@app.errorhandler(413)
def too_large(e):
    flash('File too large. Please upload a file smaller than 16MB.', 'error')
    return redirect(url_for('home'))

@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(e):
    db.session.rollback()
    flash('An internal error occurred. Please try again.', 'error')
    return redirect(url_for('home'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_demo_data()
    
    app.run(debug=True)
