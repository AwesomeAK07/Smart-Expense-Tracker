// Smart Expense Tracker - Main JavaScript File

// Global variables
let currentChart = null;
let expensesData = [];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Smart Expense Tracker initialized');
    
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Auto-hide alerts after 5 seconds
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);
});

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Chart utilities
function createCategoryChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40',
                    '#FF6384',
                    '#C9CBCF'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    return chart;
}

function createMonthlyChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Monthly Spending',
                data: Object.values(data),
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#36A2EB',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Spending: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    
    return chart;
}

// Table utilities
function filterTable(searchTerm, categoryFilter) {
    const table = document.getElementById('expensesTable');
    if (!table) return;
    
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        
        if (cells.length < 4) continue;
        
        const description = cells[1].textContent.toLowerCase();
        const category = cells[2].textContent.toLowerCase();
        
        const matchesSearch = description.includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === '' || category.includes(categoryFilter.toLowerCase());
        
        if (matchesSearch && matchesCategory) {
            row.style.display = '';
            row.classList.remove('table-secondary');
        } else {
            row.style.display = 'none';
            row.classList.add('table-secondary');
        }
    }
    
    updateTableStats();
}

function updateTableStats() {
    const table = document.getElementById('expensesTable');
    if (!table) return;
    
    const visibleRows = Array.from(table.getElementsByTagName('tbody')[0].getElementsByTagName('tr'))
        .filter(row => row.style.display !== 'none');
    
    const totalAmount = visibleRows.reduce((sum, row) => {
        const amountCell = row.getElementsByTagName('td')[3];
        if (amountCell) {
            const amount = parseFloat(amountCell.textContent.replace('$', '').replace(',', ''));
            return sum + (isNaN(amount) ? 0 : amount);
        }
        return sum;
    }, 0);
    
    // Update stats if stats cards exist
    const totalExpensesElement = document.querySelector('.stats-card h3');
    if (totalExpensesElement) {
        totalExpensesElement.textContent = formatCurrency(totalAmount);
    }
}

// Export functionality
function exportToCSV() {
    const table = document.getElementById('expensesTable');
    if (!table) return;
    
    const rows = Array.from(table.getElementsByTagName('tbody')[0].getElementsByTagName('tr'))
        .filter(row => row.style.display !== 'none');
    
    let csv = 'Date,Description,Category,Amount\n';
    
    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        if (cells.length >= 4) {
            const date = cells[0].textContent;
            const description = cells[1].textContent.replace(/"/g, '""');
            const category = cells[2].textContent;
            const amount = cells[3].textContent;
            
            csv += `"${date}","${description}","${category}","${amount}"\n`;
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Animation utilities
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = formatCurrency(current);
    }, 16);
}

// Loading utilities
function showLoading(element) {
    element.innerHTML = '<div class="loading"></div>';
    element.disabled = true;
}

function hideLoading(element, originalText) {
    element.innerHTML = originalText;
    element.disabled = false;
}

// Error handling
function showError(message) {
    const alertContainer = document.createElement('div');
    alertContainer.className = 'alert alert-danger alert-dismissible fade show';
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertContainer, container.firstChild);
    }
}

function showSuccess(message) {
    const alertContainer = document.createElement('div');
    alertContainer.className = 'alert alert-success alert-dismissible fade show';
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertContainer, container.firstChild);
    }
}

// API utilities
async function fetchExpenses() {
    try {
        const response = await fetch('/api/expenses');
        if (!response.ok) {
            throw new Error('Failed to fetch expenses');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching expenses:', error);
        showError('Failed to load expenses data');
        return [];
    }
}

// Initialize dashboard-specific functionality
function initDashboard() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterTable(this.value, categoryFilter ? categoryFilter.value : '');
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterTable(searchInput ? searchInput.value : '', this.value);
        });
    }
    
    // Auto-refresh data every 30 seconds
    setInterval(async function() {
        const newData = await fetchExpenses();
        if (newData.length !== expensesData.length) {
            location.reload(); // Simple refresh for now
        }
    }, 30000);
}

// Initialize upload-specific functionality
function initUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const submitBtn = document.getElementById('submitBtn');
    
    if (!uploadArea || !fileInput || !submitBtn) return;
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect();
        }
    });
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    function handleFileSelect() {
        const file = fileInput.files[0];
        if (file) {
            // Validate file
            if (!validateFile(file)) return;
            
            // Update UI
            updateUploadUI(file);
            submitBtn.disabled = false;
        }
    }
}

function validateFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 16 * 1024 * 1024; // 16MB
    
    if (!allowedTypes.includes(file.type)) {
        showError('Please select a valid image file (JPG, JPEG, or PNG)');
        return false;
    }
    
    if (file.size > maxSize) {
        showError('File size must be less than 16MB');
        return false;
    }
    
    return true;
}

function updateUploadUI(file) {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;
    
    uploadArea.innerHTML = `
        <div class="mb-3">
            <i class="bi bi-check-circle display-1 text-success"></i>
        </div>
        <h5 class="mb-3">File Selected</h5>
        <p class="text-muted mb-3">${file.name}</p>
        <button type="button" class="btn btn-outline-secondary" onclick="resetUpload()">
            <i class="bi bi-arrow-clockwise me-2"></i>
            Choose Different File
        </button>
    `;
}

// Global functions for use in HTML
window.resetUpload = function() {
    const fileInput = document.getElementById('fileInput');
    const submitBtn = document.getElementById('submitBtn');
    const uploadArea = document.getElementById('uploadArea');
    
    if (fileInput) fileInput.value = '';
    if (submitBtn) submitBtn.disabled = true;
    if (uploadArea) {
        uploadArea.innerHTML = `
            <div class="mb-3">
                <i class="bi bi-receipt display-1 text-muted"></i>
            </div>
            <h5 class="mb-3">Drag & Drop your receipt here</h5>
            <p class="text-muted mb-3">or click to browse files</p>
            <input type="file" name="receipt" id="fileInput" class="d-none" accept=".jpg,.jpeg,.png">
            <button type="button" class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
                <i class="bi bi-folder2-open me-2"></i>
                Choose File
            </button>
            <div class="mt-3">
                <small class="text-muted">
                    Supported formats: JPG, JPEG, PNG (Max 16MB)
                </small>
            </div>
        `;
    }
};

// Initialize based on current page
if (document.getElementById('expensesTable')) {
    initDashboard();
}

if (document.getElementById('uploadArea')) {
    initUpload();
}
